"""
Sample Provider A - Mock implementation for testing streaming system

Simulates a fast, reliable provider with minor variations in data.
"""

import random
from datetime import datetime, timedelta
from typing import List, Optional

from backend.services.providers.base_provider import BaseMarketDataProvider, ExternalPropRecord


class SampleProviderA(BaseMarketDataProvider):
    """Sample provider with fast, reliable data"""
    
    def __init__(self):
        super().__init__("sample_provider_a")
        self._mock_props = self._generate_mock_props()
        
    @property
    def supports_incremental(self) -> bool:
        return True
        
    @property
    def max_batch_size(self) -> int:
        return 500
        
    def _generate_mock_props(self) -> List[ExternalPropRecord]:
        """Generate mock prop data for testing"""
        props = []
        
        # Sample teams
        teams = ["LAD", "NYY", "HOU", "ATL", "BOS", "SF", "CHC", "NYM"]
        
        # Sample players
        players = [
            ("Mookie Betts", "LAD"),
            ("Aaron Judge", "NYY"),
            ("Alex Bregman", "HOU"),
            ("Ronald Acuna Jr", "ATL"),
            ("Rafael Devers", "BOS"),
            ("Trea Turner", "PHI"),
            ("Pete Alonso", "NYM"),
            ("Freddie Freeman", "LAD")
        ]
        
        prop_categories = [
            ("hits", 1.5), ("runs", 0.5), ("rbis", 0.5),
            ("home_runs", 0.5), ("strikeouts", 4.5), ("walks", 0.5)
        ]
        
        # Generate props for each player and category
        prop_id = 1
        for player_name, team in players:
            for category, base_line in prop_categories:
                for market_type in ["over", "under"]:
                    # Add some randomization to lines
                    line_variation = random.uniform(-0.5, 0.5)
                    line_value = max(0.5, base_line + line_variation)
                    
                    prop = ExternalPropRecord(
                        provider_prop_id=f"spa_{prop_id}",
                        external_player_id=f"player_{players.index((player_name, team)) + 1}",
                        player_name=player_name,
                        team_code=team,
                        prop_category=market_type,
                        line_value=round(line_value, 1),
                        updated_ts=datetime.utcnow(),
                        payout_type="decimal",
                        status="active",
                        odds_value=random.uniform(1.80, 2.20),
                        market_type=category,
                        game_id=f"game_{random.randint(1, 10)}",
                        league="MLB"
                    )
                    props.append(prop)
                    prop_id += 1
                    
        return props
        
    async def fetch_snapshot(self, limit: Optional[int] = None) -> List[ExternalPropRecord]:
        """Fetch complete snapshot"""
        self.logger.info(f"Fetching snapshot from {self.provider_name}, limit: {limit}")
        
        # Simulate small delay
        import asyncio
        await asyncio.sleep(random.uniform(0.1, 0.3))
        
        # Update timestamps to current time
        current_time = datetime.utcnow()
        updated_props = []
        
        props_to_return = self._mock_props[:limit] if limit else self._mock_props
        
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
        """Fetch incremental updates since timestamp"""
        self.logger.info(f"Fetching incremental from {self.provider_name} since {since_ts}")
        
        # Simulate small delay
        import asyncio
        await asyncio.sleep(random.uniform(0.05, 0.15))
        
        # Simulate some props having updates
        updated_props = []
        current_time = datetime.utcnow()
        
        # Randomly select 10-20% of props to have "updates"
        num_updates = random.randint(len(self._mock_props) // 10, len(self._mock_props) // 5)
        props_to_update = random.sample(self._mock_props, min(num_updates, len(self._mock_props)))
        
        for prop in props_to_update:
            # Simulate line movement (small changes)
            line_change = random.uniform(-0.2, 0.2)
            new_line = max(0.5, prop.line_value + line_change)
            
            # Simulate odds change
            odds_change = random.uniform(-0.1, 0.1)
            base_odds = prop.odds_value or 2.0  # Default if None
            new_odds = max(1.1, base_odds + odds_change)
            
            updated_prop = ExternalPropRecord(
                provider_prop_id=prop.provider_prop_id,
                external_player_id=prop.external_player_id,
                player_name=prop.player_name,
                team_code=prop.team_code,
                prop_category=prop.prop_category,
                line_value=round(new_line, 1),
                updated_ts=current_time,
                payout_type=prop.payout_type,
                status=prop.status,
                odds_value=round(new_odds, 2),
                market_type=prop.market_type,
                game_id=prop.game_id,
                league=prop.league
            )
            updated_props.append(updated_prop)
            
        self.update_last_fetch_timestamp(current_time)
        self.logger.info(f"Retrieved {len(updated_props)} incremental updates from {self.provider_name}")
        
        return updated_props