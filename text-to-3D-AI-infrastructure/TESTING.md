# OptiForge3D - Infrastructure Testing Guide

This guide provides comprehensive testing procedures to verify that your infrastructure is working correctly.

---

## Quick Test (5 minutes)

```bash
# 1. Start infrastructure
docker compose up -d

# 2. Wait for services to initialize
sleep 30

# 3. Run automated verification
bash verify-infrastructure.sh  # Linux/macOS/Git Bash
.\verify-infrastructure.ps1    # Windows PowerShell

# 4. Expected result: All checks pass ✓
```

---

## Manual Testing

### Test 1: Container Status
**Purpose**: Verify all containers are running

```bash
# Check container status
docker compose ps

# Expected output:
# NAME                 STATUS
# optiforge_postgres   Up X minutes (healthy)
# optiforge_redis      Up X minutes (healthy)
# optiforge_minio      Up X minutes (healthy)
```

**Success Criteria**:
- ✓ All 3 containers show "Up"
- ✓ All 3 containers show "(healthy)"
- ✓ No containers show "Restarting" or "Exited"

---

### Test 2: PostgreSQL Connection
**Purpose**: Verify database is accessible and functional

```bash
# Test 1: pg_isready
docker compose exec postgres pg_isready -U optiforge_user -d optiforge_db

# Expected: 
# postgres:5432 - accepting connections

# Test 2: Connect to database
docker compose exec postgres psql -U optiforge_user -d optiforge_db

# Test 3: Run query
optiforge_db=# SELECT version();
optiforge_db=# SELECT * FROM system_health;
optiforge_db=# \dt
optiforge_db=# \q
```

**Success Criteria**:
- ✓ pg_isready returns "accepting connections"
- ✓ Can connect via psql
- ✓ Can run SELECT queries
- ✓ system_health table exists with initial data

---

### Test 3: PostgreSQL Extensions
**Purpose**: Verify required extensions are installed

```bash
docker compose exec postgres psql -U optiforge_user -d optiforge_db -c "SELECT extname, extversion FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto');"

# Expected output:
#   extname   | extversion
# ------------+------------
#  uuid-ossp  | 1.1
#  pgcrypto   | 1.3
```

**Test UUID generation**:
```bash
docker compose exec postgres psql -U optiforge_user -d optiforge_db -c "SELECT uuid_generate_v4();"

# Expected: Random UUID like 550e8400-e29b-41d4-a716-446655440000
```

**Success Criteria**:
- ✓ uuid-ossp extension installed
- ✓ pgcrypto extension installed
- ✓ UUID generation works

---

### Test 4: Redis Connection
**Purpose**: Verify Redis is accessible and functional

```bash
# Test 1: PING
docker compose exec redis redis-cli ping

# Expected: PONG

# Test 2: Set and get data
docker compose exec redis redis-cli set test_key "Hello OptiForge3D"
docker compose exec redis redis-cli get test_key

# Expected: "Hello OptiForge3D"

# Test 3: Check persistence
docker compose exec redis redis-cli config get appendonly

# Expected: 
# 1) "appendonly"
# 2) "yes"

# Clean up
docker compose exec redis redis-cli del test_key
```

**Success Criteria**:
- ✓ PING returns PONG
- ✓ Can set and get values
- ✓ AOF persistence is enabled

---

### Test 5: Redis Data Types
**Purpose**: Test various Redis data structures

```bash
docker compose exec redis redis-cli

# String
127.0.0.1:6379> SET user:1:name "John Doe"
127.0.0.1:6379> GET user:1:name

# Hash
127.0.0.1:6379> HSET user:1 email "john@example.com" age 30
127.0.0.1:6379> HGETALL user:1

# List
127.0.0.1:6379> LPUSH queue:jobs "job1" "job2" "job3"
127.0.0.1:6379> LRANGE queue:jobs 0 -1

# Set
127.0.0.1:6379> SADD tags "3d" "optimization" "rendering"
127.0.0.1:6379> SMEMBERS tags

# Sorted Set
127.0.0.1:6379> ZADD leaderboard 100 "user1" 200 "user2" 150 "user3"
127.0.0.1:6379> ZRANGE leaderboard 0 -1 WITHSCORES

# Clean up
127.0.0.1:6379> FLUSHDB
127.0.0.1:6379> exit
```

**Success Criteria**:
- ✓ All data types work correctly
- ✓ Commands return expected results

---

### Test 6: MinIO API Access
**Purpose**: Verify MinIO API is accessible

```bash
# Test 1: Health endpoint
curl -f http://localhost:9000/minio/health/live

# Expected: Empty response (200 OK)

# Test 2: List buckets (requires credentials)
docker compose exec minio mc ls local

# Expected:
# [DATE] raw-uploads
# [DATE] generated-models
```

**Success Criteria**:
- ✓ Health endpoint returns 200
- ✓ Buckets are listed
- ✓ Both buckets exist

---

### Test 7: MinIO Console Access
**Purpose**: Verify web console is accessible

```bash
# Test console endpoint
curl -f http://localhost:9001

# Expected: HTML response (200 OK)
```

**Manual Test**:
1. Open browser: http://localhost:9001
2. Login with credentials from `.env`:
   - Username: `MINIO_ROOT_USER`
   - Password: `MINIO_ROOT_PASSWORD`
3. Click "Buckets" in left menu
4. Verify buckets exist:
   - raw-uploads
   - generated-models

**Success Criteria**:
- ✓ Console loads in browser
- ✓ Can login successfully
- ✓ Buckets are visible
- ✓ Can navigate UI

---

### Test 8: MinIO File Operations
**Purpose**: Test upload/download functionality

```bash
# Enter MinIO container
docker compose exec minio sh

# Configure mc client
mc alias set local http://localhost:9000 ${MINIO_ROOT_USER} ${MINIO_ROOT_PASSWORD}

# Create test file
echo "Test 3D Model Data" > test.obj

# Upload file
mc cp test.obj local/raw-uploads/test/test.obj

# List files
mc ls local/raw-uploads/test/

# Download file
mc cp local/raw-uploads/test/test.obj downloaded.obj

# Compare files
cat test.obj
cat downloaded.obj

# Delete test file
mc rm local/raw-uploads/test/test.obj

# Exit container
rm test.obj downloaded.obj
exit
```

**Success Criteria**:
- ✓ File uploads successfully
- ✓ File is listed in bucket
- ✓ File downloads successfully
- ✓ Downloaded content matches uploaded content

---

### Test 9: Docker Network
**Purpose**: Verify network configuration

```bash
# Test 1: Network exists
docker network ls | grep optiforge_network

# Expected: optiforge_network listed

# Test 2: Inspect network
docker network inspect optiforge_network

# Expected: JSON with 3 containers connected

# Test 3: DNS resolution (from postgres to redis)
docker compose exec postgres ping -c 1 redis

# Expected: Successful ping

# Test 4: DNS resolution (from postgres to minio)
docker compose exec postgres ping -c 1 minio

# Expected: Successful ping
```

**Success Criteria**:
- ✓ Network exists
- ✓ All 3 containers are connected
- ✓ DNS resolution works between containers

---

### Test 10: Docker Volumes
**Purpose**: Verify persistent storage

```bash
# Test 1: List volumes
docker volume ls | grep optiforge

# Expected: 3 volumes listed
# optiforge_postgres_data
# optiforge_redis_data
# optiforge_minio_data

# Test 2: Inspect PostgreSQL volume
docker volume inspect optiforge_postgres_data

# Expected: JSON with volume details

# Test 3: Check volume sizes
docker system df -v | grep optiforge

# Expected: Volume sizes listed
```

**Success Criteria**:
- ✓ All 3 volumes exist
- ✓ Volumes have data (size > 0)

---

### Test 11: Data Persistence
**Purpose**: Verify data survives container restart

```bash
# Step 1: Create test data
docker compose exec postgres psql -U optiforge_user -d optiforge_db -c "CREATE TABLE test_persistence (id SERIAL PRIMARY KEY, value TEXT); INSERT INTO test_persistence (value) VALUES ('test_data');"

docker compose exec redis redis-cli set persistence_test "redis_data"

# Step 2: Restart containers
docker compose restart

# Wait for containers to be healthy
sleep 30
docker compose ps

# Step 3: Verify data still exists
docker compose exec postgres psql -U optiforge_user -d optiforge_db -c "SELECT * FROM test_persistence;"

# Expected: test_data row

docker compose exec redis redis-cli get persistence_test

# Expected: "redis_data"

# Step 4: Clean up
docker compose exec postgres psql -U optiforge_user -d optiforge_db -c "DROP TABLE test_persistence;"
docker compose exec redis redis-cli del persistence_test
```

**Success Criteria**:
- ✓ PostgreSQL data survives restart
- ✓ Redis data survives restart
- ✓ No data loss

---

### Test 12: Health Checks
**Purpose**: Verify health check functionality

```bash
# View health check configuration
docker inspect optiforge_postgres | grep -A 10 Healthcheck
docker inspect optiforge_redis | grep -A 10 Healthcheck
docker inspect optiforge_minio | grep -A 10 Healthcheck

# View health check history
docker inspect optiforge_postgres --format='{{json .State.Health}}' | python -m json.tool

# Monitor health checks in real-time
watch -n 1 'docker compose ps'
```

**Success Criteria**:
- ✓ Health checks are configured
- ✓ All services show "healthy"
- ✓ Health checks run periodically

---

### Test 13: Resource Usage
**Purpose**: Monitor resource consumption

```bash
# Real-time stats
docker stats --no-stream

# Expected output similar to:
# CONTAINER            CPU %   MEM USAGE / LIMIT    MEM %
# optiforge_postgres   0.50%   50MiB / 7.8GiB       0.64%
# optiforge_redis      0.20%   10MiB / 7.8GiB       0.13%
# optiforge_minio      1.00%   80MiB / 7.8GiB       1.03%

# Disk usage
docker system df

# Expected:
# TYPE           TOTAL    ACTIVE   SIZE      RECLAIMABLE
# Images         3        3        500MB     0B (0%)
# Containers     3        3        1MB       0B (0%)
# Local Volumes  3        3        200MB     0B (0%)
```

**Success Criteria**:
- ✓ CPU usage is low (<5% idle)
- ✓ Memory usage is reasonable (<500MB total idle)
- ✓ No memory leaks over time

---

### Test 14: Port Exposure
**Purpose**: Verify correct port mapping

```bash
# Check exposed ports
docker compose ps --format "table {{.Name}}\t{{.Ports}}"

# Expected:
# NAME                 PORTS
# optiforge_postgres   0.0.0.0:5432->5432/tcp
# optiforge_redis      0.0.0.0:6379->6379/tcp
# optiforge_minio      0.0.0.0:9000->9000/tcp, 0.0.0.0:9001->9001/tcp

# Test port connectivity from host
# Windows
Test-NetConnection -ComputerName localhost -Port 5432
Test-NetConnection -ComputerName localhost -Port 6379
Test-NetConnection -ComputerName localhost -Port 9000
Test-NetConnection -ComputerName localhost -Port 9001

# Linux/macOS
nc -zv localhost 5432
nc -zv localhost 6379
nc -zv localhost 9000
nc -zv localhost 9001
```

**Success Criteria**:
- ✓ All ports are mapped correctly
- ✓ Ports are accessible from host

---

## Integration Testing (From Application Perspective)

### Test 15: Python Client Integration
**Purpose**: Test from application code perspective

Create `test_integration.py`:
```python
#!/usr/bin/env python3
"""
Integration test for OptiForge3D infrastructure
Tests database, cache, and storage from application perspective
"""

import sys
import psycopg2
import redis
from minio import Minio
from datetime import datetime

def test_postgres():
    """Test PostgreSQL connection and operations"""
    print("Testing PostgreSQL...")
    try:
        conn = psycopg2.connect(
            host="localhost",
            port=5432,
            database="optiforge_db",
            user="optiforge_user",
            password="OptiForge_DB_P@ssw0rd_2024!"  # Use your actual password
        )
        cursor = conn.cursor()
        
        # Test query
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]
        print(f"  ✓ PostgreSQL version: {version[:50]}...")
        
        # Test insert
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS test_integration (
                id SERIAL PRIMARY KEY,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                data TEXT
            );
        """)
        cursor.execute("INSERT INTO test_integration (data) VALUES (%s);", ("test_data",))
        conn.commit()
        
        # Test select
        cursor.execute("SELECT COUNT(*) FROM test_integration;")
        count = cursor.fetchone()[0]
        print(f"  ✓ Can insert and query data (count: {count})")
        
        # Cleanup
        cursor.execute("DROP TABLE test_integration;")
        conn.commit()
        
        cursor.close()
        conn.close()
        print("  ✓ PostgreSQL test passed\n")
        return True
    except Exception as e:
        print(f"  ✗ PostgreSQL test failed: {e}\n")
        return False

def test_redis():
    """Test Redis connection and operations"""
    print("Testing Redis...")
    try:
        client = redis.Redis(
            host='localhost',
            port=6379,
            decode_responses=True
        )
        
        # Test ping
        if not client.ping():
            raise Exception("PING failed")
        print("  ✓ Redis PING successful")
        
        # Test string operations
        client.set('test:string', 'value')
        value = client.get('test:string')
        assert value == 'value'
        print("  ✓ String operations work")
        
        # Test hash operations
        client.hset('test:hash', mapping={'field1': 'value1', 'field2': 'value2'})
        hash_data = client.hgetall('test:hash')
        assert len(hash_data) == 2
        print("  ✓ Hash operations work")
        
        # Test expiration
        client.setex('test:expire', 10, 'expires_in_10s')
        ttl = client.ttl('test:expire')
        assert ttl > 0
        print(f"  ✓ Expiration works (TTL: {ttl}s)")
        
        # Cleanup
        client.delete('test:string', 'test:hash', 'test:expire')
        
        print("  ✓ Redis test passed\n")
        return True
    except Exception as e:
        print(f"  ✗ Redis test failed: {e}\n")
        return False

def test_minio():
    """Test MinIO connection and operations"""
    print("Testing MinIO...")
    try:
        client = Minio(
            "localhost:9000",
            access_key="minioadmin",
            secret_key="OptiForge_MinIO_P@ssw0rd_2024!",  # Use your actual password
            secure=False
        )
        
        # Test bucket listing
        buckets = [bucket.name for bucket in client.list_buckets()]
        print(f"  ✓ Found buckets: {', '.join(buckets)}")
        
        # Verify required buckets exist
        required_buckets = ['raw-uploads', 'generated-models']
        for bucket in required_buckets:
            if bucket not in buckets:
                raise Exception(f"Required bucket '{bucket}' not found")
        print("  ✓ Required buckets exist")
        
        # Test file upload
        test_data = f"Test file created at {datetime.now()}"
        test_file = "test_file.txt"
        
        # Write test file
        with open(test_file, 'w') as f:
            f.write(test_data)
        
        # Upload
        client.fput_object(
            "raw-uploads",
            "test/integration_test.txt",
            test_file
        )
        print("  ✓ File upload successful")
        
        # List objects
        objects = list(client.list_objects("raw-uploads", prefix="test/"))
        assert len(objects) > 0
        print(f"  ✓ Can list objects (found {len(objects)})")
        
        # Download
        client.fget_object(
            "raw-uploads",
            "test/integration_test.txt",
            "downloaded_test.txt"
        )
        print("  ✓ File download successful")
        
        # Verify content
        with open("downloaded_test.txt", 'r') as f:
            downloaded_data = f.read()
        assert downloaded_data == test_data
        print("  ✓ Downloaded content matches uploaded content")
        
        # Cleanup
        client.remove_object("raw-uploads", "test/integration_test.txt")
        import os
        os.remove(test_file)
        os.remove("downloaded_test.txt")
        
        print("  ✓ MinIO test passed\n")
        return True
    except Exception as e:
        print(f"  ✗ MinIO test failed: {e}\n")
        return False

def main():
    print("=" * 60)
    print("OptiForge3D Infrastructure Integration Tests")
    print("=" * 60)
    print()
    
    results = {
        'PostgreSQL': test_postgres(),
        'Redis': test_redis(),
        'MinIO': test_minio()
    }
    
    print("=" * 60)
    print("Test Summary")
    print("=" * 60)
    for service, passed in results.items():
        status = "✓ PASSED" if passed else "✗ FAILED"
        print(f"{service:20s} {status}")
    print()
    
    all_passed = all(results.values())
    if all_passed:
        print("✓ All integration tests passed!")
        sys.exit(0)
    else:
        print("✗ Some tests failed. Please check the errors above.")
        sys.exit(1)

if __name__ == '__main__':
    main()
```

**Run the test**:
```bash
# Install dependencies
pip install psycopg2-binary redis minio

# Run test
python test_integration.py
```

**Success Criteria**:
- ✓ All three services pass
- ✓ Can perform CRUD operations
- ✓ Data consistency verified

---

## Performance Testing

### Test 16: PostgreSQL Performance
```bash
# Test connection time
time docker compose exec postgres psql -U optiforge_user -d optiforge_db -c "SELECT 1;"

# Expected: < 1 second

# Test query performance
docker compose exec postgres psql -U optiforge_user -d optiforge_db -c "EXPLAIN ANALYZE SELECT * FROM system_health;"
```

### Test 17: Redis Performance
```bash
# Benchmark Redis
docker compose exec redis redis-benchmark -q -n 10000 -c 10

# Expected output shows operations per second for various commands
# SET: >10,000 ops/sec
# GET: >10,000 ops/sec
```

### Test 18: MinIO Performance
```bash
# Upload speed test (create 10MB file)
dd if=/dev/zero of=test_10mb.bin bs=1M count=10

time docker compose exec -T minio mc cp - local/raw-uploads/test/test_10mb.bin < test_10mb.bin

# Download speed test
time docker compose exec minio mc cp local/raw-uploads/test/test_10mb.bin /dev/null

# Cleanup
rm test_10mb.bin
docker compose exec minio mc rm local/raw-uploads/test/test_10mb.bin
```

---

## Stress Testing

### Test 19: Concurrent Connections
```bash
# PostgreSQL - Multiple concurrent connections
for i in {1..10}; do
  docker compose exec postgres psql -U optiforge_user -d optiforge_db -c "SELECT pg_sleep(1);" &
done
wait

# Redis - Multiple concurrent commands
for i in {1..100}; do
  docker compose exec redis redis-cli set key$i value$i &
done
wait

docker compose exec redis redis-cli DBSIZE
docker compose exec redis redis-cli FLUSHDB
```

---

## Failure Testing

### Test 20: Container Recovery
```bash
# Test auto-restart
echo "Stopping PostgreSQL container..."
docker stop optiforge_postgres

echo "Waiting 10 seconds..."
sleep 10

echo "Checking if container restarted..."
docker compose ps postgres

# Expected: Container should be "Up" again

# Verify data integrity
docker compose exec postgres psql -U optiforge_user -d optiforge_db -c "SELECT * FROM system_health;"
```

### Test 21: Volume Persistence After Container Removal
```bash
# Create test data
docker compose exec postgres psql -U optiforge_user -d optiforge_db -c "INSERT INTO system_health (service_name, status, message) VALUES ('test_service', 'testing', 'persistence_test');"

# Remove and recreate container
docker compose down
docker compose up -d

# Wait for initialization
sleep 30

# Verify data persists
docker compose exec postgres psql -U optiforge_user -d optiforge_db -c "SELECT * FROM system_health WHERE service_name='test_service';"

# Expected: test_service row still exists
```

---

## Security Testing

### Test 22: Password Protection
```bash
# Test PostgreSQL requires password
docker compose exec postgres psql -U optiforge_user -d optiforge_db -w -c "SELECT 1;" 2>&1 | grep -i "password"

# Expected: Should fail without password

# Test MinIO requires credentials
curl http://localhost:9000 -I

# Expected: Should require authentication
```

### Test 23: Network Isolation
```bash
# Verify containers can't access external networks directly (if internal: true)
# This test applies when network is set to internal mode

docker compose exec postgres ping -c 1 google.com

# In production with internal: true, this should fail
# In development (current setup), this will succeed
```

---

## Documentation

### Test 24: README Verification
```bash
# Verify all documented commands work
# Go through QUICK_REFERENCE.md and test each command

# Example commands to verify:
docker compose ps
docker compose logs postgres --tail=10
docker volume ls | grep optiforge
docker network inspect optiforge_network
```

---

## Automated Test Suite

Create `run_all_tests.sh`:
```bash
#!/bin/bash
set -e

echo "======================================"
echo "OptiForge3D Complete Test Suite"
echo "======================================"
echo ""

# Run verification script
echo "Running automated verification..."
bash verify-infrastructure.sh

echo ""
echo "Running integration tests..."
python3 test_integration.py

echo ""
echo "======================================"
echo "All tests completed successfully!"
echo "======================================"
```

Make it executable and run:
```bash
chmod +x run_all_tests.sh
./run_all_tests.sh
```

---

## Test Checklist

Use this checklist to track your testing:

- [ ] Container status (Test 1)
- [ ] PostgreSQL connection (Test 2)
- [ ] PostgreSQL extensions (Test 3)
- [ ] Redis connection (Test 4)
- [ ] Redis data types (Test 5)
- [ ] MinIO API access (Test 6)
- [ ] MinIO console access (Test 7)
- [ ] MinIO file operations (Test 8)
- [ ] Docker network (Test 9)
- [ ] Docker volumes (Test 10)
- [ ] Data persistence (Test 11)
- [ ] Health checks (Test 12)
- [ ] Resource usage (Test 13)
- [ ] Port exposure (Test 14)
- [ ] Python integration (Test 15)
- [ ] Performance testing (Tests 16-18)
- [ ] Stress testing (Test 19)
- [ ] Failure recovery (Tests 20-21)
- [ ] Security (Tests 22-23)

---

**All tests passing? Your infrastructure is production-ready! 🎉**
