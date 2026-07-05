"""
OptiForge3D — Celery Application Setup
========================================
Configures the Celery distributed task queue with Redis as both
the message broker and result backend. Tuned for heavy ML workloads
that require exclusive GPU access.

Start the worker with:
    celery -A app.celery_app worker --loglevel=info --concurrency=1 --pool=solo -Q default
"""

from celery import Celery

from app.config import get_settings

settings = get_settings()

# ── Celery Application ──────────────────────────────────────────────────
# Broker (message queue) and backend (result store) both use our local Redis.
celery_app = Celery(
    "optiforge3d",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

# ── Configuration for Heavy ML Workloads ────────────────────────────────
celery_app.conf.update(
    # Serialization
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],

    # Timezone
    timezone="UTC",
    enable_utc=True,

    # Concurrency — ONE task at a time (GPU can't parallelize)
    worker_concurrency=1,

    # Don't buffer extra tasks; fetch one at a time
    worker_prefetch_multiplier=1,

    # Don't acknowledge until the task finishes (survives worker crashes)
    task_acks_late=True,

    # Report the STARTED state so the API can show "processing"
    task_track_started=True,

    # Clean up results after 1 hour
    result_expires=3600,

    # Reject tasks back to the queue on worker shutdown (no lost work)
    worker_cancel_long_running_tasks_on_connection_loss=True,

    # Default queue
    task_default_queue="default",
)

# ── Auto-discover tasks from the app.tasks package ──────────────────────
celery_app.autodiscover_tasks(["app.tasks"])
