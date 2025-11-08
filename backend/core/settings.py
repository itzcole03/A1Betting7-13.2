"""
Production-grade settings configuration using Pydantic Settings.
Follows FastAPI best practices for environment variable management.
"""

from functools import lru_cache
from typing import Literal
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    Best Practices:
    - Use Pydantic for validation and type safety
    - Load from environment variables in production
    - Use .env file only for development
    - Never commit secrets to version control
    """
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"  # Ignore extra environment variables
    )
    
    # Application Settings
    app_name: str = Field(default="A1Betting API", description="Application name")
    app_version: str = Field(default="1.0.0", description="Application version")
    environment: Literal["development", "staging", "production"] = Field(
        default="development",
        description="Deployment environment"
    )
    debug: bool = Field(default=False, description="Debug mode (disable in production)")
    
    # Server Settings
    host: str = Field(default="0.0.0.0", description="Server host")
    port: int = Field(default=8000, ge=1, le=65535, description="Server port")
    workers: int = Field(default=4, ge=1, description="Number of worker processes")
    reload: bool = Field(default=False, description="Auto-reload (dev only)")
    
    # Security Settings
    secret_key: str = Field(..., min_length=32, description="Secret key for JWT/sessions")
    algorithm: str = Field(default="HS256", description="JWT algorithm")
    access_token_expire_minutes: int = Field(default=30, ge=1, description="Token expiration")
    
    # CORS Settings
    cors_origins: list[str] = Field(
        default=["http://localhost:3000"],
        description="Allowed CORS origins"
    )
    cors_allow_credentials: bool = Field(default=True)
    cors_allow_methods: list[str] = Field(default=["*"])
    cors_allow_headers: list[str] = Field(default=["*"])
    
    # Database Settings
    database_url: str = Field(..., description="Database connection URL")
    database_pool_size: int = Field(default=20, ge=1, description="Connection pool size")
    database_max_overflow: int = Field(default=10, ge=0, description="Max overflow connections")
    database_echo: bool = Field(default=False, description="Echo SQL queries (dev only)")
    
    # Redis Settings
    redis_url: str = Field(default="redis://localhost:6379/0", description="Redis connection URL")
    redis_max_connections: int = Field(default=50, ge=1, description="Redis connection pool size")
    
    # API Settings
    api_v1_prefix: str = Field(default="/api/v1", description="API v1 prefix")
    api_rate_limit: int = Field(default=100, ge=1, description="Rate limit per minute")
    
    # Logging Settings
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = Field(
        default="INFO",
        description="Logging level"
    )
    log_format: Literal["json", "text"] = Field(
        default="json",
        description="Log format (json for production)"
    )
    
    # External Services
    openai_api_key: str | None = Field(default=None, description="OpenAI API key")
    propfinder_api_key: str | None = Field(default=None, description="PropFinder API key")
    
    # Feature Flags
    enable_ml_predictions: bool = Field(default=True, description="Enable ML predictions")
    enable_arbitrage: bool = Field(default=True, description="Enable arbitrage detection")
    enable_analytics: bool = Field(default=True, description="Enable analytics")
    
    @field_validator("environment")
    @classmethod
    def validate_environment(cls, v: str) -> str:
        """Ensure environment is valid."""
        if v not in ["development", "staging", "production"]:
            raise ValueError("environment must be development, staging, or production")
        return v
    
    @field_validator("debug")
    @classmethod
    def validate_debug(cls, v: bool, info) -> bool:
        """Ensure debug is disabled in production."""
        if info.data.get("environment") == "production" and v:
            raise ValueError("debug must be False in production")
        return v
    
    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS origins from string or list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    @property
    def is_production(self) -> bool:
        """Check if running in production."""
        return self.environment == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development."""
        return self.environment == "development"
    
    @property
    def database_url_async(self) -> str:
        """Get async database URL."""
        return self.database_url.replace("postgresql://", "postgresql+asyncpg://")


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    
    Uses lru_cache to ensure settings are loaded only once.
    This is the recommended pattern for FastAPI dependency injection.
    
    Returns:
        Settings: Application settings
    """
    return Settings()


# Singleton instance for convenience
settings = get_settings()
