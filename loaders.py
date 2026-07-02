"""
loaders.py
----------
Thin, memory-aware loader functions for each model. These are what the
Celery tasks / FastAPI workers should import — never load a model with
ad-hoc code scattered across the pipeline.

Each loader:
  1. Assumes weights were already fetched via download_models.py
  2. Uses gpu_config.get_device() so device selection stays in one place
  3. Puts the model in eval() mode and disables grad tracking where relevant
"""

import logging
from pathlib import Path

import torch

from gpu_config import get_device, MAX_GPU_MEMORY_FRACTION  # noqa: F401

logger = logging.getLogger("optiforge3d.loaders")

MODELS_DIR = Path("./models").resolve()


def load_shap_e(model_name: str = "text300M"):
    """
    model_name: "text300M" (text-to-3D), "image300M" (image-to-3D),
                or "transmitter" (latent decoder).
    """
    from shap_e.models.download import load_model
    from shap_e.util.notebooks import decode_latent_mesh  # noqa: F401 (used downstream)

    device = get_device()
    logger.info("Loading Shap-E model '%s' on %s", model_name, device)

    model = load_model(model_name, device=device)
    if hasattr(model, "eval"):
        model.eval()
    return model, device


def load_yolov8(variant: str = "yolov8n.pt"):
    from ultralytics import YOLO

    device = get_device()
    weights_path = MODELS_DIR / "yolov8" / variant
    if not weights_path.exists():
        raise FileNotFoundError(
            f"YOLOv8 weights not found at {weights_path}. "
            f"Run `python download_models.py --only yolo` first."
        )

    logger.info("Loading YOLOv8 (%s) on %s", variant, device)
    model = YOLO(str(weights_path))
    model.to(device)
    return model


def load_clip(model_name: str = "openai/clip-vit-base-patch32"):
    from transformers import CLIPModel, CLIPProcessor

    device = get_device()
    cache_dir = MODELS_DIR / "clip"
    if not cache_dir.exists():
        raise FileNotFoundError(
            f"CLIP cache not found at {cache_dir}. "
            f"Run `python download_models.py --only clip` first."
        )

    logger.info("Loading CLIP (%s) on %s", model_name, device)
    model = CLIPModel.from_pretrained(model_name, cache_dir=str(cache_dir)).to(device)
    processor = CLIPProcessor.from_pretrained(model_name, cache_dir=str(cache_dir))
    model.eval()
    return model, processor, device


# ---------------------------------------------------------------------
# Example: how a Celery task in OptiForge3D might use these together
# without letting GPU memory pile up across a long-running worker.
# ---------------------------------------------------------------------
def example_pipeline_step(prompt: str):
    from gpu_config import configure_torch, free_gpu_memory, log_gpu_memory

    configure_torch()  # once per worker process, safe to call repeatedly

    clip_model, clip_processor, device = load_clip()
    log_gpu_memory("after CLIP load")

    with torch.no_grad():
        inputs = clip_processor(text=[prompt], return_tensors="pt").to(device)
        _ = clip_model.get_text_features(**inputs)

    # Release CLIP before loading Shap-E in the same worker
    del clip_model, clip_processor
    free_gpu_memory()
    log_gpu_memory("after CLIP release")

    shap_e_model, device = load_shap_e("text300M")
    log_gpu_memory("after Shap-E load")

    # ... run generation ...

    del shap_e_model
    free_gpu_memory()
    log_gpu_memory("after Shap-E release")
