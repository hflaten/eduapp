from sqlalchemy import Column, Integer, String, DateTime, func
from .db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=True)
    password_hash = Column(String, nullable=True)  # temporarily nullable; we'll enforce later
    created_at = Column(DateTime(timezone=True), server_default=func.now())
