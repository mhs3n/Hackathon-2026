from __future__ import annotations

from pathlib import Path

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from .db import engine


ROOT_DIR = Path(__file__).resolve().parents[2]
SCHEMA_PATH = ROOT_DIR / "database" / "schema.sql"
SEED_PATH = ROOT_DIR / "database" / "seed.sql"


def _run_sql_script(path: Path) -> None:
    statements = [chunk.strip() for chunk in path.read_text(encoding="utf-8").split(";") if chunk.strip()]
    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


def bootstrap_database() -> None:
    inspector = inspect(engine)
    if not inspector.has_table("institutions"):
        _run_sql_script(SCHEMA_PATH)

    with Session(engine) as session:
        institution_count = session.execute(text("SELECT COUNT(*) FROM institutions")).scalar_one()

    if institution_count == 0:
        _run_sql_script(SEED_PATH)
