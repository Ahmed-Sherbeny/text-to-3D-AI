"""
OptiForge3D — Health Check Router
====================================
Real health checks against PostgreSQL, Redis, and MinIO.
No mock data — if a service is down, the real error is reported.
"""

import time
from urllib.parse import urlparse

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.database import get_db
from app.schemas.health import HealthResponse, ServiceHealth

router = APIRouter(tags=["Health"])


async def _check_postgres(db: AsyncSession) -> ServiceHealth:
    """Execute a real query against PostgreSQL and measure latency."""
    start = time.perf_counter()
    try:
        await db.execute(text("SELECT 1"))
        latency = (time.perf_counter() - start) * 1000
        return ServiceHealth(status="healthy", latency_ms=round(latency, 2))
    except Exception as e:
        latency = (time.perf_counter() - start) * 1000
        return ServiceHealth(
            status="unhealthy",
            latency_ms=round(latency, 2),
            error=str(e),
        )


async def _check_redis(settings: Settings) -> ServiceHealth:
    """Open a real connection to Redis, send PING, and measure latency."""
    import redis.asyncio as aioredis

    start = time.perf_counter()
    try:
        client = aioredis.from_url(settings.redis_url, socket_timeout=3)
        pong = await client.ping()
        latency = (time.perf_counter() - start) * 1000
        await client.aclose()
        if not pong:
            return ServiceHealth(
                status="unhealthy",
                latency_ms=round(latency, 2),
                error="Redis PING returned False.",
            )
        return ServiceHealth(status="healthy", latency_ms=round(latency, 2))
    except Exception as e:
        latency = (time.perf_counter() - start) * 1000
        return ServiceHealth(
            status="unhealthy",
            latency_ms=round(latency, 2),
            error=str(e),
        )


async def _check_minio(settings: Settings) -> ServiceHealth:
    """Send a real HTTP request to the MinIO health endpoint."""
    import asyncio
    import http.client

    start = time.perf_counter()
    try:
        # Parse endpoint — MinIO exposes /minio/health/live
        host_port = settings.MINIO_ENDPOINT
        parsed = urlparse(f"http://{host_port}")
        host = parsed.hostname or "localhost"
        port = parsed.port or 9000

        # Run the blocking HTTP request in a thread to avoid blocking the loop
        def _ping_minio() -> int:
            conn = http.client.HTTPConnection(host, port, timeout=3)
            conn.request("GET", "/minio/health/live")
            response = conn.getresponse()
            status_code = response.status
            conn.close()
            return status_code

        status_code = await asyncio.to_thread(_ping_minio)
        latency = (time.perf_counter() - start) * 1000

        if status_code == 200:
            return ServiceHealth(status="healthy", latency_ms=round(latency, 2))
        else:
            return ServiceHealth(
                status="unhealthy",
                latency_ms=round(latency, 2),
                error=f"MinIO returned HTTP {status_code}.",
            )
    except Exception as e:
        latency = (time.perf_counter() - start) * 1000
        return ServiceHealth(
            status="unhealthy",
            latency_ms=round(latency, 2),
            error=str(e),
        )


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="System Health Check",
    description="Checks the real connection status of PostgreSQL, Redis, and MinIO.",
)
async def health_check(
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> HealthResponse:
    """
    Returns the real health status of all backend service dependencies.
    No mock data — every status reflects a live connection check.
    """
    # Run all health checks concurrently
    import asyncio

    postgres_health, redis_health, minio_health = await asyncio.gather(
        _check_postgres(db),
        _check_redis(settings),
        _check_minio(settings),
    )

    services = {
        "postgresql": postgres_health,
        "redis": redis_health,
        "minio": minio_health,
    }

    # Overall status: healthy only if ALL services are healthy
    all_healthy = all(s.status == "healthy" for s in services.values())

    return HealthResponse(
        status="healthy" if all_healthy else "degraded",
        environment=settings.APP_ENV,
        services=services,
    )
