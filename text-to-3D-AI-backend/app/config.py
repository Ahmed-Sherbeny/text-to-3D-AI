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
    GEMINI_API_KEY: str | None = None
    COLAB_API_URL: str = "https://bumpy-chefs-tan.loca.lt"

    # ── Redis ────────────────────────────────────────────────────
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str | None = None

    # ── CORS (local-first — only localhost origins allowed) ──────
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

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
