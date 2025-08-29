import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict
from jose import jwt, JWTError

# NOTE: use a strong secret in production; store it in an env var.
ALGORITHM = "HS256"
JWT_SECRET = os.getenv("JWT_SECRET", "dev-insecure-secret-change-me")

def create_access_token(sub: str, expires_minutes: int = 60) -> str:
    """
    Create a signed JWT with subject `sub` (usually the user id or email).
    """
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=expires_minutes)
    payload: Dict[str, Any] = {
        "sub": sub,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)

def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decode and verify a JWT. Raises JWTError on invalid/expired tokens.
    """
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
    except JWTError as e:
        raise e
