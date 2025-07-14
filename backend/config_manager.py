"""Production Configuration Management for A1Betting Backend

This module handles all configuration settings for the A1Betting platform,
including API keys, database settings, caching, and feature flags.
It supports multiple environments (development, staging, production).
"""

import logging
import os
from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class Environment(str, Enum):
    """Application environment types"""

    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


@dataclass
class DatabaseConfig:
    """Database configuration"""

    url: str = "sqlite:///./a1betting.db"
    pool_size: int = 20
    max_overflow: int = 30

    @classmethod
    def from_env(cls) -> "DatabaseConfig":
        return cls(
            url=os.getenv("DATABASE_URL", cls.url),
            pool_size=int(os.getenv("DB_POOL_SIZE", str(cls.pool_size))),
            max_overflow=int(os.getenv("DB_MAX_OVERFLOW", str(cls.max_overflow))),
        )


@dataclass
class APIKeysConfig:
    """External API keys configuration"""

    sportradar_api_key: Optional[str] = None
    theodds_api_key: Optional[str] = None
    # PrizePicks API key is not required; public access only
    # prizepicks_api_key: Optional[str] = None  # Deprecated, not used
    espn_api_key: Optional[str] = None

    @classmethod
    def from_env(cls) -> "APIKeysConfig":
        return cls(
            sportradar_api_key=os.getenv("SPORTRADAR_API_KEY"),
            theodds_api_key=os.getenv("THE_ODDS_API_KEY"),
            # prizepicks_api_key=os.getenv("PRIZEPICKS_API_KEY"),  # Deprecated, not used
            espn_api_key=os.getenv("ESPN_API_KEY"),
        )


@dataclass
class CacheConfig:
    """Caching configuration"""

    redis_url: Optional[str] = None
    ttl: int = 300
    max_size: int = 1000

    @classmethod
    def from_env(cls) -> "CacheConfig":
        return cls(
            redis_url=os.getenv("REDIS_URL"),
            ttl=int(os.getenv("CACHE_TTL", str(cls.ttl))),
            max_size=int(os.getenv("MAX_CACHE_SIZE", str(cls.max_size))),
        )


@dataclass
class SecurityConfig:
    """Security and authentication configuration"""

    jwt_secret_key: str = "dev-secret-key"
    max_requests_per_minute: int = 100
    rate_limit_window_seconds: int = 60
    cors_origins: Optional[List[str]] = None

    def __post_init__(self):
        if self.cors_origins is None:
            self.cors_origins = ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://127.0.0.1:5173"]

    @classmethod
    def from_env(cls) -> "SecurityConfig":
        cors_origins_str = os.getenv(
            "CORS_ORIGINS", "http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://127.0.0.1:5173"
        )
        cors_origins = [origin.strip() for origin in cors_origins_str.split(",")]

        return cls(
            jwt_secret_key=os.getenv("JWT_SECRET_KEY", cls.jwt_secret_key),
            max_requests_per_minute=int(
                os.getenv("MAX_REQUESTS_PER_MINUTE", str(cls.max_requests_per_minute))
            ),
            rate_limit_window_seconds=int(
                os.getenv(
                    "RATE_LIMIT_WINDOW_SECONDS", str(cls.rate_limit_window_seconds)
                )
            ),
            cors_origins=cors_origins,
        )


@dataclass
class LoggingConfig:
    """Logging configuration"""

    level: str = "INFO"
    file: Optional[str] = None
    format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    @classmethod
    def from_env(cls) -> "LoggingConfig":
        return cls(
            level=os.getenv("LOG_LEVEL", cls.level),
            file=os.getenv("LOG_FILE"),
            format=os.getenv("LOG_FORMAT", cls.format),
        )


@dataclass
class ServerConfig:
    """Server configuration"""

    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 1
    debug: bool = False
    reload: bool = False

    @classmethod
    def from_env(cls) -> "ServerConfig":
        return cls(
            host=os.getenv("HOST", cls.host),
            port=int(os.getenv("PORT", str(cls.port))),
            workers=int(os.getenv("WORKERS", str(cls.workers))),
            debug=os.getenv("DEBUG", "false").lower() == "true",
            reload=os.getenv("RELOAD", "false").lower() == "true",
        )


@dataclass
class FeatureFlagsConfig:
    """Feature flags configuration"""

    enable_live_betting: bool = True
    enable_prop_betting: bool = True
    enable_arbitrage: bool = True
    enable_kelly_criterion: bool = True
    enable_news_analysis: bool = True

    @classmethod
    def from_env(cls) -> "FeatureFlagsConfig":
        return cls(
            enable_live_betting=os.getenv("ENABLE_LIVE_BETTING", "true").lower()
            == "true",
            enable_prop_betting=os.getenv("ENABLE_PROP_BETTING", "true").lower()
            == "true",
            enable_arbitrage=os.getenv("ENABLE_ARBITRAGE", "true").lower() == "true",
            enable_kelly_criterion=os.getenv("ENABLE_KELLY_CRITERION", "true").lower()
            == "true",
            enable_news_analysis=os.getenv("ENABLE_NEWS_ANALYSIS", "true").lower()
            == "true",
        )


@dataclass
class ExternalServicesConfig:
    """External services configuration"""

    email_api_key: Optional[str] = None
    email_from_address: Optional[str] = None
    sms_api_key: Optional[str] = None
    sentry_dsn: Optional[str] = None

    @classmethod
    def from_env(cls) -> "ExternalServicesConfig":
        return cls(
            email_api_key=os.getenv("EMAIL_API_KEY"),
            email_from_address=os.getenv("EMAIL_FROM_ADDRESS"),
            sms_api_key=os.getenv("SMS_API_KEY"),
            sentry_dsn=os.getenv("SENTRY_DSN"),
        )


@dataclass
class PerformanceConfig:
    """Performance and tuning configuration"""

    max_concurrent_requests: int = 100
    request_timeout: int = 30
    http_client_timeout: int = 30

    @classmethod
    def from_env(cls) -> "PerformanceConfig":
        return cls(
            max_concurrent_requests=int(
                os.getenv("MAX_CONCURRENT_REQUESTS", str(cls.max_concurrent_requests))
            ),
            request_timeout=int(os.getenv("REQUEST_TIMEOUT", str(cls.request_timeout))),
            http_client_timeout=int(
                os.getenv("HTTP_CLIENT_TIMEOUT", str(cls.http_client_timeout))
            ),
        )


class A1BettingConfig:
    """Main application configuration"""

    def __init__(self):
        self.environment = Environment(
            os.getenv("ENVIRONMENT", Environment.DEVELOPMENT.value)
        )
        self.app_name = os.getenv("APP_NAME", "A1Betting Backend")
        self.app_version = os.getenv("APP_VERSION", "1.0.0")

        # Initialize sub-configurations
        self.database = DatabaseConfig.from_env()
        self.api_keys = APIKeysConfig.from_env()
        self.cache = CacheConfig.from_env()
        self.security = SecurityConfig.from_env()
        self.logging = LoggingConfig.from_env()
        self.server = ServerConfig.from_env()
        self.features = FeatureFlagsConfig.from_env()
        self.external = ExternalServicesConfig.from_env()
        self.performance = PerformanceConfig.from_env()

        self._validate_production_config()
        self._setup_logging()

    def _validate_production_config(self):
        """Validate production configuration requirements"""
        if self.environment == Environment.PRODUCTION:
            required_configs = []

            if (
                not self.security.jwt_secret_key
                or self.security.jwt_secret_key == "dev-secret-key"
            ):
                required_configs.append("JWT_SECRET_KEY")

            if not self.database.url or self.database.url == "sqlite:///./a1betting.db":
                logger.warning("Using SQLite in production is not recommended")

            if required_configs:
                logger.error(
                    f"Missing required production configuration: {required_configs}"
                )
                raise ValueError(
                    f"Production environment requires: {', '.join(required_configs)}"
                )

    def _setup_logging(self):
        """Setup logging configuration"""
        handlers = [logging.StreamHandler()]
        if self.logging.file:
            handlers.append(logging.FileHandler(self.logging.file))

        logging.basicConfig(
            level=getattr(logging, self.logging.level.upper()),
            format=self.logging.format,
            handlers=handlers,
            force=True,
        )

    @property
    def is_development(self) -> bool:
        """Check if running in development mode"""
        return self.environment == Environment.DEVELOPMENT

    @property
    def is_production(self) -> bool:
        """Check if running in production mode"""
        return self.environment == Environment.PRODUCTION

    @property
    def is_staging(self) -> bool:
        """Check if running in staging mode"""
        return self.environment == Environment.STAGING

    def get_api_quotas(self) -> Dict[str, int]:
        """Get API quotas for external services"""
        return {
            "sportradar": int(os.getenv("SPORTRADAR_DAILY_LIMIT", "1000")),
            "theodds": int(os.getenv("THEODDS_DAILY_LIMIT", "500")),
            "prizepicks": int(os.getenv("PRIZEPICKS_DAILY_LIMIT", "1000")),
        }

    def get_database_url(self) -> str:
        """Get the appropriate database URL"""
        return self.database.url

    def to_dict(self) -> Dict[str, Any]:
        """Convert configuration to dictionary (excluding sensitive data)"""
        config_dict = {
            "environment": self.environment.value,
            "app_name": self.app_name,
            "app_version": self.app_version,
            "database": {
                "url": "***REDACTED***" if self.is_production else self.database.url,
                "pool_size": self.database.pool_size,
                "max_overflow": self.database.max_overflow,
            },
            "api_keys": {
                "sportradar_configured": bool(self.api_keys.sportradar_api_key),
                "theodds_configured": bool(self.api_keys.theodds_api_key),
                # "prizepicks_configured": bool(self.api_keys.prizepicks_api_key),  # Deprecated, not used
                "espn_configured": bool(self.api_keys.espn_api_key),
            },
            "cache": {
                "redis_configured": bool(self.cache.redis_url),
                "ttl": self.cache.ttl,
                "max_size": self.cache.max_size,
            },
            "security": {
                "jwt_configured": bool(
                    self.security.jwt_secret_key
                    and self.security.jwt_secret_key != "dev-secret-key"
                ),
                "max_requests_per_minute": self.security.max_requests_per_minute,
                "cors_origins": self.security.cors_origins,
            },
            "features": {
                "live_betting": self.features.enable_live_betting,
                "prop_betting": self.features.enable_prop_betting,
                "arbitrage": self.features.enable_arbitrage,
                "kelly_criterion": self.features.enable_kelly_criterion,
                "news_analysis": self.features.enable_news_analysis,
            },
        }
        return config_dict


# Global configuration instance
config = A1BettingConfig()


# Convenience functions
def get_config() -> A1BettingConfig:
    """Get the global configuration instance"""
    return config


def is_development() -> bool:
    """Check if running in development mode"""
    return config.is_development


def is_production() -> bool:
    """Check if running in production mode"""
    return config.is_production


def get_api_key(service: str) -> Optional[str]:
    """Get API key for a specific service"""
    api_keys = {
        "sportradar": config.api_keys.sportradar_api_key,
        "theodds": config.api_keys.theodds_api_key,
        # "prizepicks": config.api_keys.prizepicks_api_key,  # Deprecated, not used
        "espn": config.api_keys.espn_api_key,
    }
    # PrizePicks API key is not required; always returns None
    if service.lower() == "prizepicks":
        return None
    return api_keys.get(service.lower())


def get_database_url() -> str:
    """Get the database URL"""
    return config.get_database_url()


# Configuration validation on module import
if __name__ == "__main__":
    # Print configuration summary (excluding sensitive data)
    import json

    print("A1Betting Configuration Summary:")
    print(json.dumps(config.to_dict(), indent=2, default=str))
