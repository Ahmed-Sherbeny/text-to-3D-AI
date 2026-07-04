"""
OptiForge3D — Application Configuration
========================================
Loads all settings from environment variables / .env file.
Uses pydantic-settings for type-safe configuration with validation.
"""

from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central configuration class.
    Values are loaded from the .env file in the backend/ directory,
    then overridden by any actual environment variables.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────────────
    APP_ENV: str = "development"
    APP_DEBUG: bool = True

    # ── PostgreSQL ───────────────────────────────────────────────
    POSTGRES_USER: str = "optiforge_user"
    POSTGRES_PASSWORD: str = "change_this_secure_password_123"
    POSTGRES_DB: str = "optiforge_db"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432

    # ── Redis ────────────────────────────────────────────────────
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str | None = None

    # ── MinIO (S3-compatible object storage) ─────────────────────
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "change_this_minio_password_789"
    MINIO_SECURE: bool = False
    MINIO_BUCKET_RAW_UPLOADS: str = "raw-uploads"
    MINIO_BUCKET_GENERATED_MODELS: str = "generated-models"

    # ── CORS (local-first — only localhost origins allowed) ──────
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]
    
    # ── Colab ML Worker ──────────────────────────────────────────
    OPTIFORGE_ML_API_URL: str | None = None

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | List[str]) -> List[str]:
        """Accept a JSON string or a Python list."""
        if isinstance(v, str):
            import json
            return json.loads(v)
        return v

    # ── Computed Properties ──────────────────────────────────────

    @property
    def database_url(self) -> str:
        """Async PostgreSQL connection string for SQLAlchemy."""
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def database_url_sync(self) -> str:
        """Sync PostgreSQL connection string (used by Alembic)."""
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def redis_url(self) -> str:
        """Redis connection URL."""
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/0"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/0"


@lru_cache()
def get_settings() -> Settings:
    """
    Cached singleton — ensures settings are loaded once and reused.
    Call this function everywhere instead of instantiating Settings directly.
    """
    return Settings()
