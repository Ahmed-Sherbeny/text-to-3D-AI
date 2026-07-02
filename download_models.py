"""
download_models.py
-------------------
Run this once (per machine) to pull Shap-E, YOLOv8, and CLIP weights into
a local `models/` directory. This directory must be gitignored — see
`.gitignore.snippet` in this folder.

Usage:
    python download_models.py            # downloads all three
    python download_models.py --only yolo
    python download_models.py --only clip
    python download_models.py --only shape

Weights land in:
    models/
      shap-e/
      yolov8/
        yolov8n.pt   (or whichever variant you configure below)
      clip/
"""

import argparse
import logging
import os
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("optiforge3d.download")

MODELS_DIR = Path(os.getenv("OPTIFORGE_MODELS_DIR", "./models")).resolve()

# Pick the YOLOv8 variant you actually need (n = nano, fastest/smallest;
# s/m/l/x = progressively larger + more accurate). For preprocessing/
# object cropping in OptiForge3D, `yolov8n.pt` or `yolov8s.pt` is usually enough.
YOLO_VARIANT = os.getenv("OPTIFORGE_YOLO_VARIANT", "yolov8n.pt")

CLIP_MODEL_NAME = os.getenv("OPTIFORGE_CLIP_MODEL", "openai/clip-vit-base-patch32")


def download_shap_e() -> None:
    """
    Shap-E ships through the `shap-e` package (OpenAI). Its `load_model`
    helper downloads to its own cache dir by default; here we redirect
    that cache into our local, gitignored models/ folder so everything
    lives in one predictable place.
    """
    target = MODELS_DIR / "shap-e"
    target.mkdir(parents=True, exist_ok=True)

    # shap-e reads this env var for where to cache checkpoints
    os.environ["XDG_CACHE_HOME"] = str(target)

    try:
        from shap_e.models.download import load_model
        from shap_e.diffusion.sample import sample_latents  # noqa: F401 (import check)
    except ImportError:
        logger.error(
            "shap-e is not installed. Install it first:\n"
            "  pip install git+https://github.com/openai/shap-e.git"
        )
        return

    logger.info("Downloading Shap-E checkpoints (text300M, image300M, transmitter)...")
    for name in ["text300M", "image300M", "transmitter"]:
        logger.info("  -> %s", name)
        load_model(name, device="cpu")  # device doesn't matter for the download step

    logger.info("Shap-E weights cached under: %s", target)


def download_yolov8() -> None:
    target = MODELS_DIR / "yolov8"
    target.mkdir(parents=True, exist_ok=True)

    try:
        from ultralytics import YOLO
    except ImportError:
        logger.error("ultralytics is not installed. Install it first:\n  pip install ultralytics")
        return

    dest_path = target / YOLO_VARIANT
    if dest_path.exists():
        logger.info("YOLOv8 weights already present at %s, skipping.", dest_path)
        return

    logger.info("Downloading YOLOv8 weights: %s", YOLO_VARIANT)
    # Instantiating YOLO(variant) auto-downloads into the current working dir
    original_cwd = os.getcwd()
    try:
        os.chdir(target)
        YOLO(YOLO_VARIANT)  # triggers the download
    finally:
        os.chdir(original_cwd)

    logger.info("YOLOv8 weights saved under: %s", target)


def download_clip() -> None:
    target = MODELS_DIR / "clip"
    target.mkdir(parents=True, exist_ok=True)

    try:
        from transformers import CLIPModel, CLIPProcessor
    except ImportError:
        logger.error("transformers is not installed. Install it first:\n  pip install transformers")
        return

    logger.info("Downloading CLIP weights: %s", CLIP_MODEL_NAME)
    model = CLIPModel.from_pretrained(CLIP_MODEL_NAME, cache_dir=str(target))
    processor = CLIPProcessor.from_pretrained(CLIP_MODEL_NAME, cache_dir=str(target))
    del model, processor

    logger.info("CLIP weights cached under: %s", target)


def main():
    parser = argparse.ArgumentParser(description="Download OptiForge3D model weights locally.")
    parser.add_argument(
        "--only",
        choices=["shape", "yolo", "clip"],
        help="Download only one model instead of all three.",
    )
    args = parser.parse_args()

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    logger.info("Models will be stored under: %s", MODELS_DIR)

    tasks = {
        "shape": download_shap_e,
        "yolo": download_yolov8,
        "clip": download_clip,
    }

    if args.only:
        tasks[args.only]()
    else:
        for fn in tasks.values():
            fn()

    logger.info("Done. Reminder: models/ must stay out of Git — check .gitignore.")


if __name__ == "__main__":
    main()
