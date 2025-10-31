"""
Base Market Data Provider - Abstract interface for market data providers

Provides standardized interface for fetching market data from various providers
with capability flags and incremental update support.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional

from backend.services.unified_logging import get_logger

logger = get_logger("providers")


@dataclass
class ExternalPropRecord:
    """Normalized external prop record from provider"""
    provider_prop_id: str
    external_player_id: str
    player_name: str
    team_code: str
    prop_category: str  # "over", "under", "yes", "no", etc.
    line_value: float
    updated_ts: datetime
    payout_type: str  # "decimal", "american", "fractional"
    status: str  # "active", "inactive"
    
    # Optional additional fields
    odds_value: Optional[float] = None
    market_type: Optional[str] = None
    game_id: Optional[str] = None
    league: Optional[str] = None


class BaseMarketDataProvider(ABC):
    """Abstract base class for market data providers"""
    
    def __init__(self, provider_name: str):
        self.provider_name = provider_name
        self._last_fetch_timestamp: Optional[datetime] = None
        self.logger = get_logger(f"providers.{provider_name}")
        
    @property
    @abstractmethod
    def supports_incremental(self) -> bool:
        """Whether provider supports incremental updates"""
        pass
        
    @property
    @abstractmethod
    def max_batch_size(self) -> int:
        """Maximum batch size for single request"""
        pass
        
    @abstractmethod
    async def fetch_snapshot(self, limit: Optional[int] = None) -> List[ExternalPropRecord]:
        """
        Fetch complete snapshot of current market data
        
        Args:
            limit: Optional limit on number of records to return
            
        Returns:
            List of normalized external prop records
            
        Raises:
            ProviderError: On provider-specific errors
            ConnectionError: On network/connectivity issues
        """
        pass
        
    @abstractmethod
    async def fetch_incremental(self, since_ts: datetime) -> List[ExternalPropRecord]:
        """
        Fetch incremental updates since timestamp
        
        Args:
            since_ts: Timestamp to fetch updates since
            
        Returns:
            List of updated/new prop records since timestamp
            
        Raises:
            ProviderError: On provider-specific errors
            NotImplementedError: If provider doesn't support incremental updates
        """
        pass
        
    async def health_check(self) -> bool:
        """
        Check provider health and connectivity
        
        Returns:
            True if provider is healthy, False otherwise
        """
        try:
            # Try to fetch a small sample to verify connectivity
            await self.fetch_snapshot(limit=1)
            return True
        except Exception as e:
            self.logger.warning(f"Health check failed for {self.provider_name}: {str(e)}")
            return False
            
    def get_last_fetch_timestamp(self) -> Optional[datetime]:
        """Get timestamp of last successful fetch"""
        return self._last_fetch_timestamp
        
    def update_last_fetch_timestamp(self, timestamp: Optional[datetime] = None) -> None:
        """Update last fetch timestamp"""
        self._last_fetch_timestamp = timestamp or datetime.utcnow()


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