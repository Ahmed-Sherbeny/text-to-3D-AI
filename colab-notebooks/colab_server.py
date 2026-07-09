import os
import sys
import importlib

# 1. Faster Workspace Setup
# %cd /content
if not os.path.exists("TripoSR"):
    # !git clone --depth 1 https://github.com/VAST-AI-Research/TripoSR.git
    pass
# %cd /content/TripoSR
sys.path.append('/content/TripoSR') # Ensure TripoSR is in path for imports

# 2. Combined Optimized Installation
print("[*] Rapid environment setup... (Est. 2 mins)")
# !pip install --no-cache-dir \
#     "numpy==1.26.4" \
#     "transformers==4.35.0" \
#     "huggingface-hub==0.17.3" \
#     "tokenizers>=0.14,<0.15" \
#     "torchao>=0.16.0" \
#     "omegaconf==2.3.0" \
#     "einops==0.7.0" \
#     "trimesh==4.0.5" \
#     "xatlas==0.0.9" \
#     "moderngl==5.10.0" \
#     "rembg" "onnxruntime" \
#     "diffusers==0.23.1" "accelerate==0.24.1" \
#     "peft==0.6.2" \
#     "cupy-cuda12x" \
#     "scikit-build-core"

# 3. Build torchmcubes only if missing
if importlib.util.find_spec("torchmcubes") is None:
    print("[*] Building torchmcubes...")
    # !pip install --no-cache-dir git+https://github.com/tatsy/torchmcubes.git

# 4. Imports & Setup (FastAPI + ML)
import torch
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import uvicorn
import nest_asyncio
import tempfile
from PIL import Image
import trimesh
import numpy as np

# Apply nest_asyncio to run uvicorn in colab notebook
nest_asyncio.apply()

app = FastAPI(title="OptiForge3D Colab GPU Server")

# Allow all origins for dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------
# Mock pipeline setup since actual pipeline not fully provided in user snippet
# ------------------------------------------------------------------

class TrellisDraftPipeline:
    def __init__(self):
        print("Trellis pipeline mock initialized")
        
    def generate(self, prompt, **kwargs):
        print(f"Generating for prompt: {prompt}")
        return None

pipeline = TrellisDraftPipeline()

@app.post("/generate-scene")
async def generate_scene(
    prompt: str = Form(...),
):
    print(f"Received scene generation request: {prompt}")
    return {"status": "ok", "message": "Mock generation started"}

@app.post("/generate-text-to-3d")
async def generate_text_to_3d(prompt: str = Form(...)):
    print(f"Generating 3D for prompt: {prompt}")
    
    # Mocking generation by returning a dummy glb file
    temp_dir = tempfile.mkdtemp()
    out_path = os.path.join(temp_dir, "model.glb")
    
    # Create simple box as dummy mesh
    mesh = trimesh.creation.box()
    mesh.export(out_path)
    
    return FileResponse(
        out_path, 
        media_type='model/gltf-binary',
        filename="model.glb"
    )

if __name__ == "__main__":
    print("\nStarting local tunnel and server...")
    
    # Write shell script to start localtunnel
    with open("start_tunnel.sh", "w") as f:
        f.write("npm install -g localtunnel\n")
        f.write("lt --port 8000 --subdomain bumpy-chefs-tan\n")
        
    # Start server
    uvicorn.run(app, host="0.0.0.0", port=8000)
