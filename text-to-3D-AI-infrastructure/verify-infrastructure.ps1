# ==============================================================================
# OptiForge3D Infrastructure Verification Script (PowerShell)
# ==============================================================================
# This script verifies that all infrastructure components are running correctly
# Usage: .\verify-infrastructure.ps1
# ==============================================================================

$ErrorActionPreference = "Continue"

Write-Host "==================================" -ForegroundColor Blue
Write-Host "OptiForge3D Infrastructure Verification" -ForegroundColor Blue
Write-Host "==================================" -ForegroundColor Blue
Write-Host ""

# Counters
$script:Passed = 0
$script:Failed = 0

# ==============================================================================
# Helper Functions
# ==============================================================================

function Print-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
    $script:Passed++
}

function Print-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
    $script:Failed++
}

function Print-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Cyan
}

function Print-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

# ==============================================================================
# 1. Docker & Docker Compose Verification
# ==============================================================================
Write-Host "1. Checking Docker installation..."
Write-Host "-----------------------------------"

try {
    $dockerVersion = docker --version
    Print-Success "Docker is installed: $dockerVersion"
} catch {
    Print-Error "Docker is not installed"
    exit 1
}

try {
    $composeVersion = docker compose version
    Print-Success "Docker Compose is installed: $composeVersion"
} catch {
    Print-Error "Docker Compose is not installed"
    exit 1
}

Write-Host ""

# ==============================================================================
# 2. Container Status Verification
# ==============================================================================
Write-Host "2. Checking container status..."
Write-Host "--------------------------------"

$containers = @("optiforge_postgres", "optiforge_redis", "optiforge_minio")

foreach ($container in $containers) {
    $running = docker ps --format "{{.Names}}" | Select-String -Pattern "^$container$" -Quiet
    if ($running) {
        Print-Success "Container '$container' is running"
    } else {
        Print-Error "Container '$container' is not running"
    }
}

Write-Host ""

# ==============================================================================
# 3. Health Check Verification
# ==============================================================================
Write-Host "3. Checking service health..."
Write-Host "------------------------------"

foreach ($container in $containers) {
    $status = docker ps --filter "name=$container" --format "{{.Status}}"
    if ($status -match "healthy") {
        Print-Success "Container '$container' is healthy"
    } else {
        Print-Warning "Container '$container' status: $status"
    }
}

Write-Host ""

# ==============================================================================
# 4. Network Verification
# ==============================================================================
Write-Host "4. Checking Docker network..."
Write-Host "------------------------------"

$networkExists = docker network ls | Select-String -Pattern "optiforge_network" -Quiet
if ($networkExists) {
    Print-Success "Network 'optiforge_network' exists"
    
    $connected = (docker network inspect optiforge_network -f '{{range .Containers}}{{.Name}} {{end}}').Split(' ').Length
    Print-Info "Connected containers: $connected"
} else {
    Print-Error "Network 'optiforge_network' does not exist"
}

Write-Host ""

# ==============================================================================
# 5. Volume Verification
# ==============================================================================
Write-Host "5. Checking Docker volumes..."
Write-Host "------------------------------"

$volumes = @("optiforge_postgres_data", "optiforge_redis_data", "optiforge_minio_data")

foreach ($volume in $volumes) {
    $exists = docker volume ls | Select-String -Pattern $volume -Quiet
    if ($exists) {
        Print-Success "Volume '$volume' exists"
    } else {
        Print-Error "Volume '$volume' does not exist"
    }
}

Write-Host ""

# ==============================================================================
# 6. Port Verification
# ==============================================================================
Write-Host "6. Checking port exposure..."
Write-Host "-----------------------------"

$ports = @(
    @{Port=5432; Name="PostgreSQL"},
    @{Port=6379; Name="Redis"},
    @{Port=9000; Name="MinIO API"},
    @{Port=9001; Name="MinIO Console"}
)

foreach ($portInfo in $ports) {
    $exposed = docker ps --format "{{.Ports}}" | Select-String -Pattern "0.0.0.0:$($portInfo.Port)" -Quiet
    if ($exposed) {
        Print-Success "$($portInfo.Name) is exposed on port $($portInfo.Port)"
    } else {
        Print-Error "$($portInfo.Name) is not exposed on port $($portInfo.Port)"
    }
}

Write-Host ""

# ==============================================================================
# 7. PostgreSQL Connection Test
# ==============================================================================
Write-Host "7. Testing PostgreSQL connection..."
Write-Host "------------------------------------"

try {
    $pgReady = docker exec optiforge_postgres pg_isready -U optiforge_user -d optiforge_db 2>$null
    if ($LASTEXITCODE -eq 0) {
        Print-Success "PostgreSQL is accepting connections"
        
        # Test database query
        $result = docker exec optiforge_postgres psql -U optiforge_user -d optiforge_db -t -c "SELECT 1;" 2>$null
        if ($result -match "1") {
            Print-Success "PostgreSQL query test passed"
        } else {
            Print-Error "PostgreSQL query test failed"
        }
        
        # Check extensions
        $extensions = docker exec optiforge_postgres psql -U optiforge_user -d optiforge_db -t -c "SELECT COUNT(*) FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto');" 2>$null
        if ($extensions -match "2") {
            Print-Success "PostgreSQL extensions installed (uuid-ossp, pgcrypto)"
        } else {
            Print-Warning "PostgreSQL extensions may not be fully installed"
        }
    } else {
        Print-Error "PostgreSQL is not accepting connections"
    }
} catch {
    Print-Error "Failed to connect to PostgreSQL"
}

Write-Host ""

# ==============================================================================
# 8. Redis Connection Test
# ==============================================================================
Write-Host "8. Testing Redis connection..."
Write-Host "-------------------------------"

try {
    $redisPing = docker exec optiforge_redis redis-cli ping 2>$null
    if ($redisPing -eq "PONG") {
        Print-Success "Redis is responding to PING"
        
        # Test write/read
        docker exec optiforge_redis redis-cli set test_key "test_value" 2>$null | Out-Null
        $redisGet = docker exec optiforge_redis redis-cli get test_key 2>$null
        docker exec optiforge_redis redis-cli del test_key 2>$null | Out-Null
        
        if ($redisGet -eq "test_value") {
            Print-Success "Redis read/write test passed"
        } else {
            Print-Error "Redis read/write test failed"
        }
        
        # Check persistence
        $appendonly = docker exec optiforge_redis redis-cli config get appendonly 2>$null
        if ($appendonly -match "yes") {
            Print-Success "Redis AOF persistence is enabled"
        } else {
            Print-Warning "Redis AOF persistence is disabled"
        }
    } else {
        Print-Error "Redis is not responding"
    }
} catch {
    Print-Error "Failed to connect to Redis"
}

Write-Host ""

# ==============================================================================
# 9. MinIO Connection Test
# ==============================================================================
Write-Host "9. Testing MinIO connection..."
Write-Host "-------------------------------"

try {
    $minioApi = Invoke-WebRequest -Uri "http://localhost:9000/minio/health/live" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($minioApi.StatusCode -eq 200) {
        Print-Success "MinIO API is responding"
    } else {
        Print-Error "MinIO API is not responding"
    }
} catch {
    Print-Error "MinIO API is not accessible"
}

try {
    $minioConsole = Invoke-WebRequest -Uri "http://localhost:9001" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($minioConsole.StatusCode -eq 200 -or $minioConsole.StatusCode -eq 403) {
        Print-Success "MinIO Console is accessible"
    } else {
        Print-Error "MinIO Console is not accessible"
    }
} catch {
    Print-Error "MinIO Console is not accessible"
}

# Check buckets
try {
    $buckets = docker exec optiforge_minio mc ls local 2>$null
    if ($buckets) {
        $bucketCount = ($buckets -split "`n").Count
        Print-Success "MinIO buckets created ($bucketCount found)"
        foreach ($bucket in ($buckets -split "`n")) {
            if ($bucket) {
                Print-Info "  $bucket"
            }
        }
    } else {
        Print-Warning "MinIO buckets may not be created yet"
    }
} catch {
    Print-Warning "Could not check MinIO buckets"
}

Write-Host ""

# ==============================================================================
# 10. Resource Usage
# ==============================================================================
Write-Host "10. Checking resource usage..."
Write-Host "-------------------------------"

docker stats --no-stream --format "table {{.Container}}`t{{.CPUPerc}}`t{{.MemUsage}}" | Select-String "optiforge"

Write-Host ""

# ==============================================================================
# Summary
# ==============================================================================
Write-Host "==================================" -ForegroundColor Blue
Write-Host "Verification Summary" -ForegroundColor Blue
Write-Host "==================================" -ForegroundColor Blue
Write-Host ""
Write-Host "Passed: $script:Passed checks" -ForegroundColor Green
Write-Host "Failed: $script:Failed checks" -ForegroundColor Red
Write-Host ""

if ($script:Failed -eq 0) {
    Write-Host "✓ All checks passed! Infrastructure is ready." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "  1. Access PostgreSQL: docker compose exec postgres psql -U optiforge_user -d optiforge_db"
    Write-Host "  2. Access Redis: docker compose exec redis redis-cli"
    Write-Host "  3. Access MinIO Console: http://localhost:9001"
    Write-Host ""
    exit 0
} else {
    Write-Host "✗ Some checks failed. Please review errors above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:"
    Write-Host "  - Check logs: docker compose logs"
    Write-Host "  - Restart services: docker compose restart"
    Write-Host "  - Rebuild: docker compose down; docker compose up -d"
    Write-Host ""
    exit 1
}
