import logging
import os
import requests
import time
import base64
import zipfile
import io
from app.celery_app import celery_app
from app.config import get_settings

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
    logger.info(f"🏭 Starting single-object generation task: {generation_id}")
    start_time = time.time()

    settings = get_settings()
    colab_url = settings.COLAB_API_URL
    if not colab_url:
        raise ValueError("COLAB_API_URL environment variable is missing")
    
    output_dir = f"static/generated-models/{generation_id}"
    os.makedirs(output_dir, exist_ok=True)
    
    try:
        if input_type == "text" and prompt:
            # 1. Generate 2D Image via Pollinations
            logger.info(f"   🎨 Pollinations AI: Generating 2D image for: {prompt}")
            prompt_encoded = requests.utils.quote(f"A single, isolated 3D rendering of {prompt}. Straight-on eye-level view, perfectly upright, completely flat side-profile, NOT isometric, NOT from above. Clean solid white background, high quality, centered, photorealistic.")
            image_url = f"https://image.pollinations.ai/prompt/{prompt_encoded}?width=512&height=512&nologo=true"
            
            for attempt in range(5):
                img_res = requests.get(image_url, timeout=60)
                if img_res.status_code == 429:
                    logger.warning(f"   ⚠️ Pollinations 429. Retrying in 3s...")
                    time.sleep(3)
                    continue
                img_res.raise_for_status()
                break
                
            img_bytes = img_res.content
            b64_str = base64.b64encode(img_bytes).decode('utf-8')
            
            # 2. Call TRELLIS on Colab
            endpoint = f"{colab_url.rstrip('/')}/generate-scene"
            logger.info(f"   📡 Sending image to TRELLIS Colab: {endpoint}")
            
            res = requests.post(
                endpoint,
                json={"images": [{"name": prompt, "image_base64": b64_str}]},
                headers={"Bypass-Tunnel-Reminder": "true"},
                timeout=300
            )
            res.raise_for_status()
            
            # 3. Extract the single object from the zip
            zip_path = os.path.join(output_dir, "response.zip")
            with open(zip_path, "wb") as f:
                f.write(res.content)
                
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(output_dir)
                
            # Rename object_0.glb to model.glb for the frontend
            os.rename(os.path.join(output_dir, "object_0.glb"), os.path.join(output_dir, "model.glb"))
            
        else:
            raise ValueError(f"Unsupported input_type: {input_type}")
        
        output_url = f"generated-models/{generation_id}/model.glb"
            
        elapsed_ms = int((time.time() - start_time) * 1000)
        logger.info(f"   ✅ Status → COMPLETED ({elapsed_ms}ms)")

        return {
            "generation_id": generation_id,
            "status": "completed",
            "output_file_url": output_url,
            "processing_time_ms": elapsed_ms,
        }

    except Exception as exc:
        logger.error(f"   ❌ Task FAILED: {exc}")
        raise exc
