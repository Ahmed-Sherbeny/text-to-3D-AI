"""
clip_embeddings.py
-------------------
CLIP text/image embedding utilities. Used to:
  1. Verify/auto-label YOLO crops against a text prompt (does the crop
     actually look like what the user asked for?)
  2. Pick the best of several detections when multiple objects are
     present, based on similarity to the user's text prompt
  3. Cache embeddings for later search/dedup features (optional)

Note: Shap-E's image300M model has its own internal CLIP-based image
encoder for conditioning the diffusion model — this module is for the
*preprocessing/decision* layer around that, not a replacement for it.
"""

import logging

import torch
import torch.nn.functional as F
from PIL import Image

from loaders import load_clip
from gpu_config import free_gpu_memory

logger = logging.getLogger("optiforge3d.clip_embeddings")

_clip_cache = {}  # simple in-process cache so repeated calls in one task don't reload


def _get_clip():
    if "model" not in _clip_cache:
        model, processor, device = load_clip()
        _clip_cache["model"] = model
        _clip_cache["processor"] = processor
        _clip_cache["device"] = device
    return _clip_cache["model"], _clip_cache["processor"], _clip_cache["device"]


def embed_text(text: str) -> torch.Tensor:
    model, processor, device = _get_clip()
    with torch.no_grad():
        inputs = processor(text=[text], return_tensors="pt", padding=True).to(device)
        features = model.get_text_features(**inputs)
    return F.normalize(features, dim=-1).squeeze(0).cpu()


def embed_image(image: Image.Image) -> torch.Tensor:
    model, processor, device = _get_clip()
    with torch.no_grad():
        inputs = processor(images=image, return_tensors="pt").to(device)
        features = model.get_image_features(**inputs)
    return F.normalize(features, dim=-1).squeeze(0).cpu()


def similarity(embedding_a: torch.Tensor, embedding_b: torch.Tensor) -> float:
    """Cosine similarity between two normalized CLIP embeddings, range [-1, 1]."""
    return float((embedding_a @ embedding_b).item())


def best_crop_for_prompt(crops: list[Image.Image], prompt: str) -> tuple[int, float]:
    """
    Given several YOLO crops and the user's text prompt, returns
    (index_of_best_crop, similarity_score). Useful when detect_objects()
    finds multiple plausible subjects and you want the one that best
    matches what the user actually typed.
    """
    text_emb = embed_text(prompt)
    scores = [similarity(embed_image(c), text_emb) for c in crops]
    best_idx = max(range(len(scores)), key=lambda i: scores[i])
    logger.info("Best crop match: index=%d score=%.3f (of %d crops)", best_idx, scores[best_idx], len(crops))
    return best_idx, scores[best_idx]


def release_clip():
    """Call after the preprocessing stage of a task if the worker is about
    to load Shap-E and you want the VRAM back."""
    _clip_cache.clear()
    free_gpu_memory()
