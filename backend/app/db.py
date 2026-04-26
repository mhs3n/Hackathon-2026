from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .settings import settings


class Base(DeclarativeBase):
    pass


def _connect_args(db_url: str) -> dict:
    if db_url.startswith("sqlite:"):
        return {"check_same_thread": False}
    return {}


engine = create_engine(settings.db_url, connect_args=_connect_args(settings.db_url))
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

