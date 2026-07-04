"""
progressive_refinement.py
---------------------------
Two-pass generation loop: a fast ~5s coarse draft so the UI has
something to show immediately, followed by a slower ~2min high-res
final pass. Both passes reuse the same loaded model.

Important correction on the levers available: Shap-E's `decode_latent_mesh`
does NOT expose a mesh-resolution/grid_size argument — the exported
mesh resolution is fixed by the pretrained STF decoder. The real
speed/quality lever for the *mesh* is diffusion step count
(`karras_steps`): fewer steps -> faster, rougher latent -> faster,
rougher mesh. For a quick on-screen *preview* (not the exported mesh),
you can optionally render a low-res NeRF turnaround with
`decode_latent_images` + `create_pan_cameras(size=...)`, where `size`
genuinely does control render resolution/speed — that's what
`preview_render_size` below is for.

Actual wall-clock time depends heavily on your GPU. The defaults below
are starting points — tune `coarse_steps` and `final_steps` against
your target hardware until you hit the ~5s / ~2min targets from the
project plan; log lines report actual elapsed time on every run so
this is a quick calibration loop, not guesswork.

Usage (as a generator, so a Celery task can push each stage to the
frontend as soon as it's ready):

    for stage in generate_progressive(text_prompt="a small wooden chair"):
        print(stage["stage"], stage["elapsed_sec"], stage["mesh_path"])
        # stage["stage"] == "coarse" fires first, "final" fires second
"""

import logging
import time
from pathlib import Path
from typing import Optional

from gpu_config import configure_torch, free_gpu_memory, log_gpu_memory
from loaders import load_shap_e

logger = logging.getLogger("optiforge3d.progressive_refinement")


def generate_progressive(
    text_prompt: Optional[str] = None,
    image=None,
    output_dir: str = "./outputs",
    coarse_steps: int = 16,
    final_steps: int = 64,
    preview_render_size: int = 64,
    guidance_scale: Optional[float] = None,
):
    """
    Yields two dicts in order:
      {"stage": "coarse", "mesh_path": Path, "elapsed_sec": float}
      {"stage": "final",  "mesh_path": Path, "elapsed_sec": float}

    Exactly one of `text_prompt` / `image` should be provided — this
    picks Shap-E's text300M or image300M model accordingly.
    """
    from shap_e.diffusion.sample import sample_latents
    from shap_e.diffusion.gaussian_diffusion import diffusion_from_config
    from shap_e.models.download import load_config
    from shap_e.util.notebooks import decode_latent_mesh

    if (text_prompt is None) == (image is None):
        raise ValueError("Provide exactly one of text_prompt or image.")

    is_text = text_prompt is not None
    model_name = "text300M" if is_text else "image300M"
    model_kwargs = dict(texts=[text_prompt]) if is_text else dict(images=[image])
    default_guidance = 15.0 if is_text else 3.0
    guidance_scale = guidance_scale if guidance_scale is not None else default_guidance

    slug = _slugify(text_prompt) if is_text else "from_image"
    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    configure_torch()
    model, device = load_shap_e(model_name)
    _, xm_device = load_shap_e("transmitter")
    diffusion = diffusion_from_config(load_config("diffusion"))

    def _run_stage(stage_name: str, steps: int):
        t0 = time.perf_counter()
        log_gpu_memory(f"before {stage_name} sampling")

        latents = sample_latents(
            batch_size=1,
            model=model,
            diffusion=diffusion,
            guidance_scale=guidance_scale,
            model_kwargs=model_kwargs,
            progress=False,
            clip_denoised=True,
            use_fp16=True,
            use_karras=True,
            karras_steps=steps,
            sigma_min=1e-3,
            sigma_max=160,
            s_churn=0,
            device=device,
        )

        mesh = decode_latent_mesh(xm_device, latents[0]).tri_mesh()
        mesh_path = out_dir / f"{slug}_{stage_name}.ply"
        with open(mesh_path, "wb") as f:
            mesh.write_ply(f)

        elapsed = time.perf_counter() - t0
        log_gpu_memory(f"after {stage_name} sampling")
        logger.info(
            "[%s] steps=%d elapsed=%.2fs -> %s",
            stage_name, steps, elapsed, mesh_path,
        )
        return mesh_path, elapsed

    # --- Coarse pass: fast, few diffusion steps, gives the UI something instantly ---
    coarse_path, coarse_elapsed = _run_stage("coarse", coarse_steps)
    yield {"stage": "coarse", "mesh_path": coarse_path, "elapsed_sec": coarse_elapsed}

    # --- Final pass: slower, many diffusion steps, the deliverable quality model ---
    final_path, final_elapsed = _run_stage("final", final_steps)
    yield {"stage": "final", "mesh_path": final_path, "elapsed_sec": final_elapsed}

    del model
    free_gpu_memory()


def render_preview_images(xm_device, latent, size: int = 64, render_mode: str = "nerf"):
    """
    Optional: render a quick low-res NeRF turnaround of a latent for the
    UI to show while the mesh export is happening. `size` here genuinely
    controls render resolution/speed (unlike mesh export, which has no
    such knob) — keep it small (e.g. 64) for the coarse stage.
    """
    from shap_e.util.notebooks import create_pan_cameras, decode_latent_images

    cameras = create_pan_cameras(size, xm_device.device)
    return decode_latent_images(xm_device, latent, cameras, rendering_mode=render_mode)


def _slugify(text: str) -> str:
    return "_".join(text.lower().split())[:60] or "generated_mesh"
