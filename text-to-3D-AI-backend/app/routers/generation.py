"""
OptiForge3D — Generation Router
=================================
API endpoints for submitting and tracking 3D model generation jobs.

POST /generations/              → Submit a new generation (dispatches to Celery)
GET  /generations/{id}/status   → Check the status of a generation job
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.generation import Generation, GenerationStatus
from app.schemas.generation import (
    GenerationCreate,
    GenerationStatusResponse,
    GenerationSubmitResponse,
)

router = APIRouter(prefix="/generations", tags=["Generations"])


@router.post(
    "/",
    response_model=GenerationSubmitResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Submit a 3D Generation Job",
    description=(
        "Creates a new generation record, dispatches the heavy ML work to a "
        "Celery background worker, and returns the task ID immediately. "
        "The API is never blocked by long-running GPU computations."
    ),
)
async def submit_generation(
    payload: GenerationCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    1. Insert a new Generation row (status=PENDING) into PostgreSQL.
    2. Fire generate_3d_task.delay() to the Celery queue.
    3. Update the row with the celery_task_id.
    4. Return generation_id + celery_task_id immediately.
    """
    # Create the Generation record
    generation = Generation(
        id=uuid.uuid4(),
        user_id=payload.user_id,
        input_type=payload.input_type,
        prompt=payload.prompt,
        parameters=payload.parameters,
        status=GenerationStatus.PENDING,
    )
    db.add(generation)
    await db.flush()  # Get the ID assigned without committing

    # Dispatch to Celery (non-blocking)
    from app.tasks.generation import generate_3d_task

    task = generate_3d_task.delay(
        generation_id=str(generation.id),
        input_type=payload.input_type.value,
        prompt=payload.prompt,
        parameters=payload.parameters,
    )

    # Store the Celery task ID on the Generation row
    generation.celery_task_id = task.id
    await db.commit()

    return GenerationSubmitResponse(
        generation_id=generation.id,
        celery_task_id=task.id,
        status=GenerationStatus.PENDING,
        message="Generation job submitted. Use the generation_id to check status.",
    )


@router.get(
    "/{generation_id}/status",
    response_model=GenerationStatusResponse,
    summary="Check Generation Status",
    description=(
        "Returns the current status of a generation job by querying "
        "the real PostgreSQL record. No mocked data."
    ),
)
async def get_generation_status(
    generation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Query the real Generation row and return its current state."""
    result = await db.execute(
        select(Generation).where(Generation.id == generation_id)
    )
    generation = result.scalar_one_or_none()

    if not generation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Generation {generation_id} not found.",
        )

    return GenerationStatusResponse(
        generation_id=generation.id,
        status=generation.status,
        celery_task_id=generation.celery_task_id,
        output_file_url=generation.output_file_url,
        error_message=generation.error_message,
        processing_time_ms=generation.processing_time_ms,
        created_at=generation.created_at,
        updated_at=generation.updated_at,
    )
