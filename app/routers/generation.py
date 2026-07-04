"""
OptiForge3D — API v1 Router
=================================
API endpoints for submitting and tracking 3D model generation jobs.

POST /api/v1/generate/text    → Submit a text-to-3D job
POST /api/v1/generate/image   → Submit an image-to-3D job (multipart)
POST /api/v1/generate/sketch  → Submit a sketch-to-3D job (multipart)
GET  /api/v1/generate/{id}/status   → Check the status of a generation job
GET  /api/v1/models/{id}/download   → Download the finished 3D model
"""

import json
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.minio_client import minio_client
from app.models.generation import Generation, GenerationStatus, InputType
from app.schemas.generation import (
    GenerationStatusResponse,
    GenerationSubmitResponse,
    TextGenerationRequest,
)

settings = get_settings()
router = APIRouter(prefix="/api/v1", tags=["Generations"])


@router.post(
    "/generate/text",
    response_model=GenerationSubmitResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Submit a Text-to-3D Generation Job",
)
async def generate_text(
    payload: TextGenerationRequest,
    db: AsyncSession = Depends(get_db),
):
    # Create the Generation record
    generation = Generation(
        id=uuid.uuid4(),
        user_id=payload.user_id,
        input_type=InputType.TEXT,
        prompt=payload.prompt,
        parameters=payload.parameters,
        status=GenerationStatus.PENDING,
    )
    db.add(generation)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Invalid user_id")

    # Dispatch to Celery
    from app.tasks.generation import generate_3d_task

    task = generate_3d_task.delay(
        generation_id=str(generation.id),
        input_type="text",
        prompt=payload.prompt,
        input_file_url=None,
        parameters=payload.parameters,
    )

    generation.celery_task_id = task.id
    await db.commit()

    return GenerationSubmitResponse(
        generation_id=generation.id,
        celery_task_id=task.id,
        status=GenerationStatus.PENDING,
        message="Text generation job submitted.",
    )


@router.post(
    "/generate/image",
    response_model=GenerationSubmitResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Submit an Image-to-3D Generation Job",
)
async def generate_image(
    user_id: uuid.UUID = Form(...),
    prompt: Optional[str] = Form(None),
    parameters: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    return await handle_multipart_generation(
        InputType.IMAGE, user_id, prompt, parameters, file, db
    )


@router.post(
    "/generate/sketch",
    response_model=GenerationSubmitResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Submit a Sketch-to-3D Generation Job",
)
async def generate_sketch(
    user_id: uuid.UUID = Form(...),
    prompt: Optional[str] = Form(None),
    parameters: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    return await handle_multipart_generation(
        InputType.SKETCH, user_id, prompt, parameters, file, db
    )


async def handle_multipart_generation(
    input_type: InputType,
    user_id: uuid.UUID,
    prompt: Optional[str],
    parameters_json: Optional[str],
    file: UploadFile,
    db: AsyncSession,
):
    # Parse parameters
    parameters = {}
    if parameters_json:
        try:
            parameters = json.loads(parameters_json)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON in parameters")

    # ── Validate the uploaded file ──────────────────────────────
    # Reject empty uploads and enforce a small content-type allow-list
    # so arbitrary blobs can't be ingested as "images" or "sketches".
    ALLOWED_CONTENT_TYPES = {
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
    }
    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Unsupported file type: '{content_type or 'unknown'}'. "
                f"Allowed: png, jpeg, webp."
            ),
        )

    # Stream the file into memory and reject zero-byte uploads.
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty.",
        )

    import io
    data_stream = io.BytesIO(file_bytes)
    object_name = f"{user_id}/{uuid.uuid4()}_{file.filename}"
    
    input_file_url = minio_client.upload_file_stream(
        bucket_name=settings.MINIO_BUCKET_RAW_UPLOADS,
        object_name=object_name,
        data=data_stream,
        length=len(file_bytes),
        content_type=file.content_type or "application/octet-stream",
    )

    # Create Generation record
    generation = Generation(
        id=uuid.uuid4(),
        user_id=user_id,
        input_type=input_type,
        prompt=prompt,
        input_file_url=input_file_url,
        parameters=parameters,
        status=GenerationStatus.PENDING,
    )
    db.add(generation)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Invalid user_id")

    # Dispatch to Celery
    from app.tasks.generation import generate_3d_task

    task = generate_3d_task.delay(
        generation_id=str(generation.id),
        input_type=input_type.value,
        prompt=prompt,
        input_file_url=input_file_url,
        parameters=parameters,
    )

    generation.celery_task_id = task.id
    await db.commit()

    return GenerationSubmitResponse(
        generation_id=generation.id,
        celery_task_id=task.id,
        status=GenerationStatus.PENDING,
        message=f"{input_type.value.capitalize()} generation job submitted.",
    )


@router.get(
    "/generate/{generation_id}/status",
    response_model=GenerationStatusResponse,
    summary="Check Generation Status",
)
async def get_generation_status(
    generation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
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


@router.get(
    "/models/{generation_id}/download",
    summary="Download the Generated 3D Model",
)
async def download_model(
    generation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    # Verify the generation exists and is completed
    result = await db.execute(
        select(Generation).where(Generation.id == generation_id)
    )
    generation = result.scalar_one_or_none()

    if not generation:
        raise HTTPException(status_code=404, detail="Generation not found.")
    
    if generation.status != GenerationStatus.COMPLETED or not generation.output_file_url:
        raise HTTPException(status_code=400, detail="Generation is not completed yet or file URL is missing.")

    # output_file_url is stored as "bucket_name/object_name"
    parts = generation.output_file_url.split("/", 1)
    if len(parts) != 2:
        raise HTTPException(status_code=500, detail="Invalid output_file_url format in database.")
    
    bucket_name, object_name = parts

    try:
        minio_response = minio_client.get_file_stream(bucket_name, object_name)
    except Exception as e:
        raise HTTPException(status_code=404, detail="File not found in storage.")

    # Determine content type from extension
    filename = object_name.split('/')[-1]
    media_type = "application/octet-stream"
    if filename.endswith(".obj"):
        media_type = "model/obj"
    elif filename.endswith(".glb"):
        media_type = "model/gltf-binary"
    elif filename.endswith(".stl"):
        media_type = "model/stl"

    # Stream the file back to the client
    return StreamingResponse(
        minio_response.stream(32 * 1024),
        media_type=media_type,
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
