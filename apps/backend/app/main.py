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

# Dev CORS; tighten in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

# ---- Auth dependency (reads Authorization: Bearer <token>) ----
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

# ---- Protected route ----
@app.get("/me")
def me(current_user: models.User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email, "name": current_user.name}
