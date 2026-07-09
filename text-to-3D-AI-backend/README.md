# OptiForge3D — Backend API

This is the backend API for OptiForge3D. It handles receiving requests from the frontend, breaking down scene prompts using Gemini, and dispatching tasks to Celery. Celery then orchestrates generating 2D images and sending them to the Colab TRELLIS server for 3D generation.

## Project Structure
- **FastAPI** (`app/main.py`)
- **Celery Worker** (`app/celery_app.py`, `app/tasks/`)
- **Redis** (`docker-compose.yml`)

## Local Setup

### 1. Start Redis
```bash
docker compose up -d
```

### 2. Install Dependencies
```bash
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Environment Variables
Copy `.env.example` to `.env` and fill in your keys:
```bash
cp .env.example .env
```

### 4. Run the API Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Run the Celery Worker (New Terminal)
```bash
.\.venv\Scripts\activate
celery -A app.celery_app worker --loglevel=info --concurrency=1 --pool=solo -Q default
```
