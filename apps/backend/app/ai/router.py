from typing import List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text

from ..db import get_db
from ..jwt import decode_access_token
from .. import models
from .providers.dummy import DummyLocalProvider

router = APIRouter(tags=["ai"])

class KeyConceptsIn(BaseModel):
    text: str
    k: int = 5

class KeyConceptsOut(BaseModel):
    concepts: List[str]

def current_user(
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
) -> models.User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.split(" ", 1)[1]
    try:
        claims = decode_access_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    sub = claims.get("sub")
    user = db.get(models.User, int(sub)) if sub is not None else None
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# In the future, switch this factory based on env (AI_PROVIDER=openai/replicate/etc.)
_provider = DummyLocalProvider()

@router.post("/key-concepts", response_model=KeyConceptsOut)
def key_concepts(payload: KeyConceptsIn, user: models.User = Depends(current_user)):
    # Personalization hook (later): use `user.id` to bias/explain results or log telemetry
    concepts = _provider.key_concepts(payload.text, k=max(1, min(payload.k, 12)))
    return KeyConceptsOut(concepts=concepts)
