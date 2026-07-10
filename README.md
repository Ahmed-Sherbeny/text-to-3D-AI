# OptiForge3D — Text-to-3D AI Generation System

Welcome to the OptiForge3D monorepo! This application allows users to generate ultra-high-quality 3D scenes and objects from text prompts using the TripoSR AI model.

The architecture has been highly optimized and simplified for rapid deployment and development. 

## Project Architecture
1. **Frontend**: React / Vite / TypeScript (Tailwind + Three.js for rendering)
2. **Backend API**: FastAPI + Celery (Python) for asynchronous job processing.
3. **Task Broker**: Redis (via Docker Compose)
4. **AI Engine**: Google Colab

---

## Quick Start Guide (100% Working Setup)

To get everything running on a fresh machine, follow these 3 steps exactly.

### Step 1: Start the AI Engine (Google Colab)
Because the TripoSR model requires an NVIDIA GPU with at least 16GB VRAM, we run it in a free Google Colab environment.
1. Open Google Colab and create a new notebook.
2. Go to **Runtime -> Change runtime type -> T4 GPU**.
3. Open `colab-notebooks/colab_server.py` from this repository, and copy its contents into two cells in the Colab notebook.
4. In Cell 2, insert your Hugging Face token in the environment variables.
5. Run both cells. 
6. At the end of Cell 2, it will output an **API URL** (e.g. `https://wet-dancers-fetch.loca.lt`). Keep this handy!

### Step 2: Start the Backend (FastAPI + Celery)
You need Python 3.10+ installed.

1. **Start Redis**:
   Open a terminal in `text-to-3D-AI-backend/` and run:
   ```bash
   docker compose up -d
   ```
2. **Setup Python Environment**:
   ```bash
   cd text-to-3D-AI-backend
   python -m venv .venv
   # Windows:
   .\.venv\Scripts\activate
   # Mac/Linux:
   source .venv/bin/activate
   
   pip install -r requirements.txt
   ```
3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` inside the `text-to-3D-AI-backend/` folder.
   Edit the `.env` file and set the URL you got from Google Colab:
   ```env
   COLAB_API_URL=https://your-cloudflare-url-here.trycloudflare.com
   GEMINI_API_KEY=your_gemini_api_key
   ```
4. **Start the FastAPI Server**:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
5. **Start the Celery Worker (In a new terminal)**:
   ```bash
   cd text-to-3D-AI-backend
   .\.venv\Scripts\activate
   celery -A app.celery_app worker --loglevel=info --concurrency=1 --pool=solo -Q default
   ```

### Step 3: Start the Frontend (Vite)
You need Node.js installed.

1. Open a new terminal in the frontend directory:
   ```bash
   cd text-to-3D-AI-frontend/frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser to `http://localhost:5173`. You are ready to generate 3D models!
