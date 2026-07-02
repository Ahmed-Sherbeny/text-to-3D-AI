# OptiForge3D - Infrastructure Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           HOST MACHINE (Windows)                         │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │                      Docker Engine                              │   │
│  │                                                                 │   │
│  │  ┌──────────────────────────────────────────────────────────┐ │   │
│  │  │         Docker Network: optiforge_network (bridge)        │ │   │
│  │  │                                                            │ │   │
│  │  │  ┌─────────────────┐  ┌─────────────────┐  ┌──────────┐ │ │   │
│  │  │  │   PostgreSQL    │  │      Redis      │  │  MinIO   │ │ │   │
│  │  │  │   Container     │  │   Container     │  │Container │ │ │   │
│  │  │  ├─────────────────┤  ├─────────────────┤  ├──────────┤ │ │   │
│  │  │  │  Image:         │  │  Image:         │  │  Image:  │ │ │   │
│  │  │  │  postgres:16    │  │  redis:7        │  │  minio:  │ │ │   │
│  │  │  │  -alpine        │  │  -alpine        │  │  latest  │ │ │   │
│  │  │  ├─────────────────┤  ├─────────────────┤  ├──────────┤ │ │   │
│  │  │  │  Port: 5432     │  │  Port: 6379     │  │Port:9000 │ │ │   │
│  │  │  │                 │  │                 │  │Port:9001 │ │ │   │
│  │  │  ├─────────────────┤  ├─────────────────┤  ├──────────┤ │ │   │
│  │  │  │  Hostname:      │  │  Hostname:      │  │Hostname: │ │ │   │
│  │  │  │  postgres       │  │  redis          │  │minio     │ │ │   │
│  │  │  ├─────────────────┤  ├─────────────────┤  ├──────────┤ │ │   │
│  │  │  │  Health: ✓      │  │  Health: ✓      │  │Health: ✓ │ │ │   │
│  │  │  │  pg_isready     │  │  redis-cli ping │  │curl /    │ │ │   │
│  │  │  │                 │  │                 │  │health    │ │ │   │
│  │  │  └────────┬────────┘  └────────┬────────┘  └────┬─────┘ │ │   │
│  │  │           │                    │                 │       │ │   │
│  │  │           │   DNS Resolution   │                 │       │ │   │
│  │  │           │◄───────────────────┼─────────────────►       │ │   │
│  │  │           │                    │                 │       │ │   │
│  │  └───────────┼────────────────────┼─────────────────┼───────┘ │   │
│  │              │                    │                 │         │   │
│  │  ┌───────────▼────────────────────▼─────────────────▼───────┐ │   │
│  │  │              Docker Named Volumes                         │ │   │
│  │  │  ┌──────────────────┐ ┌──────────────┐ ┌──────────────┐ │ │   │
│  │  │  │ postgres_data    │ │  redis_data  │ │  minio_data  │ │ │   │
│  │  │  │                  │ │              │ │              │ │ │   │
│  │  │  │ • Database files │ │ • AOF file   │ │ • Buckets:   │ │ │   │
│  │  │  │ • WAL logs       │ │ • RDB dump   │ │   raw-       │ │ │   │
│  │  │  │ • Config         │ │              │ │   uploads    │ │ │   │
│  │  │  │                  │ │              │ │   generated- │ │ │   │
│  │  │  │ Size: 100MB+     │ │ Size: 10MB+  │ │   models     │ │ │   │
│  │  │  │                  │ │              │ │              │ │ │   │
│  │  │  │                  │ │              │ │ Size: 1GB+   │ │ │   │
│  │  │  └──────────────────┘ └──────────────┘ └──────────────┘ │ │   │
│  │  └───────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Port Mappings (localhost)                      │  │
│  │  localhost:5432  ──►  postgres:5432  (PostgreSQL)               │  │
│  │  localhost:6379  ──►  redis:6379     (Redis)                    │  │
│  │  localhost:9000  ──►  minio:9000     (MinIO API)                │  │
│  │  localhost:9001  ──►  minio:9001     (MinIO Console)            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER/APPLICATION                             │
└───────┬─────────────────────┬────────────────────┬───────────────────┘
        │                     │                    │
        │ SQL Queries         │ Cache/Session      │ File Upload/Download
        │ port 5432           │ port 6379          │ port 9000/9001
        ▼                     ▼                    ▼
┌───────────────┐     ┌──────────────┐    ┌─────────────────┐
│  PostgreSQL   │     │    Redis     │    │     MinIO       │
│               │     │              │    │                 │
│  • Users      │     │  • Sessions  │    │  • raw-uploads  │
│  • Models     │     │  • Cache     │    │  • generated-   │
│  • Jobs       │     │  • Queue     │    │    models       │
│  • Config     │     │  • Temp data │    │                 │
└───────┬───────┘     └──────┬───────┘    └────────┬────────┘
        │                    │                     │
        │ Persist            │ Persist             │ Persist
        ▼                    ▼                     ▼
┌───────────────┐     ┌──────────────┐    ┌─────────────────┐
│ postgres_data │     │  redis_data  │    │   minio_data    │
│  Volume       │     │   Volume     │    │    Volume       │
└───────────────┘     └──────────────┘    └─────────────────┘
```

---

## Network Communication Diagram

```
┌──────────────────────────────────────────────────────────────┐
│            optiforge_network (Docker Bridge)                  │
│                                                               │
│  Service Discovery via DNS:                                   │
│                                                               │
│  ┌──────────┐         DNS: postgres         ┌──────────┐    │
│  │          │◄────────────────────────────────│          │    │
│  │ Backend  │                                 │PostgreSQL│    │
│  │          │─────────────────────────────────►          │    │
│  │(future)  │      postgresql://postgres:5432 │          │    │
│  │          │                                 └──────────┘    │
│  │          │                                                 │
│  │          │         DNS: redis             ┌──────────┐    │
│  │          │◄────────────────────────────────│          │    │
│  │          │                                 │  Redis   │    │
│  │          │─────────────────────────────────►          │    │
│  │          │      redis://redis:6379         └──────────┘    │
│  │          │                                                 │
│  │          │         DNS: minio             ┌──────────┐    │
│  │          │◄────────────────────────────────│          │    │
│  │          │                                 │  MinIO   │    │
│  │          │─────────────────────────────────►          │    │
│  └──────────┘      http://minio:9000         └──────────┘    │
│                                                               │
│  Benefits:                                                    │
│  ✓ No IP addresses needed                                    │
│  ✓ Automatic DNS resolution                                  │
│  ✓ Service names are stable                                  │
│  ✓ Easy to add new services                                  │
└──────────────────────────────────────────────────────────────┘
```

---

## Storage Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    Docker Volume System                          │
│                                                                  │
│  Named Volumes (Docker-managed):                                 │
│  Location: /var/lib/docker/volumes/ (Linux)                      │
│            \\wsl$\docker-desktop-data\... (Windows)              │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  optiforge_postgres_data                                   │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  Database Files:                                      │ │ │
│  │  │  • base/ (table data)                                 │ │ │
│  │  │  • global/ (cluster data)                             │ │ │
│  │  │  • pg_wal/ (write-ahead logs)                         │ │ │
│  │  │  • pg_xact/ (transaction status)                      │ │ │
│  │  │  • postgresql.conf (config)                           │ │ │
│  │  │                                                        │ │ │
│  │  │  Backup: pg_dump → SQL file                           │ │ │
│  │  │  Restore: psql < SQL file                             │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  optiforge_redis_data                                      │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  Persistence Files:                                   │ │ │
│  │  │  • appendonly.aof (write-ahead log)                   │ │ │
│  │  │  • dump.rdb (point-in-time snapshot)                  │ │ │
│  │  │                                                        │ │ │
│  │  │  Backup: SAVE command → dump.rdb                      │ │ │
│  │  │  Restore: Copy dump.rdb → restart                     │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  optiforge_minio_data                                      │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  Object Storage:                                      │ │ │
│  │  │  • raw-uploads/ (bucket)                              │ │ │
│  │  │    └── user_id/upload_id/model.obj                    │ │ │
│  │  │  • generated-models/ (bucket)                         │ │ │
│  │  │    └── user_id/job_id/optimized.glb                   │ │ │
│  │  │  • .minio.sys/ (metadata, config)                     │ │ │
│  │  │                                                        │ │ │
│  │  │  Backup: mc mirror → local directory                  │ │ │
│  │  │  Restore: mc mirror → MinIO                           │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## Application Integration (Future Steps)

```
┌─────────────────────────────────────────────────────────────────┐
│                       Step 3: Backend API                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  FastAPI / Flask / Django                                  │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │ │
│  │  │   ORM        │  │  Cache       │  │  Storage     │   │ │
│  │  │ (SQLAlchemy) │  │  (Redis)     │  │  (MinIO SDK) │   │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │ │
│  │         │                 │                 │           │ │
│  └─────────┼─────────────────┼─────────────────┼───────────┘ │
│            │                 │                 │             │
└────────────┼─────────────────┼─────────────────┼─────────────┘
             │                 │                 │
             ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              Step 2: Infrastructure (CURRENT)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  PostgreSQL  │  │    Redis     │  │    MinIO     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
             │                 │                 │
             ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Docker Volumes                               │
└─────────────────────────────────────────────────────────────────┘


Future Integration (Step 6):
┌─────────────────────────────────────────────────────────────────┐
│  Backend API                                                     │
│  ┌──────────────┐          ┌──────────────┐                    │
│  │   FastAPI    │  enqueue │    Celery    │                    │
│  │  Endpoints   │─────────►│    Worker    │                    │
│  └──────────────┘          └──────┬───────┘                    │
│                                   │                             │
│                                   │ broker/backend              │
│                                   ▼                             │
│                            ┌──────────────┐                     │
│                            │    Redis     │                     │
│                            └──────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Connection Strings Reference

### From Host Machine (Development)
```python
# PostgreSQL
DATABASE_URL = "postgresql://optiforge_user:password@localhost:5432/optiforge_db"

# Redis
REDIS_URL = "redis://localhost:6379/0"

# MinIO
MINIO_ENDPOINT = "localhost:9000"
MINIO_ACCESS_KEY = "minioadmin"
MINIO_SECRET_KEY = "password"
```

### From Docker Containers (Production)
```python
# PostgreSQL - Use service name, not localhost!
DATABASE_URL = "postgresql://optiforge_user:password@postgres:5432/optiforge_db"

# Redis
REDIS_URL = "redis://redis:6379/0"

# MinIO
MINIO_ENDPOINT = "minio:9000"
MINIO_ACCESS_KEY = "minioadmin"
MINIO_SECRET_KEY = "password"
```

---

## Health Check Flow

```
┌──────────────────────────────────────────────────────────────┐
│                     Docker Engine                             │
│                                                               │
│  Every 10 seconds:                                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  1. Execute health check command                       │  │
│  │     • PostgreSQL: pg_isready -U user -d db             │  │
│  │     • Redis: redis-cli ping                            │  │
│  │     • MinIO: curl /minio/health/live                   │  │
│  │                                                         │  │
│  │  2. Wait for response (timeout: 3-10s)                 │  │
│  │                                                         │  │
│  │  3. Evaluate result:                                   │  │
│  │     Success (exit 0) → Increment healthy counter       │  │
│  │     Failure (exit 1) → Increment unhealthy counter     │  │
│  │                                                         │  │
│  │  4. Update container status:                           │  │
│  │     • starting (within start_period)                   │  │
│  │     • healthy (consecutive successes)                  │  │
│  │     • unhealthy (retries exceeded)                     │  │
│  │                                                         │  │
│  │  5. Take action if unhealthy:                          │  │
│  │     • restart: unless-stopped → Auto-restart           │  │
│  │     • Alert monitoring systems                         │  │
│  │     • Log event                                        │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘

View health status:
$ docker compose ps

NAME                 STATUS
optiforge_postgres   Up 2 minutes (healthy)
optiforge_redis      Up 2 minutes (healthy)
optiforge_minio      Up 2 minutes (healthy)
```

---

## Backup and Restore Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         BACKUP FLOW                              │
│                                                                  │
│  ┌──────────┐                       ┌────────────────────────┐  │
│  │          │   1. Trigger Backup   │                        │  │
│  │  Cron    │──────────────────────►│  Backup Script         │  │
│  │  Job     │   (Daily 2 AM)        │  backup.sh             │  │
│  └──────────┘                       └───────┬────────────────┘  │
│                                             │                    │
│                    ┌────────────────────────┼────────────────┐   │
│                    │                        │                │   │
│         ┌──────────▼────────┐   ┌──────────▼────────┐   ┌───▼───▼───┐
│         │  pg_dump          │   │  redis-cli SAVE   │   │ mc mirror │
│         │  PostgreSQL       │   │  Redis            │   │  MinIO    │
│         └──────────┬────────┘   └──────────┬────────┘   └─────┬─────┘
│                    │                       │                   │
│         ┌──────────▼────────┐   ┌─────────▼─────────┐   ┌─────▼─────┐
│         │ backup.sql        │   │ dump.rdb          │   │ buckets/  │
│         │ (SQL format)      │   │ (Binary format)   │   │ (Objects) │
│         └──────────┬────────┘   └──────────┬────────┘   └─────┬─────┘
│                    │                       │                   │
│                    └───────────────────────┼───────────────────┘
│                                           │
│                                ┌──────────▼────────┐
│                                │  Compress & Store │
│                                │  backup_date.tar  │
│                                └──────────┬────────┘
│                                           │
│                                ┌──────────▼────────┐
│                                │  Offsite Storage  │
│                                │  S3 / NAS / Cloud │
│                                └───────────────────┘
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        RESTORE FLOW                              │
│                                                                  │
│  ┌──────────────────┐                                           │
│  │  Backup Archive  │                                           │
│  │ backup_date.tar  │                                           │
│  └────────┬─────────┘                                           │
│           │                                                     │
│  ┌────────▼─────────┐                                           │
│  │  Extract Files   │                                           │
│  └────────┬─────────┘                                           │
│           │                                                     │
│  ┌────────┼─────────────────────────┐                          │
│  │        │                         │                          │
│  ▼        ▼                         ▼                          │
│ backup.sql  dump.rdb           buckets/                        │
│  │         │                    │                              │
│  │  ┌──────▼────────┐  ┌───────▼────────┐  ┌────────────────┐│
│  │  │ Stop Services │  │ Stop Services  │  │ Stop Services  ││
│  │  └──────┬────────┘  └───────┬────────┘  └────────┬────────┘│
│  │         │                   │                    │         │
│  │  ┌──────▼────────┐  ┌───────▼────────┐  ┌────────▼────────┐│
│  │  │ psql < sql    │  │ Copy dump.rdb  │  │ mc mirror       ││
│  │  │ Restore DB    │  │ to volume      │  │ Upload objects  ││
│  │  └──────┬────────┘  └───────┬────────┘  └────────┬────────┘│
│  │         │                   │                    │         │
│  │  ┌──────▼─────────────────────▼────────────────────▼──────┐│
│  │  │           Start Services                               ││
│  │  │           docker compose up -d                         ││
│  │  └───────────────────────────┬────────────────────────────┘│
│  │                              │                             │
│  │                    ┌─────────▼──────────┐                 │
│  │                    │  Verify Restore    │                 │
│  │                    │  • Test connections │                 │
│  │                    │  • Check data       │                 │
│  │                    └────────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                      Security Architecture                       │
│                                                                  │
│  Layer 1: Host Security                                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  • Operating system hardening                              │ │
│  │  • Firewall configuration                                  │ │
│  │  • User access control                                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│  Layer 2: Docker Security    │                                   │
│  ┌──────────────────────────▼──────────────────────────────┐   │
│  │  • Docker daemon security                                │   │
│  │  • Image trust (official images only)                    │   │
│  │  • Resource limits                                        │   │
│  │  • Network isolation (custom bridge)                     │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                              │                                   │
│  Layer 3: Container Security │                                   │
│  ┌──────────────────────────▼──────────────────────────────┐   │
│  │  • Non-root users (postgres, redis, minio)              │   │
│  │  • Read-only filesystem (where possible)                │   │
│  │  • Minimal Alpine images                                │   │
│  │  • No unnecessary privileges                            │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                              │                                   │
│  Layer 4: Application Security                                  │
│  ┌──────────────────────────▼──────────────────────────────┐   │
│  │  • Strong passwords (16+ chars)                          │   │
│  │  • Environment variables (not hardcoded)                 │   │
│  │  • .gitignore for secrets                                │   │
│  │  • Authentication required (passwords set)               │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                              │                                   │
│  Layer 5: Network Security   │                                   │
│  ┌──────────────────────────▼──────────────────────────────┐   │
│  │  • Private Docker network                                │   │
│  │  • Service-to-service DNS only                           │   │
│  │  • Port exposure controlled                              │   │
│  │  • Future: TLS/SSL encryption                            │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                              │                                   │
│  Layer 6: Data Security      │                                   │
│  ┌──────────────────────────▼──────────────────────────────┐   │
│  │  • Persistent volumes (data survives)                    │   │
│  │  • Regular backups                                       │   │
│  │  • Encryption at rest (future)                           │   │
│  │  • Access control (bucket policies)                      │   │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

This architecture provides a solid, secure, and scalable foundation for OptiForge3D!
