"""
OptiForge3D — User Pydantic Schemas
=====================================
Request/response schemas for User endpoints.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# ── Request Schemas ──────────────────────────────────────────────────────

class UserCreate(BaseModel):
    """Schema for creating a new user account."""
    username: str = Field(
        ..., min_length=3, max_length=50,
        description="Unique display name (3–50 characters).",
        examples=["john_doe"],
    )
    email: EmailStr = Field(
        ...,
        description="Valid email address.",
        examples=["john@example.com"],
    )
    password: str = Field(
        ..., min_length=8, max_length=128,
        description="Plaintext password (8–128 characters). Will be hashed server-side.",
    )
    full_name: str | None = Field(
        None, max_length=100,
        description="Optional full name.",
        examples=["John Doe"],
    )


class UserUpdate(BaseModel):
    """Schema for updating an existing user profile (partial updates)."""
    username: str | None = Field(None, min_length=3, max_length=50)
    email: EmailStr | None = None
    full_name: str | None = Field(None, max_length=100)
    is_active: bool | None = None


# ── Response Schemas ─────────────────────────────────────────────────────

class UserRead(BaseModel):
    """Schema for returning user data in API responses."""
    id: uuid.UUID
    username: str
    email: str
    full_name: str | None
    is_active: bool
    is_admin: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
