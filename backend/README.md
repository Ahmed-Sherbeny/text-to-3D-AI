# OptiForge3D — Backend API

Local-first SaaS platform for generating 3D models from text, images, or sketches.

Built with **FastAPI**, **SQLAlchemy (async)**, **PostgreSQL**, **Redis**, and **MinIO**.

---

## Project Structure

```
backend/
├── app/
│   ├── __init__.py            # Package init
│   ├── main.py                # FastAPI entry point (CORS, lifespan, routers)
│   ├── config.py              # pydantic-settings config (.env loader)
│   ├── database.py            # SQLAlchemy async engine, session, Base
│   ├── models/
│   │   ├── __init__.py        # Re-exports all ORM models
│   │   ├── user.py            # User profile model
│   │   ├── generation.py      # Generation metadata model
│   │   └── system.py          # System status key-value model
│   ├── schemas/
│   │   ├── __init__.py        # Re-exports all Pydantic schemas
│   │   ├── user.py            # User request/response schemas
│   │   ├── generation.py      # Generation request/response schemas
│   │   └── health.py          # Health check response schema
│   └── routers/
│       ├── __init__.py        # Re-exports all routers
│       └── health.py          # /health endpoint (real service checks)
├── alembic/
│   ├── env.py                 # Alembic async migration environment
│   ├── script.py.mako         # Migration template
│   └── versions/              # Auto-generated migration files
├── alembic.ini                # Alembic configuration
├── requirements.txt           # Python dependencies
├── .env.example               # Environment variable template
└── README.md                  # This file
```

---

## Prerequisites

Make sure the infrastructure from **Step 2** is running:

```bash
docker compose up -d
```

This starts PostgreSQL (port 5432), Redis (port 6379), and MinIO (port 9000/9001).

---

## Quick Start

### 1. Create and activate a virtual environment

```bash
cd backend
python -m venv venv

# Windows PowerShell
.\venv\Scripts\Activate.ps1

# macOS/Linux
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment variables

```bash
# Copy the template
cp .env.example .env

# Edit .env with your actual credentials (defaults match Docker Compose)
```

### 4. Run database migrations

```bash
# Generate the initial migration
alembic revision --autogenerate -m "initial schema"

# Apply migrations to PostgreSQL
alembic upgrade head
```

### 5. Start the development server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 6. Verify

- **API Root**: [http://localhost:8000/](http://localhost:8000/)
- **Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## API Endpoints

| Method | Path      | Description                                      |
|--------|-----------|--------------------------------------------------|
| GET    | `/`       | API root — returns name, version, status         |
| GET    | `/health` | Real health check for PostgreSQL, Redis, MinIO   |
| GET    | `/docs`   | Interactive Swagger UI                           |
| GET    | `/redoc`  | ReDoc API documentation                          |

---

## Database Models

### Users (`users` table)
Tracks registered users with profile info and account flags.

### Generations (`generations` table)
Records every 3D model generation job — input type, prompt, parameters, status lifecycle, and MinIO file references.

### System Status (`system_status` table)
Key-value store for system-wide configuration and status tracking.

---

## Environment Variables

| Variable                     | Default                             | Description                          |
|------------------------------|-------------------------------------|--------------------------------------|
| `POSTGRES_USER`              | `optiforge_user`                    | PostgreSQL username                  |
| `POSTGRES_PASSWORD`          | `change_this_secure_password_123`   | PostgreSQL password                  |
| `POSTGRES_DB`                | `optiforge_db`                      | PostgreSQL database name             |
| `POSTGRES_HOST`              | `localhost`                         | PostgreSQL host                      |
| `POSTGRES_PORT`              | `5432`                              | PostgreSQL port                      |
| `REDIS_HOST`                 | `localhost`                         | Redis host                           |
| `REDIS_PORT`                 | `6379`                              | Redis port                           |
| `REDIS_PASSWORD`             | *(none)*                            | Redis password (optional)            |
| `MINIO_ENDPOINT`             | `localhost:9000`                    | MinIO S3 endpoint                    |
| `MINIO_ACCESS_KEY`           | `minioadmin`                        | MinIO access key                     |
| `MINIO_SECRET_KEY`           | `change_this_minio_password_789`    | MinIO secret key                     |
| `MINIO_SECURE`               | `false`                             | Use HTTPS for MinIO                  |
| `MINIO_BUCKET_RAW_UPLOADS`   | `raw-uploads`                       | Bucket for user uploads              |
| `MINIO_BUCKET_GENERATED_MODELS` | `generated-models`               | Bucket for generated 3D models       |
| `APP_ENV`                    | `development`                       | Application environment              |
| `APP_DEBUG`                  | `true`                              | Enable debug logging                 |
| `CORS_ORIGINS`               | `["http://localhost:3000", ...]`    | Allowed CORS origins (localhost only)|

---

## Design Principles

- **No mock data** — every endpoint hits real services (PostgreSQL, Redis, MinIO)
- **Local-first** — CORS strictly locked to localhost origins
- **Async everywhere** — async SQLAlchemy engine, async Redis, async health checks
- **Clean separation** — models, schemas, routers, and config in separate modules
