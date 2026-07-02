#!/bin/sh
# ==============================================================================
# OptiForge3D - MinIO Bucket Initialization Script
# ==============================================================================
# This script automatically creates required S3 buckets when MinIO starts
# It runs once during container initialization
# ==============================================================================

# Wait for MinIO to be ready
echo "Waiting for MinIO to be ready..."
sleep 10

# Configure MinIO client to connect to local MinIO instance
mc alias set local http://localhost:9000 ${MINIO_ROOT_USER} ${MINIO_ROOT_PASSWORD}

# ==============================================================================
# Create Buckets
# ==============================================================================

# Bucket 1: raw-uploads
# Purpose: Store user-uploaded 3D model files before processing
# Contents: Original files (.obj, .fbx, .stl, .glb, .gltf, .blend, etc.)
# Access: Private (only backend can read/write)
# Lifecycle: Files retained for 90 days after successful processing
echo "Creating bucket: raw-uploads"
mc mb local/raw-uploads --ignore-existing

# Set bucket policy to private
mc anonymous set none local/raw-uploads

# Optional: Enable versioning (keeps file history)
mc version enable local/raw-uploads

echo "✓ Bucket 'raw-uploads' created successfully"

# Bucket 2: generated-models
# Purpose: Store optimized 3D model outputs after processing
# Contents: Processed files (optimized meshes, LODs, compressed formats)
# Access: Private with presigned URL access for users
# Lifecycle: Permanent storage (user's processed models)
echo "Creating bucket: generated-models"
mc mb local/generated-models --ignore-existing

# Set bucket policy to private
mc anonymous set none local/generated-models

# Optional: Enable versioning
mc version enable local/generated-models

echo "✓ Bucket 'generated-models' created successfully"

# ==============================================================================
# Optional: Create Additional Buckets (uncomment if needed)
# ==============================================================================

# Bucket 3: thumbnails (for preview images)
# echo "Creating bucket: thumbnails"
# mc mb local/thumbnails --ignore-existing
# mc anonymous set download local/thumbnails  # Public read access
# echo "✓ Bucket 'thumbnails' created successfully"

# Bucket 4: temp-processing (for intermediate files)
# echo "Creating bucket: temp-processing"
# mc mb local/temp-processing --ignore-existing
# mc anonymous set none local/temp-processing
# echo "✓ Bucket 'temp-processing' created successfully"

# ==============================================================================
# Verify Buckets
# ==============================================================================
echo ""
echo "All buckets created successfully:"
mc ls local

echo ""
echo "MinIO initialization complete!"
