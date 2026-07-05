"""
OptiForge3D — Sync Database for Celery Workers
=================================================
Celery workers run synchronous code, so they need a sync SQLAlchemy
engine (psycopg2) instead of the async one (asyncpg) used by FastAPI.

Reads the same .env settings to keep credentials centralised.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_settings

settings = get_settings()

# ── Sync Engine (psycopg2) ──────────────────────────────────────────────
sync_engine = create_engine(
    settings.database_url_sync,
    echo=False,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
)

# ── Session Factory ─────────────────────────────────────────────────────
SyncSessionLocal = sessionmaker(
    bind=sync_engine,
    class_=Session,
    expire_on_commit=False,
)


def get_sync_db() -> Session:
    """
    Returns a sync database session for use in Celery tasks.
    Must be used in a try/finally block to ensure cleanup.

    Usage:
        db = get_sync_db()
        try:
            # ... do work ...
            db.commit()
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()
    """
    return SyncSessionLocal()
