"""
OptiForge3D — Routers Package
================================
"""

from app.routers.health import router as health_router
from app.routers.generation import router as generation_router

__all__ = ["health_router", "generation_router"]
