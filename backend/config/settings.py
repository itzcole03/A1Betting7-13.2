"""
Enhanced Configuration Management using Pydantic BaseSettings
Following FastAPI 2024-2025 best practices for production-ready configuration.
"""

import os
from enum import Enum
from functools import lru_cache
from typing import Any, Dict, List, Optional, Set

from pydantic import Field, validator, model_validator
from pydantic_settings import BaseSettings


class Environment(str, Enum):
    """Application environment types"""

    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    TESTING = "testing"


class LogLevel(str, Enum):
    """Logging levels"""

    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class DatabaseSettings(BaseSettings):
    """Database configuration settings"""

    # Primary database
    database_url: str = Field(
        default="sqlite+aiosqlite:///./a1betting.db", description="Primary database URL"
    )

    # Connection pooling
    pool_size: int = Field(default=20, ge=1, le=100)
    max_overflow: int = Field(default=30, ge=0, le=100)
    pool_timeout: int = Field(default=30, ge=1, le=300)
    pool_recycle: int = Field(default=3600, ge=300, le=86400)

    # Connection settings
    connection_timeout: int = Field(default=10, ge=1, le=60)
    query_timeout: int = Field(default=30, ge=1, le=300)
    retry_attempts: int = Field(default=3, ge=1, le=10)

    # Advanced settings
    echo_sql: bool = Field(default=False)
    enable_query_logging: bool = Field(default=False)

    class Config:
        env_prefix = "DB_"
        case_sensitive = False


class RedisSettings(BaseSettings):
    """Redis cache configuration"""

    url: Optional[str] = Field(default=None, description="Redis URL")
    host: str = Field(default="localhost")
    port: int = Field(default=6379, ge=1, le=65535)
    db: int = Field(default=0, ge=0, le=15)
    password: Optional[str] = Field(default=None)

    # Connection settings
    max_connections: int = Field(default=50, ge=1, le=1000)
    socket_timeout: int = Field(default=5, ge=1, le=60)
    socket_connect_timeout: int = Field(default=5, ge=1, le=60)
    retry_on_timeout: bool = Field(default=True)

    # Cache settings
    default_ttl: int = Field(default=300, ge=1, le=86400)
    max_ttl: int = Field(default=3600, ge=1, le=86400)

    @validator("url", pre=True)
    def validate_redis_url(cls, v, values):
        if v:
            return v
        # Build URL from components if not provided
        host = values.get("host", "localhost")
        port = values.get("port", 6379)
        db = values.get("db", 0)
        password = values.get("password")

        if password:
            return f"redis://:{password}@{host}:{port}/{db}"
        return f"redis://{host}:{port}/{db}"

    class Config:
        env_prefix = "REDIS_"
        case_sensitive = False


class SecuritySettings(BaseSettings):
    """
    Security configuration with comprehensive protection controls.
    
    Features:
    - Environment-driven security header configuration
    - Content Security Policy with enforce/report-only modes
    - HTTP Strict Transport Security (HSTS) controls
    - Cross-origin isolation policies (COOP/COEP/CORP)
    - Configurable payload validation and limits
    
    Special Behaviors:
    - security_strict_mode: When enabled, overrides individual flags to enforce
      maximum security baseline (e.g., forces CSP_REPORT_ONLY=False for enforcement)
    - model_validator: Applies cross-field validation and strict mode overrides
    - Production-ready defaults with development flexibility
    """

    # API Keys
    api_key: Optional[str] = Field(default=None, description="Internal API key")
    secret_key: str = Field(
        default="your-secret-key-change-in-production",
        description="Secret key for signing",
    )

    # JWT Settings
    jwt_secret_key: Optional[str] = Field(default=None)
    jwt_algorithm: str = Field(default="HS256")
    jwt_expire_minutes: int = Field(default=30, ge=1, le=1440)

    # Rate limiting
    rate_limit_requests: int = Field(default=100, ge=1, le=10000)
    rate_limit_window: int = Field(default=60, ge=1, le=3600)

    # CORS settings
    cors_origins: List[str] = Field(default_factory=lambda: ["*"])
    cors_credentials: bool = Field(default=True)
    cors_methods: List[str] = Field(default_factory=lambda: ["*"])
    cors_headers: List[str] = Field(default_factory=lambda: ["*"])

    # Security headers
    enable_security_headers: bool = Field(default=True)
    trusted_hosts: List[str] = Field(default_factory=lambda: ["*"])

    # Payload guard settings (Step 5)
    max_json_payload_bytes: int = Field(default=262144, ge=1024, le=10485760)  # 256KB default, max 10MB
    enforce_json_content_type: bool = Field(default=True)
    allow_extra_content_types: str = Field(default="")  # Comma-separated list
    payload_guard_enabled: bool = Field(default=True)
    
    # Security headers settings (Step 6)
    security_headers_enabled: bool = Field(default=True)
    enable_hsts: bool = Field(default=True)
    enable_coep: bool = Field(default=True)
    enable_coop: bool = Field(default=True)
    csp_enabled: bool = Field(default=True)
    csp_report_only: bool = Field(default=True)
    csp_report_endpoint_enabled: bool = Field(default=True)
    csp_extra_connect_src: str = Field(default="")  # Comma-separated additional connect sources
    csp_enable_upgrade_insecure: bool = Field(default=True)
    x_frame_options: str = Field(default="DENY")  # DENY or SAMEORIGIN
    permissions_policy_append: str = Field(default="")  # Additional permissions to append
    security_strict_mode: bool = Field(default=False)  # Force strict settings in production

    @validator("security_strict_mode", pre=True)
    def validate_security_strict_mode_field(cls, v):
        """Convert string values to boolean for security_strict_mode field"""
        if isinstance(v, str):
            if v.lower() in ('true', '1', 'yes', 'on'):
                return True
            elif v.lower() in ('false', '0', 'no', 'off', ''):
                return False
            else:
                raise ValueError(f"Invalid boolean value: {v}")
        return bool(v) if v is not None else False

    @validator("secret_key")
    def validate_secret_key(cls, v):
        if len(v) < 32:
            raise ValueError("Secret key must be at least 32 characters long")
        return v
    
    @validator("x_frame_options")
    def validate_x_frame_options(cls, v):
        if v.upper() not in ["DENY", "SAMEORIGIN"]:
            raise ValueError("X-Frame-Options must be either 'DENY' or 'SAMEORIGIN'")
        return v.upper()
    
    @model_validator(mode='after')
    def validate_security_strict_mode(self):
        """Apply security strict mode overrides and validation."""
        import logging
        logger = logging.getLogger(__name__)
        
        # If strict mode is enabled, force strict security settings
        if self.security_strict_mode:
            logger.info("SECURITY_STRICT_MODE enabled: forcing CSP_REPORT_ONLY=False for enforcement")
            # Create a copy with overridden values
            object.__setattr__(self, 'csp_report_only', False)  # Force CSP enforcement
            object.__setattr__(self, 'enable_hsts', True)      # Force HSTS in strict mode
            object.__setattr__(self, 'enable_coep', True)      # Force COEP
            object.__setattr__(self, 'enable_coop', True)      # Force COOP
            # Note: Don't force csp_enabled=True - respect explicit disabling
        
        # Warn about misconfiguration: report-only mode with disabled endpoint
        if self.csp_report_only and not self.csp_report_endpoint_enabled:
            logger.warning("Configuration warning: CSP_REPORT_ONLY=True but CSP_REPORT_ENDPOINT_ENABLED=False - reports will be lost")
        
        return self

    class Config:
        env_prefix = "SECURITY_"
        case_sensitive = False


class ExternalAPISettings(BaseSettings):
    """External API configuration"""

    # Sports data APIs
    sportradar_api_key: Optional[str] = Field(default=None)
    theodds_api_key: Optional[str] = Field(default=None)
    espn_api_key: Optional[str] = Field(default=None)

    # API timeouts
    api_timeout: int = Field(default=30, ge=1, le=300)
    api_retry_attempts: int = Field(default=3, ge=1, le=10)
    api_retry_delay: float = Field(default=1.0, ge=0.1, le=60.0)

    # Rate limiting for external APIs
    external_api_rate_limit: int = Field(default=100, ge=1, le=10000)

    class Config:
        env_prefix = "API_"
        case_sensitive = False


class MonitoringSettings(BaseSettings):
    """Monitoring and observability configuration"""

    # Logging
    log_level: LogLevel = Field(default=LogLevel.INFO)
    log_format: str = Field(default="json")
    enable_request_logging: bool = Field(default=True)
    enable_sql_logging: bool = Field(default=False)

    # Metrics
    enable_prometheus: bool = Field(default=True)
    metrics_endpoint: str = Field(default="/metrics")

    # Health checks
    health_check_endpoint: str = Field(default="/health")
    enable_detailed_health: bool = Field(default=True)

    # Performance monitoring
    enable_performance_monitoring: bool = Field(default=True)
    slow_query_threshold: float = Field(default=1.0, ge=0.1, le=60.0)

    class Config:
        env_prefix = "MONITORING_"
        case_sensitive = False


class PerformanceSettings(BaseSettings):
    """Performance optimization settings"""

    # Async settings
    max_workers: int = Field(default=4, ge=1, le=32)
    worker_timeout: int = Field(default=30, ge=1, le=300)

    # Caching
    enable_response_caching: bool = Field(default=True)
    cache_default_ttl: int = Field(default=300, ge=1, le=86400)

    # Compression
    enable_compression: bool = Field(default=True)
    compression_level: int = Field(default=6, ge=1, le=9)
    compression_minimum_size: int = Field(default=1024, ge=1, le=10240)

    # Background tasks
    max_background_tasks: int = Field(default=100, ge=1, le=1000)
    background_task_timeout: int = Field(default=300, ge=1, le=3600)

    class Config:
        env_prefix = "PERFORMANCE_"
        case_sensitive = False


class AppSettings(BaseSettings):
    """Main application settings"""

    # Basic app info
    app_name: str = Field(default="A1Betting Backend API")
    app_version: str = Field(default="2.0.0")
    app_description: str = Field(
        default="AI-powered sports analytics and betting platform"
    )

    # Environment
    environment: Environment = Field(default=Environment.DEVELOPMENT)
    debug: bool = Field(default=False)

    # Server settings
    host: str = Field(default="0.0.0.0")
    port: int = Field(default=8000, ge=1, le=65535)
    reload: bool = Field(default=False)

    # Documentation
    enable_docs: bool = Field(default=True)
    docs_url: Optional[str] = Field(default="/docs")
    redoc_url: Optional[str] = Field(default="/redoc")
    openapi_url: Optional[str] = Field(default="/openapi.json")

    # Feature flags
    enable_experimental_features: bool = Field(default=False)
    enable_ml_features: bool = Field(default=True)
    enable_comprehensive_props: bool = Field(default=True)
    enable_debug_routes: bool = Field(default=True)
    
    # Development optimization flags (Stabilization)
    dev_lean_mode: bool = Field(
        default=False, 
        description="Disable heavy monitoring and non-essential features for cleaner development"
    )

    @validator("debug", pre=True)
    def validate_debug(cls, v, values):
        env = values.get("environment", Environment.DEVELOPMENT)
        if env == Environment.PRODUCTION and v:
            raise ValueError("Debug mode cannot be enabled in production")
        return v

    @validator("enable_docs", pre=True)
    def validate_docs(cls, v, values):
        env = values.get("environment", Environment.DEVELOPMENT)
        # Automatically disable docs in production for security
        if env == Environment.PRODUCTION:
            return False
        return v

    class Config:
        env_prefix = "APP_"
        case_sensitive = False


class Settings(BaseSettings):
    """Main settings class combining all configuration sections"""

    # Application settings
    app: AppSettings = Field(default_factory=AppSettings)

    # Component settings
    database: DatabaseSettings = Field(default_factory=DatabaseSettings)
    redis: RedisSettings = Field(default_factory=RedisSettings)
    security: SecuritySettings = Field(default_factory=SecuritySettings)
    external_api: ExternalAPISettings = Field(default_factory=ExternalAPISettings)
    monitoring: MonitoringSettings = Field(default_factory=MonitoringSettings)
    performance: PerformanceSettings = Field(default_factory=PerformanceSettings)

    # Global overrides
    environment: Environment = Field(default=Environment.DEVELOPMENT)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Sync environment across all components
        self.app.environment = self.environment

        # Apply environment-specific overrides
        if self.environment == Environment.PRODUCTION:
            self._apply_production_settings()
        elif self.environment == Environment.STAGING:
            self._apply_staging_settings()
        elif self.environment == Environment.DEVELOPMENT:
            self._apply_development_settings()

    def _apply_production_settings(self):
        """Apply production-specific settings"""
        self.app.debug = False
        self.app.enable_docs = False
        self.app.docs_url = None
        self.app.redoc_url = None
        self.app.reload = False
        self.database.echo_sql = False
        self.monitoring.log_level = LogLevel.INFO
        self.security.cors_origins = []  # Restrict CORS in production

    def _apply_staging_settings(self):
        """Apply staging-specific settings"""
        self.app.debug = False
        self.app.enable_docs = True
        self.database.echo_sql = False
        self.monitoring.log_level = LogLevel.INFO

    def _apply_development_settings(self):
        """Apply development-specific settings"""
        self.app.debug = True
        self.app.enable_docs = True
        self.app.reload = True
        self.database.echo_sql = True
        self.monitoring.log_level = LogLevel.DEBUG
        self.monitoring.enable_sql_logging = True

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        validate_assignment = True
        extra = "allow"  # Allow extra fields for backward compatibility


# Cache settings instance for performance
@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Export commonly used settings
settings = get_settings()
