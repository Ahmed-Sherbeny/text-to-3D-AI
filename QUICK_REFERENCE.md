# OptiForge3D - Quick Reference Guide

Quick command reference for daily operations.

---

## Initial Setup

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Edit credentials
nano .env  # or code .env

# 3. Start all services
docker compose up -d

# 4. Verify everything works
bash verify-infrastructure.sh  # Linux/macOS
.\verify-infrastructure.ps1    # Windows PowerShell
```

---

## Daily Commands

### Start/Stop Services
```bash
# Start all
docker compose up -d

# Stop all (keeps data)
docker compose down

# Restart all
docker compose restart

# Restart single service
docker compose restart postgres
```

### View Status
```bash
# Check containers
docker compose ps

# Check health
docker compose ps | grep healthy

# View resource usage
docker stats

# Check logs
docker compose logs -f
docker compose logs postgres
docker compose logs --tail=50 redis
```

---

## Service Access

### PostgreSQL
```bash
# Connect to database
docker compose exec postgres psql -U optiforge_user -d optiforge_db

# Common SQL commands
\l              # List databases
\dt             # List tables
\d table_name   # Describe table
\q              # Quit

# Run single query
docker compose exec postgres psql -U optiforge_user -d optiforge_db -c "SELECT * FROM system_health;"

# Connection string
postgresql://optiforge_user:password@localhost:5432/optiforge_db
```

### Redis
```bash
# Connect to Redis CLI
docker compose exec redis redis-cli

# Common Redis commands
PING                    # Test connection
KEYS *                  # List all keys
GET key_name            # Get value
SET key_name value      # Set value
INFO                    # Server info
INFO memory             # Memory usage
FLUSHDB                 # Clear current DB (CAUTION!)
exit                    # Exit CLI

# Run single command
docker compose exec redis redis-cli PING
```

### MinIO
```bash
# Web Console
# URL: http://localhost:9001
# Username: MINIO_ROOT_USER (from .env)
# Password: MINIO_ROOT_PASSWORD (from .env)

# CLI Access
docker compose exec minio sh
mc alias set local http://localhost:9000 minioadmin password
mc ls local                           # List buckets
mc ls local/raw-uploads              # List objects
mc cp file.obj local/raw-uploads/    # Upload file
mc cp local/raw-uploads/file.obj .   # Download file
exit

# S3 endpoint
http://localhost:9000
```

---

## Troubleshooting

### Check Logs
```bash
# All services
docker compose logs

# Specific service with tail
docker compose logs --tail=100 postgres
docker compose logs --tail=100 redis
docker compose logs --tail=100 minio

# Follow logs (real-time)
docker compose logs -f postgres
```

### Container Issues
```bash
# Check container status
docker compose ps

# Restart unhealthy container
docker compose restart postgres

# Recreate container
docker compose up -d --force-recreate postgres

# View detailed container info
docker inspect optiforge_postgres
```

### Network Issues
```bash
# List networks
docker network ls

# Inspect network
docker network inspect optiforge_network

# Check DNS resolution
docker compose exec postgres ping redis
docker compose exec redis ping postgres
```

### Volume Issues
```bash
# List volumes
docker volume ls | grep optiforge

# Inspect volume
docker volume inspect optiforge_postgres_data

# Check volume size
docker system df -v
```

### Port Conflicts
```bash
# Check what's using a port
# Windows
netstat -ano | findstr :5432

# Linux/macOS
lsof -i :5432
sudo netstat -tulpn | grep :5432

# Kill process (if safe)
# Windows: taskkill /PID <PID> /F
# Linux/macOS: kill -9 <PID>
```

### Complete Reset (DELETES ALL DATA!)
```bash
# Stop and remove everything
docker compose down -v

# Remove specific volume
docker volume rm optiforge_postgres_data

# Clean up all unused resources
docker system prune -a --volumes

# Start fresh
docker compose up -d
```

---

## Backup & Restore

### Quick Backup
```bash
# PostgreSQL
docker compose exec postgres pg_dump -U optiforge_user optiforge_db > backup_$(date +%Y%m%d).sql

# Redis
docker compose exec redis redis-cli SAVE
docker cp optiforge_redis:/data/dump.rdb redis_backup_$(date +%Y%m%d).rdb

# MinIO (requires mc configured)
docker compose exec minio mc mirror local/raw-uploads /backup/raw-uploads
```

### Quick Restore
```bash
# PostgreSQL
cat backup.sql | docker compose exec -T postgres psql -U optiforge_user -d optiforge_db

# Redis
docker cp backup.rdb optiforge_redis:/data/dump.rdb
docker compose restart redis

# MinIO
docker compose exec minio mc mirror /backup/raw-uploads local/raw-uploads
```

---

## Health Checks

### Manual Health Checks
```bash
# PostgreSQL
docker compose exec postgres pg_isready -U optiforge_user -d optiforge_db

# Redis
docker compose exec redis redis-cli ping

# MinIO
curl -f http://localhost:9000/minio/health/live
curl -f http://localhost:9001
```

### Automated Verification
```bash
# Run full verification script
bash verify-infrastructure.sh        # Linux/macOS/Git Bash
.\verify-infrastructure.ps1          # Windows PowerShell
```

---

## Maintenance

### Update Images
```bash
# Pull latest images
docker compose pull

# Recreate containers with new images
docker compose up -d
```

### Clean Up Disk Space
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# Remove everything unused
docker system prune -a --volumes
```

### View Resource Usage
```bash
# Real-time stats
docker stats

# Disk usage
docker system df

# Detailed disk usage
docker system df -v
```

---

## Environment Variables

### View Current Config
```bash
# Show current .env
cat .env

# Validate docker-compose.yml
docker compose config

# Show resolved configuration
docker compose config --resolve-image-digests
```

### Change Configuration
```bash
# Edit .env
nano .env  # or code .env

# Apply changes (recreate containers)
docker compose up -d
```

---

## Security

### Change Passwords
```bash
# 1. Stop services
docker compose down

# 2. Edit .env with new passwords
nano .env

# 3. Remove volumes (required for password change)
docker volume rm optiforge_postgres_data

# 4. Start services (will reinitialize)
docker compose up -d
```

### Check Security
```bash
# Verify .env is gitignored
git status .env  # Should show "nothing to commit"

# Check exposed ports
docker compose ps --format "table {{.Name}}\t{{.Ports}}"

# Check running processes
docker compose top
```

---

## Connection Strings

### From Host Machine
```bash
# PostgreSQL
postgresql://optiforge_user:password@localhost:5432/optiforge_db

# Redis
redis://localhost:6379/0

# MinIO
Endpoint: http://localhost:9000
Access Key: MINIO_ROOT_USER
Secret Key: MINIO_ROOT_PASSWORD
```

### From Docker Containers
```bash
# PostgreSQL (use service name)
postgresql://optiforge_user:password@postgres:5432/optiforge_db

# Redis
redis://redis:6379/0

# MinIO
Endpoint: http://minio:9000
```

---

## One-Liners

```bash
# Check if all services are healthy
docker compose ps | grep -q "unhealthy" && echo "Issues detected" || echo "All healthy"

# Restart all unhealthy services
docker compose ps | grep unhealthy | awk '{print $1}' | xargs -I {} docker compose restart {}

# View last 10 errors in logs
docker compose logs --tail=1000 | grep -i error | tail -10

# Count containers by status
docker compose ps --format json | jq -r '.State' | sort | uniq -c

# Show total disk usage
docker system df --format "{{.Type}}: {{.Size}} ({{.Reclaimable}} reclaimable)"

# Generate strong password
openssl rand -base64 32

# Backup all services at once
docker compose exec postgres pg_dump -U optiforge_user optiforge_db > backup.sql && \
docker compose exec redis redis-cli SAVE && \
docker cp optiforge_redis:/data/dump.rdb redis.rdb

# Test database connection
docker compose exec postgres psql -U optiforge_user -d optiforge_db -c "SELECT version();"

# Show PostgreSQL database size
docker compose exec postgres psql -U optiforge_user -d optiforge_db -c "SELECT pg_size_pretty(pg_database_size('optiforge_db'));"

# Count Redis keys
docker compose exec redis redis-cli DBSIZE

# List MinIO buckets with sizes
docker compose exec minio mc du local
```

---

## Useful Aliases

Add these to your `~/.bashrc` or `~/.zshrc`:

```bash
# Docker Compose shortcuts
alias dcup='docker compose up -d'
alias dcdown='docker compose down'
alias dclogs='docker compose logs -f'
alias dcps='docker compose ps'
alias dcrestart='docker compose restart'

# OptiForge3D specific
alias ofpg='docker compose exec postgres psql -U optiforge_user -d optiforge_db'
alias ofredis='docker compose exec redis redis-cli'
alias ofminio='docker compose exec minio sh'
alias oflogs='docker compose logs -f'
alias ofstatus='docker compose ps'
alias ofverify='bash verify-infrastructure.sh'
```

---

## Emergency Procedures

### Service Won't Start
```bash
# 1. Check logs
docker compose logs service_name

# 2. Check if port is in use
netstat -ano | findstr :PORT  # Windows
lsof -i :PORT                 # Linux/macOS

# 3. Try recreating container
docker compose up -d --force-recreate service_name

# 4. If still failing, remove volume and reinitialize
docker compose down
docker volume rm optiforge_service_data
docker compose up -d
```

### Out of Disk Space
```bash
# 1. Check usage
docker system df

# 2. Remove unused resources
docker system prune -a --volumes

# 3. If still need space, backup and remove old data
# (See Backup section above)
```

### Performance Issues
```bash
# 1. Check resource usage
docker stats

# 2. Check slow queries (PostgreSQL)
docker compose exec postgres psql -U optiforge_user -d optiforge_db -c "SELECT query, state, query_start FROM pg_stat_activity WHERE state != 'idle';"

# 3. Check Redis memory
docker compose exec redis redis-cli INFO memory

# 4. Restart overloaded service
docker compose restart service_name
```

---

## Additional Resources

- **Full Documentation**: README.md
- **Setup Guide**: SETUP.md
- **Best Practices**: BEST_PRACTICES.md
- **Service Details**: docker/*/README.md
- **Volume Info**: volumes/README.md

---

**Tip**: Bookmark this file for quick access to common commands!
