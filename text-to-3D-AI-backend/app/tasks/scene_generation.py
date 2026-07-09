"""
OptiForge3D — 3D Scene Generation Celery Task
=============================================
Decomposes a scene prompt, generates individual objects via Nano Banana,
sends them to Colab (TripoSR), and uses trimesh + Gemini to assemble them into a final scene.glb.
"""

import logging
import time
import uuid
import os
import zipfile
import json
import base64
import requests
import io
import trimesh
import numpy as np
from PIL import Image

from pydantic import BaseModel, Field
from typing import Dict, Optional, List

from google import genai
from google.genai import types
from google.genai.errors import APIError

from app.celery_app import celery_app
from app.config import get_settings

logger = logging.getLogger("optiforge3d.tasks.scene")

class ObjectTransform(BaseModel):
    id: str = Field(description="The exact key of the object from the list, e.g. 'object_0'")
    position: List[float] = Field(description="[X, Y, Z] offsets in meters")
    scale: float = Field(description="Scale multiplier")
    rotation: float = Field(description="Rotation around Y axis in degrees")
    parent: Optional[str] = Field(description="Key of the object this rests on, or null")

class SceneLayout(BaseModel):
    objects: List[ObjectTransform]

@celery_app.task(
    bind=True,
    name="app.tasks.generate_scene",
    max_retries=3,
    default_retry_delay=60,
)
def generate_scene_task(
    self,
    generation_id: str,
    prompt: str,
    parameters: dict | None = None,
) -> dict:
    """
    Background task: generates a 3D scene from a text prompt.
    """
    logger.info(f"🏗️ Starting SCENE generation task: {generation_id}")

    start_time = time.time()
    
    settings = get_settings()
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured.")
    
    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    output_dir = f"static/generated-models/{generation_id}"
    os.makedirs(output_dir, exist_ok=True)

    try:
        # ── Step 1: Decompose Scene ────────────────────────────────
        logger.info("   🧠 Gemini: Decomposing scene prompt...")
        decomp_prompt = f"""
        Extract the distinct physical objects from this scene description.
        Output ONLY a valid JSON list of strings representing the objects.
        Keep the descriptions simple (e.g., "a wooden desk").
        Limit to 5 objects maximum.
        
        Scene: "{prompt}"
        """
        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=decomp_prompt
            )
        except APIError as e:
            logger.warning(f"Gemini API Error during decomposition: {e}. Retrying in 60s...")
            raise self.retry(exc=e, countdown=60)
            
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        
        objects_list = json.loads(text.strip())
        logger.info(f"   📦 Objects detected: {objects_list}")
        

        # ── Step 2: Generate 2D Images via Pollinations AI ─────────
        logger.info("   🎨 Pollinations AI: Generating 2D images...")
        import concurrent.futures

        def fetch_single_image(idx_obj_tuple):
            idx, obj_prompt = idx_obj_tuple
            logger.info(f"      🎨 Generating image for: {obj_prompt}")
            prompt_encoded = requests.utils.quote(f"A single, isolated 3D rendering of {obj_prompt}. Straight-on eye-level view, perfectly upright, completely flat side-profile, NOT isometric, NOT from above. Clean solid white background, high quality, centered, photorealistic.")
            image_url = f"https://image.pollinations.ai/prompt/{prompt_encoded}?width=512&height=512&nologo=true"
            
            for attempt in range(5):
                img_res = requests.get(image_url, timeout=60)
                if img_res.status_code == 429:
                    logger.warning(f"      ⚠️ Pollinations 429 on {obj_prompt}. Retrying in 3s...")
                    time.sleep(3)
                    continue
                img_res.raise_for_status()
                break
            
            img_bytes = img_res.content
            
            img_path = os.path.join(output_dir, f"object_{idx}.jpg")
            with open(img_path, "wb") as f:
                f.write(img_bytes)
                
            b64_str = base64.b64encode(img_bytes).decode('utf-8')
            return {
                "name": obj_prompt,
                "image_base64": b64_str
            }

        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            object_images_base64 = list(executor.map(fetch_single_image, enumerate(objects_list)))

        # ── Step 3: Generate 3D via Colab (TripoSR) ────────────────
        colab_url = settings.COLAB_API_URL
        endpoint = f"{colab_url.rstrip('/')}/generate-scene"
        logger.info(f"   📡 Sending {len(object_images_base64)} images to Colab: {endpoint}")
        
        res = requests.post(
            endpoint,
            json={"images": object_images_base64},
            headers={"Bypass-Tunnel-Reminder": "true"},
            timeout=600 # 10 mins timeout for multiple generations
        )
        res.raise_for_status()
        
        zip_path = os.path.join(output_dir, "scene_raw.zip")
        with open(zip_path, "wb") as f:
            f.write(res.content)
            
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(output_dir)

        # ── Step 4: Load Meshes & Clean Noise ──────────────────────
        logger.info("   🧹 Loading meshes and cleaning noise...")
        normalized_meshes = {}  # obj_key -> mesh
        mesh_dimensions = {}    # obj_key -> [W, H, D]
        
        for i, obj_name in enumerate(objects_list):
            glb_file = os.path.join(output_dir, f"object_{i}.glb")
            if not os.path.exists(glb_file):
                logger.warning(f"Missing {glb_file}, skipping.")
                continue
                
            mesh = trimesh.load(glb_file, force="mesh")
            
            # TripoSR natively outputs Z-up meshes. 
            # We must convert to Y-up (Three.js standard) by rotating -90 degrees around the X-axis.
            rot_z_to_y = trimesh.transformations.rotation_matrix(np.radians(-90), [1, 0, 0])
            mesh.apply_transform(rot_z_to_y)
            
            # Clean up floating noise: keep only the largest connected component
            components = mesh.split(only_watertight=False)
            if len(components) > 0:
                mesh = sorted(components, key=lambda m: m.volume, reverse=True)[0]
            
            # Normalize origin to bottom-mass-center (X=0, Y=0 at bottom, Z=0)
            bounds = mesh.bounds
            if bounds is not None:
                try:
                    mass_center = mesh.center_mass
                    if np.any(np.isnan(mass_center)):
                        mass_center = (bounds[0] + bounds[1]) / 2.0
                except Exception:
                    mass_center = (bounds[0] + bounds[1]) / 2.0
                    
                bottom_y = bounds[0][1]
                mesh.apply_translation([-mass_center[0], -bottom_y, -mass_center[2]])
            
            # Normalize mesh size to 1.0 unit cube
            extents = mesh.extents
            max_dim = np.max(extents)
            if max_dim > 0:
                mesh.apply_scale(1.0 / max_dim)
                
            obj_key = f"object_{i}"
            normalized_meshes[obj_key] = mesh
            
            # Record final normalized dimensions
            dims = mesh.extents
            mesh_dimensions[obj_key] = {
                "name": obj_name,
                "width_x": round(float(dims[0]), 2),
                "height_y": round(float(dims[1]), 2),
                "depth_z": round(float(dims[2]), 2)
            }

        # ── Step 5: Layout via Gemini ──────────────────────────────
        logger.info("   📐 Gemini: Computing spatial layout...")
        layout_prompt = f"""
        Given the following list of objects and their normalized physical dimensions (Width, Height, Depth in meters):
        {json.dumps(mesh_dimensions, indent=2)}
        
        The user's original scene description was: "{prompt}"
        
        Determine their logical 3D positions, scales, and rotations to form a coherent room matching the user's description.
        Pay special attention to how the objects interact in the prompt (e.g., if a book is ON a desk, its Y position should be higher).
        Positions are [X, Y, Z] in meters.
        Scales are multipliers (1.0 is default, a pen should be 0.05, a bed might be 2.0).
        Rotations are in degrees around the Y axis (up).
        
        Output ONLY valid JSON matching this schema:
        {{
            "objects": [
                {{"id": "object_0", "position": [0, 0, 0], "scale": 1.0, "rotation": 0, "parent": null}},
                {{"id": "object_1", "position": [1, 0, 0], "scale": 0.5, "rotation": 90, "parent": "object_0"}}
            ]
        }}
        If an object rests ON TOP of another object, set "parent" to that object's key (e.g., "object_0"). Set to null if it's on the floor.
        
        CRITICAL: Treat the positions as an absolute 2D floor plan. 
        Provide the absolute world `X` and `Z` coordinates where the object should be dropped from above.
        You MUST use the physical dimensions of the objects to ensure they intersect! 
        For example, if object_0 is at X=0.0 and its scaled width is 1.0 (from -0.5 to 0.5), and object_1 is placed on top of it, object_1's X coordinate MUST be between -0.5 and 0.5! If you put it at X=1.0, it will miss the object and fall to the floor!
        Y will be automatically calculated via ray-traced gravity, so always set Y=0 for all objects.
        """
        try:
            layout_res = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=layout_prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=SceneLayout,
                ),
            )
        except APIError as e:
            logger.warning(f"Gemini API Error during layout: {e}. Retrying in 60s...")
            raise self.retry(exc=e, countdown=60)
        
        layout_dict = json.loads(layout_res.text)
        layout_list = layout_dict.get("objects", [])
        
        # Convert list back to dictionary for the rest of the code
        layout_data = {item["id"]: item for item in layout_list}
        logger.info(f"   🗺️ Layout computed: {layout_data}")

        # ── Step 6: Assemble Scene ─────────────────────────────────
        logger.info("   🛠️ Assembling scene via trimesh...")
        scene = trimesh.Scene()
        
        # Add a visible physical floor to the scene and collider
        collider_mesh = trimesh.creation.box(extents=[20.0, 0.1, 20.0])
        collider_mesh.apply_translation([0, -0.05, 0]) # Top of the floor is exactly at Y=0
        # Optional: color it light grey
        collider_mesh.visual.vertex_colors = [150, 150, 150, 255]
        scene.add_geometry(collider_mesh, node_name="floor")
        
        # Pass 2: Ray-Traced Gravity Drop
        
        # Sort objects by dependency (floor objects first)
        pending_objects = list(normalized_meshes.keys())
        dropped_objects = []
        
        while pending_objects:
            progress = False
            for obj_key in pending_objects[:]:
                conf = layout_data.get(obj_key, {})
                parent_key = conf.get("parent")
                # Drop if it has no parent, or if its parent is already dropped
                if not parent_key or parent_key in dropped_objects or parent_key not in pending_objects:
                    dropped_objects.append(obj_key)
                    pending_objects.remove(obj_key)
                    progress = True
            if not progress:
                # Circular dependency? Just drop the rest
                dropped_objects.extend(pending_objects)
                break
        
        for obj_key in dropped_objects:
            mesh = normalized_meshes[obj_key].copy()
            conf = layout_data.get(obj_key, {})
            layout_scale = conf.get("scale", 1.0)
            rot_deg = conf.get("rotation", 0)
            pos = conf.get("position", [0, 0, 0])
            
            world_x = pos[0]
            world_z = pos[2]
            
            # 1. Scale and Rotate the mesh
            scale_matrix = np.eye(4)
            np.fill_diagonal(scale_matrix, layout_scale)
            scale_matrix[3, 3] = 1.0
            
            rot_matrix = trimesh.transformations.rotation_matrix(np.radians(rot_deg), [0, 1, 0])
            
            # Apply local transform to the actual mesh so raycasting uses the scaled/rotated geometry
            mesh.apply_transform(rot_matrix @ scale_matrix)
            
            # 2. Ray-Traced Gravity
            # Shoot a ray straight down from high above the object's [X, Z] coordinate
            ray_origin = np.array([[world_x, 100.0, world_z]])
            ray_dir = np.array([[0, -1, 0]])
            
            hit_y = 0.0 # Floor is at Y=0
            
            if not collider_mesh.is_empty:
                # Cast ray against all previously dropped objects
                locations, index_ray, index_tri = collider_mesh.ray.intersects_location(ray_origin, ray_dir)
                if len(locations) > 0:
                    # Find the highest point hit by the ray
                    hit_y = np.max(locations[:, 1])
                    
            # 3. Drop object into place
            trans_matrix = np.eye(4)
            trans_matrix[0, 3] = world_x
            trans_matrix[1, 3] = hit_y
            trans_matrix[2, 3] = world_z
            
            mesh.apply_transform(trans_matrix)
            
            # Add to the physics collider for the next objects
            collider_mesh = trimesh.util.concatenate([collider_mesh, mesh])
            
            # Also add to the final scene graph (the final scene just uses identity transform since we baked it into the mesh)
            scene.add_geometry(mesh, node_name=f"node_{obj_key}")
            
            logger.info(f"      📍 {obj_key}: Dropped at [X:{world_x:.2f}, Y:{hit_y:.2f}, Z:{world_z:.2f}], Scale:{layout_scale}")
            
        final_scene_path = os.path.join(output_dir, "scene.glb")
        scene.export(final_scene_path)

        # ── Step 6: Mark COMPLETED ─────────────────────────────────
        elapsed_ms = int((time.time() - start_time) * 1000)
        output_url = f"generated-models/{generation_id}/scene.glb"

        logger.info(f"   ✅ Scene completed in {elapsed_ms}ms")
        return {
            "generation_id": generation_id,
            "status": "completed",
            "output_file_url": output_url,
            "processing_time_ms": elapsed_ms
        }

    except Exception as exc:
        elapsed_ms = int((time.time() - start_time) * 1000)
        error_msg = str(exc)
        logger.error(f"   ❌ Task FAILED: {error_msg}")
        raise exc
