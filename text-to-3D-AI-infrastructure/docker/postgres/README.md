# PostgreSQL Configuration

## Overview
PostgreSQL is the primary relational database for OptiForge3D, storing structured data including user accounts, model metadata, and job records.

## Directory Structure
```
postgres/
├── init/              # SQL scripts that run on first container start
│   └── 01_init.sql   # Initial database setup
└── README.md         # This file
```

## Initialization Scripts

SQL files in the `init/` directory are executed automatically when the PostgreSQL container starts for the **first time only**. They run in alphabetical order.

### When do init scripts run?
- ✅ First time the container starts with an empty data volume
- ❌ On subsequent container restarts (data already exists)
- ❌ After manual database deletion inside container

### How to re-run init scripts?
```bash
# Stop containers and remove volumes
docker compose down -v

# Start fresh (init scripts will run again)
docker compose up -d
```

## Configuration Details

### Image
- **Base**: `postgres:16-alpine`
- **Size**: ~230MB (Alpine) vs ~380MB (Debian)
- **Version**: PostgreSQL 16.x (latest stable)

### Environment Variables
- `POSTGRES_USER`: Superuser username
- `POSTGRES_PASSWORD`: Superuser password
- `POSTGRES_DB`: Default database name
- `PGDATA`: Data directory location

### Data Persistence
Data is stored in a Docker-managed volume: `optiforge_postgres_data`

### Ports
- **Container**: 5432
- **Host**: 5432 (configurable in `.env`)

## Connection Information

### From Host Machine
```bash
# Using psql
psql -h localhost -p 5432 -U optiforge_user -d optiforge_db

# Connection string
postgresql://optiforge_user:password@localhost:5432/optiforge_db
```

### From Other Docker Containers
```bash
# Using service name (DNS resolution)
postgresql://optiforge_user:password@postgres:5432/optiforge_db
```

### From Python (example)
```python
import psycopg2

conn = psycopg2.connect(
    host="postgres",  # Service name in Docker network
    port=5432,
    database="optiforge_db",
    user="optiforge_user",
    password="your_password"
)
```

## Health Check

The container includes a health check that runs every 10 seconds:
```bash
pg_isready -U optiforge_user -d optiforge_db
```

Check health status:
```bash
docker compose ps postgres
```

## Common Operations

### Access PostgreSQL CLI
```bash
docker compose exec postgres psql -U optiforge_user -d optiforge_db
```

### View logs
```bash
docker compose logs postgres
```

### Create database backup
```bash
docker compose exec postgres pg_dump -U optiforge_user optiforge_db > backup.sql
```

### Restore database backup
```bash
cat backup.sql | docker compose exec -T postgres psql -U optiforge_user -d optiforge_db
```

### View database size
```sql
SELECT pg_size_pretty(pg_database_size('optiforge_db'));
```

### List all tables
```sql
\dt
```

### View table schema
```sql
\d table_name
```

## Extensions Enabled

### uuid-ossp
Provides functions to generate UUIDs:
```sql
SELECT uuid_generate_v4();
```

### pgcrypto
Provides cryptographic functions:
```sql
SELECT crypt('password', gen_salt('bf'));
```

## Performance Tuning (Future)

For production, consider tuning these PostgreSQL settings in a custom `postgresql.conf`:
- `shared_buffers`: 25% of RAM
- `effective_cache_size`: 75% of RAM
- `maintenance_work_mem`: 10% of RAM
- `max_connections`: Based on application needs
- `work_mem`: RAM / max_connections / 4

## Security Best Practices

1. **Change default password**: Never use default passwords in production
2. **Use SSL/TLS**: Enable SSL for encrypted connections
3. **Restrict host access**: Don't expose port 5432 to the internet
4. **Regular backups**: Automate daily backups
5. **Update regularly**: Keep PostgreSQL version up to date
6. **Least privilege**: Create application-specific users with limited permissions

## Troubleshooting

### Container won't start
```bash
# Check logs for errors
docker compose logs postgres

# Common issues:
# - Port 5432 already in use
# - Insufficient disk space
# - Corrupted data volume
```

### Can't connect from host
```bash
# Verify container is running
docker compose ps postgres

# Test network connectivity
docker compose exec postgres pg_isready

# Check firewall settings (Windows)
```

### Slow query performance
```sql
-- Enable query logging in postgresql.conf
ALTER DATABASE optiforge_db SET log_statement = 'all';
ALTER DATABASE optiforge_db SET log_duration = on;

-- Analyze query plans
EXPLAIN ANALYZE SELECT ...;
```

## Additional Resources

- [Official PostgreSQL Documentation](https://www.postgresql.org/docs/16/)
- [Docker Hub: postgres](https://hub.docker.com/_/postgres)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Don%27t_Do_This)
