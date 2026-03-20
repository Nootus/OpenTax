from pydantic import Field
from pydantic_settings import BaseSettings
from functools import lru_cache

class AppEnvSettings(BaseSettings):
    # -----------------------------
    # App Info
    # -----------------------------
    PROJECT_NAME: str = Field(default="Open Tax")

    # -----------------------------
    # CORS
    # -----------------------------
    BACKEND_CORS_ORIGINS: str = Field(default="http://localhost:3000", description="Comma-separated list of allowed CORS origins")
# AppEnvSettings

@lru_cache()
def get_settings() -> AppEnvSettings:
    """Cached singleton settings instance."""
    return AppEnvSettings() # type: ignore # Pydantic BaseSettings uses dynamic attributes


AppSettings = get_settings()
