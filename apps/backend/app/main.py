from dotenv import load_dotenv
load_dotenv()
import os
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from .db import engine, get_db
from .schemas import UserCreate, UserSignup, UserLogin
from . import models
from .security import hash_password, verify_password
from .jwt import create_access_token, decode_access_token

app = FastAPI(title="EduApp API", version="0.1")

# ---- CORS: allow only our front-end origin(s) ----
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "").rstrip("/")
ALLOWED_ORIGINS = [o for o in {
    FRONTEND_ORIGIN,
    "http://localhost:8083",   # Expo web (dev)
    "http://localhost:3000",   # common local web
} if o]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/db-ping")
def db_ping():
    with engine.connect() as conn:
        val = conn.execute(text("select 1")).scalar_one()
    return {"db": "ok", "result": int(val)}

@app.post("/users")
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter_by(email=payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(email=payload.email, name=payload.name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "email": user.email, "name": user.name}

@app.post("/auth/signup")
def signup(payload: UserSignup, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter_by(email=payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    pwd_hash = hash_password(payload.password)
    user = models.User(email=payload.email, name=payload.name, password_hash=pwd_hash)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "email": user.email, "name": user.name}

@app.post("/auth/login")
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(email=payload.email).first()
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    token = create_access_token(sub=str(user.id), expires_minutes=60)
    return {"access_token": token, "token_type": "bearer"}

def get_current_user(
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.split(" ", 1)[1]
    try:
        claims = decode_access_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user_id = claims.get("sub")
    user = db.get(models.User, int(user_id)) if user_id is not None else None
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@app.get("/me")
def me(current_user: models.User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email, "name": current_user.name}
from .ai.router import router as ai_router
app.include_router(ai_router, prefix='/ai')

# ---------------- Study Sessions ----------------
from datetime import datetime, timezone
from pydantic import BaseModel
from .models import StudySession
from fastapi import status

class SessionStartReq(BaseModel):
    is_pomodoro: bool = False
    note: str | None = None

class SessionFinishReq(BaseModel):
    session_id: int

class SessionOut(BaseModel):
    id: int
    started_at: datetime
    ended_at: datetime | None
    duration_sec: int | None
    is_pomodoro: bool
    note: str | None

@app.post("/sessions/start", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
def start_session(req: SessionStartReq, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    s = StudySession(user_id=user.id, is_pomodoro=req.is_pomodoro, note=req.note)
    db.add(s)
    db.commit()
    db.refresh(s)
    return SessionOut(
        id=s.id,
        started_at=s.started_at,
        ended_at=s.ended_at,
        duration_sec=s.duration_sec,
        is_pomodoro=s.is_pomodoro,
        note=s.note,
    )

@app.post("/sessions/finish", response_model=SessionOut)
def finish_session(req: SessionFinishReq, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    s = db.query(StudySession).filter_by(id=req.session_id, user_id=user.id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    if s.ended_at is None:
        s.ended_at = datetime.now(timezone.utc)
        if s.started_at:
            s.duration_sec = int((s.ended_at - s.started_at).total_seconds())
    db.commit()
    db.refresh(s)
    return SessionOut(
        id=s.id,
        started_at=s.started_at,
        ended_at=s.ended_at,
        duration_sec=s.duration_sec,
        is_pomodoro=s.is_pomodoro,
        note=s.note,
    )

@app.get("/sessions/my", response_model=list[SessionOut])
def my_sessions(limit: int = 20, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    rows = (
        db.query(StudySession)
        .filter_by(user_id=user.id)
        .order_by(StudySession.started_at.desc())
        .limit(limit)
        .all()
    )
    return [
        SessionOut(
            id=r.id,
            started_at=r.started_at,
            ended_at=r.ended_at,
            duration_sec=r.duration_sec,
            is_pomodoro=r.is_pomodoro,
            note=r.note,
        )
        for r in rows
    ]

# ---------------- Study Sessions ----------------
from datetime import datetime, timezone
from pydantic import BaseModel
from .models import StudySession
from fastapi import status

class SessionStartReq(BaseModel):
    is_pomodoro: bool = False
    note: str | None = None

class SessionFinishReq(BaseModel):
    session_id: int

class SessionOut(BaseModel):
    id: int
    started_at: datetime
    ended_at: datetime | None
    duration_sec: int | None
    is_pomodoro: bool
    note: str | None

@app.post("/sessions/start", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
def start_session(req: SessionStartReq, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    s = StudySession(user_id=user.id, is_pomodoro=req.is_pomodoro, note=req.note)
    db.add(s)
    db.commit()
    db.refresh(s)
    return SessionOut(
        id=s.id,
        started_at=s.started_at,
        ended_at=s.ended_at,
        duration_sec=s.duration_sec,
        is_pomodoro=s.is_pomodoro,
        note=s.note,
    )

@app.post("/sessions/finish", response_model=SessionOut)
def finish_session(req: SessionFinishReq, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    s = db.query(StudySession).filter_by(id=req.session_id, user_id=user.id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    if s.ended_at is None:
        s.ended_at = datetime.now(timezone.utc)
        if s.started_at:
            s.duration_sec = int((s.ended_at - s.started_at).total_seconds())
    db.commit()
    db.refresh(s)
    return SessionOut(
        id=s.id,
        started_at=s.started_at,
        ended_at=s.ended_at,
        duration_sec=s.duration_sec,
        is_pomodoro=s.is_pomodoro,
        note=s.note,
    )

@app.get("/sessions/my", response_model=list[SessionOut])
def my_sessions(limit: int = 20, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    rows = (
        db.query(StudySession)
        .filter_by(user_id=user.id)
        .order_by(StudySession.started_at.desc())
        .limit(limit)
        .all()
    )
    return [
        SessionOut(
            id=r.id,
            started_at=r.started_at,
            ended_at=r.ended_at,
            duration_sec=r.duration_sec,
            is_pomodoro=r.is_pomodoro,
            note=r.note,
        )
        for r in rows
    ]
