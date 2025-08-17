"""
Modeling Configuration - Environment-specific settings and parameters
"""

import os
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from enum import Enum


class Environment(Enum):
    """Environment types"""
    DEVELOPMENT = "development"
    TESTING = "testing"
    STAGING = "staging"  
    PRODUCTION = "production"


class ModelType(Enum):
    """Available model types"""
    POISSON = "poisson"
    NORMAL = "normal"
    NEGATIVE_BINOMIAL = "negative_binomial"


@dataclass
class EdgeThresholdConfig:
    """Edge detection threshold configuration"""
    ev_min: float = 0.05  # Minimum expected value
    prob_over_min: float = 0.52  # Minimum probability over line
    prob_over_max: float = 0.75  # Maximum probability over line  
    volatility_max: float = 2.0  # Maximum volatility score


@dataclass
class ModelConfig:
    """Model-specific configuration"""
    enabled: bool = True
    priority: int = 1  # Higher number = higher priority for defaults
    cache_ttl_seconds: int = 300  # 5 minutes
    confidence_threshold: float = 0.6
    parameters: Dict[str, Any] = field(default_factory=dict)


@dataclass 
class DatabaseConfig:
    """Database configuration"""
    connection_pool_size: int = 20
    max_overflow: int = 30
    pool_timeout: int = 30
    pool_recycle: int = 3600  # 1 hour
    query_timeout: int = 30
    enable_migrations: bool = True


@dataclass
class CacheConfig:
    """Caching configuration"""
    valuation_ttl_seconds: int = 300  # 5 minutes
    prediction_ttl_seconds: int = 600  # 10 minutes
    model_defaults_ttl_seconds: int = 3600  # 1 hour
    max_memory_mb: int = 100
    cleanup_interval_seconds: int = 300  # 5 minutes


@dataclass
class ObservabilityConfig:
    """Observability configuration"""
    metrics_enabled: bool = True
    health_check_interval_seconds: int = 60
    sample_size: int = 100  # For rolling averages
    log_level: str = "INFO"
    enable_performance_tracking: bool = True


@dataclass
class IntegrationConfig:
    """Integration configuration"""
    websocket_enabled: bool = False  # TODO: Enable when websocket system ready
    edge_events_enabled: bool = True
    batch_processing_size: int = 10
    batch_processing_delay_ms: int = 500
    max_concurrent_valuations: int = 20


class ModelingConfig:
    """
    Main configuration class for the modeling system.
    Loads settings from environment variables with sensible defaults.
    """
    
    def __init__(self):
        self.environment = self._get_environment()
        self.debug = self._get_bool_env("DEBUG", default=False)
        
        # Load configuration sections
        self.edge_thresholds = self._load_edge_thresholds()
        self.models = self._load_model_configs()
        self.database = self._load_database_config()
        self.cache = self._load_cache_config()
        self.observability = self._load_observability_config()
        self.integration = self._load_integration_config()
        
        # Feature flags
        self.feature_flags = self._load_feature_flags()
        
    def _get_environment(self) -> Environment:
        """Get current environment"""
        env_name = os.getenv("ENVIRONMENT", "development").lower()
        try:
            return Environment(env_name)
        except ValueError:
            return Environment.DEVELOPMENT
    
    def _get_bool_env(self, key: str, default: bool) -> bool:
        """Get boolean from environment"""
        value = os.getenv(key, str(default)).lower()
        return value in ("true", "1", "yes", "on")
    
    def _get_float_env(self, key: str, default: float) -> float:
        """Get float from environment"""
        try:
            return float(os.getenv(key, str(default)))
        except (ValueError, TypeError):
            return default
    
    def _get_int_env(self, key: str, default: int) -> int:
        """Get integer from environment"""
        try:
            return int(os.getenv(key, str(default)))
        except (ValueError, TypeError):
            return default
    
    def _load_edge_thresholds(self) -> EdgeThresholdConfig:
        """Load edge detection thresholds"""
        return EdgeThresholdConfig(
            ev_min=self._get_float_env("EDGE_EV_MIN", 0.05),
            prob_over_min=self._get_float_env("EDGE_PROB_OVER_MIN", 0.52),
            prob_over_max=self._get_float_env("EDGE_PROB_OVER_MAX", 0.75),
            volatility_max=self._get_float_env("EDGE_VOLATILITY_MAX", 2.0)
        )
    
    def _load_model_configs(self) -> Dict[ModelType, ModelConfig]:
        """Load model-specific configurations"""
        configs = {}
        
        # Poisson model config
        configs[ModelType.POISSON] = ModelConfig(
            enabled=self._get_bool_env("MODEL_POISSON_ENABLED", True),
            priority=self._get_int_env("MODEL_POISSON_PRIORITY", 1),
            cache_ttl_seconds=self._get_int_env("MODEL_POISSON_CACHE_TTL", 300),
            confidence_threshold=self._get_float_env("MODEL_POISSON_CONFIDENCE", 0.6),
            parameters={
                "min_sample_size": self._get_int_env("MODEL_POISSON_MIN_SAMPLES", 10),
                "regularization": self._get_float_env("MODEL_POISSON_REGULARIZATION", 0.01)
            }
        )
        
        # Normal model config
        configs[ModelType.NORMAL] = ModelConfig(
            enabled=self._get_bool_env("MODEL_NORMAL_ENABLED", True),
            priority=self._get_int_env("MODEL_NORMAL_PRIORITY", 2),
            cache_ttl_seconds=self._get_int_env("MODEL_NORMAL_CACHE_TTL", 300),
            confidence_threshold=self._get_float_env("MODEL_NORMAL_CONFIDENCE", 0.65),
            parameters={
                "min_sample_size": self._get_int_env("MODEL_NORMAL_MIN_SAMPLES", 15),
                "outlier_threshold": self._get_float_env("MODEL_NORMAL_OUTLIER_THRESHOLD", 2.5)
            }
        )
        
        # Negative Binomial model config
        configs[ModelType.NEGATIVE_BINOMIAL] = ModelConfig(
            enabled=self._get_bool_env("MODEL_NEGBINOM_ENABLED", True),
            priority=self._get_int_env("MODEL_NEGBINOM_PRIORITY", 3),
            cache_ttl_seconds=self._get_int_env("MODEL_NEGBINOM_CACHE_TTL", 300),
            confidence_threshold=self._get_float_env("MODEL_NEGBINOM_CONFIDENCE", 0.7),
            parameters={
                "min_sample_size": self._get_int_env("MODEL_NEGBINOM_MIN_SAMPLES", 20),
                "convergence_tolerance": self._get_float_env("MODEL_NEGBINOM_TOLERANCE", 1e-6)
            }
        )
        
        return configs
    
    def _load_database_config(self) -> DatabaseConfig:
        """Load database configuration"""
        return DatabaseConfig(
            connection_pool_size=self._get_int_env("DB_POOL_SIZE", 20),
            max_overflow=self._get_int_env("DB_MAX_OVERFLOW", 30),
            pool_timeout=self._get_int_env("DB_POOL_TIMEOUT", 30),
            pool_recycle=self._get_int_env("DB_POOL_RECYCLE", 3600),
            query_timeout=self._get_int_env("DB_QUERY_TIMEOUT", 30),
            enable_migrations=self._get_bool_env("DB_ENABLE_MIGRATIONS", True)
        )
    
    def _load_cache_config(self) -> CacheConfig:
        """Load caching configuration"""
        return CacheConfig(
            valuation_ttl_seconds=self._get_int_env("CACHE_VALUATION_TTL", 300),
            prediction_ttl_seconds=self._get_int_env("CACHE_PREDICTION_TTL", 600),
            model_defaults_ttl_seconds=self._get_int_env("CACHE_MODEL_DEFAULTS_TTL", 3600),
            max_memory_mb=self._get_int_env("CACHE_MAX_MEMORY_MB", 100),
            cleanup_interval_seconds=self._get_int_env("CACHE_CLEANUP_INTERVAL", 300)
        )
    
    def _load_observability_config(self) -> ObservabilityConfig:
        """Load observability configuration"""
        return ObservabilityConfig(
            metrics_enabled=self._get_bool_env("METRICS_ENABLED", True),
            health_check_interval_seconds=self._get_int_env("HEALTH_CHECK_INTERVAL", 60),
            sample_size=self._get_int_env("METRICS_SAMPLE_SIZE", 100),
            log_level=os.getenv("LOG_LEVEL", "INFO").upper(),
            enable_performance_tracking=self._get_bool_env("PERFORMANCE_TRACKING_ENABLED", True)
        )
    
    def _load_integration_config(self) -> IntegrationConfig:
        """Load integration configuration"""
        return IntegrationConfig(
            websocket_enabled=self._get_bool_env("WEBSOCKET_ENABLED", False),
            edge_events_enabled=self._get_bool_env("EDGE_EVENTS_ENABLED", True),
            batch_processing_size=self._get_int_env("BATCH_PROCESSING_SIZE", 10),
            batch_processing_delay_ms=self._get_int_env("BATCH_PROCESSING_DELAY_MS", 500),
            max_concurrent_valuations=self._get_int_env("MAX_CONCURRENT_VALUATIONS", 20)
        )
    
    def _load_feature_flags(self) -> Dict[str, bool]:
        """Load feature flags"""
        return {
            "enable_model_caching": self._get_bool_env("FEATURE_MODEL_CACHING", True),
            "enable_valuation_deduplication": self._get_bool_env("FEATURE_VALUATION_DEDUP", True),
            "enable_edge_correlation_analysis": self._get_bool_env("FEATURE_EDGE_CORRELATION", False),
            "enable_advanced_distributions": self._get_bool_env("FEATURE_ADVANCED_DISTRIBUTIONS", True),
            "enable_real_time_updates": self._get_bool_env("FEATURE_REAL_TIME_UPDATES", False),
            "enable_a_b_testing": self._get_bool_env("FEATURE_AB_TESTING", False),
            "enable_model_explanations": self._get_bool_env("FEATURE_MODEL_EXPLANATIONS", True),
            "enable_performance_optimization": self._get_bool_env("FEATURE_PERF_OPTIMIZATION", True)
        }
    
    def get_model_config(self, model_type: ModelType) -> ModelConfig:
        """
        Get configuration for a specific model type.
        
        Args:
            model_type: Model type to get config for
            
        Returns:
            ModelConfig: Configuration for the model
        """
        return self.models.get(model_type, ModelConfig())
    
    def is_feature_enabled(self, feature_name: str) -> bool:
        """
        Check if a feature flag is enabled.
        
        Args:
            feature_name: Name of the feature flag
            
        Returns:
            bool: True if feature is enabled
        """
        return self.feature_flags.get(feature_name, False)
    
    def get_environment_specific_config(self) -> Dict[str, Any]:
        """
        Get environment-specific configuration overrides.
        
        Returns:
            dict: Environment-specific settings
        """
        if self.environment == Environment.DEVELOPMENT:
            return {
                "debug": True,
                "log_level": "DEBUG",
                "cache_ttl_multiplier": 0.1,  # Shorter cache for development
                "batch_size": 5,  # Smaller batches for testing
                "enable_mock_data": True
            }
        elif self.environment == Environment.TESTING:
            return {
                "debug": True,
                "log_level": "WARNING",
                "cache_ttl_multiplier": 0.01,  # Very short cache for tests
                "batch_size": 2,
                "enable_mock_data": True,
                "database_timeout": 5  # Faster timeouts for tests
            }
        elif self.environment == Environment.STAGING:
            return {
                "debug": False,
                "log_level": "INFO",
                "cache_ttl_multiplier": 0.5,  # Reduced cache for staging
                "batch_size": 10,
                "enable_mock_data": False,
                "enable_advanced_logging": True
            }
        elif self.environment == Environment.PRODUCTION:
            return {
                "debug": False,
                "log_level": "WARNING",
                "cache_ttl_multiplier": 1.0,  # Full cache in production
                "batch_size": 20,
                "enable_mock_data": False,
                "enable_advanced_logging": True,
                "enable_performance_monitoring": True
            }
        
        return {}
    
    def validate_config(self) -> List[str]:
        """
        Validate configuration and return list of issues.
        
        Returns:
            List[str]: List of configuration issues (empty if valid)
        """
        issues = []
        
        # Validate edge thresholds
        if self.edge_thresholds.ev_min <= 0:
            issues.append("EDGE_EV_MIN must be positive")
        
        if not (0 < self.edge_thresholds.prob_over_min < self.edge_thresholds.prob_over_max < 1):
            issues.append("Probability thresholds must be between 0 and 1 with min < max")
        
        if self.edge_thresholds.volatility_max <= 0:
            issues.append("EDGE_VOLATILITY_MAX must be positive")
        
        # Validate model configs
        enabled_models = [model_type for model_type, config in self.models.items() if config.enabled]
        if not enabled_models:
            issues.append("At least one model must be enabled")
        
        # Validate database config
        if self.database.connection_pool_size <= 0:
            issues.append("DB_POOL_SIZE must be positive")
        
        if self.database.query_timeout <= 0:
            issues.append("DB_QUERY_TIMEOUT must be positive")
        
        # Validate cache config
        if self.cache.max_memory_mb <= 0:
            issues.append("CACHE_MAX_MEMORY_MB must be positive")
        
        # Validate integration config
        if self.integration.batch_processing_size <= 0:
            issues.append("BATCH_PROCESSING_SIZE must be positive")
        
        if self.integration.max_concurrent_valuations <= 0:
            issues.append("MAX_CONCURRENT_VALUATIONS must be positive")
        
        return issues
    
    def get_summary(self) -> Dict[str, Any]:
        """
        Get configuration summary for debugging.
        
        Returns:
            dict: Configuration summary
        """
        enabled_models = [model_type.value for model_type, config in self.models.items() if config.enabled]
        enabled_features = [name for name, enabled in self.feature_flags.items() if enabled]
        
        return {
            "environment": self.environment.value,
            "debug": self.debug,
            "enabled_models": enabled_models,
            "enabled_features": enabled_features,
            "edge_thresholds": {
                "ev_min": self.edge_thresholds.ev_min,
                "prob_range": f"{self.edge_thresholds.prob_over_min}-{self.edge_thresholds.prob_over_max}",
                "volatility_max": self.edge_thresholds.volatility_max
            },
            "database_pool_size": self.database.connection_pool_size,
            "cache_max_memory_mb": self.cache.max_memory_mb,
            "batch_processing_size": self.integration.batch_processing_size,
            "validation_issues": self.validate_config()
        }


# Global configuration instance
modeling_config = ModelingConfig()


# Convenience functions for accessing common settings
def get_edge_thresholds() -> EdgeThresholdConfig:
    """Get edge detection thresholds"""
    return modeling_config.edge_thresholds

def get_model_config(model_type: ModelType) -> ModelConfig:
    """Get configuration for a model type"""
    return modeling_config.get_model_config(model_type)

def is_feature_enabled(feature_name: str) -> bool:
    """Check if a feature is enabled"""
    return modeling_config.is_feature_enabled(feature_name)

def get_cache_config() -> CacheConfig:
    """Get cache configuration"""
    return modeling_config.cache

def get_database_config() -> DatabaseConfig:
    """Get database configuration"""
    return modeling_config.database

def is_debug_mode() -> bool:
    """Check if debug mode is enabled"""
    return modeling_config.debug