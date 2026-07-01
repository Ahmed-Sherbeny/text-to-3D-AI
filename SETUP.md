# OptiForge3D - Infrastructure Setup Guide

## Prerequisites

### Required Software
- **Docker Engine**: Version 20.10 or higher
- **Docker Compose**: V2 or higher
- **Git**: For version control
- **Text Editor**: VS Code, Sublime, or any editor

### System Requirements
- **RAM**: Minimum 4GB free (8GB recommended)
- **Disk Space**: Minimum 10GB free
- **OS**: Windows 10/11, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **Network**: Internet connection for pulling Docker images

### Installation Guides

#### Docker Desktop (Windows/macOS)
1. Download from: https://www.docker.com/products/docker-desktop
2. Install Docker Desktop
3. Start Docker Desktop
4. Verify installation:
   ```bash
   docker --version
   docker compose version
   ```

#### Docker Engine (Linux)
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Verify
docker --version
docker compose version
```

---

## Step-by-Step Setup

### Step 1: Clone/Download Project
```bash
# If using Git
git clone <repository-url>
cd OptiForge3D

# Or download and extract ZIP
```

### Step 2: Configure Environment Variables
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your preferred editor
nano .env   # or code .env (VS Code)
```

**IMPORTANT**: Change these default values in `.env`:
- `POSTGRES_PASSWORD`: Use a strong password (16+ characters)
- `MINIO_ROOT_PASSWORD`: Use a strong password (16+ characters)
- Optionally uncomment and set `REDIS_PASSWORD`

### Step 3: Review Docker Compose Configuration
```bash
# Optional: Review the configuration
cat docker-compose.yml

# Optional: Validate syntax
docker compose config
```

### Step 4: Start Infrastructure
```bash
# Start all services in detached mode
docker compose up -d

# View logs (optional)
docker compose logs -f
```

**Expected Output**:
```
[+] Running 7/7
 ✔ Network optiforge_network          Created
 ✔ Volume optiforge_postgres_data     Created
 ✔ Volume optiforge_redis_data        Created
 ✔ Volume optiforge_minio_data        Created
 ✔ Container optiforge_postgres       Started
 ✔ Container optiforge_redis          Started
 ✔ Container optiforge_minio          Started
```

### Step 5: Wait for Services to Initialize
```bash
# Check service status (wait for "healthy")
docker compose ps

# Expected output after ~30 seconds:
# NAME                  STATUS
# optiforge_postgres    Up 30 seconds (healthy)
# optiforge_redis       Up 30 seconds (healthy)
# optiforge_minio       Up 30 seconds (healthy)
```

### Step 6: Verify Infrastructure
```bash
# Run verification script

# On Linux/macOS:
bash verify-infrastructure.sh

# On Windows (PowerShell):
.\verify-infrastructure.ps1

# On Windows (Git Bash):
bash verify-infrastructure.sh
```

**Expected Output**: All checks should pass ✓

### Step 7: Access Services

#### PostgreSQL
```bash
# Connect via CLI
docker compose exec postgres psql -U optiforge_user -d optiforge_db

# Run test query
optiforge_db=# SELECT * FROM system_health;

# Exit
optiforge_db=# \q
```

#### Redis
```bash
# Connect via CLI
docker compose exec redis redis-cli

# Run test command
127.0.0.1:6379> PING
PONG

# Exit
127.0.0.1:6379> exit
```

#### MinIO
1. Open browser: http://localhost:9001
2. Login:
   - Username: Value from `MINIO_ROOT_USER` in `.env`
   - Password: Value from `MINIO_ROOT_PASSWORD` in `.env`
3. Verify buckets exist:
   - `raw-uploads`
   - `generated-models`

---

## Verification Checklist

Use this checklist to ensure everything is working:

- [ ] Docker and Docker Compose are installed
- [ ] All three containers are running
- [ ] All containers show "healthy" status
- [ ] PostgreSQL accepts connections
- [ ] PostgreSQL extensions are installed (uuid-ossp, pgcrypto)
- [ ] Redis responds to PING
- [ ] Redis AOF persistence is enabled
- [ ] MinIO API is accessible (http://localhost:9000)
- [ ] MinIO Console is accessible (http://localhost:9001)
- [ ] MinIO buckets are created (raw-uploads, generated-models)
- [ ] Docker network `optiforge_network` exists
- [ ] Docker volumes are created (postgres, redis, minio)

---

## Common Commands

### Start/Stop Services
```bash
# Start all services
docker compose up -d

# Stop all services (keeps data)
docker compose down

# Stop and remove volumes (DELETES ALL DATA!)
docker compose down -v

# Restart specific service
docker compose restart postgres
docker compose restart redis
docker compose restart minio
```

### View Logs
```bash
# All services
docker compose logs

# Specific service
docker compose logs postgres
docker compose logs redis
docker compose logs minio

# Follow logs (real-time)
docker compose logs -f

# Last 100 lines
docker compose logs --tail=100
```

### Check Status
```bash
# Container status
docker compose ps

# Resource usage
docker stats

# Disk usage
docker system df
```

### Access Service CLIs
```bash
# PostgreSQL
docker compose exec postgres psql -U optiforge_user -d optiforge_db

# Redis
docker compose exec redis redis-cli

# MinIO (mc client)
docker compose exec minio sh
mc alias set local http://localhost:9000 minioadmin password
mc ls local
```

---

## Troubleshooting

### Issue: Port Already in Use

**Error**:
```
Error response from daemon: Ports are not available: exposing port TCP 0.0.0.0:5432 -> 0.0.0.0:0: listen tcp 0.0.0.0:5432: bind: address already in use
```

**Solution**:
```bash
# Find what's using the port
# Windows
netstat -ano | findstr :5432

# Linux/macOS
lsof -i :5432

# Option 1: Stop the conflicting service
# Option 2: Change port in .env file
POSTGRES_PORT=5433  # Use different port
```

### Issue: Container Won't Start

**Symptoms**: Container exits immediately or shows "Restarting"

**Solution**:
```bash
# Check logs for errors
docker compose logs postgres

# Common causes:
# 1. Corrupted volume - remove and recreate
docker compose down -v
docker compose up -d

# 2. Insufficient disk space
docker system df
docker system prune  # Free up space

# 3. Configuration error in .env
docker compose config  # Validate syntax
```

### Issue: Container is Unhealthy

**Solution**:
```bash
# Check logs
docker compose logs postgres

# Check health check command
docker inspect optiforge_postgres | grep -A 10 Healthcheck

# Restart service
docker compose restart postgres

# Wait 30 seconds and check again
docker compose ps
```

### Issue: Can't Connect to Database

**Error**: `psql: could not connect to server`

**Solution**:
```bash
# 1. Verify container is running
docker compose ps

# 2. Verify container is healthy
docker compose ps postgres

# 3. Check PostgreSQL logs
docker compose logs postgres

# 4. Test from inside container
docker compose exec postgres pg_isready

# 5. Verify credentials in .env
cat .env | grep POSTGRES
```

### Issue: MinIO Buckets Not Created

**Solution**:
```bash
# Check if init script ran
docker compose logs minio | grep -i bucket

# Manually create buckets
docker compose exec minio sh
mc alias set local http://localhost:9000 minioadmin your_password
mc mb local/raw-uploads
mc mb local/generated-models
mc ls local
exit
```

### Issue: Docker Daemon Not Running

**Error**: `Cannot connect to the Docker daemon`

**Solution**:
```bash
# Windows/macOS: Start Docker Desktop

# Linux:
sudo systemctl start docker
sudo systemctl status docker
```

### Issue: Permission Denied (Linux)

**Error**: `permission denied while trying to connect to the Docker daemon socket`

**Solution**:
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and log back in, or run:
newgrp docker

# Verify
docker ps
```

---

## Security Hardening

### Development Environment
- ✓ Change default passwords in `.env`
- ✓ Use `.gitignore` to prevent committing `.env`
- ✓ Keep Docker and images updated
- ✓ Use Docker network isolation (already configured)

### Production Environment
**Additional Steps Required**:

1. **Use Docker Secrets** (instead of .env)
   ```yaml
   secrets:
     postgres_password:
       file: ./secrets/postgres_password.txt
   ```

2. **Don't Expose Ports** (use reverse proxy)
   ```yaml
   # Remove ports section from docker-compose.yml
   # Access via nginx/traefik only
   ```

3. **Enable SSL/TLS**
   - PostgreSQL: Configure SSL certificates
   - Redis: Enable TLS mode
   - MinIO: Use HTTPS with valid certificates

4. **Restrict Network Access**
   ```yaml
   networks:
     optiforge_network:
       internal: true  # No external access
   ```

5. **Use Specific Image Tags** (not `latest`)
   ```yaml
   image: postgres:16.2-alpine  # Specific version
   ```

6. **Enable Audit Logging**
   - PostgreSQL: Enable query logging
   - MinIO: Enable access logs
   - Redis: Enable command logging

7. **Regular Backups**
   - Automate daily backups
   - Test restore procedures
   - Store backups offsite

8. **Resource Limits**
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '2'
         memory: 2G
   ```

---

## Maintenance

### Regular Tasks

#### Daily
- Monitor disk usage: `docker system df`
- Check container health: `docker compose ps`
- Review logs for errors: `docker compose logs --tail=100`

#### Weekly
- Backup databases (see volumes/README.md)
- Update Docker images: `docker compose pull`
- Prune unused resources: `docker system prune`

#### Monthly
- Review security updates
- Test backup restoration
- Audit access logs

### Backup Procedures

See `volumes/README.md` for detailed backup instructions.

**Quick Backup**:
```bash
# Create backup directory
mkdir -p backups/$(date +%Y%m%d)

# Backup PostgreSQL
docker compose exec postgres pg_dump -U optiforge_user optiforge_db > backups/$(date +%Y%m%d)/postgres.sql

# Backup Redis
docker compose exec redis redis-cli SAVE
docker cp optiforge_redis:/data/dump.rdb backups/$(date +%Y%m%d)/redis-dump.rdb

# Backup MinIO
docker compose exec minio mc mirror local/raw-uploads backups/$(date +%Y%m%d)/raw-uploads
docker compose exec minio mc mirror local/generated-models backups/$(date +%Y%m%d)/generated-models
```

---

## Next Steps

Once infrastructure is verified and running:

1. **Step 3**: Develop Backend API (FastAPI/Flask/Django)
2. **Step 4**: Develop Frontend Application (React/Vue/Angular)
3. **Step 5**: Integrate AI Models (3D optimization algorithms)
4. **Step 6**: Add Task Queue (Celery with Redis broker)

---

## Additional Resources

### Documentation
- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/docs/)
- [MinIO Documentation](https://min.io/docs/)

### Community
- [Docker Community Forums](https://forums.docker.com/)
- [Stack Overflow - Docker](https://stackoverflow.com/questions/tagged/docker)
- [Reddit - Docker](https://www.reddit.com/r/docker/)

### Training
- [Docker Official Training](https://www.docker.com/resources/training/)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [Redis University](https://university.redis.com/)

---

## Support

For issues specific to OptiForge3D infrastructure:
1. Check logs: `docker compose logs`
2. Run verification: `bash verify-infrastructure.sh`
3. Review troubleshooting section above
4. Check service-specific README files in `docker/` directory

---

## License

[Your License Here]

---

**Last Updated**: $(date +%Y-%m-%d)
**Version**: 1.0.0
