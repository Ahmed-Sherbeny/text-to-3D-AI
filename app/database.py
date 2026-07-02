"""
OptiForge3D — Database Connection Setup
========================================
Async SQLAlchemy engine, session factory, declarative Base, and
a FastAPI dependency for injecting database sessions into routes.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, MetaData, func
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.config import get_settings

# ── Naming convention for constraints (keeps Alembic migrations clean) ───
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

settings = get_settings()

# ── Async Engine ─────────────────────────────────────────────────────────
# Connects to the real PostgreSQL instance from Docker Compose.
engine = create_async_engine(
    settings.database_url,
    echo=settings.APP_DEBUG,       # Log SQL statements in development
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,            # Test connections before using them
)

# ── Session Factory ──────────────────────────────────────────────────────
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# ── Declarative Base ─────────────────────────────────────────────────────
class Base(DeclarativeBase):
    """
    Base class for all ORM models.
    Uses a naming convention for consistent constraint names across migrations.
    """
    metadata = MetaData(naming_convention=convention)


# ── Timestamp Mixin ──────────────────────────────────────────────────────
class TimestampMixin:
    """
    Mixin that adds created_at and updated_at columns to any model.
    Timestamps are timezone-aware and auto-managed by the database server.
    """
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


# ── FastAPI Dependency ───────────────────────────────────────────────────
async def get_db() -> AsyncSession:
    """
    Yields an async database session for use in FastAPI route dependencies.
    The session is automatically closed when the request completes.

    Usage in a route:
        @router.get("/example")
        async def example(db: AsyncSession = Depends(get_db)):
            result = await db.execute(select(Model))
            ...
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
