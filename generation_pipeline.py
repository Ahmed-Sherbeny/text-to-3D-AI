"""
generation_pipeline.py
------------------------
Ties Step 7 together: YOLOv8 preprocessing -> CLIP-based subject
selection/verification -> Shap-E 3D generation. This is what the Celery
task in Phase 3's generation pipeline should call.

Two entry points:
  - generate_3d_from_image_prompt(image_path, text_prompt)
      Detects candidate objects, picks the one that best matches the
      text prompt via CLIP, crops it, and runs it through Shap-E's
      image300M model.
  - generate_3d_from_text(text_prompt)
      Skips YOLO/CLIP entirely and goes straight through Shap-E's
      text300M model (for pure text-to-3D requests with no source image).
"""

import logging
from pathlib import Path

import torch

from gpu_config import configure_torch, free_gpu_memory, log_gpu_memory
from loaders import load_shap_e
from yolo_preprocessing import detect_objects, crop_detection, pick_primary_subject
from clip_embeddings import best_crop_for_prompt, release_clip

logger = logging.getLogger("optiforge3d.generation_pipeline")


def generate_3d_from_text(
    text_prompt: str,
    output_dir: str = "./outputs",
    guidance_scale: float = 15.0,
    karras_steps: int = 64,
) -> Path:
    from shap_e.diffusion.sample import sample_latents
    from shap_e.diffusion.gaussian_diffusion import diffusion_from_config
    from shap_e.models.download import load_config
    from shap_e.util.notebooks import decode_latent_mesh

    configure_torch()
    model, device = load_shap_e("text300M")
    _, xm_device = load_shap_e("transmitter")
    diffusion = diffusion_from_config(load_config("diffusion"))

    log_gpu_memory("before text->3D sampling")
    latents = sample_latents(
        batch_size=1,
        model=model,
        diffusion=diffusion,
        guidance_scale=guidance_scale,
        model_kwargs=dict(texts=[text_prompt]),
        progress=True,
        clip_denoised=True,
        use_fp16=True,
        use_karras=True,
        karras_steps=karras_steps,
        sigma_min=1e-3,
        sigma_max=160,
        s_churn=0,
        device=device,
    )

    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    mesh_path = out_dir / f"{_slugify(text_prompt)}.ply"

    mesh = decode_latent_mesh(xm_device, latents[0]).tri_mesh()
    with open(mesh_path, "wb") as f:
        mesh.write_ply(f)

    del model, latents
    free_gpu_memory()
    log_gpu_memory("after text->3D sampling")

    logger.info("Saved mesh to %s", mesh_path)
    return mesh_path


def generate_3d_from_image_prompt(
    image_path: str,
    text_prompt: str,
    output_dir: str = "./outputs",
    yolo_variant: str = "yolov8n.pt",
    guidance_scale: float = 3.0,
    karras_steps: int = 64,
) -> Path:
    """
    Full Step 7 flow:
      1. YOLOv8 detects candidate objects in the uploaded image
      2. CLIP compares each crop against the user's text prompt
      3. The best-matching crop is fed into Shap-E's image300M model
    """
    from shap_e.diffusion.sample import sample_latents
    from shap_e.diffusion.gaussian_diffusion import diffusion_from_config
    from shap_e.models.download import load_config
    from shap_e.util.notebooks import decode_latent_mesh

    # --- 1. Detect ---
    detections = detect_objects(image_path, variant=yolo_variant)
    if not detections:
        logger.warning("No objects detected — falling back to the full image.")
        from PIL import Image
        best_crop = Image.open(image_path).convert("RGB")
    else:
        crops = [crop_detection(image_path, d) for d in detections]
        # --- 2. CLIP-score against the prompt ---
        best_idx, score = best_crop_for_prompt(crops, text_prompt)
        best_crop = crops[best_idx]
        logger.info(
            "Selected detection: %s (conf=%.2f, clip_score=%.3f)",
            detections[best_idx].class_name, detections[best_idx].confidence, score,
        )
        release_clip()  # free VRAM before loading Shap-E

    # --- 3. Shap-E image-to-3D ---
    configure_torch()
    model, device = load_shap_e("image300M")
    _, xm_device = load_shap_e("transmitter")
    diffusion = diffusion_from_config(load_config("diffusion"))

    log_gpu_memory("before image->3D sampling")
    latents = sample_latents(
        batch_size=1,
        model=model,
        diffusion=diffusion,
        guidance_scale=guidance_scale,
        model_kwargs=dict(images=[best_crop]),
        progress=True,
        clip_denoised=True,
        use_fp16=True,
        use_karras=True,
        karras_steps=karras_steps,
        sigma_min=1e-3,
        sigma_max=160,
        s_churn=0,
        device=device,
    )

    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    mesh_path = out_dir / f"{_slugify(text_prompt)}.ply"

    mesh = decode_latent_mesh(xm_device, latents[0]).tri_mesh()
    with open(mesh_path, "wb") as f:
        mesh.write_ply(f)

    del model, latents
    free_gpu_memory()
    log_gpu_memory("after image->3D sampling")

    logger.info("Saved mesh to %s", mesh_path)
    return mesh_path


def _slugify(text: str) -> str:
    return "_".join(text.lower().split())[:60] or "generated_mesh"
