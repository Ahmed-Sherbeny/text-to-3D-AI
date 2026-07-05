"""
OptiForge3D — System Status Model
====================================
A simple key-value store for tracking system-wide configuration
and status information (e.g., model versions, feature flags).
"""

import uuid

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, TimestampMixin


class SystemStatus(Base, TimestampMixin):
    """
    Key-value pairs for system-level configuration and status tracking.

    Examples:
        key="ml_model_version"     value="1.2.0"
        key="maintenance_mode"     value="false"
        key="last_health_check"    value="2025-01-15T10:30:00Z"
    """
    __tablename__ = "system_status"

    # ── Primary Key ──────────────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
        doc="Unique identifier for this status entry.",
    )

    # ── Key-Value Fields ─────────────────────────────────────────
    key: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
        doc="Unique status key name.",
    )
    value: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        doc="The value associated with this key (JSON-serializable string).",
    )
    description: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        doc="Human-readable description of what this key represents.",
    )

    def __repr__(self) -> str:
        return f"<SystemStatus(key={self.key!r}, value={self.value!r})>"
