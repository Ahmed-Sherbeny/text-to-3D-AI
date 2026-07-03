"""
yolo_preprocessing.py
----------------------
YOLOv8 preprocessing stage for OptiForge3D: object detection, instance
segmentation, auto-labeling, and cropping objects out of a user-uploaded
image before it's handed to Shap-E's image-to-3D path.

Typical pipeline position:
    user image -> detect_objects() -> pick best detection ->
    crop_detection() -> (optional) auto_label() -> feed crop to Shap-E
"""

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from PIL import Image

from loaders import load_yolov8

logger = logging.getLogger("optiforge3d.yolo_preprocessing")


@dataclass
class Detection:
    class_id: int
    class_name: str
    confidence: float
    box_xyxy: tuple  # (x1, y1, x2, y2) in pixel coords
    mask: Optional["object"] = None  # numpy bool mask, if segmentation model used


def detect_objects(image_path: str, variant: str = "yolov8n.pt", conf: float = 0.35):
    """
    Runs plain object detection. Returns a list[Detection] sorted by
    confidence, descending.
    """
    model = load_yolov8(variant)
    results = model.predict(source=image_path, conf=conf, verbose=False)

    detections = []
    result = results[0]
    names = result.names
    for box in result.boxes:
        detections.append(
            Detection(
                class_id=int(box.cls.item()),
                class_name=names[int(box.cls.item())],
                confidence=float(box.conf.item()),
                box_xyxy=tuple(box.xyxy[0].tolist()),
            )
        )

    detections.sort(key=lambda d: d.confidence, reverse=True)
    logger.info("Detected %d object(s) in %s", len(detections), image_path)
    return detections


def segment_objects(image_path: str, variant: str = "yolov8n-seg.pt", conf: float = 0.35):
    """
    Runs instance segmentation (requires a '-seg' YOLOv8 variant, e.g.
    yolov8n-seg.pt — download it the same way as the detection weights:
        python download_models.py --only yolo   (with OPTIFORGE_YOLO_VARIANT=yolov8n-seg.pt)
    Returns list[Detection] with `.mask` populated (numpy bool array).
    """
    model = load_yolov8(variant)
    results = model.predict(source=image_path, conf=conf, verbose=False)

    detections = []
    result = results[0]
    names = result.names
    masks = result.masks.data.cpu().numpy() if result.masks is not None else [None] * len(result.boxes)

    for box, mask in zip(result.boxes, masks):
        detections.append(
            Detection(
                class_id=int(box.cls.item()),
                class_name=names[int(box.cls.item())],
                confidence=float(box.conf.item()),
                box_xyxy=tuple(box.xyxy[0].tolist()),
                mask=mask,
            )
        )

    detections.sort(key=lambda d: d.confidence, reverse=True)
    logger.info("Segmented %d object(s) in %s", len(detections), image_path)
    return detections


def crop_detection(image_path: str, detection: Detection, padding: int = 12) -> Image.Image:
    """
    Crops the source image to a single detection's bounding box, with a
    small padding margin — this crop is what typically gets fed into
    Shap-E's image300M model (it wants a clean, centered subject, not
    a cluttered full scene).
    """
    img = Image.open(image_path).convert("RGB")
    x1, y1, x2, y2 = detection.box_xyxy
    x1 = max(0, int(x1) - padding)
    y1 = max(0, int(y1) - padding)
    x2 = min(img.width, int(x2) + padding)
    y2 = min(img.height, int(y2) + padding)
    return img.crop((x1, y1, x2, y2))


def auto_label(
    image_path: str,
    output_dir: str,
    variant: str = "yolov8n.pt",
    conf: float = 0.35,
) -> Path:
    """
    Runs detection and writes a YOLO-format label file (class_id, x_center,
    y_center, width, height — all normalized 0-1) next to the image, for
    building/expanding a training set or for a human-in-the-loop review
    step before the crop is trusted downstream.
    """
    model = load_yolov8(variant)
    results = model.predict(source=image_path, conf=conf, verbose=False)
    result = results[0]

    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    label_path = out_dir / (Path(image_path).stem + ".txt")

    img_w, img_h = result.orig_shape[1], result.orig_shape[0]
    lines = []
    for box in result.boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        cls_id = int(box.cls.item())
        x_center = ((x1 + x2) / 2) / img_w
        y_center = ((y1 + y2) / 2) / img_h
        width = (x2 - x1) / img_w
        height = (y2 - y1) / img_h
        lines.append(f"{cls_id} {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}")

    label_path.write_text("\n".join(lines))
    logger.info("Wrote %d label(s) to %s", len(lines), label_path)
    return label_path


def pick_primary_subject(detections: list[Detection]) -> Optional[Detection]:
    """
    Heuristic for picking 'the' object to turn into a 3D model when an
    image has several detections: highest confidence, tie-broken by
    largest box area (usually the main subject, not background clutter).
    """
    if not detections:
        return None

    def area(d: Detection) -> float:
        x1, y1, x2, y2 = d.box_xyxy
        return (x2 - x1) * (y2 - y1)

    return sorted(detections, key=lambda d: (round(d.confidence, 2), area(d)), reverse=True)[0]
