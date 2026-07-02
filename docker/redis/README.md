# Redis Configuration

## Overview
Redis is an in-memory data structure store used as a cache, message broker, and session store for OptiForge3D.

## Why Include Redis Before Celery?

Even though Celery (task queue) is not implemented until Step 6, Redis is included in Step 2 because:

1. **Caching**: Improves API response times by caching frequently accessed data
   - Database query results
   - User session data
   - API responses
   - Computed values (e.g., model statistics)

2. **Session Storage**: Essential for user authentication
   - JWT token blacklist
   - Active user sessions
   - Login attempt tracking (rate limiting)

3. **Real-time Features**: Foundation for future features
   - WebSocket connections state
   - Live progress updates
   - Temporary data sharing

4. **Future-Proofing**: Makes Celery integration trivial
   - No infrastructure changes needed
   - Same Redis instance can serve multiple purposes
   - Minimal resource overhead (~20MB memory)

5. **Development Efficiency**: Available from the start
   - Backend developers can use caching immediately
   - No need to add infrastructure mid-project

## Directory Structure
```
redis/
├── redis.conf    # Custom Redis configuration
└── README.md     # This file
```

## Configuration Details

### Image
- **Base**: `redis:7-alpine`
- **Size**: ~30MB
- **Version**: Redis 7.x (latest stable)

### Persistence
Redis is configured with **dual persistence**:

1. **RDB (Redis Database)**: Point-in-time snapshots
   - Compact, fast to load
   - Saved every 1 hour (if ≥1 key changed)
   - Good for backups

2. **AOF (Append Only File)**: Write-ahead log
   - Logs every write operation
   - More durable (fsync every second)
   - Larger file size but safer

### Data Storage
Data persists in Docker volume: `optiforge_redis_data`

### Ports
- **Container**: 6379
- **Host**: 6379 (configurable in `.env`)

## Connection Information

### From Host Machine
```bash
# Using redis-cli
redis-cli -h localhost -p 6379

# Test connection
redis-cli ping
# Expected: PONG
```

### From Other Docker Containers
```bash
# Using service name
redis://redis:6379/0
```

### From Python (example)
```python
import redis

# Connect to Redis
client = redis.Redis(
    host="redis",  # Service name in Docker network
    port=6379,
    db=0,
    decode_responses=True
)

# Test connection
client.ping()  # Returns True

# Set and get data
client.set("key", "value")
print(client.get("key"))  # Returns "value"
```

## Redis Databases

Redis supports multiple logical databases (0-15 by default):
- **DB 0**: Default database (general caching)
- **DB 1**: Sessions
- **DB 2**: Celery broker (future)
- **DB 3**: Celery results (future)

Select database:
```bash
redis-cli -n 1  # Connect to DB 1
```

## Health Check

The container includes a health check that runs every 10 seconds:
```bash
redis-cli ping
```

Check health status:
```bash
docker compose ps redis
```

## Common Operations

### Access Redis CLI
```bash
docker compose exec redis redis-cli
```

### View all keys
```redis
KEYS *
```

### Check memory usage
```redis
INFO memory
```

### Monitor commands in real-time
```redis
MONITOR
```

### View statistics
```redis
INFO stats
```

### Check connected clients
```redis
CLIENT LIST
```

### Flush database (CAUTION!)
```redis
# Flush current database
FLUSHDB

# Flush all databases
FLUSHALL
```

## Common Use Cases

### Caching Database Queries
```python
import json
import redis

cache = redis.Redis(host="redis", port=6379)

# Cache query result
def get_user(user_id):
    # Check cache first
    cached = cache.get(f"user:{user_id}")
    if cached:
        return json.loads(cached)
    
    # Query database
    user = db.query(User).filter_by(id=user_id).first()
    
    # Store in cache (expire after 1 hour)
    cache.setex(
        f"user:{user_id}",
        3600,
        json.dumps(user)
    )
    
    return user
```

### Rate Limiting
```python
def check_rate_limit(user_id, max_requests=100, window=3600):
    key = f"rate_limit:{user_id}"
    current = cache.get(key)
    
    if current and int(current) >= max_requests:
        return False  # Rate limit exceeded
    
    # Increment counter
    pipe = cache.pipeline()
    pipe.incr(key)
    pipe.expire(key, window)
    pipe.execute()
    
    return True  # Request allowed
```

### Session Management
```python
def create_session(user_id, token):
    session_key = f"session:{token}"
    cache.setex(
        session_key,
        86400,  # 24 hours
        json.dumps({"user_id": user_id, "created_at": time.time()})
    )

def validate_session(token):
    session_key = f"session:{token}"
    session = cache.get(session_key)
    return json.loads(session) if session else None
```

## Performance Tuning

### Memory Management
```redis
# Check current memory usage
INFO memory

# Set max memory limit
CONFIG SET maxmemory 256mb

# Set eviction policy
CONFIG SET maxmemory-policy allkeys-lru
```

### Monitor Slow Queries
```redis
# View slow queries (>10ms)
SLOWLOG GET 10

# Reset slow log
SLOWLOG RESET
```

## Security Best Practices

1. **Use passwords**: Uncomment `requirepass` in redis.conf for production
2. **Network isolation**: Don't expose port 6379 to the internet
3. **Disable dangerous commands**: Rename or disable FLUSHDB, FLUSHALL, CONFIG
4. **Regular backups**: Backup RDB/AOF files periodically
5. **Monitor access**: Use `CLIENT LIST` to track connections

## Troubleshooting

### Container won't start
```bash
# Check logs
docker compose logs redis

# Common issues:
# - Port 6379 already in use
# - Invalid redis.conf syntax
# - Insufficient disk space for persistence
```

### Memory issues
```redis
# Check memory stats
INFO memory

# Find large keys
MEMORY USAGE key_name

# Sample keyspace
SCAN 0 COUNT 100
```

### Performance issues
```redis
# Check latency
INFO latency

# Monitor commands
MONITOR

# Check slow queries
SLOWLOG GET 20
```

### Data loss concerns
```redis
# Verify persistence
INFO persistence

# Manually trigger RDB save
SAVE

# Check last save time
LASTSAVE
```

## Backup and Restore

### Backup RDB file
```bash
# Copy RDB from container
docker compose exec redis redis-cli SAVE
docker cp optiforge_redis:/data/dump.rdb ./backup/dump.rdb
```

### Restore RDB file
```bash
# Stop Redis
docker compose stop redis

# Copy RDB to volume
docker cp ./backup/dump.rdb optiforge_redis:/data/dump.rdb

# Start Redis
docker compose start redis
```

## Additional Resources

- [Official Redis Documentation](https://redis.io/docs/)
- [Docker Hub: redis](https://hub.docker.com/_/redis)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [Redis Commands Reference](https://redis.io/commands/)
