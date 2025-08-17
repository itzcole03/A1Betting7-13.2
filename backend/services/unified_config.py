"""
Unified Configuration Management System

Provides centralized configuration handling across the entire application.
Supports environment variables, file-based config, and runtime overrides.
"""

import json
import logging
import os
from dataclasses import dataclass, field, field
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
class LLMConfig:
    """LLM (Large Language Model) configuration"""
    
    # Provider settings
    provider: str = "local_stub"  # "openai" | "local_stub" 
    max_tokens: int = 512
    temperature: float = 0.2
    timeout_sec: int = 25
    prompt_template_version: str = "v1"
    
    # Rate limiting
    rate_limit_per_min: int = 60
    
    # Caching
    cache_ttl_sec: int = 3600  # 1 hour
    allow_batch_prefetch: bool = True
    
    # Logging and debugging
    log_prompt_debug: bool = False  # Enable truncated prompt logging
    
    # OpenAI specific settings
    openai_model: str = "gpt-3.5-turbo"
    openai_organization: Optional[str] = None


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
class StreamingConfig:
    """Real-time market data streaming configuration"""
    
    # Polling facade settings
    poll_interval_sec: int = 20
    jitter_sec: int = 5
    event_buffer: int = 1000
    
    # Provider management
    provider_default_enabled: bool = True
    provider_health_check_interval_sec: int = 300  # 5 minutes
    provider_timeout_sec: int = 30
    
    # Delta detection settings
    valuation_recompute_debounce_sec: int = 10
    optimization_live_refresh_min_changed_edges: int = 1
    
    # Portfolio rationale settings
    portfolio_rationale_cache_ttl_sec: int = 3600  # 1 hour
    llm_portfolio_rationale_enabled: bool = True


@dataclass
class CorrelationConfig:
    """Correlation analysis configuration"""

    # Minimum samples required for correlation calculation
    min_samples: int = 8
    
    # Correlation threshold for clustering
    threshold_cluster: float = 0.4
    
    # Correlation adjustment factor for parlay calculations
    adjustment_factor: float = 0.5
    
    # Enable correlation-adjusted probability calculations
    allow_correlation_adjustment: bool = True


@dataclass
class TicketingConfig:
    """Parlay ticketing configuration"""

    # Ticket constraints
    max_legs: int = 6
    min_legs: int = 2
    
    # Maximum average correlation allowed within a ticket
    max_avg_correlation: float = 0.6
    
    # Base payout multiplier (placeholder for more sophisticated payout schema)
    parlay_base_multiplier: float = 3.0
    
    # LLM integration
    llm_prefetch_on_ticket: bool = False


@dataclass
class OptimizationConfig:
    """Portfolio optimization configuration"""
    
    # Optimization engine settings
    enabled: bool = True
    default_objective: str = "max_ev"  # "max_ev", "max_ev_var_ratio", "target_probability"
    
    # Beam search parameters
    default_beam_width: int = 100
    max_beam_width: int = 1000
    default_max_iterations: int = 1000
    max_iterations_limit: int = 10000
    
    # Portfolio constraints
    max_total_stake: float = 10000.0
    min_edge_threshold: float = 0.02
    max_correlation_threshold: float = 0.7
    max_props_per_portfolio: int = 50
    
    # Correlation method preferences
    default_correlation_method: str = "factor"  # "pairwise", "factor", "copula"
    enable_factor_model: bool = True
    enable_copula_modeling: bool = True
    
    # Performance settings
    enable_parallel_processing: bool = True
    max_worker_threads: int = 4
    computation_timeout_sec: int = 300  # 5 minutes
    
    # Caching
    cache_optimization_results: bool = True
    optimization_cache_ttl_sec: int = 3600  # 1 hour
    
    # Task scheduling
    enable_background_optimization: bool = True
    default_task_priority: str = "medium"  # "low", "medium", "high"
    max_concurrent_optimizations: int = 3


@dataclass
class MonteCarloConfig:
    """Monte Carlo simulation configuration"""
    
    # Simulation parameters
    default_min_simulations: int = 10000
    default_max_simulations: int = 100000
    max_simulations_limit: int = 1000000
    default_confidence_level: float = 0.95
    
    # Convergence criteria
    convergence_tolerance: float = 0.001
    convergence_window: int = 1000
    adaptive_stopping_enabled: bool = True
    
    # Performance optimization
    enable_factor_acceleration: bool = True
    batch_size: int = 1000
    enable_parallel_sampling: bool = True
    
    # Correlation modeling
    default_correlation_method: str = "factor"  # "pairwise", "factor", "copula"
    correlation_lookback_days: int = 30
    min_correlation_observations: int = 20
    
    # Caching
    cache_simulation_results: bool = True
    simulation_cache_ttl_sec: int = 1800  # 30 minutes
    
    # Statistical validation
    enable_statistical_tests: bool = True
    ks_test_threshold: float = 0.05
    confidence_interval_method: str = "percentile"  # "percentile", "bootstrap"


@dataclass
class PortfolioCorrelationConfig:
    """Advanced correlation modeling configuration"""
    
    # Data requirements
    min_observations: int = 20
    max_lookback_days: int = 365
    default_lookback_days: int = 30
    
    # Correlation matrix computation
    enable_psd_enforcement: bool = True  # Positive Semi-Definite enforcement
    shrinkage_enabled: bool = True
    shrinkage_intensity: float = 0.1
    
    # Factor model settings
    auto_select_factors: bool = True
    max_factors: int = 10
    min_factor_variance_explained: float = 0.8
    factor_rotation: str = "varimax"  # "varimax", "promax", "none"
    
    # Copula modeling
    copula_type: str = "gaussian"  # "gaussian", "t", "clayton", "gumbel"
    copula_fit_method: str = "mle"  # "mle", "ifm", "cmle"
    
    # Validation and diagnostics
    enable_correlation_diagnostics: bool = True
    eigenvalue_tolerance: float = 1e-8
    condition_number_threshold: float = 1e12
    
    # Caching
    cache_correlation_matrices: bool = True
    correlation_cache_ttl_sec: int = 7200  # 2 hours
    cache_factor_models: bool = True
    factor_model_cache_ttl_sec: int = 14400  # 4 hours


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
class RiskManagementConfig:
    """Risk management and exposure configuration"""
    
    # Bankroll Management
    risk_min_stake: float = 1.0
    risk_max_stake_pct_bankroll: float = 0.05  # 5% max stake per bet
    
    # Exposure Limits (as percentage of bankroll)
    exposure_max_player_pct: float = 0.15  # 15% max exposure per player
    exposure_max_prop_type_pct: float = 0.25  # 25% max exposure per prop type
    exposure_max_cluster_pct: float = 0.20  # 20% max exposure per correlation cluster  
    exposure_max_daily_stake: float = 0.3  # 30% max daily aggregate exposure
    
    # Risk Analysis Thresholds
    risk_max_correlated_edges: int = 5  # Max edges in same correlation cluster
    risk_max_edges_per_player: int = 3  # Max edges per player
    risk_max_edges_per_prop_type: int = 5  # Max edges per prop type
    risk_max_legs_per_cluster: int = 3  # Max legs per cluster in single ticket
    risk_low_ev_threshold: float = 0.02  # 2% EV threshold for "low EV" classification
    risk_min_combined_probability: float = 0.01  # 1% minimum combined probability
    
    # Alert System
    alert_evaluation_interval_seconds: int = 60  # Alert evaluation interval
    alert_cooldown_min_sec: int = 300  # 5 minutes between same alert
    alert_max_batch: int = 50  # Max alerts per batch
    bankroll_drawdown_threshold: float = 0.7  # Alert when bankroll drops to 70%
    
    # Personalization
    interest_decay_rate: float = 0.1  # Daily decay rate for interest signals
    edge_recommendation_limit: int = 50  # Max edges returned in recommendations
    
    # LLM Integration
    llm_explain_stake: bool = False  # Enable LLM stake explanations


@dataclass
class SportsConfig:
    """Multi-sport configuration"""
    
    # Supported sports and their enablement status
    sports_enabled: Dict[str, bool] = field(default_factory=lambda: {
        "NBA": True,  # Currently supported
        "NFL": False,  # Future implementation
        "MLB": False,  # Future implementation
        "NHL": False,  # Future implementation
        "NCAA_BB": False,  # Future implementation
        "NCAA_FB": False,  # Future implementation
    })
    
    # Default sport for legacy functionality
    default_sport: str = "NBA"
    
    # Per-sport polling intervals (seconds)
    polling_intervals: Dict[str, int] = field(default_factory=lambda: {
        "NBA": 20,   # Fast polling for active NBA season
        "NFL": 30,   # Slower for weekly games
        "MLB": 15,   # Frequent for daily games
        "NHL": 25,   # Medium polling
        "NCAA_BB": 30,  # Tournament dependent
        "NCAA_FB": 60,  # Weekly games
    })
    
    # Per-sport provider configurations
    provider_configs: Dict[str, Dict[str, Any]] = field(default_factory=lambda: {
        "NBA": {
            "enabled_providers": ["stub", "draftkings", "fanduel"],
            "priority_provider": "stub",
            "timeout_sec": 30,
            "max_retries": 3,
        },
        "NFL": {
            "enabled_providers": ["stub"],
            "priority_provider": "stub", 
            "timeout_sec": 45,
            "max_retries": 2,
        },
        "MLB": {
            "enabled_providers": ["stub"],
            "priority_provider": "stub",
            "timeout_sec": 30,
            "max_retries": 3,
        }
    })
    
    # Sport-specific data retention policies
    data_retention_days: Dict[str, int] = field(default_factory=lambda: {
        "NBA": 180,  # Full season + playoffs
        "NFL": 365,  # Longer retention for weekly data
        "MLB": 180,  # Baseball season
        "NHL": 180,  # Hockey season
        "NCAA_BB": 90,  # Tournament season
        "NCAA_FB": 120, # College football season
    })
    
    # Sport-specific ingestion limits
    ingestion_limits: Dict[str, int] = field(default_factory=lambda: {
        "NBA": 500,   # High prop volume
        "NFL": 1000,  # Many prop types
        "MLB": 400,   # Moderate volume
        "NHL": 300,   # Moderate volume  
        "NCAA_BB": 200,  # Tournament focus
        "NCAA_FB": 250,  # Weekend focus
    })


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
    llm: LLMConfig = field(default_factory=LLMConfig)
    external_apis: ExternalAPIConfig = field(default_factory=ExternalAPIConfig)
    logging: LoggingConfig = field(default_factory=LoggingConfig)
    performance: PerformanceConfig = field(default_factory=PerformanceConfig)
    streaming: StreamingConfig = field(default_factory=StreamingConfig)
    correlation: CorrelationConfig = field(default_factory=CorrelationConfig)
    ticketing: TicketingConfig = field(default_factory=TicketingConfig)
    security: SecurityConfig = field(default_factory=SecurityConfig)
    risk: RiskManagementConfig = field(default_factory=RiskManagementConfig)
    sports: SportsConfig = field(default_factory=SportsConfig)
    
    # New portfolio optimization configurations
    optimization: OptimizationConfig = field(default_factory=OptimizationConfig)
    monte_carlo: MonteCarloConfig = field(default_factory=MonteCarloConfig)
    portfolio_correlation: PortfolioCorrelationConfig = field(default_factory=PortfolioCorrelationConfig)


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
            # LLM
            "LLM_PROVIDER": ("llm.provider", str),
            "LLM_MAX_TOKENS": ("llm.max_tokens", int),
            "LLM_TEMPERATURE": ("llm.temperature", float),
            "LLM_TIMEOUT_SEC": ("llm.timeout_sec", int),
            "LLM_PROMPT_TEMPLATE_VERSION": ("llm.prompt_template_version", str),
            "LLM_RATE_LIMIT_PER_MIN": ("llm.rate_limit_per_min", int),
            "LLM_CACHE_TTL_SEC": ("llm.cache_ttl_sec", int),
            "LLM_ALLOW_BATCH_PREFETCH": ("llm.allow_batch_prefetch", bool),
            "LLM_LOG_PROMPT_DEBUG": ("llm.log_prompt_debug", bool),
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
            
            # Portfolio optimization settings
            "OPTIMIZATION_ENABLED": ("optimization.enabled", bool),
            "OPTIMIZATION_DEFAULT_OBJECTIVE": ("optimization.default_objective", str),
            "OPTIMIZATION_BEAM_WIDTH": ("optimization.default_beam_width", int),
            "OPTIMIZATION_MAX_ITERATIONS": ("optimization.default_max_iterations", int),
            "OPTIMIZATION_MAX_TOTAL_STAKE": ("optimization.max_total_stake", float),
            "OPTIMIZATION_MIN_EDGE_THRESHOLD": ("optimization.min_edge_threshold", float),
            "OPTIMIZATION_MAX_CORRELATION_THRESHOLD": ("optimization.max_correlation_threshold", float),
            "OPTIMIZATION_CORRELATION_METHOD": ("optimization.default_correlation_method", str),
            "OPTIMIZATION_ENABLE_FACTOR_MODEL": ("optimization.enable_factor_model", bool),
            "OPTIMIZATION_MAX_WORKER_THREADS": ("optimization.max_worker_threads", int),
            "OPTIMIZATION_TIMEOUT_SEC": ("optimization.computation_timeout_sec", int),
            
            # Monte Carlo settings
            "MONTE_CARLO_MIN_SIMULATIONS": ("monte_carlo.default_min_simulations", int),
            "MONTE_CARLO_MAX_SIMULATIONS": ("monte_carlo.default_max_simulations", int),
            "MONTE_CARLO_CONFIDENCE_LEVEL": ("monte_carlo.default_confidence_level", float),
            "MONTE_CARLO_CONVERGENCE_TOLERANCE": ("monte_carlo.convergence_tolerance", float),
            "MONTE_CARLO_ENABLE_FACTOR_ACCELERATION": ("monte_carlo.enable_factor_acceleration", bool),
            "MONTE_CARLO_BATCH_SIZE": ("monte_carlo.batch_size", int),
            "MONTE_CARLO_CORRELATION_METHOD": ("monte_carlo.default_correlation_method", str),
            "MONTE_CARLO_LOOKBACK_DAYS": ("monte_carlo.correlation_lookback_days", int),
            
            # Portfolio correlation settings
            "PORTFOLIO_CORRELATION_MIN_OBSERVATIONS": ("portfolio_correlation.min_observations", int),
            "PORTFOLIO_CORRELATION_LOOKBACK_DAYS": ("portfolio_correlation.default_lookback_days", int),
            "PORTFOLIO_CORRELATION_ENABLE_PSD": ("portfolio_correlation.enable_psd_enforcement", bool),
            "PORTFOLIO_CORRELATION_SHRINKAGE_ENABLED": ("portfolio_correlation.shrinkage_enabled", bool),
            "PORTFOLIO_CORRELATION_MAX_FACTORS": ("portfolio_correlation.max_factors", int),
            "PORTFOLIO_CORRELATION_COPULA_TYPE": ("portfolio_correlation.copula_type", str),
            
            # Streaming settings
            "STREAM_POLL_INTERVAL_SEC": ("streaming.poll_interval_sec", int),
            "STREAM_JITTER_SEC": ("streaming.jitter_sec", int),
            "STREAM_EVENT_BUFFER": ("streaming.event_buffer", int),
            "PROVIDER_DEFAULT_ENABLED": ("streaming.provider_default_enabled", bool),
            "PROVIDER_HEALTH_CHECK_INTERVAL_SEC": ("streaming.provider_health_check_interval_sec", int),
            "PROVIDER_TIMEOUT_SEC": ("streaming.provider_timeout_sec", int),
            "VALUATION_RECOMPUTE_DEBOUNCE_SEC": ("streaming.valuation_recompute_debounce_sec", int),
            "OPTIMIZATION_LIVE_REFRESH_MIN_CHANGED_EDGES": ("streaming.optimization_live_refresh_min_changed_edges", int),
            "PORTFOLIO_RATIONALE_CACHE_TTL_SEC": ("streaming.portfolio_rationale_cache_ttl_sec", int),
            "LLM_PORTFOLIO_RATIONALE_ENABLED": ("streaming.llm_portfolio_rationale_enabled", bool),
            
            # Sports settings
            "SPORTS_DEFAULT": ("sports.default_sport", str),
            "SPORTS_NBA_ENABLED": ("sports.sports_enabled.NBA", bool),
            "SPORTS_NFL_ENABLED": ("sports.sports_enabled.NFL", bool),
            "SPORTS_MLB_ENABLED": ("sports.sports_enabled.MLB", bool),
            "SPORTS_NHL_ENABLED": ("sports.sports_enabled.NHL", bool),
            "SPORTS_NBA_POLL_INTERVAL": ("sports.polling_intervals.NBA", int),
            "SPORTS_NFL_POLL_INTERVAL": ("sports.polling_intervals.NFL", int),
            "SPORTS_MLB_POLL_INTERVAL": ("sports.polling_intervals.MLB", int),
            "SPORTS_NHL_POLL_INTERVAL": ("sports.polling_intervals.NHL", int),
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

    def get_llm_config(self) -> LLMConfig:
        """Get LLM configuration"""
        return self._config.llm

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

    def get_streaming_config(self) -> StreamingConfig:
        """Get streaming configuration"""
        return self._config.streaming

    def get_correlation_config(self) -> CorrelationConfig:
        """Get correlation configuration"""
        return self._config.correlation

    def get_ticketing_config(self) -> TicketingConfig:
        """Get ticketing configuration"""
        return self._config.ticketing

    def get_risk_config(self) -> RiskManagementConfig:
        """Get risk management configuration"""
        return self._config.risk

    def set_runtime_override(self, path: str, value: Any):
        """Set runtime configuration override"""
        self._runtime_overrides[path] = value
        self._set_nested_config(path, value, ConfigSource.RUNTIME)

    def get_config_value(self, path: str, default: Any = None) -> Any:
        """Get configuration value by path"""
        try:
            # Handle direct risk config keys
            risk_config_keys = {
                "RISK_MIN_STAKE": "risk.risk_min_stake",
                "RISK_MAX_STAKE_PCT_BANKROLL": "risk.risk_max_stake_pct_bankroll",
                "EXPOSURE_MAX_PLAYER_PCT": "risk.exposure_max_player_pct",
                "EXPOSURE_MAX_PROP_TYPE_PCT": "risk.exposure_max_prop_type_pct",
                "EXPOSURE_MAX_CLUSTER_PCT": "risk.exposure_max_cluster_pct",
                "EXPOSURE_MAX_DAILY_STAKE": "risk.exposure_max_daily_stake",
                "RISK_MAX_CORRELATED_EDGES": "risk.risk_max_correlated_edges",
                "RISK_MAX_EDGES_PER_PLAYER": "risk.risk_max_edges_per_player",
                "RISK_MAX_EDGES_PER_PROP_TYPE": "risk.risk_max_edges_per_prop_type",
                "RISK_MAX_LEGS_PER_CLUSTER": "risk.risk_max_legs_per_cluster",
                "RISK_LOW_EV_THRESHOLD": "risk.risk_low_ev_threshold",
                "RISK_MIN_COMBINED_PROBABILITY": "risk.risk_min_combined_probability",
                "ALERT_COOLDOWN_MIN_SEC": "risk.alert_cooldown_min_sec",
                "ALERT_MAX_BATCH": "risk.alert_max_batch",
                "BANKROLL_DRAWDOWN_THRESHOLD": "risk.bankroll_drawdown_threshold",
                "INTEREST_DECAY_RATE": "risk.interest_decay_rate",
                "EDGE_RECOMMENDATION_LIMIT": "risk.edge_recommendation_limit",
                "LLM_EXPLAIN_STAKE": "risk.llm_explain_stake",
            }
            
            # Map direct keys to config paths
            if path in risk_config_keys:
                path = risk_config_keys[path]
            
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
        # Handle environment safely in case it's not an enum
        try:
            env_value = self._config.environment.value if hasattr(self._config.environment, 'value') else str(self._config.environment)
        except Exception:
            env_value = str(self._config.environment)
            
        return {
            "environment": env_value,
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


def get_correlation_config() -> CorrelationConfig:
    """Get correlation configuration"""
    return unified_config.get_correlation_config()


def get_ticketing_config() -> TicketingConfig:
    """Get ticketing configuration"""
    return unified_config.get_ticketing_config()


def get_risk_management_config() -> RiskManagementConfig:
    """Get risk management configuration"""
    return unified_config.get_risk_config()


def get_streaming_config() -> StreamingConfig:
    """Get streaming configuration"""
    return unified_config.get_streaming_config()


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
    "StreamingConfig",
    "CorrelationConfig",
    "TicketingConfig",
    "SecurityConfig",
    "Environment",
    "unified_config",
    "get_config",
    "get_database_config",
    "get_cache_config",
    "get_api_config",
    "get_ml_config",
    "get_correlation_config",
    "get_ticketing_config",
    "get_risk_management_config",
    "get_streaming_config",
    "is_development",
    "is_production",
]
