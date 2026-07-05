"""
OptiForge3D — User Profile Model
==================================
Tracks registered users of the platform.
"""

import uuid

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, TimestampMixin


class User(Base, TimestampMixin):
    """
    Represents a registered user on the OptiForge3D platform.

    Relationships:
        - generations: All 3D model generation jobs created by this user.
    """
    __tablename__ = "users"

    # ── Primary Key ──────────────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
        doc="Unique user identifier (UUID v4).",
    )

    # ── Profile Fields ───────────────────────────────────────────
    username: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
        doc="Unique display name.",
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
        doc="Unique email address.",
    )
    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="Bcrypt-hashed password. Never store plaintext.",
    )
    full_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        doc="Optional full name for display purposes.",
    )

    # ── Account Flags ────────────────────────────────────────────
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        doc="Whether the account is active. Soft-delete flag.",
    )
    is_admin: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        doc="Whether the user has admin privileges.",
    )

    # ── Relationships ────────────────────────────────────────────
    generations = relationship(
        "Generation",
        back_populates="user",
        lazy="selectin",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id!r}, username={self.username!r})>"
