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
    parameters: dict | None = None,
) -> dict:
    """
    Background task: generates a 3D model from user input.

    Args:
        generation_id: UUID of the Generation record in PostgreSQL.
        input_type: "text", "image", or "sketch".
        prompt: The text prompt (for text-based generation).
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

        # ── Step 2: Run ML Pipeline ─────────────────────────────────
        # =============================================================
        # 🔌 ML ENGINEER: PLUG IN YOUR CODE HERE
        # =============================================================
        # This is where the heavy PyTorch execution happens:
        #   - Load the Shap-E / YOLOv8 / CLIP model weights
        #   - Generate the 3D mesh from the input
        #   - Export to .glb / .obj format
        #   - Upload the result to MinIO (generated-models bucket)
        #   - Return the MinIO object URL
        #
        # Example integration:
        #   from ml.pipeline import generate_3d_model
        #   result = generate_3d_model(
        #       input_type=input_type,
        #       prompt=prompt,
        #       parameters=parameters,
        #   )
        #   output_url = upload_to_minio(result.mesh_file)
        #
        # For now, we simulate the processing time to prove
        # the task queue works end-to-end with real infrastructure.
        # =============================================================

        logger.info("   🧠 ML pipeline executing...")

        # Simulate GPU processing (replace with real ML code)
        time.sleep(5)

        # Simulated output URL (replace with real MinIO upload path)
        output_url = (
            f"generated-models/{generation_id}/model.glb"
        )

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
