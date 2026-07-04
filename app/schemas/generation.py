"""
OptiForge3D — Generation Pydantic Schemas
==========================================
Request/response schemas for Generation endpoints.
"""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.models.generation import GenerationStatus, InputType


# ── Request Schemas ──────────────────────────────────────────────────────

class TextGenerationRequest(BaseModel):
    """Schema for submitting a new text-to-3D generation job."""
    user_id: uuid.UUID = Field(
        ...,
        description="The ID of the user submitting this generation.",
    )
    prompt: str | None = Field(
        None,
        description="Text prompt describing the desired 3D model.",
        examples=["A futuristic spaceship with glowing engines"],
    )
    parameters: dict[str, Any] | None = Field(
        None,
        description="Optional model parameters (format, quality, etc.).",
        examples=[{"format": "glb", "quality": "high"}],
    )


# ── Response Schemas ─────────────────────────────────────────────────────

class GenerationRead(BaseModel):
    """Schema for returning generation data in API responses."""
    id: uuid.UUID
    user_id: uuid.UUID
    input_type: InputType
    prompt: str | None
    input_file_url: str | None
    output_file_url: str | None
    status: GenerationStatus
    parameters: dict[str, Any] | None
    error_message: str | None
    processing_time_ms: int | None
    celery_task_id: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class GenerationList(BaseModel):
    """Paginated list of generation results."""
    items: list[GenerationRead]
    total: int


class GenerationSubmitResponse(BaseModel):
    """Returned immediately when a generation job is submitted."""
    generation_id: uuid.UUID = Field(
        ..., description="UUID of the generation record in PostgreSQL."
    )
    celery_task_id: str = Field(
        ..., description="Celery task ID for tracking the background job."
    )
    status: GenerationStatus = Field(
        ..., description="Initial status (always 'pending')."
    )
    message: str = Field(
        ..., description="Human-readable confirmation message."
    )


class GenerationStatusResponse(BaseModel):
    """Current status of a generation job, queried from real PostgreSQL."""
    generation_id: uuid.UUID
    status: GenerationStatus
    celery_task_id: str | None = None
    output_file_url: str | None = None
    error_message: str | None = None
    processing_time_ms: int | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

