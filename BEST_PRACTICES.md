# OptiForge3D - Infrastructure Best Practices

This document explains the design decisions, best practices, and common pitfalls to avoid when working with the OptiForge3D infrastructure.

---

## Table of Contents
1. [Docker Compose Best Practices](#docker-compose-best-practices)
2. [Security Best Practices](#security-best-practices)
3. [Network Architecture](#network-architecture)
4. [Volume Management](#volume-management)
5. [Environment Variables](#environment-variables)
6. [Health Checks](#health-checks)
7. [Container Orchestration](#container-orchestration)
8. [Performance Optimization](#performance-optimization)
9. [Monitoring and Logging](#monitoring-and-logging)
10. [Common Mistakes to Avoid](#common-mistakes-to-avoid)

---

## Docker Compose Best Practices

### 1. Use Compose File Version 3.9+
**Why**: Latest features, better syntax, forward compatibility

```yaml
# ✓ Good
version: '3.9'

# ✗ Bad
version: '2'  # Outdated, missing features
```

### 2. Use Named Volumes Over Bind Mounts
**Why**: Better performance, platform-independent, Docker-managed

```yaml
# ✓ Good - Named volume (used in OptiForge3D)
volumes:
  postgres_data:/var/lib/postgresql/data

# ✗ Bad - Bind mount (avoid for databases)
volumes:
  ./data/postgres:/var/lib/postgresql/data
```

**Exceptions**: Bind mounts are fine for:
- Source code (hot reload during development)
- Configuration files you need to edit
- Logs you want to access directly

### 3. Always Set Restart Policies
**Why**: Services automatically recover from failures

```yaml
# ✓ Good
restart: unless-stopped

# ✗ Bad
# No restart policy - container won't restart after crash
```

**Restart Options**:
- `no`: Never restart (default, not recommended)
- `always`: Always restart, even after manual stop
- `unless-stopped`: Restart unless explicitly stopped (✓ recommended)
- `on-failure`: Restart only on error exit codes

### 4. Use Fixed Container Names
**Why**: Predictable names for scripts and debugging

```yaml
# ✓ Good
container_name: optiforge_postgres

# ✗ Bad
# Auto-generated names like "optiforge_postgres_1" are unpredictable
```

### 5. Separate Concerns with Comments
**Why**: Maintainability and documentation

```yaml
# ✓ Good - Clear sections with explanations
# ==============================================================================
# PostgreSQL Database Service
# ==============================================================================
# Primary relational database for storing:
# - User accounts and authentication data
# - 3D model metadata
# ==============================================================================
postgres:
  image: postgres:16-alpine
  # ... configuration ...

# ✗ Bad - No structure or documentation
postgres:
  image: postgres:16-alpine
redis:
  image: redis:7-alpine
minio:
  image: minio/minio:latest
```

### 6. Use Alpine Images When Possible
**Why**: Smaller size, faster downloads, reduced attack surface

```yaml
# ✓ Good
image: postgres:16-alpine      # ~230MB
image: redis:7-alpine          # ~30MB

# ✗ Bad (unless you need specific Debian packages)
image: postgres:16             # ~380MB
image: redis:7                 # ~110MB
```

**When NOT to use Alpine**:
- Need specific GNU libraries
- Compatibility issues with C extensions
- Debugging tools not available in Alpine

---

## Security Best Practices

### 1. Never Hardcode Credentials
**Why**: Prevents credential leaks in version control

```yaml
# ✓ Good - Use environment variables
environment:
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}

# ✗ Bad - Hardcoded password
environment:
  POSTGRES_PASSWORD: my_secret_password_123
```

### 2. Use Strong, Unique Passwords
**Why**: Prevent brute force and credential stuffing attacks

```bash
# ✓ Good - Generate strong passwords
openssl rand -base64 32

# Example: "K7mN2pQ8vR4tW6xY9zB3cF5gH8jL0n="

# ✗ Bad
POSTGRES_PASSWORD=password123
POSTGRES_PASSWORD=admin
```

**Password Requirements**:
- Minimum 16 characters
- Mix of uppercase, lowercase, numbers, symbols
- Different password for each service
- No dictionary words or personal information

### 3. Always Use .gitignore for Secrets
**Why**: Prevents accidental commit of credentials

```bash
# ✓ Good - .env is gitignored
echo ".env" >> .gitignore

# ✗ Bad - Committing .env to repository
git add .env  # NEVER DO THIS!
```

### 4. Don't Expose Unnecessary Ports in Production
**Why**: Reduces attack surface

```yaml
# ✓ Good for Development - Exposed for testing
ports:
  - "5432:5432"

# ✓ Good for Production - No port exposure, access via network only
# ports:  # Comment out or remove
```

**Production Setup**:
- Remove `ports` section
- Access services via Docker network only
- Use reverse proxy (nginx/traefik) as single entry point

### 5. Enable Authentication Everywhere
**Why**: Prevents unauthorized access

```yaml
# ✓ Good - Redis with password
environment:
  REDIS_PASSWORD: ${REDIS_PASSWORD}
command: redis-server --requirepass ${REDIS_PASSWORD}

# ✗ Bad - Redis without password
command: redis-server
```

### 6. Use Read-Only Filesystem When Possible
**Why**: Prevents container compromise from modifying system files

```yaml
# ✓ Good for stateless services
read_only: true
tmpfs:
  - /tmp
  - /var/run

# Note: Not suitable for databases that need to write data
```

### 7. Run as Non-Root User
**Why**: Limits damage if container is compromised

```yaml
# ✓ Good
user: "999:999"  # postgres user

# ✗ Bad
user: "0:0"  # root user
```

**Note**: Official images (postgres, redis, minio) already run as non-root by default.

---

## Network Architecture

### 1. Use Custom Bridge Networks
**Why**: Enables service discovery, isolation, and DNS resolution

```yaml
# ✓ Good - Custom network (used in OptiForge3D)
networks:
  optiforge_network:
    driver: bridge

# ✗ Bad - Default bridge network (no DNS resolution)
# Using default network without explicit network definition
```

**Benefits of Custom Networks**:
- Containers can reach each other by service name (e.g., `postgres`, `redis`)
- Isolated from other Docker networks
- Better security through network segmentation

### 2. Service Discovery via DNS
**Why**: Stable, human-readable connection strings

```python
# ✓ Good - Use service name (OptiForge3D approach)
db_host = "postgres"  # Resolved by Docker DNS
redis_host = "redis"
minio_host = "minio"

# ✗ Bad - Using IP addresses
db_host = "172.18.0.2"  # IP can change on restart!
```

### 3. Don't Use localhost in Container-to-Container Communication
**Why**: localhost refers to the container itself, not other containers

```python
# ✓ Good - Service name
DATABASE_URL = "postgresql://user:pass@postgres:5432/db"

# ✗ Bad - localhost doesn't work between containers
DATABASE_URL = "postgresql://user:pass@localhost:5432/db"
```

**localhost is only for**:
- Connections FROM host machine TO container
- Example: `psql -h localhost -p 5432` (from your laptop)

### 4. Use Internal Networks for Production
**Why**: Prevents external access to sensitive services

```yaml
# ✓ Good for Production
networks:
  optiforge_network:
    driver: bridge
    internal: true  # No external internet access

# ✓ Good for Development (OptiForge3D default)
networks:
  optiforge_network:
    driver: bridge  # Allows external access for development
```

---

## Volume Management

### 1. Why Named Volumes Over Bind Mounts?

#### Named Volumes (✓ Recommended for OptiForge3D)
**Pros**:
- Docker manages location (optimal performance)
- Cross-platform compatible
- No permission issues
- Easier backup/restore
- Can be shared between containers

**Cons**:
- Data not directly visible in project directory
- Requires Docker commands to access

```yaml
# ✓ Good - Named volume
volumes:
  postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
    driver: local
```

#### Bind Mounts
**Pros**:
- Data visible in project directory
- Easy to edit files directly
- Good for development (code hot-reload)

**Cons**:
- Permission issues (especially on Linux)
- Platform-specific paths
- Slower performance on Windows/macOS
- Project directory gets cluttered

```yaml
# Use for source code, not databases
volumes:
  ./backend:/app
```

### 2. Volume Naming Convention
**Why**: Consistent, predictable, avoid conflicts

```yaml
# ✓ Good - Project prefix + service + data
postgres_data:
  name: optiforge_postgres_data

# ✗ Bad - Generic name (conflicts with other projects)
postgres_data:
  name: postgres_data
```

### 3. Never Store Volumes in Git
**Why**: Volumes can be gigabytes in size, change frequently

```bash
# ✓ Good - .gitignore
volumes/
*.sql
*.dump

# ✗ Bad - Committing volume data
git add volumes/postgres_data/
```

### 4. Regular Backups
**Why**: Data loss prevention, disaster recovery

```bash
# ✓ Good - Automated daily backups
0 2 * * * /path/to/backup-script.sh

# ✗ Bad - No backup strategy
```

---

## Environment Variables

### 1. Use .env File for Configuration
**Why**: Single source of truth, easy to manage

```yaml
# ✓ Good - Variables in .env
environment:
  POSTGRES_USER: ${POSTGRES_USER}
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}

# ✗ Bad - Hardcoded in docker-compose.yml
environment:
  POSTGRES_USER: admin
  POSTGRES_PASSWORD: password123
```

### 2. Provide .env.example Template
**Why**: Documents required variables, safe to commit

```bash
# ✓ Good - Commit .env.example with placeholders
POSTGRES_PASSWORD=change_this_password

# ✗ Bad - No template, users don't know what to configure
```

### 3. Validate Environment Variables
**Why**: Catch configuration errors early

```bash
# ✓ Good - Validate before starting
if [ -z "$POSTGRES_PASSWORD" ]; then
    echo "Error: POSTGRES_PASSWORD not set"
    exit 1
fi

# Check syntax
docker compose config
```

### 4. Use Descriptive Variable Names
**Why**: Self-documenting configuration

```bash
# ✓ Good
POSTGRES_USER=optiforge_user
POSTGRES_DB=optiforge_db
MINIO_ROOT_USER=minioadmin

# ✗ Bad
DB_USER=admin
USER=admin
U=admin
```

### 5. Group Related Variables
**Why**: Better organization, easier to understand

```bash
# ✓ Good - Organized by service
# ============================================
# PostgreSQL Configuration
# ============================================
POSTGRES_USER=optiforge_user
POSTGRES_PASSWORD=secret
POSTGRES_DB=optiforge_db

# ============================================
# Redis Configuration
# ============================================
REDIS_PORT=6379
```

---

## Health Checks

### 1. Always Define Health Checks
**Why**: Automated monitoring, orchestration awareness

```yaml
# ✓ Good - Health check defined (OptiForge3D approach)
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s

# ✗ Bad - No health check
# Docker can't tell if service is actually working
```

### 2. Use Appropriate Start Period
**Why**: Avoids false positives during initialization

```yaml
# ✓ Good - 30s grace period for PostgreSQL
start_period: 30s

# ✗ Bad - No grace period
start_period: 0s  # Fails during initialization
```

**Start Period Guidelines**:
- PostgreSQL: 30s (first-time initialization can be slow)
- Redis: 10s (fast startup)
- MinIO: 20s (bucket creation takes time)

### 3. Set Reasonable Timeouts
**Why**: Balance between responsiveness and false positives

```yaml
# ✓ Good - 5s timeout for database query
timeout: 5s

# ✗ Bad
timeout: 1s   # Too short, causes false failures
timeout: 60s  # Too long, delays failure detection
```

### 4. Use Service-Specific Health Check Commands
**Why**: Accurate status detection

```yaml
# ✓ Good - PostgreSQL
test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]

# ✓ Good - Redis
test: ["CMD", "redis-cli", "ping"]

# ✓ Good - MinIO
test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]

# ✗ Bad - Just checking if process exists
test: ["CMD", "ps", "aux", "|", "grep", "postgres"]
```

---

## Container Orchestration

### 1. Use Depends_on with Conditions
**Why**: Ensures services start in correct order

```yaml
# ✓ Good - Wait for healthy database
backend:
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy

# ⚠ Acceptable for OptiForge3D Step 2 - No backend yet
# Will add depends_on in Step 3
```

### 2. Set Appropriate Resource Limits
**Why**: Prevents single service from consuming all resources

```yaml
# ✓ Good for Production
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G
    reservations:
      cpus: '1'
      memory: 1G

# ✓ OK for Development - No limits (OptiForge3D default)
# Allows flexibility during testing
```

### 3. Use Labels for Organization
**Why**: Easier filtering and management

```yaml
# ✓ Good
labels:
  com.optiforge.service: "database"
  com.optiforge.environment: "development"
  com.optiforge.version: "1.0.0"
```

---

## Performance Optimization

### 1. Use Specific Image Tags
**Why**: Faster pulls, predictable behavior, easier rollback

```yaml
# ✓ Good for Production
image: postgres:16.2-alpine

# ⚠ OK for Development (OptiForge3D uses this)
image: postgres:16-alpine  # Always gets latest 16.x

# ✗ Bad
image: postgres:latest  # Unpredictable, can break updates
```

### 2. Optimize PostgreSQL PGDATA Location
**Why**: Avoids volume mounting issues on some systems

```yaml
# ✓ Good (OptiForge3D approach)
environment:
  PGDATA: /var/lib/postgresql/data/pgdata

# ✗ Bad - Can cause permission issues
environment:
  PGDATA: /var/lib/postgresql/data
```

### 3. Enable Redis AOF for Durability
**Why**: Prevents data loss on crashes

```yaml
# ✓ Good
command: redis-server --appendonly yes

# ✗ Bad - Data loss on crashes
command: redis-server
```

### 4. Use Shared Memory for PostgreSQL
**Why**: Better performance for large queries

```yaml
# ✓ Good for Production
shm_size: '256mb'

# OK for Development - Not critical
```

---

## Monitoring and Logging

### 1. Centralize Logs
**Why**: Easier debugging, historical analysis

```bash
# ✓ Good - View all logs
docker compose logs -f

# ✓ Good - View specific service
docker compose logs -f postgres

# ✗ Bad - No log retention strategy
```

### 2. Set Log Rotation
**Why**: Prevents disk from filling up

```yaml
# ✓ Good for Production
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"

# OK for Development - Default logging
```

### 3. Monitor Resource Usage
**Why**: Identify bottlenecks, plan capacity

```bash
# ✓ Good - Regular monitoring
docker stats

# Set up alerts for high CPU/memory usage
```

---

## Common Mistakes to Avoid

### 1. ✗ Using Host Network Mode
**Why**: Breaks isolation, complicates multi-host deployment

```yaml
# ✗ Bad
network_mode: host

# ✓ Good
networks:
  - optiforge_network
```

### 2. ✗ Not Using Health Checks
**Why**: Can't detect when service is unhealthy but container is running

```yaml
# ✗ Bad - No health check
postgres:
  image: postgres:16-alpine

# ✓ Good - With health check (OptiForge3D)
postgres:
  image: postgres:16-alpine
  healthcheck:
    test: ["CMD-SHELL", "pg_isready"]
```

### 3. ✗ Exposing All Ports in Production
**Why**: Security risk, unnecessary attack surface

```yaml
# ✗ Bad for Production
ports:
  - "5432:5432"  # Exposed to internet!
  - "6379:6379"
  - "9000:9000"

# ✓ Good for Production - Only expose via reverse proxy
# ports: (commented out or removed)
```

### 4. ✗ Using `docker-compose` (V1) Instead of `docker compose` (V2)
**Why**: V1 is deprecated, V2 is faster and has better features

```bash
# ✗ Bad - V1 (deprecated)
docker-compose up -d

# ✓ Good - V2
docker compose up -d
```

### 5. ✗ Not Testing Backup Restoration
**Why**: Discover backup issues only during disasters

```bash
# ✗ Bad - Only creating backups
# Never testing if they can be restored

# ✓ Good - Regular restore testing
# Test restore in staging environment monthly
```

### 6. ✗ Storing Secrets in Environment Variables (Production)
**Why**: Environment variables are visible in docker inspect

```yaml
# ✗ Bad for Production
environment:
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}

# ✓ Good for Production - Use Docker secrets
secrets:
  - postgres_password
environment:
  POSTGRES_PASSWORD_FILE: /run/secrets/postgres_password
```

### 7. ✗ Running as Root User
**Why**: Security risk if container is compromised

```yaml
# ✗ Bad
user: root

# ✓ Good (Official images handle this automatically)
# postgres runs as user 'postgres'
# redis runs as user 'redis'
# minio runs as user 'minio'
```

### 8. ✗ Not Using .dockerignore
**Why**: Slower builds, larger images

```bash
# ✓ Good - .dockerignore file
node_modules/
.git/
*.log
.env
```

### 9. ✗ Forgetting to Clean Up Resources
**Why**: Disk fills up with unused images/volumes

```bash
# ✓ Good - Regular cleanup
docker system prune -a
docker volume prune

# Set up automated cleanup
```

### 10. ✗ Not Documenting Configuration
**Why**: Team members can't understand or maintain setup

```yaml
# ✗ Bad - No comments
postgres:
  image: postgres:16-alpine
  environment:
    PGDATA: /var/lib/postgresql/data/pgdata

# ✓ Good - Well-documented (OptiForge3D approach)
# ==============================================================================
# PostgreSQL Database Service
# ==============================================================================
# Primary relational database for storing:
# - User accounts and authentication data
# ...
postgres:
  # --------------------------------------------------
  # Image Selection
  # --------------------------------------------------
  # Using Alpine variant for smaller image size
  image: postgres:16-alpine
```

---

## Summary

The OptiForge3D infrastructure follows these key principles:

1. **Security First**: Strong passwords, .gitignore, environment variables
2. **Reliability**: Health checks, restart policies, data persistence
3. **Maintainability**: Comprehensive documentation, clear structure
4. **Scalability**: Docker networks, volume management, resource awareness
5. **Best Practices**: Industry standards, battle-tested patterns

By following these best practices, the infrastructure is:
- **Production-ready**: Can be deployed with minimal changes
- **Developer-friendly**: Easy to understand and modify
- **Maintainable**: Well-documented and organized
- **Secure**: Following security best practices
- **Scalable**: Ready for growth and additional services

---

**Remember**: These are guidelines, not absolute rules. Adapt based on your specific requirements, but understand the trade-offs when deviating from best practices.

---

**Last Updated**: 2024
**Version**: 1.0.0
