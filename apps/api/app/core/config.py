from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "MTB Galaxy API"
    api_prefix: str = ""
    cors_origin: str = "http://localhost:5173"
    database_url: str = f"sqlite:///{Path(__file__).resolve().parents[2] / 'dev.db'}"
    redis_url: str = "redis://localhost:6379/0"
    queue_mode: str = "sync"
    demo_user_id: str = "u_demo"
    sse_interval_seconds: float = 2.0

    model_config = SettingsConfigDict(env_prefix="MTB_", env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()

