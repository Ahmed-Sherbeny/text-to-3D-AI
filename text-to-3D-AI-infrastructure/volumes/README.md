# Docker Volumes Documentation

## Overview
This directory documents the Docker volumes used by OptiForge3D. The actual volume data is managed by Docker and stored outside the project directory.

## Why Use Named Volumes?

### 1. **Docker-Managed Storage**
- Docker automatically handles optimal storage location
- Better performance than bind mounts
- Consistent behavior across Windows, Linux, macOS

### 2. **Data Persistence**
- Data survives container deletion
- Can be backed up independently
- Can be shared between containers

### 3. **No Permission Issues**
- Docker handles file ownership automatically
- No host user/group conflicts
- Works seamlessly in all environments

### 4. **Portability**
- Volumes can be moved between hosts
- Easy backup/restore workflows
- Independent of project directory

### 5. **Better Isolation**
- Volume data separate from code
- Cleaner project directory
- Easier .gitignore management

## Volume Locations

### Where is data actually stored?

**Linux**:
```
/var/lib/docker/volumes/
```

**Windows (WSL2)**:
```
\\wsl$\docker-desktop-data\data\docker\volumes\
```

**macOS**:
```
~/Library/Containers/com.docker.docker/Data/vms/0/
```

### Accessing volume data
```bash
# Don't access volume data directly on filesystem
# Always use docker commands or exec into containers

# Example: View PostgreSQL data
docker compose exec postgres ls -la /var/lib/postgresql/data
```

## OptiForge3D Volumes

### 1. optiforge_postgres_data
**Service**: PostgreSQL database

**Contents**:
- Database files (tables, indexes)
- Write-Ahead Log (WAL) files
- Configuration files
- Transaction logs

**Typical Size**:
- Initial: ~100MB
- Growth: Depends on data volume
- Estimate: 1GB for small projects, 10GB+ for production

**Backup Frequency**: Daily (recommended)

**Backup Command**:
```bash
docker compose exec postgres pg_dump -U optiforge_user optiforge_db > backup.sql
```

---

### 2. optiforge_redis_data
**Service**: Redis cache

**Contents**:
- RDB snapshots (point-in-time backups)
- AOF file (append-only log)
- Redis configuration state

**Typical Size**:
- Initial: <10MB
- Growth: Depends on cache size
- Estimate: 100MB - 1GB

**Backup Frequency**: Weekly (cache data is ephemeral)

**Backup Command**:
```bash
docker compose exec redis redis-cli SAVE
docker cp optiforge_redis:/data/dump.rdb ./backup/redis-dump.rdb
```

---

### 3. optiforge_minio_data
**Service**: MinIO object storage

**Contents**:
- All uploaded 3D model files
- All generated/optimized models
- Bucket metadata and configurations
- Access logs

**Typical Size**:
- Initial: <100MB
- Growth: Depends on usage
- Estimate: 10GB - 1TB+ (largest volume)

**Backup Frequency**: Daily or real-time sync (critical data)

**Backup Command**:
```bash
docker compose exec minio mc mirror local/raw-uploads /backup/raw-uploads
docker compose exec minio mc mirror local/generated-models /backup/generated-models
```

## Volume Management

### List all volumes
```bash
docker volume ls
```

### Inspect specific volume
```bash
docker volume inspect optiforge_postgres_data
```

### Check volume size
```bash
docker system df -v
```

### Remove unused volumes
```bash
# CAUTION: This removes ALL unused volumes, not just OptiForge3D
docker volume prune
```

### Remove specific volume
```bash
# MUST stop and remove containers first
docker compose down
docker volume rm optiforge_postgres_data

# WARNING: This deletes all data in the volume!
```

### Backup all volumes
```bash
# Create backup directory
mkdir -p backups/volumes

# PostgreSQL
docker compose exec postgres pg_dump -U optiforge_user optiforge_db > backups/volumes/postgres.sql

# Redis
docker compose exec redis redis-cli SAVE
docker cp optiforge_redis:/data/dump.rdb backups/volumes/redis-dump.rdb

# MinIO
docker compose exec minio mc mirror local/raw-uploads backups/volumes/minio-raw-uploads
docker compose exec minio mc mirror local/generated-models backups/volumes/minio-generated-models
```

### Restore from backup
```bash
# PostgreSQL
cat backups/volumes/postgres.sql | docker compose exec -T postgres psql -U optiforge_user -d optiforge_db

# Redis
docker cp backups/volumes/redis-dump.rdb optiforge_redis:/data/dump.rdb
docker compose restart redis

# MinIO
docker compose exec minio mc mirror backups/volumes/minio-raw-uploads local/raw-uploads
docker compose exec minio mc mirror backups/volumes/minio-generated-models local/generated-models
```

## Bind Mounts vs Named Volumes

### When to use Named Volumes (✓ OptiForge3D uses these)
- Database files (PostgreSQL)
- Cache data (Redis)
- Object storage (MinIO)
- Any persistent data that shouldn't be in project directory

### When to use Bind Mounts
- Source code (for live reloading during development)
- Configuration files that need editing
- Logs you want to access directly

## Best Practices

### 1. **Regular Backups**
```bash
# Automate with cron (Linux/macOS)
0 2 * * * /path/to/backup-script.sh

# Automate with Task Scheduler (Windows)
```

### 2. **Monitor Disk Usage**
```bash
# Check volume sizes regularly
docker system df -v

# Set up alerts when volumes exceed thresholds
```

### 3. **Test Restore Procedures**
```bash
# Regularly test that backups can be restored
# Don't wait for disaster to discover backup issues
```

### 4. **Document Volume Contents**
- Keep this README updated
- Document what each volume stores
- Note backup frequencies and procedures

### 5. **Version Control**
- Never commit volume data to git
- Keep volumes outside project directory
- Use .gitignore for any local volume mounts

## Disaster Recovery

### Complete system restore

1. **Install Docker and Docker Compose**

2. **Clone repository**
```bash
git clone <repository-url>
cd OptiForge3D
```

3. **Copy .env file**
```bash
cp .env.backup .env
```

4. **Start services** (creates fresh volumes)
```bash
docker compose up -d
```

5. **Restore data from backups**
```bash
# PostgreSQL
cat backup/postgres.sql | docker compose exec -T postgres psql -U optiforge_user -d optiforge_db

# Redis (optional, cache data)
docker cp backup/redis-dump.rdb optiforge_redis:/data/dump.rdb
docker compose restart redis

# MinIO
docker compose exec minio mc mirror backup/raw-uploads local/raw-uploads
docker compose exec minio mc mirror backup/generated-models local/generated-models
```

6. **Verify restoration**
```bash
# Check PostgreSQL
docker compose exec postgres psql -U optiforge_user -d optiforge_db -c "SELECT COUNT(*) FROM system_health;"

# Check MinIO
docker compose exec minio mc ls local/
```

## Common Issues

### Volume full
```bash
# Check which volume is full
docker system df -v

# Clean up old data
# - PostgreSQL: Delete old records
# - Redis: FLUSHDB (cache only!)
# - MinIO: Delete old uploads
```

### Permission denied
```bash
# Docker handles permissions automatically for named volumes
# If issues persist, check Docker daemon permissions

# Windows: Ensure Docker Desktop has drive access
# Linux: Ensure user is in docker group
```

### Corrupted volume
```bash
# Stop containers
docker compose down

# Remove corrupted volume
docker volume rm optiforge_postgres_data

# Restore from backup
docker compose up -d
# ... restore data ...
```

## Additional Resources

- [Docker Volumes Documentation](https://docs.docker.com/storage/volumes/)
- [Docker Volume Backup Best Practices](https://docs.docker.com/storage/volumes/#backup-restore-or-migrate-data-volumes)
- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [Redis Persistence Documentation](https://redis.io/docs/manual/persistence/)
- [MinIO Backup Guide](https://min.io/docs/minio/linux/operations/data-recovery.html)
