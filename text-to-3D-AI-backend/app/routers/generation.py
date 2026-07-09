import uuid
from fastapi import APIRouter, HTTPException, status
from celery.result import AsyncResult
from pydantic import BaseModel
from app.celery_app import celery_app

router = APIRouter(prefix="/generations", tags=["Generations"])

class GenerationCreate(BaseModel):
    input_type: str
    prompt: str
    parameters: dict | None = None

@router.post("/", status_code=status.HTTP_202_ACCEPTED)
async def submit_generation(payload: GenerationCreate):
    from app.tasks.scene_generation import generate_scene_task
    from app.tasks.generation import generate_3d_task

    generation_id = str(uuid.uuid4())

    if payload.input_type == "scene":
        task = generate_scene_task.delay(
            generation_id=generation_id,
            prompt=payload.prompt,
            parameters=payload.parameters,
        )
    else:
        task = generate_3d_task.delay(
            generation_id=generation_id,
            input_type=payload.input_type,
            prompt=payload.prompt,
            parameters=payload.parameters,
        )

    return {
        "generation_id": generation_id,
        "celery_task_id": task.id,
        "status": "pending",
        "message": "Generation job submitted. Use the celery_task_id to check status."
    }

@router.get("/{task_id}/status")
async def get_generation_status(task_id: str):
    task = AsyncResult(task_id, app=celery_app)
    
    if task.state == 'PENDING':
        response = {"status": "pending"}
    elif task.state == 'STARTED' or task.state == 'RETRY':
        response = {"status": "processing"}
    elif task.state == 'SUCCESS':
        result = task.result
        response = {
            "status": "completed",
            "output_file_url": result.get("output_file_url"),
            "generation_id": result.get("generation_id")
        }
    elif task.state == 'FAILURE':
        response = {
            "status": "failed",
            "error_message": str(task.info)
        }
    else:
        response = {"status": task.state.lower()}
        
    return response
