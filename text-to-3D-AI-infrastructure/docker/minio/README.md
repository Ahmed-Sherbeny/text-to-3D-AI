# MinIO Object Storage Configuration

## Overview
MinIO is an S3-compatible object storage system used for storing 3D model files in OptiForge3D.

## Why MinIO Instead of Local Filesystem?

### 1. **S3 API Compatibility**
- Use the same code for development (MinIO) and production (AWS S3, Azure Blob, GCS)
- No code changes when migrating to cloud storage
- Industry-standard API with extensive client libraries

### 2. **Better File Management**
- Built-in metadata support (content type, custom headers)
- Object versioning (keep file history)
- Lifecycle policies (auto-delete old files)
- Multipart uploads (handle large files efficiently)

### 3. **Scalability**
- Designed for large files (3D models can be 100MB+)
- Better performance than filesystem for many files
- Can scale to distributed storage later

### 4. **Access Control**
- Bucket-level permissions
- Presigned URLs (temporary access without credentials)
- IAM policies (fine-grained access control)

### 5. **Web Management**
- Built-in web console for browsing files
- No need for SSH/FTP access
- Easy debugging and manual operations

## Directory Structure
```
minio/
├── init/
│   └── create-buckets.sh    # Auto-creates buckets on startup
└── README.md                # This file
```

## Configuration Details

### Image
- **Base**: `minio/minio:latest`
- **Size**: ~260MB
- **Version**: Latest stable release

### Ports
- **9000**: S3 API endpoint (for programmatic access)
- **9001**: Web console (for administration)

### Storage Location
Data persists in Docker volume: `optiforge_minio_data`

## Bucket Configuration

### Bucket 1: `raw-uploads`
**Purpose**: Store user-uploaded 3D model files before processing

**Contents**:
- Original uploaded files
- File formats: .obj, .fbx, .stl, .glb, .gltf, .blend, .dae, .3ds
- Typical size: 1MB - 500MB per file
- Naming convention: `{user_id}/{upload_id}/{filename}`

**Access**: Private (only backend can read/write)

**Lifecycle**: 
- Retain for 90 days after successful processing
- Auto-delete after retention period
- Keep failed uploads for 30 days for debugging

**Versioning**: Enabled (track file overwrites)

---

### Bucket 2: `generated-models`
**Purpose**: Store optimized 3D model outputs after processing

**Contents**:
- Processed/optimized models
- Multiple LOD (Level of Detail) versions
- Compressed formats
- Typical size: 100KB - 50MB per file
- Naming convention: `{user_id}/{job_id}/{output_type}/{filename}`

**Access**: Private with presigned URL generation

**Lifecycle**:
- Permanent storage (user's final outputs)
- No auto-deletion
- Manual cleanup by user request only

**Versioning**: Enabled (keep processing iterations)

---

### Future Buckets (Optional)

**Bucket 3: `thumbnails`** (for preview images)
- PNG/JPEG preview renders
- Public read access
- Small files (<1MB)

**Bucket 4: `temp-processing`** (for intermediate files)
- Temporary files during optimization
- Auto-delete after 24 hours
- No versioning needed

## Web Console Access

### Accessing the Console
1. Open browser: http://localhost:9001
2. Login with credentials from `.env`:
   - Username: `MINIO_ROOT_USER`
   - Password: `MINIO_ROOT_PASSWORD`

### Console Features
- Browse buckets and objects
- Upload/download files manually
- View object metadata
- Generate presigned URLs
- Monitor storage usage
- View access logs

## API Access

### Connection Information

**From Host Machine**:
```
Endpoint: http://localhost:9000
Access Key: (see .env MINIO_ROOT_USER)
Secret Key: (see .env MINIO_ROOT_PASSWORD)
```

**From Other Docker Containers**:
```
Endpoint: http://minio:9000
Access Key: (see .env MINIO_ROOT_USER)
Secret Key: (see .env MINIO_ROOT_PASSWORD)
```

### Python Client Example
```python
from minio import Minio
from minio.error import S3Error

# Initialize MinIO client
client = Minio(
    "minio:9000",  # Service name in Docker network
    access_key="minioadmin",
    secret_key="your_password",
    secure=False  # Use True for HTTPS in production
)

# Upload file
client.fput_object(
    "raw-uploads",
    "user123/upload456/model.obj",
    "/path/to/local/model.obj",
    content_type="application/octet-stream"
)

# Download file
client.fget_object(
    "raw-uploads",
    "user123/upload456/model.obj",
    "/path/to/save/model.obj"
)

# Generate presigned URL (valid for 7 days)
url = client.presigned_get_object(
    "generated-models",
    "user123/job789/optimized_model.glb",
    expires=timedelta(days=7)
)
print(f"Download URL: {url}")

# List objects in bucket
objects = client.list_objects("raw-uploads", prefix="user123/")
for obj in objects:
    print(obj.object_name, obj.size, obj.last_modified)
```

### AWS SDK (Boto3) Example
```python
import boto3

# MinIO is S3-compatible, so use boto3
s3_client = boto3.client(
    's3',
    endpoint_url='http://minio:9000',
    aws_access_key_id='minioadmin',
    aws_secret_access_key='your_password'
)

# Upload file
s3_client.upload_file(
    '/path/to/local/model.obj',
    'raw-uploads',
    'user123/upload456/model.obj'
)

# Download file
s3_client.download_file(
    'raw-uploads',
    'user123/upload456/model.obj',
    '/path/to/save/model.obj'
)

# Generate presigned URL
url = s3_client.generate_presigned_url(
    'get_object',
    Params={'Bucket': 'generated-models', 'Key': 'user123/job789/model.glb'},
    ExpiresIn=604800  # 7 days
)
```

## Common Operations

### Using MinIO Client (mc)

#### Access MinIO CLI
```bash
# Enter MinIO container
docker compose exec minio sh

# MinIO client (mc) is pre-installed
mc --help
```

#### Configure alias (one-time setup)
```bash
mc alias set local http://localhost:9000 minioadmin your_password
```

#### List buckets
```bash
mc ls local
```

#### List objects in bucket
```bash
mc ls local/raw-uploads
mc ls local/raw-uploads/user123/
```

#### Upload file
```bash
mc cp /local/path/model.obj local/raw-uploads/user123/model.obj
```

#### Download file
```bash
mc cp local/raw-uploads/user123/model.obj /local/path/
```

#### Delete object
```bash
mc rm local/raw-uploads/user123/model.obj
```

#### Get object info
```bash
mc stat local/raw-uploads/user123/model.obj
```

#### Mirror directory to bucket
```bash
mc mirror /local/directory local/raw-uploads/user123/
```

## Health Check

The container includes a health check:
```bash
curl -f http://localhost:9000/minio/health/live
```

Check health status:
```bash
docker compose ps minio
```

## Storage Management

### Check storage usage
```bash
# From MinIO console
mc admin info local

# From web console
# Navigate to: Buckets → Click bucket → Usage tab
```

### Bucket statistics
```bash
mc du local/raw-uploads
```

### Set bucket quota (optional)
```bash
# Limit bucket to 100GB
mc admin bucket quota local/raw-uploads --hard 100GB
```

## Backup and Restore

### Backup bucket
```bash
# Mirror bucket to local directory
mc mirror local/raw-uploads /backup/raw-uploads

# Create tar archive
tar -czf minio-backup.tar.gz /backup/raw-uploads
```

### Restore bucket
```bash
# Extract backup
tar -xzf minio-backup.tar.gz -C /restore

# Mirror to MinIO
mc mirror /restore/raw-uploads local/raw-uploads
```

### Export bucket policy
```bash
mc admin policy list local
mc admin policy info local policy-name > policy-backup.json
```

## Security Best Practices

1. **Change default credentials**: Never use minioadmin/minioadmin in production
2. **Use strong passwords**: 16+ characters with mixed case, numbers, symbols
3. **Don't expose ports**: Use reverse proxy (nginx) in production
4. **Enable HTTPS**: Use TLS certificates for encrypted communication
5. **Bucket policies**: Use least privilege access
6. **Access logs**: Enable audit logging for compliance
7. **Presigned URLs**: Use short expiration times (hours, not days)
8. **Network isolation**: Keep MinIO on private Docker network

## Troubleshooting

### Container won't start
```bash
# Check logs
docker compose logs minio

# Common issues:
# - Ports 9000/9001 already in use
# - Invalid credentials in .env
# - Insufficient disk space
```

### Buckets not created
```bash
# Check if init script ran
docker compose logs minio | grep "Bucket"

# Manually create buckets
docker compose exec minio sh
mc alias set local http://localhost:9000 minioadmin your_password
mc mb local/raw-uploads
mc mb local/generated-models
```

### Can't access console
```bash
# Verify MinIO is running
docker compose ps minio

# Check browser URL
# Should be: http://localhost:9001 (not 9000)

# Check firewall settings
```

### Upload fails
```bash
# Check disk space
docker system df

# Check bucket exists
mc ls local

# Verify credentials
mc admin info local
```

### Slow performance
- Check Docker resource allocation (CPU/memory)
- Monitor disk I/O
- Consider using SSDs for Docker volumes
- Increase MinIO memory limit if needed

## Additional Resources

- [Official MinIO Documentation](https://min.io/docs/minio/linux/index.html)
- [MinIO Python SDK](https://min.io/docs/minio/linux/developers/python/minio-py.html)
- [MinIO Client Guide](https://min.io/docs/minio/linux/reference/minio-mc.html)
- [S3 API Compatibility](https://min.io/docs/minio/linux/operations/concepts/s3-compatibility.html)
