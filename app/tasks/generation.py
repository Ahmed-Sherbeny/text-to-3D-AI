"""
OptiForge3D — 3D Generation Celery Task
=========================================
The main background task that processes 3D model generation requests.

This task:
1. Updates the Generation row to PROCESSING
2. Runs the ML pipeline (placeholder for Shap-E / YOLOv8 / CLIP)
3. On success: sets COMPLETED + output_file_url + processing_time_ms
4. On failure: sets FAILED + error_message

All database writes hit real PostgreSQL via the sync engine.
"""

import logging
import time
import uuid

from app.celery_app import celery_app
from app.models.generation import GenerationStatus
from app.tasks.database import get_sync_db

logger = logging.getLogger("optiforge3d.tasks")


@celery_app.task(
    bind=True,
    name="app.tasks.generate_3d",
    max_retries=2,
    default_retry_delay=30,
    acks_late=True,
)
def generate_3d_task(
    self,
    generation_id: str,
    input_type: str,
    prompt: str | None = None,
    input_file_url: str | None = None,
    parameters: dict | None = None,
) -> dict:
    """
    Background task: generates a 3D model from user input.

    Args:
        generation_id: UUID of the Generation record in PostgreSQL.
        input_type: "text", "image", or "sketch".
        prompt: The text prompt (for text-based generation).
        input_file_url: Optional MinIO path for the input image/sketch.
        parameters: Optional model parameters (format, quality, etc.).

    Returns:
        dict with generation_id, status, and output_file_url.
    """
    logger.info(f"🏭 Starting generation task: {generation_id}")
    logger.info(f"   Input type: {input_type}, Prompt: {prompt!r}")
    logger.info(f"   Celery task ID: {self.request.id}")

    db = get_sync_db()
    start_time = time.time()

    try:
        # ── Step 1: Mark as PROCESSING ──────────────────────────────
        from app.models.generation import Generation

        generation = db.query(Generation).filter(
            Generation.id == uuid.UUID(generation_id)
        ).first()

        if not generation:
            raise ValueError(f"Generation {generation_id} not found in database")

        generation.status = GenerationStatus.PROCESSING
        db.commit()
        logger.info(f"   Status → PROCESSING")

        logger.info("   🧠 ML pipeline executing via Colab API...")

        import requests
        import os
        from minio import Minio
        from app.config import get_settings
        
        settings = get_settings()
        
        # Pull the Cloudflare API URL from .env via the Settings class
        ml_api_url = settings.OPTIFORGE_ML_API_URL
        if not ml_api_url:
            raise ValueError("OPTIFORGE_ML_API_URL is not set in the .env file!")
        
        response = requests.post(
            f"{ml_api_url.rstrip('/')}/generate",
            json={"prompt": prompt, "steps": 64},
            headers={"ngrok-skip-browser-warning": "1"},
            timeout=180 # 3 minutes since Shap-E generation takes a bit
        )
        
        if response.status_code != 200:
            raise RuntimeError(f"Colab API returned {response.status_code}: {response.text}")

        # Save downloaded .obj temporarily
        temp_file = f"/tmp/{generation_id}.obj"
        # On Windows, you might want os.path.join(os.getenv('TEMP'), f"{generation_id}.obj")
        if os.name == 'nt':
            temp_file = os.path.join(os.getenv('TEMP', '.'), f"{generation_id}.obj")
            
        with open(temp_file, "wb") as f:
            f.write(response.content)

        # Upload to MinIO
        from app.minio_client import minio_client
        import io
        
        with open(temp_file, "rb") as f:
            file_bytes = f.read()
            
        object_name = f"{generation_id}/model.obj"
        output_url = minio_client.upload_file_stream(
            bucket_name=settings.MINIO_BUCKET_GENERATED_MODELS,
            object_name=object_name,
            data=io.BytesIO(file_bytes),
            length=len(file_bytes),
            content_type="application/octet-stream",
        )
        
        # Clean up temp file
        if os.path.exists(temp_file):
            os.remove(temp_file)

        logger.info(f"   ✅ ML pipeline complete. Output: {output_url}")

        # ── Step 3: Mark as COMPLETED ───────────────────────────────
        elapsed_ms = int((time.time() - start_time) * 1000)

        generation.status = GenerationStatus.COMPLETED
        generation.output_file_url = output_url
        generation.processing_time_ms = elapsed_ms
        db.commit()

        logger.info(f"   Status → COMPLETED ({elapsed_ms}ms)")

        return {
            "generation_id": generation_id,
            "status": "completed",
            "output_file_url": output_url,
            "processing_time_ms": elapsed_ms,
        }

    except Exception as exc:
        # ── Step 4: Mark as FAILED ──────────────────────────────────
        elapsed_ms = int((time.time() - start_time) * 1000)
        error_msg = str(exc)

        logger.error(f"   ❌ Task FAILED: {error_msg}")

        try:
            if generation:
                generation.status = GenerationStatus.FAILED
                generation.error_message = error_msg
                generation.processing_time_ms = elapsed_ms
                db.commit()
        except Exception as db_err:
            logger.error(f"   ❌ Failed to update DB with error: {db_err}")
            db.rollback()

        raise

    finally:
        db.close()
