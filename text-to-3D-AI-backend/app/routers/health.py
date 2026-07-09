from fastapi import APIRouter
from app.celery_app import celery_app

router = APIRouter(prefix="/health", tags=["System"])

@router.get("")
async def health_check():
    """Simple health check endpoint that pings Redis."""
    try:
        celery_app.backend.client.ping()
        return {"status": "ok", "redis": "connected"}
    except Exception as e:
        return {"status": "error", "redis": str(e)}
