# OptiForge3D — Text-to-3D AI Generation System

Welcome to the OptiForge3D monorepo! This application allows users to generate ultra-high-quality 3D scenes and objects from text prompts using the TRELLIS AI model.

The architecture has been highly optimized and simplified for rapid deployment and development. 

## Project Architecture
1. **Frontend**: React / Vite / TypeScript (Tailwind + Three.js for rendering)
2. **Backend API**: FastAPI + Celery (Python) for asynchronous job processing.
3. **Task Broker**: Redis (via Docker Compose)
4. **AI Engine**: Google Colab (running the massive TRELLIS model via Cloudflare API tunnels)

---

## 🚀 Quick Start Guide (100% Working Setup)

To get everything running on a fresh machine, follow these 3 steps exactly.

### Step 1: Start the AI Engine (Google Colab)
Because the TRELLIS model requires an NVIDIA GPU with at least 16GB VRAM, we run it in a free Google Colab environment.
1. Open Google Colab and create a new notebook.
2. Go to **Runtime -> Change runtime type -> T4 GPU**.
3. Open `colab-notebooks/colab_server.py` from this repository, and copy its contents into two cells in the Colab notebook.
4. In Cell 2, insert your Hugging Face token in the environment variables.
5. Run both cells. 
6. At the end of Cell 2, it will output a **Cloudflare API URL** (e.g. `https://random-words.trycloudflare.com`). Keep this handy!

### Step 2: Start the Full Stack with Docker
You only need [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed on your machine.

1. **Configure Environment Variables**:
   Copy `.env.example` to `.env` inside the `text-to-3D-AI-backend/` folder.
   Edit the `.env` file and set the URL you got from Google Colab:
   ```env
   COLAB_API_URL=https://your-cloudflare-url-here.trycloudflare.com
   GEMINI_API_KEY=your_gemini_api_key
   ```
2. **Launch Everything**:
   Open a terminal in the **root** folder of this repository (where `docker-compose.yml` is) and run:
   ```bash
   docker compose up --build -d
   ```
   This will automatically:
   - Start the Redis message broker
   - Build and start the FastAPI Backend (Port 8000)
   - Build and start the Celery Task Worker
   - Build and start the React/Vite Frontend (Port 3000)

3. **Access the App**:
   Open your browser to `http://localhost:3000`. You are ready to generate 3D models!

*To stop the app later, simply run `docker compose down`.*
