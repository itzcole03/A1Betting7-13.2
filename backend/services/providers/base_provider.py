"""
Base Market Data Provider - Abstract interface for market data providers

Provides standardized interface for fetching market data from various providers
with capability flags and incremental update support.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional, Dict, Set, Any

from backend.services.unified_logging import get_logger
from backend.config.sport_settings import get_default_sport

logger = get_logger("providers")


@dataclass
class ExternalPropRecord:
    """Normalized external prop record from provider with sport dimension"""
    provider_prop_id: str
    external_player_id: str
    player_name: str
    team_code: str
    prop_category: str  # "over", "under", "yes", "no", etc.
    line_value: float
    updated_ts: datetime
    payout_type: str  # "decimal", "american", "fractional"
    status: str  # "active", "inactive"
    sport: Optional[str] = None  # Sport dimension for multi-sport support
    
    # Optional additional fields
    odds_value: Optional[float] = None
    market_type: Optional[str] = None
    game_id: Optional[str] = None
    league: Optional[str] = None
    
    def __post_init__(self):
        """Ensure sport field is populated with default if not provided"""
        if self.sport is None:
            # Use object.__setattr__ for dataclass immutability
            object.__setattr__(self, 'sport', get_default_sport())


@dataclass
class ProviderCapabilities:
    """Provider capability flags for different sports"""
    supports_incremental: bool = False
    max_batch_size: int = 100
    supported_sports: Optional[Set[str]] = None
    supports_live_odds: bool = False
    supports_player_props: bool = True
    supports_team_props: bool = False
    rate_limit_per_minute: int = 60
    
    def __post_init__(self):
        if self.supported_sports is None:
            object.__setattr__(self, 'supported_sports', {get_default_sport()})


class BaseMarketDataProvider(ABC):
    """Abstract base class for market data providers with multi-sport support"""
    
    def __init__(self, provider_name: str, capabilities: Optional[ProviderCapabilities] = None):
        self.provider_name = provider_name
        self.capabilities = capabilities or ProviderCapabilities()
        self._last_fetch_timestamp: Dict[str, Optional[datetime]] = {}  # per-sport timestamps
        self.logger = get_logger(f"providers.{provider_name}")
        
    @property
    def supports_incremental(self) -> bool:
        """Whether provider supports incremental updates"""
        return self.capabilities.supports_incremental
        
    @property
    def max_batch_size(self) -> int:
        """Maximum batch size for single request"""
        return self.capabilities.max_batch_size
        
    @property
    def supported_sports(self) -> Set[str]:
        """Set of sports this provider supports"""
        return self.capabilities.supported_sports or {get_default_sport()}
        
    def supports_sport(self, sport: str) -> bool:
        """Check if provider supports a specific sport"""
        return sport in self.supported_sports
        
    @abstractmethod
    async def fetch_snapshot(self, sport: str, limit: Optional[int] = None) -> List[ExternalPropRecord]:
        """
        Fetch complete snapshot of current market data for specific sport
        
        Args:
            sport: Sport to fetch data for
            limit: Optional limit on number of records to return
            
        Returns:
            List of normalized external prop records
            
        Raises:
            ProviderError: On provider-specific errors
            ConnectionError: On network/connectivity issues
            ValueError: If sport is not supported
        """
        pass
        
    @abstractmethod
    async def fetch_incremental(self, sport: str, since_ts: datetime) -> List[ExternalPropRecord]:
        """
        Fetch incremental updates since timestamp for specific sport
        
        Args:
            sport: Sport to fetch updates for
            since_ts: Timestamp to fetch updates since
            
        Returns:
            List of updated/new prop records since timestamp
            
        Raises:
            ProviderError: On provider-specific errors
            NotImplementedError: If provider doesn't support incremental updates
            ValueError: If sport is not supported
        """
        pass
        
    async def health_check(self, sport: Optional[str] = None) -> bool:
        """
        Check provider health and connectivity
        
        Args:
            sport: Optional sport to check specifically (defaults to first supported sport)
        
        Returns:
            True if provider is healthy, False otherwise
        """
        try:
            # Use specified sport or default to first supported sport
            check_sport = sport or next(iter(self.supported_sports))
            
            if not self.supports_sport(check_sport):
                self.logger.warning(f"Health check requested for unsupported sport: {check_sport}")
                return False
            
            # Try to fetch a small sample to verify connectivity
            await self.fetch_snapshot(check_sport, limit=1)
            return True
        except Exception as e:
            self.logger.warning(f"Health check failed for {self.provider_name}: {str(e)}")
            return False
            
    def get_last_fetch_timestamp(self, sport: str) -> Optional[datetime]:
        """Get timestamp of last successful fetch for specific sport"""
        return self._last_fetch_timestamp.get(sport)
        
    def update_last_fetch_timestamp(self, sport: str, timestamp: Optional[datetime] = None) -> None:
        """Update last fetch timestamp for specific sport"""
        self._last_fetch_timestamp[sport] = timestamp or datetime.utcnow()
        
    def get_provider_status(self, sport: Optional[str] = None) -> Dict[str, Any]:
        """Get comprehensive provider status"""
        status = {
            "provider_name": self.provider_name,
            "supported_sports": list(self.supported_sports),
            "capabilities": {
                "supports_incremental": self.capabilities.supports_incremental,
                "max_batch_size": self.capabilities.max_batch_size,
                "supports_live_odds": self.capabilities.supports_live_odds,
                "supports_player_props": self.capabilities.supports_player_props,
                "supports_team_props": self.capabilities.supports_team_props,
                "rate_limit_per_minute": self.capabilities.rate_limit_per_minute
            }
        }
        
        if sport:
            status.update({
                "sport": sport,
                "supports_sport": self.supports_sport(sport),
                "last_fetch_timestamp": self.get_last_fetch_timestamp(sport)
            })
        else:
            status["last_fetch_timestamps"] = dict(self._last_fetch_timestamp)
            
        return status


class ProviderError(Exception):
    """Base exception for provider-specific errors"""
    
    def __init__(self, provider_name: str, message: str, original_error: Optional[Exception] = None):
        self.provider_name = provider_name
        self.original_error = original_error
        super().__init__(f"Provider {provider_name}: {message}")


class ProviderConnectionError(ProviderError):
    """Connection-related provider error"""
    pass


class ProviderRateLimitError(ProviderError):
    """Rate limit exceeded error"""
    pass


class ProviderDataError(ProviderError):
    """Data format/validation error"""
    pass