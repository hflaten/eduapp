import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

_default = "postgresql+psycopg://edu:pass@localhost:5432/eduapp"

raw_url = os.getenv("DATABASE_URL", _default)
if raw_url.startswith("postgres://"):
    raw_url = raw_url.replace("postgres://", "postgresql+psycopg://", 1)
elif raw_url.startswith("postgresql://") and "+psycopg" not in raw_url:
    raw_url = raw_url.replace("postgresql://", "postgresql+psycopg://", 1)

DATABASE_URL = raw_url

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
