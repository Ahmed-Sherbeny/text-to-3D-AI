"""
OptiForge3D — MinIO Client Utility
====================================
Provides a clean interface for uploading and downloading files from MinIO.
"""

import io
import logging

from minio import Minio

from app.config import get_settings

logger = logging.getLogger("optiforge3d.minio")
settings = get_settings()

class OptiForgeMinioClient:
    def __init__(self):
        self.client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
        self.buckets = [
            settings.MINIO_BUCKET_RAW_UPLOADS,
            settings.MINIO_BUCKET_GENERATED_MODELS,
        ]

    def init_buckets(self) -> None:
        """Ensure required buckets exist on startup."""
        for bucket in self.buckets:
            try:
                if not self.client.bucket_exists(bucket):
                    self.client.make_bucket(bucket)
                    logger.info(f"🪣 Created MinIO bucket: {bucket}")
                else:
                    logger.debug(f"🪣 MinIO bucket already exists: {bucket}")
            except Exception as e:
                logger.error(f"❌ Failed to initialize MinIO bucket {bucket}: {e}")

    def upload_file_stream(
        self, bucket_name: str, object_name: str, data: io.BytesIO, length: int, content_type: str = "application/octet-stream"
    ) -> str:
        """
        Uploads an in-memory byte stream to the specified bucket.
        Returns the object path.
        """
        try:
            self.client.put_object(
                bucket_name=bucket_name,
                object_name=object_name,
                data=data,
                length=length,
                content_type=content_type,
            )
            return f"{bucket_name}/{object_name}"
        except Exception as e:
            logger.error(f"Failed to upload {object_name} to {bucket_name}: {e}")
            raise e

    def get_file_stream(self, bucket_name: str, object_name: str):
        """
        Retrieves a file stream from the specified bucket.
        Must be closed by the caller.
        """
        try:
            response = self.client.get_object(bucket_name, object_name)
            return response
        except Exception as e:
            logger.error(f"Failed to fetch {object_name} from {bucket_name}: {e}")
            raise e

# Global singleton instance
minio_client = OptiForgeMinioClient()
