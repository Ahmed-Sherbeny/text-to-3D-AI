import os

%cd /content
print("[*] Cleaning up TripoSR setup...")
# Remove TripoSR directory if it exists
if os.path.exists("TripoSR"):
    !rm -rf TripoSR

# Remove previous pip installs (if they were manual and not handled by rm -rf)
# The explicit pip installs were removed from this cell in the previous turn.

print("[*] TripoSR setup cleaned.")

# --- CELL ---

from google.colab import drive
drive.mount('/content/drive')

import os

%cd /content
print("[*] Cleaning up TripoSR setup...")
if os.path.exists("TripoSR"):
    !rm -rf TripoSR
print("[*] TripoSR setup cleaned.")

# Ensure Drive is mounted and paths are set
DRIVE_SAVE_PATH = '/content/drive/MyDrive/trellis_env'
WHEEL_SAVE_PATH = os.path.join(DRIVE_SAVE_PATH, 'trellis_wheels')

print(f"[*] Creating wheel backup directory: {WHEEL_SAVE_PATH}")
os.makedirs(WHEEL_SAVE_PATH, exist_ok=True)

%cd /content

# Clone TRELLIS WITH submodules
if not os.path.exists("TRELLIS"):
    print("[*] Cloning TRELLIS repository with submodules...")
    !git clone --recurse-submodules https://github.com/microsoft/TRELLIS.git TRELLIS
else:
    print("[*] TRELLIS repository already exists.")

%cd /content/TRELLIS

print("[*] Installing base dependencies...")
!pip install ninja wheel spconv-cu121 "setuptools<70" xformers rembg

print("[*] Building and saving nvdiffrast & kaolin wheels directly to Google Drive...")
# Using --wheel-dir saves the compiled .whl files straight to Google Drive
!MAX_JOBS=2 pip wheel git+https://github.com/NVlabs/nvdiffrast.git --wheel-dir="{WHEEL_SAVE_PATH}" --no-build-isolation
!MAX_JOBS=2 pip wheel git+https://github.com/NVIDIAGameWorks/kaolin.git --wheel-dir="{WHEEL_SAVE_PATH}" --no-build-isolation

print("[*] Installing the newly built wheels into the current session...")
# This is the crucial missing line that makes the model usable right now!
!pip install "{WHEEL_SAVE_PATH}"/*.whl

print("[+] One-Time TRELLIS backup script complete! Wheels safely stored in Google Drive and installed.")

# --- CELL ---

from google.colab import drive
drive.mount('/content/drive')

import os
%cd /content

print("[*] Cloning TRELLIS repository with submodules...")
if not os.path.exists("TRELLIS"):
    !git clone --recurse-submodules https://github.com/microsoft/TRELLIS.git TRELLIS

%cd /content/TRELLIS

print("[*] Installing base dependencies...")
!pip install ninja wheel spconv-cu121 "setuptools<70" xformers rembg

print("[*] Instantly installing pre-compiled heavy dependencies from Google Drive...")
# This skips the 15-minute wait entirely!
!pip install /content/drive/MyDrive/trellis_env/trellis_wheels/*.whl

print("[+] Fast setup complete! Ready to generate.")

# --- CELL ---

# Mount Google Drive
from google.colab import drive
drive.mount('/content/drive')

# --- CELL ---

# Define the target path in Google Drive
# You can change 'trellis_env' to any name you prefer
DRIVE_SAVE_PATH = '/content/drive/MyDrive/trellis_env'

# Create the directory in Google Drive if it doesn't exist
!mkdir -p "{DRIVE_SAVE_PATH}"

# Copy the TRELLIS project directory
print(f"[*] Copying /content/TRELLIS to {DRIVE_SAVE_PATH}...")
!cp -r /content/TRELLIS "{DRIVE_SAVE_PATH}/"

print("[+] TRELLIS project folder saved to Google Drive.")
print("\nTo restore in a new session:")
print("1. Mount Google Drive: `from google.colab import drive; drive.mount('/content/drive')`")
print(f"2. Copy back the TRELLIS folder: `!cp -r {DRIVE_SAVE_PATH}/TRELLIS /content/`")
print("3. Navigate to the TRELLIS folder: `os.chdir('/content/TRELLIS')`")
print("4. Rerun the optimized installation cell (cell `1110a401` in this notebook). It should be much faster now.")

# --- CELL ---

print("hello")

# --- CELL ---

import sys
import os
import time
import torch
import numpy as np # Keeping numpy as it's often used with PIL.Image and other image processing
from PIL import Image
from diffusers import StableDiffusionPipeline, LCMScheduler

from IPython.display import display as ipy_display
import shutil # Added for copying the generated GLB file

sys.path.append('/content/TRELLIS')
# Force TRELLIS to use xformers instead of flash-attn
os.environ["ATTN_BACKEND"] = "xformers"

# Add TRELLIS specific imports
from trellis.pipelines import TrellisImageTo3DPipeline
from trellis.models import TrellisImageTo3DModel
from trellis.processors import TrellisImageTo3DPreprocessor

class TrueTrellisPipeline:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.precision = torch.float16
        print(f"[*] Initializing ML Pipeline on: {self.device.upper()}")

        self.sd_pipe = StableDiffusionPipeline.from_pretrained(
            "runwayml/stable-diffusion-v1-5",
            torch_dtype=self.precision,
            safety_checker=None
        ).to(self.device)
        self.sd_pipe.load_lora_weights("latent-consistency/lcm-lora-sdv1-5")
        self.sd_pipe.scheduler = LCMScheduler.from_config(self.sd_pipe.scheduler.config)

        # Initialize TRELLIS pipeline
        print("[-] Initializing TRELLIS model and preprocessor...")
        self.trellis_model = TrellisImageTo3DModel.from_pretrained(
            "microsoft/trellis-image-to-3d",
            torch_dtype=self.precision
        ).to(self.device)
        self.trellis_preprocessor = TrellisImageTo3DPreprocessor.from_pretrained(
            "microsoft/trellis-image-to-3d"
        )
        self.trellis_pipeline = TrellisImageTo3DPipeline(
            model=self.trellis_model,
            preprocessor=self.trellis_preprocessor
        )

        print("[+] Pipeline Ready.")

    def generate_draft(self, prompt: str, output_path: str = "model.glb"):
        start_time = time.time()
        print(f"[*] Starting generation for prompt: '{prompt}'")

        with torch.no_grad():
            # Step 1: Generate 2D image with Stable Diffusion
            self.sd_pipe.to(self.device)
            full_prompt = f"full body {prompt}, single object, product shot, plain white background, centered, complete object visible, no cropping, high detail"
            negative_prompt = "cropped, partial, close-up, portrait, face only, cut off, multiple objects, gradient background, vignette, textured background, busy background, dark background, blurry, low quality, out of frame"

            print(f"[-] 1/2: Generating 2D Concept...")
            raw_image = self.sd_pipe(
                prompt=full_prompt,
                negative_prompt=negative_prompt,
                num_inference_steps=8,
                guidance_scale=2.0,
            ).images[0]
            print(f"    → Generated 2D concept.")
            ipy_display(raw_image.resize((256, 256)))

            torch.cuda.empty_cache()

            # Step 2: Preprocessing and 3D reconstruction using TRELLIS pipeline
            print("[-] 2/2: Reconstructing 3D Mesh with TRELLIS...")
            # The TrellisImageTo3DPipeline handles preprocessing internally when called with an image.
            output = self.trellis_pipeline(raw_image, return_model=True, return_image=False)
            glb_source_path = output.model_path # This is a Path object from the TRELLIS pipeline

            # Copy the generated GLB to the desired output_path
            shutil.copy(glb_source_path, output_path)

            torch.cuda.empty_cache()

        print(f"[+] Success! Saved to {output_path} in {time.time() - start_time:.2f}s")
        return output_path

# --- CELL ---

object1 = TrueTrellisPipeline()

# --- CELL ---

object1.generate_draft("a car")

# --- CELL ---

import base64
import trimesh
from IPython.display import HTML, display

def visualize_and_fix_display(file_path='model.glb'):
    print(f"[*] Checking {file_path}...")

    try:
        # 1. Confirm file validity and print stats
        scene = trimesh.load(file_path)
        if isinstance(scene, trimesh.Scene):
            geometry = next(iter(scene.geometry.values()))
        else:
            geometry = scene

        print(f"[+] File exists. Vertices: {len(geometry.vertices)}, Faces: {len(geometry.faces)}")

        # 2. Create an immediate download link as a fallback
        with open(file_path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode()

        download_html = f'''
        <div style="background-color: #e8f0fe; padding: 15px; border-radius: 8px; border: 1px solid #4285f4; margin-bottom: 20px;">
            <h3 style="margin-top:0; color: #1967d2;">Download Model</h3>
            <p>If the viewer below is blank, click the link to view the file on your local machine:</p>
            <a href="data:application/octet-stream;base64,{b64}"
               download="{file_path}"
               style="background-color: #1a73e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
               Download {file_path}
            </a>
        </div>
        '''
        display(HTML(download_html))

        # 3. Enhanced Model Viewer with white background and different lighting
        data_url = f"data:model/gltf-binary;base64,{b64}"
        viewer_html = f"""
        <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js"></script>
        <div style="width: 100%; height: 500px; border: 1px solid #ccc; background-color: #ffffff;">
            <model-viewer src="{data_url}"
                          style="width: 100%; height: 100%;"
                          auto-rotate
                          camera-controls
                          exposure="1.0"
                          environment-image="neutral"
                          shadow-intensity="1">
            </model-viewer>
        </div>
        """
        display(HTML(viewer_html))

    except Exception as e:
        print(f"[!] Error processing model: {str(e)}")

visualize_and_fix_display('model.glb')

# --- CELL ---

