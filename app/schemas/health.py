"""
OptiForge3D — Health Check Pydantic Schemas
=============================================
Response schemas for health and readiness endpoints.
"""

from pydantic import BaseModel, Field


class ServiceHealth(BaseModel):
    """Health status of a single service dependency."""
    status: str = Field(
        ...,
        description="'healthy' or 'unhealthy'.",
        examples=["healthy"],
    )
    latency_ms: float | None = Field(
        None,
        description="Response latency in milliseconds.",
    )
    error: str | None = Field(
        None,
        description="Error message if the service is unhealthy.",
    )


class HealthResponse(BaseModel):
    """Aggregated health check for all backend services."""
    status: str = Field(
        ...,
        description="Overall status: 'healthy' or 'degraded'.",
        examples=["healthy"],
    )
    environment: str = Field(
        ...,
        description="Current application environment.",
        examples=["development"],
    )
    services: dict[str, ServiceHealth] = Field(
        ...,
        description="Health status of each service dependency.",
    )
