from sqlalchemy import Column, Integer, String, DateTime, func
from .db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=True)
    password_hash = Column(String, nullable=True)  # temporarily nullable; we'll enforce later
    created_at = Column(DateTime(timezone=True), server_default=func.now())
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, func
from sqlalchemy.orm import relationship

class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    duration_sec = Column(Integer, nullable=True)
    is_pomodoro = Column(Boolean, nullable=False, server_default="false")
    note = Column(String, nullable=True)

    user = relationship("User")
