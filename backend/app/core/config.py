"""
Centralized application configuration.

All environment dependent values are declared here and loaded from a `.env`
file (see `.env.example`). Nothing else in the codebase should call
`os.environ` directly -- this keeps configuration auditable in one place.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Application
    environment: str = "development"
    debug: bool = True

    # Database
    database_url: str
    database_url_sync: str

    # Auth
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # CORS - comma separated string in .env, parsed into a list
    cors_origins: str = "http://localhost:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance -- avoids re-reading/parsing .env on every call."""
    return Settings()


settings = get_settings()
