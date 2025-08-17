"""
NBA Provider Stub

Simulates realistic data from an external NBA proposition betting provider.
This stub generates realistic prop market data for development and testing.

TODO: Replace with real provider client implementation.
"""

import asyncio
import random
from datetime import datetime, timedelta
from typing import List, Optional
import logging

from ..models.dto import RawExternalPropDTO, PayoutType

logger = logging.getLogger(__name__)


class NBAProviderStub:
    """
    Stub implementation of NBA proposition betting data provider.
    
    Generates realistic market data for development and testing purposes.
    Includes retry logic and simulated network behavior.
    """
    
    def __init__(self, base_delay: float = 0.1, failure_rate: float = 0.05):
        """
        Initialize the provider stub.
        
        Args:
            base_delay: Base network delay in seconds
            failure_rate: Probability of request failure (0.0 to 1.0)
        """
        self.base_delay = base_delay
        self.failure_rate = failure_rate
        self.provider_name = "nba_stub_provider"
        
        # Realistic NBA player data
        self.nba_players = [
            {"name": "LeBron James", "team": "LAL", "position": "SF", "id": "lebron_001"},
            {"name": "Stephen Curry", "team": "GSW", "position": "PG", "id": "curry_001"},
            {"name": "Kevin Durant", "team": "PHX", "position": "SF", "id": "durant_001"},
            {"name": "Giannis Antetokounmpo", "team": "MIL", "position": "PF", "id": "giannis_001"},
            {"name": "Joel Embiid", "team": "PHI", "position": "C", "id": "embiid_001"},
            {"name": "Nikola Jokic", "team": "DEN", "position": "C", "id": "jokic_001"},
            {"name": "Jayson Tatum", "team": "BOS", "position": "SF", "id": "tatum_001"},
            {"name": "Luka Doncic", "team": "DAL", "position": "PG", "id": "luka_001"},
            {"name": "Damian Lillard", "team": "MIL", "position": "PG", "id": "lillard_001"},
            {"name": "Anthony Davis", "team": "LAL", "position": "PF", "id": "davis_001"},
            {"name": "Kawhi Leonard", "team": "LAC", "position": "SF", "id": "kawhi_001"},
            {"name": "Jimmy Butler", "team": "MIA", "position": "SF", "id": "butler_001"},
            {"name": "Paul George", "team": "LAC", "position": "SF", "id": "george_001"},
            {"name": "Jaylen Brown", "team": "BOS", "position": "SG", "id": "brown_001"},
            {"name": "Devin Booker", "team": "PHX", "position": "SG", "id": "booker_001"},
        ]
        
        # Prop categories with realistic line ranges
        self.prop_categories = {
            "Points": {"min": 15.5, "max": 35.5, "step": 0.5},
            "Assists": {"min": 3.5, "max": 12.5, "step": 0.5},
            "Rebounds": {"min": 4.5, "max": 15.5, "step": 0.5},
            "Points + Rebounds + Assists": {"min": 25.5, "max": 55.5, "step": 0.5},
            "3-Point Field Goals Made": {"min": 1.5, "max": 5.5, "step": 0.5},
            "Steals": {"min": 0.5, "max": 2.5, "step": 0.5},
            "Blocks": {"min": 0.5, "max": 2.5, "step": 0.5},
        }
        
        # Cache for consistent line generation
        self._line_cache = {}
    
    async def fetch_current_props(self, limit: Optional[int] = None) -> List[RawExternalPropDTO]:
        """
        Fetch current proposition bets from the provider.
        
        Args:
            limit: Maximum number of props to return
            
        Returns:
            List of raw proposition data from provider
            
        Raises:
            ProviderError: If the provider request fails after retries
        """
        logger.info(f"Fetching NBA props from {self.provider_name}, limit={limit}")
        
        # Simulate network delay
        await asyncio.sleep(self.base_delay)
        
        # Simulate random failures for testing retry logic
        if random.random() < self.failure_rate:
            raise ProviderError(f"Simulated network failure from {self.provider_name}")
        
        # Generate realistic props
        props = []
        target_count = limit or 50  # Default to 50 props if no limit specified
        
        # Ensure we have enough player/prop combinations
        total_possible = len(self.nba_players) * len(self.prop_categories)
        actual_count = min(target_count, total_possible)
        
        generated_combos = set()
        
        while len(props) < actual_count:
            player = random.choice(self.nba_players)
            prop_category = random.choice(list(self.prop_categories.keys()))
            
            combo_key = f"{player['id']}_{prop_category}"
            if combo_key in generated_combos:
                continue
                
            generated_combos.add(combo_key)
            
            # Generate realistic line value
            prop_config = self.prop_categories[prop_category]
            line_value = self._generate_line_value(combo_key, prop_config)
            
            # Generate realistic odds
            over_odds, under_odds = self._generate_odds()
            
            # Create timestamp with slight variations for testing
            base_time = datetime.utcnow()
            variation_seconds = random.randint(-300, 0)  # Up to 5 minutes ago
            timestamp = base_time + timedelta(seconds=variation_seconds)
            
            prop = RawExternalPropDTO(
                external_player_id=player["id"],
                player_name=player["name"],
                team_code=player["team"],
                prop_category=prop_category,
                line_value=line_value,
                provider_prop_id=f"{self.provider_name}_{combo_key}_{int(timestamp.timestamp())}",
                payout_type=PayoutType.STANDARD,
                over_odds=over_odds,
                under_odds=under_odds,
                updated_ts=timestamp.isoformat(),
                provider_name=self.provider_name,
                additional_data={
                    "position": player["position"],
                    "confidence": random.uniform(0.75, 0.95),
                    "market_type": "regular"
                }
            )
            
            props.append(prop)
        
        logger.info(f"Successfully fetched {len(props)} NBA props")
        return props
    
    async def fetch_current_props_with_retry(self, limit: Optional[int] = None, max_retries: int = 2) -> List[RawExternalPropDTO]:
        """
        Fetch props with exponential backoff retry logic.
        
        Args:
            limit: Maximum number of props to return
            max_retries: Maximum number of retry attempts
            
        Returns:
            List of raw proposition data
            
        Raises:
            ProviderError: If all retries are exhausted
        """
        for attempt in range(max_retries + 1):
            try:
                return await self.fetch_current_props(limit)
            except ProviderError as e:
                if attempt == max_retries:
                    logger.error(f"All retry attempts exhausted for {self.provider_name}: {e}")
                    raise
                
                # Exponential backoff
                backoff_delay = (2 ** attempt) * self.base_delay
                logger.warning(f"Provider request failed (attempt {attempt + 1}/{max_retries + 1}), "
                             f"retrying in {backoff_delay:.2f}s: {e}")
                await asyncio.sleep(backoff_delay)
        
        # This should never be reached due to the raise in the except block
        raise ProviderError("Unexpected error in retry logic")
    
    def _generate_line_value(self, cache_key: str, prop_config: dict) -> float:
        """Generate consistent line values using cache."""
        if cache_key not in self._line_cache:
            min_val = prop_config["min"]
            max_val = prop_config["max"]
            step = prop_config["step"]
            
            # Generate value in steps
            num_steps = int((max_val - min_val) / step)
            step_choice = random.randint(0, num_steps)
            line_value = min_val + (step_choice * step)
            
            self._line_cache[cache_key] = line_value
        
        return self._line_cache[cache_key]
    
    def _generate_odds(self) -> tuple[float, float]:
        """Generate realistic American odds for over/under bets."""
        # Most props have odds around -110 to +110
        over_odds = random.uniform(-120, -100)
        under_odds = random.uniform(-120, -100)
        
        # Ensure odds are roughly balanced (juice for house)
        total_implied = (100 / abs(over_odds) if over_odds < 0 else over_odds / (over_odds + 100)) + \
                       (100 / abs(under_odds) if under_odds < 0 else under_odds / (under_odds + 100))
        
        if total_implied < 1.05:  # Add some juice if too balanced
            adjustment = random.choice([-5, 5])
            over_odds += adjustment
            under_odds -= adjustment
        
        return over_odds, under_odds
    
    def clear_cache(self):
        """Clear the line cache for testing different scenarios."""
        self._line_cache.clear()
    
    async def health_check(self) -> bool:
        """
        Check if the provider is available.
        
        Returns:
            True if provider is healthy, False otherwise
        """
        try:
            # Simulate health check with short timeout
            await asyncio.wait_for(self.fetch_current_props(limit=1), timeout=5.0)
            return True
        except Exception as e:
            logger.warning(f"Health check failed for {self.provider_name}: {e}")
            return False


class ProviderError(Exception):
    """Exception raised when provider requests fail."""
    pass


# Default instance for convenience
default_nba_provider = NBAProviderStub()