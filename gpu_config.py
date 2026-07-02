"""
gpu_config.py
-------------
Central place for configuring PyTorch to use the local NVIDIA GPU with
strict memory management. Import `get_device()` and `configure_torch()`
from every loader script (Shap-E, YOLOv8, CLIP) instead of hardcoding
`torch.device(...)` everywhere.

Why this matters for OptiForge3D:
Shap-E, YOLOv8, and CLIP will all be loaded in the same worker process
(Celery task) at various points in the generation pipeline. Without
limits, PyTorch's caching allocator will happily grab most of the GPU
for one model and starve the others, or fragment memory badly under
Celery's long-running worker processes.
"""

import os
import gc
import logging

import torch

logger = logging.getLogger("optiforge3d.gpu")

# ---- Tunables (override via environment variables in docker-compose) ----
# Fraction of total GPU memory this process is allowed to use.
MAX_GPU_MEMORY_FRACTION = float(os.getenv("OPTIFORGE_MAX_GPU_MEM_FRACTION", "0.85"))
# Whether to use PyTorch's expandable memory segments (helps fragmentation).
USE_EXPANDABLE_SEGMENTS = os.getenv("OPTIFORGE_EXPANDABLE_SEGMENTS", "1") == "1"
# Force CPU even if a GPU is present (useful for local dev on a laptop).
FORCE_CPU = os.getenv("OPTIFORGE_FORCE_CPU", "0") == "1"


def configure_torch() -> None:
    """
    Call this ONCE at process/worker startup (e.g. in the Celery worker's
    `worker_process_init` signal, or at the top of a standalone script)
    before any model is loaded.
    """
    if USE_EXPANDABLE_SEGMENTS:
        # Reduces CUDA memory fragmentation across repeated
        # allocate/free cycles, which matters a lot when the same worker
        # loads/unloads Shap-E, YOLOv8, and CLIP back-to-back.
        os.environ.setdefault(
            "PYTORCH_CUDA_ALLOC_CONF", "expandable_segments:True"
        )

    if not torch.cuda.is_available():
        logger.warning("CUDA not available — falling back to CPU.")
        return

    torch.backends.cudnn.benchmark = True
    torch.backends.cuda.matmul.allow_tf32 = True
    torch.backends.cudnn.allow_tf32 = True

    try:
        torch.cuda.set_per_process_memory_fraction(MAX_GPU_MEMORY_FRACTION, device=0)
        logger.info(
            "CUDA configured: device=%s, mem_fraction=%.2f, expandable_segments=%s",
            torch.cuda.get_device_name(0),
            MAX_GPU_MEMORY_FRACTION,
            USE_EXPANDABLE_SEGMENTS,
        )
    except Exception as e:  # some driver/CUDA combos don't support this call
        logger.warning("Could not set per-process memory fraction: %s", e)


def get_device() -> torch.device:
    """Returns the device every loader should use."""
    if FORCE_CPU or not torch.cuda.is_available():
        return torch.device("cpu")
    return torch.device("cuda:0")


def free_gpu_memory() -> None:
    """
    Call after a heavy inference step (e.g. after a Shap-E generation job
    finishes) to release cached memory back to the allocator pool before
    the next model runs in the same worker.
    """
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
        torch.cuda.ipc_collect()


def log_gpu_memory(tag: str = "") -> None:
    """Lightweight memory logging you can sprinkle around the pipeline."""
    if not torch.cuda.is_available():
        return
    allocated = torch.cuda.memory_allocated() / 1024**3
    reserved = torch.cuda.memory_reserved() / 1024**3
    logger.info("[%s] GPU mem — allocated: %.2f GB, reserved: %.2f GB", tag, allocated, reserved)
