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

class GenerationCreate(BaseModel):
    """Schema for submitting a new 3D model generation job."""
    input_type: InputType = Field(
        ...,
        description="The kind of input: 'text', 'image', or 'sketch'.",
        examples=["text"],
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
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class GenerationList(BaseModel):
    """Paginated list of generation results."""
    items: list[GenerationRead]
    total: int
