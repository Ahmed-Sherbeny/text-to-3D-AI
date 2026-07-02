"""
OptiForge3D — FastAPI Application Entry Point
================================================
Local-first SaaS platform for generating 3D models
from text, images, or sketches.

Run with:
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import get_settings
from app.database import engine
from app.routers import generation_router, health_router

# ── Logging ──────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger("optiforge3d")

settings = get_settings()


# ── Lifespan (startup / shutdown) ────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs on application startup and shutdown.
    - Startup: Verify real connections to PostgreSQL and Redis.
    - Shutdown: Dispose the database engine cleanly.
    """
    # ── Startup ──────────────────────────────────────────────────
    logger.info("🚀 OptiForge3D backend starting up...")
    logger.info(f"   Environment : {settings.APP_ENV}")
    logger.info(f"   Debug mode  : {settings.APP_DEBUG}")

    # Verify PostgreSQL connection (real query, no mock)
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("✅ PostgreSQL connection verified.")
    except Exception as e:
        logger.error(f"❌ PostgreSQL connection FAILED: {e}")

    # Verify Redis connection (real PING, no mock)
    try:
        import redis.asyncio as aioredis

        redis_client = aioredis.from_url(settings.redis_url, socket_timeout=3)
        pong = await redis_client.ping()
        if pong:
            logger.info("✅ Redis connection verified.")
        else:
            logger.warning("⚠️  Redis PING returned False.")
        await redis_client.aclose()
    except Exception as e:
        logger.error(f"❌ Redis connection FAILED: {e}")

    logger.info("🟢 OptiForge3D backend is ready.")
    logger.info(f"   Docs: http://localhost:8000/docs")

    yield  # ← Application runs here

    # ── Shutdown ─────────────────────────────────────────────────
    logger.info("🔴 OptiForge3D backend shutting down...")
    await engine.dispose()
    logger.info("   Database engine disposed. Goodbye.")


# ── FastAPI Application ──────────────────────────────────────────────────
app = FastAPI(
    title="OptiForge3D API",
    description=(
        "Local-first SaaS platform for generating 3D models "
        "from text, images, or sketches."
    ),
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


# ── CORS Middleware ──────────────────────────────────────────────────────
# Strictly locked to localhost origins for local-first requirement.
# No wildcard origins — only explicit localhost ports are allowed.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# ── Register Routers ────────────────────────────────────────────────────
app.include_router(health_router)
app.include_router(generation_router)


# ── Root Endpoint ────────────────────────────────────────────────────────
@app.get("/", tags=["Root"], summary="API Root")
async def root():
    """Returns basic API information."""
    return {
        "name": "OptiForge3D API",
        "version": "0.1.0",
        "status": "running",
        "docs": "/docs",
    }
