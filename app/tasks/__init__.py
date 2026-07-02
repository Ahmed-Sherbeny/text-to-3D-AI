"""
OptiForge3D — Tasks Package
================================
Background tasks executed by Celery workers.
"""

from app.tasks.generation import generate_3d_task

__all__ = ["generate_3d_task"]
