#!/bin/bash
# ==============================================================================
# OptiForge3D Infrastructure Verification Script
# ==============================================================================
# This script verifies that all infrastructure components are running correctly
# Usage: bash verify-infrastructure.sh
# ==============================================================================

set -e  # Exit on error

echo "=================================="
echo "OptiForge3D Infrastructure Verification"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# ==============================================================================
# Helper Functions
# ==============================================================================

print_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

print_error() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# ==============================================================================
# 1. Docker & Docker Compose Verification
# ==============================================================================
echo "1. Checking Docker installation..."
echo "-----------------------------------"

if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    print_success "Docker is installed: $DOCKER_VERSION"
else
    print_error "Docker is not installed"
    exit 1
fi

if docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version)
    print_success "Docker Compose is installed: $COMPOSE_VERSION"
else
    print_error "Docker Compose is not installed"
    exit 1
fi

echo ""

# ==============================================================================
# 2. Container Status Verification
# ==============================================================================
echo "2. Checking container status..."
echo "--------------------------------"

# Check if containers are running
CONTAINERS=("optiforge_postgres" "optiforge_redis" "optiforge_minio")

for container in "${CONTAINERS[@]}"; do
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        print_success "Container '$container' is running"
    else
        print_error "Container '$container' is not running"
    fi
done

echo ""

# ==============================================================================
# 3. Health Check Verification
# ==============================================================================
echo "3. Checking service health..."
echo "------------------------------"

for container in "${CONTAINERS[@]}"; do
    if docker ps --filter "name=$container" --format '{{.Status}}' | grep -q "healthy"; then
        print_success "Container '$container' is healthy"
    else
        STATUS=$(docker ps --filter "name=$container" --format '{{.Status}}')
        print_warning "Container '$container' status: $STATUS"
    fi
done

echo ""

# ==============================================================================
# 4. Network Verification
# ==============================================================================
echo "4. Checking Docker network..."
echo "------------------------------"

if docker network ls | grep -q "optiforge_network"; then
    print_success "Network 'optiforge_network' exists"
    
    # Count connected containers
    CONNECTED=$(docker network inspect optiforge_network -f '{{range .Containers}}{{.Name}} {{end}}' | wc -w)
    print_info "Connected containers: $CONNECTED"
else
    print_error "Network 'optiforge_network' does not exist"
fi

echo ""

# ==============================================================================
# 5. Volume Verification
# ==============================================================================
echo "5. Checking Docker volumes..."
echo "------------------------------"

VOLUMES=("optiforge_postgres_data" "optiforge_redis_data" "optiforge_minio_data")

for volume in "${VOLUMES[@]}"; do
    if docker volume ls | grep -q "$volume"; then
        SIZE=$(docker system df -v | grep "$volume" | awk '{print $3}')
        print_success "Volume '$volume' exists (Size: $SIZE)"
    else
        print_error "Volume '$volume' does not exist"
    fi
done

echo ""

# ==============================================================================
# 6. Port Verification
# ==============================================================================
echo "6. Checking port exposure..."
echo "-----------------------------"

PORTS=(5432 6379 9000 9001)
PORT_NAMES=("PostgreSQL" "Redis" "MinIO API" "MinIO Console")

for i in "${!PORTS[@]}"; do
    PORT="${PORTS[$i]}"
    NAME="${PORT_NAMES[$i]}"
    
    if docker ps --format '{{.Ports}}' | grep -q "0.0.0.0:$PORT"; then
        print_success "$NAME is exposed on port $PORT"
    else
        print_error "$NAME is not exposed on port $PORT"
    fi
done

echo ""

# ==============================================================================
# 7. PostgreSQL Connection Test
# ==============================================================================
echo "7. Testing PostgreSQL connection..."
echo "------------------------------------"

if docker exec optiforge_postgres pg_isready -U optiforge_user -d optiforge_db &> /dev/null; then
    print_success "PostgreSQL is accepting connections"
    
    # Test database query
    RESULT=$(docker exec optiforge_postgres psql -U optiforge_user -d optiforge_db -t -c "SELECT 1;" 2>/dev/null | tr -d '[:space:]')
    if [ "$RESULT" == "1" ]; then
        print_success "PostgreSQL query test passed"
    else
        print_error "PostgreSQL query test failed"
    fi
    
    # Check extensions
    EXTENSIONS=$(docker exec optiforge_postgres psql -U optiforge_user -d optiforge_db -t -c "SELECT COUNT(*) FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto');" 2>/dev/null | tr -d '[:space:]')
    if [ "$EXTENSIONS" == "2" ]; then
        print_success "PostgreSQL extensions installed (uuid-ossp, pgcrypto)"
    else
        print_warning "PostgreSQL extensions may not be fully installed"
    fi
else
    print_error "PostgreSQL is not accepting connections"
fi

echo ""

# ==============================================================================
# 8. Redis Connection Test
# ==============================================================================
echo "8. Testing Redis connection..."
echo "-------------------------------"

REDIS_PING=$(docker exec optiforge_redis redis-cli ping 2>/dev/null)
if [ "$REDIS_PING" == "PONG" ]; then
    print_success "Redis is responding to PING"
    
    # Test write/read
    docker exec optiforge_redis redis-cli set test_key "test_value" &> /dev/null
    REDIS_GET=$(docker exec optiforge_redis redis-cli get test_key 2>/dev/null)
    docker exec optiforge_redis redis-cli del test_key &> /dev/null
    
    if [ "$REDIS_GET" == "test_value" ]; then
        print_success "Redis read/write test passed"
    else
        print_error "Redis read/write test failed"
    fi
    
    # Check persistence
    if docker exec optiforge_redis redis-cli config get appendonly 2>/dev/null | grep -q "yes"; then
        print_success "Redis AOF persistence is enabled"
    else
        print_warning "Redis AOF persistence is disabled"
    fi
else
    print_error "Redis is not responding"
fi

echo ""

# ==============================================================================
# 9. MinIO Connection Test
# ==============================================================================
echo "9. Testing MinIO connection..."
echo "-------------------------------"

if curl -sf http://localhost:9000/minio/health/live > /dev/null 2>&1; then
    print_success "MinIO API is responding"
else
    print_error "MinIO API is not responding"
fi

if curl -sf http://localhost:9001 > /dev/null 2>&1; then
    print_success "MinIO Console is accessible"
else
    print_error "MinIO Console is not accessible"
fi

# Check buckets (requires mc client in container)
BUCKETS=$(docker exec optiforge_minio mc ls local 2>/dev/null | wc -l)
if [ "$BUCKETS" -ge 2 ]; then
    print_success "MinIO buckets created ($BUCKETS found)"
    docker exec optiforge_minio mc ls local 2>/dev/null | while read -r line; do
        print_info "  $line"
    done
else
    print_warning "MinIO buckets may not be created yet (found: $BUCKETS)"
fi

echo ""

# ==============================================================================
# 10. Resource Usage
# ==============================================================================
echo "10. Checking resource usage..."
echo "-------------------------------"

docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep optiforge

echo ""

# ==============================================================================
# Summary
# ==============================================================================
echo "=================================="
echo "Verification Summary"
echo "=================================="
echo ""
echo -e "${GREEN}Passed:${NC} $PASSED checks"
echo -e "${RED}Failed:${NC} $FAILED checks"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Infrastructure is ready.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Access PostgreSQL: docker compose exec postgres psql -U optiforge_user -d optiforge_db"
    echo "  2. Access Redis: docker compose exec redis redis-cli"
    echo "  3. Access MinIO Console: http://localhost:9001"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please review errors above.${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  - Check logs: docker compose logs"
    echo "  - Restart services: docker compose restart"
    echo "  - Rebuild: docker compose down && docker compose up -d"
    echo ""
    exit 1
fi
