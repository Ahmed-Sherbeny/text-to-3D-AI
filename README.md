# OptiForge3D - Step 2: Base Docker Architecture & Local Storage

## Overview
This is the foundational infrastructure for OptiForge3D, a 3D model optimization platform.

## Architecture Components

### Core Services
- **PostgreSQL**: Primary relational database for application data
- **Redis**: In-memory data store for caching and message brokering
- **MinIO**: S3-compatible object storage for 3D models and assets

### Network Architecture
All services communicate through a dedicated Docker bridge network (`optiforge_network`), enabling service discovery via DNS names.

## Directory Structure

```
OptiForge3D/
│
├── docker-compose.yml          # Main orchestration file
├── .env                        # Environment variables (DO NOT COMMIT)
├── .env.example                # Template for environment variables
│
├── docker/                     # Docker-related configurations
│   ├── postgres/
│   │   ├── init/              # SQL initialization scripts
│   │   └── README.md
│   ├── redis/
│   │   ├── redis.conf         # Redis configuration
│   │   └── README.md
│   └── minio/
│       ├── init/              # MinIO initialization scripts
│       └── README.md
│
├── volumes/                    # Mount point documentation (actual volumes are Docker-managed)
│   └── README.md
│
└── README.md                   # This file
```

## Quick Start

### Prerequisites
- Docker Engine 20.10+
- Docker Compose V2+
- At least 4GB free RAM
- At least 10GB free disk space

### Setup

1. **Copy environment template**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your credentials**
   ```bash
   nano .env  # or your preferred editor
   ```

3. **Start all services**
   ```bash
   docker compose up -d
   ```

4. **Verify all services are healthy**
   ```bash
   docker compose ps
   ```

## Service Access

### PostgreSQL
- **Host**: localhost
- **Port**: 5432
- **Database**: optiforge_db
- **Connection String**: `postgresql://optiforge_user:your_password@localhost:5432/optiforge_db`

### Redis
- **Host**: localhost
- **Port**: 6379
- **Connection String**: `redis://localhost:6379/0`

### MinIO
- **Console UI**: http://localhost:9001
- **API Endpoint**: http://localhost:9000
- **Root User**: See `.env` file
- **Root Password**: See `.env` file

## Verification Commands

### Check service status
```bash
docker compose ps
```

### View logs
```bash
# All services
docker compose logs

# Specific service
docker compose logs postgres
docker compose logs redis
docker compose logs minio
```

### Connect to PostgreSQL
```bash
docker compose exec postgres psql -U optiforge_user -d optiforge_db
```

### Connect to Redis CLI
```bash
docker compose exec redis redis-cli
```

### Test MinIO
```bash
# List buckets
docker compose exec minio mc ls local/
```

## Volume Management

### List volumes
```bash
docker volume ls | grep optiforge
```

### Inspect volume
```bash
docker volume inspect optiforge_postgres_data
```

### Backup volumes (example for PostgreSQL)
```bash
docker compose exec postgres pg_dump -U optiforge_user optiforge_db > backup.sql
```

## Network Management

### Inspect network
```bash
docker network inspect optiforge_network
```

### View connected containers
```bash
docker network inspect optiforge_network | grep Name
```

## Maintenance

### Stop all services
```bash
docker compose down
```

### Stop and remove volumes (CAUTION: Data loss!)
```bash
docker compose down -v
```

### Restart a specific service
```bash
docker compose restart postgres
```

### View resource usage
```bash
docker stats
```

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit `.env` to version control
- Change all default passwords in production
- Use strong passwords (16+ characters, mixed case, numbers, symbols)
- Consider using Docker secrets for production deployments
- Restrict port exposure in production (use reverse proxy)

## Troubleshooting

### Services won't start
```bash
# Check logs for errors
docker compose logs

# Verify ports aren't already in use
netstat -ano | findstr "5432 6379 9000 9001"
```

### Permission issues
```bash
# Ensure Docker has necessary permissions
# On Windows: Check Docker Desktop settings
```

### Network issues
```bash
# Recreate network
docker compose down
docker network prune
docker compose up -d
```

## Next Steps

This infrastructure is ready for:
- Step 3: Backend API development
- Step 4: Frontend application
- Step 5: AI model integration
- Step 6: Task queue with Celery

## Support

For issues or questions about this infrastructure setup, consult:
- Docker documentation: https://docs.docker.com
- PostgreSQL documentation: https://www.postgresql.org/docs
- Redis documentation: https://redis.io/docs
- MinIO documentation: https://min.io/docs
