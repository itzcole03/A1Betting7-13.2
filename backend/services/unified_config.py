"""
Unified Configuration Management System

Provides centralized configuration handling across the entire application.
Supports environment variables, file-based config, and runtime overrides.
"""

import json
import logging
import os
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Type, TypeVar, Union

import yaml

T = TypeVar("T")


class Environment(Enum):
    """Application environments"""

    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    TESTING = "testing"


class ConfigSource(Enum):
    """Configuration sources in priority order"""

    RUNTIME = "runtime"  # Highest priority
    ENVIRONMENT = "environment"
    CONFIG_FILE = "config_file"
    DEFAULTS = "defaults"  # Lowest priority


@dataclass
class DatabaseConfig:
    """Database configuration"""

    url: str = "sqlite:///a1betting.db"
    pool_size: int = 10
    max_overflow: int = 20
    pool_timeout: int = 30
    pool_recycle: int = 3600

    # Additional database settings
    echo_sql: bool = False
    auto_commit: bool = False
    auto_flush: bool = True


@dataclass
class CacheConfig:
    """Cache configuration"""

    enabled: bool = True
    redis_url: Optional[str] = None
    default_ttl: int = 300  # 5 minutes
    max_memory_cache_size: int = 1000

    # Cache tiers
    memory_cache_enabled: bool = True
    redis_cache_enabled: bool = False
    file_cache_enabled: bool = False


@dataclass
class APIConfig:
    """API configuration"""

    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    reload: bool = False

    # Security settings
    cors_origins: List[str] = field(
        default_factory=lambda: ["http://localhost:3000", "http://localhost:5173"]
    )
    cors_credentials: bool = True
    cors_methods: List[str] = field(default_factory=lambda: ["*"])
    cors_headers: List[str] = field(default_factory=lambda: ["*"])

    # Rate limiting
    rate_limit_enabled: bool = True
    rate_limit_per_minute: int = 100

    # API keys and secrets
    secret_key: str = "your-secret-key-change-in-production"
    jwt_secret: Optional[str] = None
    jwt_expire_minutes: int = 30


@dataclass
class MLConfig:
    """Machine Learning configuration"""

    enabled: bool = True
    model_cache_dir: str = "backend/models/cache"

    # Modern ML settings
    modern_ml_enabled: bool = True
    torch_enabled: bool = True
    gpu_enabled: bool = False

    # Model settings
    default_model_type: str = "transformer"
    batch_size: int = 32
    max_sequence_length: int = 512

    # Performance settings
    optimize_performance: bool = True
    use_amp: bool = False  # Automatic Mixed Precision
    compile_models: bool = False


@dataclass
class ExternalAPIConfig:
    """External API configuration"""

    # Sports APIs
    mlb_stats_api_url: str = "https://statsapi.mlb.com/api/v1"
    baseball_savant_enabled: bool = True
    sportradar_api_key: Optional[str] = "mock-key-for-tests"

    # Betting APIs
    prizepicks_api_key: Optional[str] = None
    odds_api_key: Optional[str] = None

    # Timeouts and retries
    request_timeout: int = 30
    max_retries: int = 3
    retry_delay: float = 1.0


@dataclass
class LoggingConfig:
    """Logging configuration"""

    level: str = "INFO"
    format: str = "structured"  # "simple" or "structured"

    # File logging
    log_to_file: bool = True
    log_dir: str = "backend/logs"
    max_file_size: int = 50 * 1024 * 1024  # 50MB
    backup_count: int = 10

    # Console logging
    log_to_console: bool = True
    console_level: str = "INFO"


@dataclass
class PerformanceConfig:
    """Performance configuration"""

    # Caching
    enable_intelligent_cache: bool = True
    cache_warming_enabled: bool = True

    # Database
    query_optimization_enabled: bool = True
    connection_pooling_enabled: bool = True

    # Frontend
    virtualization_threshold: int = 100
    lazy_loading_enabled: bool = True

    # Monitoring
    performance_monitoring_enabled: bool = True
    metrics_collection_enabled: bool = True


@dataclass
class SecurityConfig:
    """Security configuration"""

    # Authentication
    require_authentication: bool = False
    session_timeout_minutes: int = 30

    # HTTPS
    force_https: bool = False

    # Input validation
    strict_validation: bool = True
    max_request_size: int = 10 * 1024 * 1024  # 10MB

    # Security headers
    enable_security_headers: bool = True


@dataclass
class ApplicationConfig:
    """Main application configuration"""

    # Environment settings
    environment: Environment = Environment.DEVELOPMENT
    debug: bool = False
    testing: bool = False

    # Component configurations
    database: DatabaseConfig = field(default_factory=DatabaseConfig)
    cache: CacheConfig = field(default_factory=CacheConfig)
    api: APIConfig = field(default_factory=APIConfig)
    ml: MLConfig = field(default_factory=MLConfig)
    external_apis: ExternalAPIConfig = field(default_factory=ExternalAPIConfig)
    logging: LoggingConfig = field(default_factory=LoggingConfig)
    performance: PerformanceConfig = field(default_factory=PerformanceConfig)
    security: SecurityConfig = field(default_factory=SecurityConfig)


class UnifiedConfigManager:
    """
    Centralized configuration management with:
    - Multiple configuration sources
    - Environment-specific settings
    - Runtime configuration updates
    - Type-safe configuration access
    - Configuration validation
    """

    def __init__(self, config_dir: str = "backend/config"):
        self.config_dir = Path(config_dir)
        self.config_dir.mkdir(exist_ok=True)

        self._config: ApplicationConfig = ApplicationConfig()
        self._config_sources: Dict[str, ConfigSource] = {}
        self._runtime_overrides: Dict[str, Any] = {}

        self.logger = logging.getLogger("unified_config")

        # Load configuration
        self._load_configuration()

    def _load_configuration(self):
        """Load configuration from all sources"""
        try:
            # 1. Load defaults (already set in dataclass)

            # 2. Load from config files
            self._load_from_files()

            # 3. Load from environment variables
            self._load_from_environment()

            # 4. Apply runtime overrides
            self._apply_runtime_overrides()

            self.logger.info("Configuration loaded successfully")

        except Exception as e:
            self.logger.error(f"Failed to load configuration: {e}")
            raise

    def _load_from_files(self):
        """Load configuration from files"""
        # Load base config
        base_config_file = self.config_dir / "config.yaml"
        if base_config_file.exists():
            self._load_yaml_config(base_config_file)

        # Load environment-specific config
        env_config_file = (
            self.config_dir / f"config.{self._config.environment.value}.yaml"
        )
        if env_config_file.exists():
            self._load_yaml_config(env_config_file)

    def _load_yaml_config(self, config_file: Path):
        """Load configuration from YAML file"""
        try:
            with open(config_file, "r") as f:
                config_data = yaml.safe_load(f)

            if config_data:
                self._merge_config(config_data, ConfigSource.CONFIG_FILE)

        except Exception as e:
            self.logger.warning(f"Failed to load config file {config_file}: {e}")

    def _load_from_environment(self):
        """Load configuration from environment variables"""
        env_mappings = {
            # Database
            "DATABASE_URL": ("database.url", str),
            "DB_POOL_SIZE": ("database.pool_size", int),
            "DB_ECHO_SQL": ("database.echo_sql", bool),
            # API
            "API_HOST": ("api.host", str),
            "API_PORT": ("api.port", int),
            "API_DEBUG": ("api.debug", bool),
            "SECRET_KEY": ("api.secret_key", str),
            "JWT_SECRET": ("api.jwt_secret", str),
            # Cache
            "REDIS_URL": ("cache.redis_url", str),
            "CACHE_ENABLED": ("cache.enabled", bool),
            "CACHE_DEFAULT_TTL": ("cache.default_ttl", int),
            # ML
            "ML_ENABLED": ("ml.enabled", bool),
            "MODERN_ML_ENABLED": ("ml.modern_ml_enabled", bool),
            "GPU_ENABLED": ("ml.gpu_enabled", bool),
            # External APIs
            "PRIZEPICKS_API_KEY": ("external_apis.prizepicks_api_key", str),
            "ODDS_API_KEY": ("external_apis.odds_api_key", str),
            # Logging
            "LOG_LEVEL": ("logging.level", str),
            "LOG_TO_FILE": ("logging.log_to_file", bool),
            # Environment
            "ENVIRONMENT": ("environment", str),
            "DEBUG": ("debug", bool),
        }

        for env_var, (config_path, config_type) in env_mappings.items():
            env_value = os.getenv(env_var)
            if env_value is not None:
                try:
                    # Convert value to correct type
                    if config_type == bool:
                        value = env_value.lower() in ("true", "1", "yes", "on")
                    elif config_type == int:
                        value = int(env_value)
                    elif config_type == float:
                        value = float(env_value)
                    else:
                        value = env_value

                    # Set nested configuration
                    self._set_nested_config(
                        config_path, value, ConfigSource.ENVIRONMENT
                    )

                except (ValueError, TypeError) as e:
                    self.logger.warning(
                        f"Invalid environment variable {env_var}={env_value}: {e}"
                    )

    def _set_nested_config(self, path: str, value: Any, source: ConfigSource):
        """Set nested configuration value"""
        path_parts = path.split(".")
        current = self._config

        # Navigate to parent
        for part in path_parts[:-1]:
            if hasattr(current, part):
                current = getattr(current, part)
            else:
                self.logger.warning(f"Configuration path not found: {path}")
                return

        # Set value
        final_key = path_parts[-1]
        if hasattr(current, final_key):
            setattr(current, final_key, value)
            self._config_sources[path] = source
        else:
            self.logger.warning(f"Configuration key not found: {path}")

    def _merge_config(self, config_data: Dict[str, Any], source: ConfigSource):
        """Merge configuration data into current config"""

        def merge_dict(target_dict, source_dict, prefix=""):
            for key, value in source_dict.items():
                current_path = f"{prefix}.{key}" if prefix else key

                if isinstance(value, dict):
                    # Recursive merge for nested dictionaries
                    if hasattr(target_dict, key):
                        target_attr = getattr(target_dict, key)
                        if hasattr(target_attr, "__dict__"):
                            merge_dict(target_attr, value, current_path)
                    else:
                        self.logger.warning(f"Unknown config section: {current_path}")
                else:
                    # Set scalar value
                    if hasattr(target_dict, key):
                        setattr(target_dict, key, value)
                        self._config_sources[current_path] = source
                    else:
                        self.logger.warning(f"Unknown config key: {current_path}")

        merge_dict(self._config, config_data)

    def _apply_runtime_overrides(self):
        """Apply runtime configuration overrides"""
        for path, value in self._runtime_overrides.items():
            self._set_nested_config(path, value, ConfigSource.RUNTIME)

    def get_config(self) -> ApplicationConfig:
        """Get the complete application configuration"""
        return self._config

    def get_database_config(self) -> DatabaseConfig:
        """Get database configuration"""
        return self._config.database

    def get_cache_config(self) -> CacheConfig:
        """Get cache configuration"""
        return self._config.cache

    def get_api_config(self) -> APIConfig:
        """Get API configuration"""
        return self._config.api

    def get_ml_config(self) -> MLConfig:
        """Get ML configuration"""
        return self._config.ml

    def get_external_apis_config(self) -> ExternalAPIConfig:
        """Get external APIs configuration"""
        return self._config.external_apis

    def get_logging_config(self) -> LoggingConfig:
        """Get logging configuration"""
        return self._config.logging

    def get_performance_config(self) -> PerformanceConfig:
        """Get performance configuration"""
        return self._config.performance

    def get_security_config(self) -> SecurityConfig:
        """Get security configuration"""
        return self._config.security

    def set_runtime_override(self, path: str, value: Any):
        """Set runtime configuration override"""
        self._runtime_overrides[path] = value
        self._set_nested_config(path, value, ConfigSource.RUNTIME)

    def get_config_value(self, path: str, default: Any = None) -> Any:
        """Get configuration value by path"""
        try:
            path_parts = path.split(".")
            current = self._config

            for part in path_parts:
                if hasattr(current, part):
                    current = getattr(current, part)
                else:
                    return default

            return current
        except Exception:
            return default

    def is_development(self) -> bool:
        """Check if running in development environment"""
        return self._config.environment == Environment.DEVELOPMENT

    def is_production(self) -> bool:
        """Check if running in production environment"""
        return self._config.environment == Environment.PRODUCTION

    def is_testing(self) -> bool:
        """Check if running in testing environment"""
        return self._config.environment == Environment.TESTING or self._config.testing

    def get_config_summary(self) -> Dict[str, Any]:
        """Get configuration summary for debugging"""
        return {
            "environment": self._config.environment.value,
            "debug": self._config.debug,
            "api_host": self._config.api.host,
            "api_port": self._config.api.port,
            "database_url": self._config.database.url,
            "cache_enabled": self._config.cache.enabled,
            "ml_enabled": self._config.ml.enabled,
            "modern_ml_enabled": self._config.ml.modern_ml_enabled,
            "config_sources": dict(self._config_sources),
        }

    def validate_configuration(self) -> List[str]:
        """Validate configuration and return list of issues"""
        issues = []

        # Database validation
        if not self._config.database.url:
            issues.append("Database URL is required")

        # API validation
        if self._config.api.port < 1 or self._config.api.port > 65535:
            issues.append("API port must be between 1 and 65535")

        if (
            self.is_production()
            and self._config.api.secret_key == "your-secret-key-change-in-production"
        ):
            issues.append("Secret key must be changed in production")

        # ML validation
        if (
            self._config.ml.enabled
            and not Path(self._config.ml.model_cache_dir).exists()
        ):
            issues.append(
                f"ML model cache directory does not exist: {self._config.ml.model_cache_dir}"
            )

        return issues


# Global instance
unified_config = UnifiedConfigManager()


# Convenience functions
def get_config() -> ApplicationConfig:
    """Get the global configuration"""
    return unified_config.get_config()


def get_database_config() -> DatabaseConfig:
    """Get database configuration"""
    return unified_config.get_database_config()


def get_cache_config() -> CacheConfig:
    """Get cache configuration"""
    return unified_config.get_cache_config()


def get_api_config() -> APIConfig:
    """Get API configuration"""
    return unified_config.get_api_config()


def get_ml_config() -> MLConfig:
    """Get ML configuration"""
    return unified_config.get_ml_config()


def is_development() -> bool:
    """Check if in development mode"""
    return unified_config.is_development()


def is_production() -> bool:
    """Check if in production mode"""
    return unified_config.is_production()


# Export interfaces
__all__ = [
    "UnifiedConfigManager",
    "ApplicationConfig",
    "DatabaseConfig",
    "CacheConfig",
    "APIConfig",
    "MLConfig",
    "ExternalAPIConfig",
    "LoggingConfig",
    "PerformanceConfig",
    "SecurityConfig",
    "Environment",
    "unified_config",
    "get_config",
    "get_database_config",
    "get_cache_config",
    "get_api_config",
    "get_ml_config",
    "is_development",
    "is_production",
]
