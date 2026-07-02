"""
OptiForge3D — Generation Metadata Model
=========================================
Tracks every 3D model generation job: input type, prompt, parameters,
status lifecycle, and output file references in MinIO.
"""

import enum
import uuid

from sqlalchemy import Enum, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, TimestampMixin


class InputType(str, enum.Enum):
    """The kind of input the user provided to trigger generation."""
    TEXT = "text"
    IMAGE = "image"
    SKETCH = "sketch"


class GenerationStatus(str, enum.Enum):
    """Lifecycle status of a generation job."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Generation(Base, TimestampMixin):
    """
    Represents a single 3D model generation request.

    Each generation is tied to a user, records the input prompt/parameters,
    and tracks the processing status through to completion or failure.
    File references (input_file_url, output_file_url) point to real
    MinIO object paths — never hardcoded or mocked.
    """
    __tablename__ = "generations"

    # ── Primary Key ──────────────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
        doc="Unique generation job identifier (UUID v4).",
    )

    # ── Foreign Key to User ──────────────────────────────────────
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="The user who initiated this generation.",
    )

    # ── Input Details ────────────────────────────────────────────
    input_type: Mapped[InputType] = mapped_column(
        Enum(InputType, name="input_type_enum", create_constraint=True),
        nullable=False,
        doc="Whether the input was text, an image, or a sketch.",
    )
    prompt: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="The text prompt describing the desired 3D model.",
    )
    input_file_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
        doc="MinIO object path for the uploaded image or sketch input.",
    )

    # ── Output Details ───────────────────────────────────────────
    output_file_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
        doc="MinIO object path for the generated 3D model file.",
    )

    # ── Processing Status ────────────────────────────────────────
    status: Mapped[GenerationStatus] = mapped_column(
        Enum(GenerationStatus, name="generation_status_enum", create_constraint=True),
        default=GenerationStatus.PENDING,
        nullable=False,
        index=True,
        doc="Current lifecycle status of this generation job.",
    )
    parameters: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        doc="Model parameters used for generation (format, quality, etc.).",
    )
    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Error details if the generation failed.",
    )
    processing_time_ms: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        doc="Total processing time in milliseconds (set on completion).",
    )
    celery_task_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        doc="Celery task ID for tracking the background job.",
    )

    # ── Relationships ────────────────────────────────────────────
    user = relationship(
        "User",
        back_populates="generations",
    )

    def __repr__(self) -> str:
        return (
            f"<Generation(id={self.id!r}, user_id={self.user_id!r}, "
            f"status={self.status.value!r})>"
        )
