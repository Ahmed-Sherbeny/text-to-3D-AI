FROM python:3.10-slim

WORKDIR /app

# Install dependencies first for caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend source code
COPY . .

# We don't specify CMD here because docker-compose will override it
# for the API (uvicorn) and the Worker (celery).
