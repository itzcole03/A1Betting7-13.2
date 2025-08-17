"""
Sample Provider B - Mock implementation with higher latency and occasional issues

Simulates a slower provider with occasional missing props and connection issues.
"""

import random
from datetime import datetime, timedelta
from typing import List, Optional

from backend.services.providers.base_provider import (
    BaseMarketDataProvider, 
    ExternalPropRecord,
    ProviderConnectionError,
    ProviderRateLimitError
)


class SampleProviderB(BaseMarketDataProvider):
    """Sample provider with higher latency and occasional issues"""
    
    def __init__(self):
        super().__init__("sample_provider_b")
        self._mock_props = self._generate_mock_props()
        self._request_count = 0
        
    @property
    def supports_incremental(self) -> bool:
        return True
        
    @property
    def max_batch_size(self) -> int:
        return 200  # Smaller batch size
        
    def _generate_mock_props(self) -> List[ExternalPropRecord]:
        """Generate mock prop data with some variations"""
        props = []
        
        # Different teams and players than Provider A
        teams = ["TB", "SD", "MIL", "TOR", "SEA", "MIN", "CLE", "DET"]
        
        players = [
            ("Wander Franco", "TB"),
            ("Fernando Tatis Jr", "SD"),
            ("Christian Yelich", "MIL"),
            ("Vladimir Guerrero Jr", "TOR"),
            ("Julio Rodriguez", "SEA"),
            ("Byron Buxton", "MIN"),
            ("Jose Ramirez", "CLE"),
            ("Spencer Torkelson", "DET")
        ]
        
        prop_categories = [
            ("hits", 1.5), ("runs", 0.5), ("rbis", 0.5),
            ("doubles", 0.5), ("stolen_bases", 0.5), ("total_bases", 2.5)
        ]
        
        # Generate props
        prop_id = 1000  # Different ID range
        for player_name, team in players:
            for category, base_line in prop_categories:
                for market_type in ["over", "under"]:
                    # More variation in lines
                    line_variation = random.uniform(-1.0, 1.0)
                    line_value = max(0.5, base_line + line_variation)
                    
                    prop = ExternalPropRecord(
                        provider_prop_id=f"spb_{prop_id}",
                        external_player_id=f"player_b_{players.index((player_name, team)) + 1}",
                        player_name=player_name,
                        team_code=team,
                        prop_category=market_type,
                        line_value=round(line_value, 1),
                        updated_ts=datetime.utcnow(),
                        payout_type="american",
                        status="active",
                        odds_value=random.uniform(1.70, 2.40),
                        market_type=category,
                        game_id=f"game_b_{random.randint(1, 8)}",
                        league="MLB"
                    )
                    props.append(prop)
                    prop_id += 1
                    
        return props
        
    async def fetch_snapshot(self, limit: Optional[int] = None) -> List[ExternalPropRecord]:
        """Fetch complete snapshot with simulated issues"""
        self.logger.info(f"Fetching snapshot from {self.provider_name}, limit: {limit}")
        
        self._request_count += 1
        
        # Simulate occasional rate limiting (5% chance)
        if random.random() < 0.05:
            raise ProviderRateLimitError(
                self.provider_name, 
                "Rate limit exceeded", 
                Exception("429 Too Many Requests")
            )
            
        # Simulate occasional connection errors (3% chance)
        if random.random() < 0.03:
            raise ProviderConnectionError(
                self.provider_name,
                "Connection timeout",
                Exception("Connection timed out")
            )
        
        # Simulate higher latency
        import asyncio
        await asyncio.sleep(random.uniform(0.5, 1.5))
        
        current_time = datetime.utcnow()
        updated_props = []
        
        props_to_return = self._mock_props[:limit] if limit else self._mock_props
        
        # Occasionally exclude some props (simulate missing data)
        if random.random() < 0.1:  # 10% chance
            exclusion_count = random.randint(1, min(5, len(props_to_return)))
            props_to_return = random.sample(props_to_return, len(props_to_return) - exclusion_count)
            self.logger.warning(f"Provider {self.provider_name}: Missing {exclusion_count} props in response")
        
        for prop in props_to_return:
            updated_prop = ExternalPropRecord(
                provider_prop_id=prop.provider_prop_id,
                external_player_id=prop.external_player_id,
                player_name=prop.player_name,
                team_code=prop.team_code,
                prop_category=prop.prop_category,
                line_value=prop.line_value,
                updated_ts=current_time,
                payout_type=prop.payout_type,
                status=prop.status,
                odds_value=prop.odds_value,
                market_type=prop.market_type,
                game_id=prop.game_id,
                league=prop.league
            )
            updated_props.append(updated_prop)
            
        self.update_last_fetch_timestamp(current_time)
        self.logger.info(f"Retrieved {len(updated_props)} props from {self.provider_name}")
        
        return updated_props
        
    async def fetch_incremental(self, since_ts: datetime) -> List[ExternalPropRecord]:
        """Fetch incremental updates with simulated issues"""
        self.logger.info(f"Fetching incremental from {self.provider_name} since {since_ts}")
        
        self._request_count += 1
        
        # Simulate occasional failures for incremental (2% chance)
        if random.random() < 0.02:
            raise ProviderConnectionError(
                self.provider_name,
                "Incremental fetch failed",
                Exception("Network error")
            )
        
        # Simulate variable latency
        import asyncio
        await asyncio.sleep(random.uniform(0.2, 0.8))
        
        updated_props = []
        current_time = datetime.utcnow()
        
        # More aggressive update simulation - 20-40% of props
        num_updates = random.randint(len(self._mock_props) // 5, (len(self._mock_props) * 2) // 5)
        props_to_update = random.sample(self._mock_props, min(num_updates, len(self._mock_props)))
        
        for prop in props_to_update:
            # Larger line movements
            line_change = random.uniform(-0.5, 0.5)
            new_line = max(0.5, prop.line_value + line_change)
            
            # More dramatic odds changes
            odds_change = random.uniform(-0.3, 0.3)
            base_odds = prop.odds_value or 2.0
            new_odds = max(1.1, base_odds + odds_change)
            
            # Occasionally mark props as inactive (1% chance per prop)
            status = "inactive" if random.random() < 0.01 else "active"
            
            updated_prop = ExternalPropRecord(
                provider_prop_id=prop.provider_prop_id,
                external_player_id=prop.external_player_id,
                player_name=prop.player_name,
                team_code=prop.team_code,
                prop_category=prop.prop_category,
                line_value=round(new_line, 1),
                updated_ts=current_time,
                payout_type=prop.payout_type,
                status=status,
                odds_value=round(new_odds, 2),
                market_type=prop.market_type,
                game_id=prop.game_id,
                league=prop.league
            )
            updated_props.append(updated_prop)
            
        self.update_last_fetch_timestamp(current_time)
        self.logger.info(f"Retrieved {len(updated_props)} incremental updates from {self.provider_name}")
        
        return updated_props
        
    async def health_check(self) -> bool:
        """Health check with occasional failures"""
        # Simulate health check failures based on request history
        if self._request_count > 100 and random.random() < 0.1:  # 10% chance after 100 requests
            self.logger.warning(f"Provider {self.provider_name}: Health check failed")
            return False
            
        return await super().health_check()