"""
Sample MLB Provider - Mock implementation for MLB prop generation

Generates synthetic MLB props with realistic distributions for:
- Hitters: HITS, TOTAL_BASES, RUNS, RBIs, HOME_RUNS, WALKS, STOLEN_BASES
- Pitchers: STRIKEOUTS_PITCHER, OUTS_RECORDED, WALKS_ALLOWED, EARNED_RUNS

Following the MLB enablement plan specifications.
"""

import random
import hashlib
from datetime import datetime, timedelta
from typing import List, Optional, Dict

from backend.services.providers.base_provider import BaseMarketDataProvider, ExternalPropRecord, ProviderCapabilities


class SampleMLBProvider(BaseMarketDataProvider):
    """MLB-specific provider with realistic prop generation"""
    
    def __init__(self):
        # MLB-specific capabilities
        capabilities = ProviderCapabilities(
            supports_incremental=True,
            max_batch_size=500,
            supported_sports={"MLB"},
            supports_live_odds=True,
            supports_player_props=True,
            supports_team_props=False,
            rate_limit_per_minute=60
        )
        
        super().__init__("sample_mlb", capabilities)
        self._mock_props = self._generate_mlb_props()
        
    def _generate_mlb_props(self) -> List[ExternalPropRecord]:
        """Generate MLB-specific prop data with realistic distributions"""
        props = []
        
        # MLB teams (AL/NL mix)
        mlb_teams = [
            # AL East
            ("NYY", "New York Yankees"), ("BOS", "Boston Red Sox"), 
            ("TOR", "Toronto Blue Jays"), ("TB", "Tampa Bay Rays"), ("BAL", "Baltimore Orioles"),
            # AL Central  
            ("CLE", "Cleveland Guardians"), ("MIN", "Minnesota Twins"), 
            ("CWS", "Chicago White Sox"), ("DET", "Detroit Tigers"), ("KC", "Kansas City Royals"),
            # AL West
            ("HOU", "Houston Astros"), ("LAA", "Los Angeles Angels"), 
            ("TEX", "Texas Rangers"), ("SEA", "Seattle Mariners"), ("OAK", "Oakland Athletics"),
            # NL East
            ("ATL", "Atlanta Braves"), ("NYM", "New York Mets"), 
            ("PHI", "Philadelphia Phillies"), ("MIA", "Miami Marlins"), ("WSH", "Washington Nationals"),
            # NL Central
            ("MIL", "Milwaukee Brewers"), ("STL", "St. Louis Cardinals"), 
            ("CHC", "Chicago Cubs"), ("CIN", "Cincinnati Reds"), ("PIT", "Pittsburgh Pirates"),
            # NL West  
            ("LAD", "Los Angeles Dodgers"), ("SD", "San Diego Padres"), 
            ("SF", "San Francisco Giants"), ("ARI", "Arizona Diamondbacks"), ("COL", "Colorado Rockies")
        ]
        
        # Sample MLB players with realistic names and positions
        mlb_players = [
            # Star hitters
            ("Mookie Betts", "LAD", "H"), ("Aaron Judge", "NYY", "H"),
            ("Ronald Acuña Jr.", "ATL", "H"), ("Juan Soto", "NYY", "H"),
            ("Mike Trout", "LAA", "H"), ("Manny Machado", "SD", "H"),
            ("Vladimir Guerrero Jr.", "TOR", "H"), ("Rafael Devers", "BOS", "H"),
            ("Jose Altuve", "HOU", "H"), ("Trea Turner", "PHI", "H"),
            ("Pete Alonso", "NYM", "H"), ("Freddie Freeman", "LAD", "H"),
            ("Corey Seager", "TEX", "H"), ("Yordan Alvarez", "HOU", "H"),
            ("Kyle Tucker", "HOU", "H"), ("Bo Bichette", "TOR", "H"),
            
            # Star pitchers  
            ("Gerrit Cole", "NYY", "P"), ("Shane Bieber", "CLE", "P"),
            ("Jacob deGrom", "TEX", "P"), ("Max Scherzer", "NYM", "P"),
            ("Walker Buehler", "LAD", "P"), ("Sandy Alcantara", "MIA", "P"),
            ("Corbin Burnes", "MIL", "P"), ("Tyler Glasnow", "LAD", "P"),
            ("Spencer Strider", "ATL", "P"), ("Logan Webb", "SF", "P"),
            ("Framber Valdez", "HOU", "P"), ("Jose Berrios", "TOR", "P"),
        ]
        
        # MLB-specific prop types with realistic base lines
        hitter_props = [
            ("HITS", 1.5, 0.3), ("TOTAL_BASES", 2.5, 0.5), 
            ("RUNS", 0.5, 0.2), ("RBIs", 0.5, 0.2),
            ("HOME_RUNS", 0.5, 0.1), ("WALKS", 0.5, 0.2), 
            ("STOLEN_BASES", 0.5, 0.1)
        ]
        
        pitcher_props = [
            ("STRIKEOUTS_PITCHER", 6.5, 1.0), ("OUTS_RECORDED", 15.5, 3.0),
            ("WALKS_ALLOWED", 2.5, 0.5), ("EARNED_RUNS", 2.5, 0.5)
        ]
        
        # Generate props for each player
        prop_id = 1
        for player_name, team_code, role in mlb_players:
            # Select appropriate props based on role
            if role == "H":  # Hitter
                prop_types = hitter_props
            else:  # Pitcher
                prop_types = pitcher_props
                
            for prop_type, base_line, variance in prop_types:
                # Use deterministic variation based on player name hash
                player_hash = int(hashlib.md5(f"{player_name}{prop_type}".encode()).hexdigest(), 16) % 10000
                player_factor = (player_hash / 10000.0) * 2 - 1  # -1 to 1 range
                
                # Adjust base line with player-specific factor
                adjusted_line = base_line + (player_factor * variance)
                adjusted_line = max(0.5, adjusted_line)  # Minimum line
                
                for market_type in ["over", "under"]:
                    # Generate realistic odds (1.80 to 2.20 range with player adjustment)
                    base_odds = 2.0 + (player_hash % 40 - 20) / 100.0  # 1.80 to 2.20
                    
                    prop = ExternalPropRecord(
                        provider_prop_id=f"mlb_{prop_id}",
                        external_player_id=f"mlb_player_{player_hash % 1000}",
                        player_name=player_name,
                        team_code=team_code,
                        prop_category=market_type,
                        line_value=round(adjusted_line, 1),
                        updated_ts=datetime.utcnow(),
                        payout_type="decimal",
                        status="active",
                        sport="MLB",  # Explicit sport field
                        odds_value=round(base_odds, 2),
                        market_type=prop_type,
                        game_id=f"mlb_game_{(player_hash % 15) + 1}",  # 15 games per day typical
                        league="MLB"
                    )
                    
                    # Add metadata for role identification
                    if hasattr(prop, '__dict__'):
                        prop.__dict__['is_pitcher'] = (role == "P")
                        prop.__dict__['role'] = role
                    
                    props.append(prop)
                    prop_id += 1
                    
        return props
        
    async def fetch_snapshot(self, sport: str, limit: Optional[int] = None) -> List[ExternalPropRecord]:
        """Fetch complete MLB snapshot"""
        assert sport == "MLB", f"SampleMLBProvider only supports MLB, got {sport}"
        
        self.logger.info(f"Fetching MLB snapshot, limit: {limit}")
        
        # Simulate realistic delay
        import asyncio
        await asyncio.sleep(random.uniform(0.2, 0.4))
        
        # Update timestamps to current time
        current_time = datetime.utcnow()
        updated_props = []
        
        props_to_return = self._mock_props[:limit] if limit else self._mock_props
        
        for prop in props_to_return:
            # Create updated prop with current timestamp
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
                sport="MLB",  # Ensure sport is always set
                odds_value=prop.odds_value,
                market_type=prop.market_type,
                game_id=prop.game_id,
                league=prop.league
            )
            
            # Preserve metadata if present
            if hasattr(prop, '__dict__'):
                if 'is_pitcher' in prop.__dict__:
                    updated_prop.__dict__['is_pitcher'] = prop.__dict__['is_pitcher']
                if 'role' in prop.__dict__:
                    updated_prop.__dict__['role'] = prop.__dict__['role']
            
            updated_props.append(updated_prop)
            
        self.update_last_fetch_timestamp("MLB", current_time)
        self.logger.info(f"Retrieved {len(updated_props)} MLB props from {self.provider_name}")
        
        return updated_props
        
    async def fetch_incremental(self, sport: str, since_ts: datetime) -> List[ExternalPropRecord]:
        """Fetch MLB incremental updates with realistic line movements"""
        assert sport == "MLB", f"SampleMLBProvider only supports MLB, got {sport}"
        
        self.logger.info(f"Fetching MLB incremental updates since {since_ts}")
        
        # Simulate small delay
        import asyncio
        await asyncio.sleep(random.uniform(0.1, 0.2))
        
        updated_props = []
        current_time = datetime.utcnow()
        
        # Simulate realistic update frequency (5-15% of props change in each cycle)
        update_rate = random.uniform(0.05, 0.15)
        num_updates = int(len(self._mock_props) * update_rate)
        props_to_update = random.sample(self._mock_props, min(num_updates, len(self._mock_props)))
        
        for prop in props_to_update:
            # MLB-specific line movement patterns
            if prop.market_type == "STRIKEOUTS_PITCHER":
                # Pitcher strikeouts: moderate volatility
                line_change = random.uniform(-0.5, 0.5)
            elif prop.market_type in ["HOME_RUNS", "STOLEN_BASES"]:
                # Binary-like props: smaller movements  
                line_change = random.uniform(-0.2, 0.2)
            else:
                # Standard props: normal volatility
                line_change = random.uniform(-0.3, 0.3)
            
            new_line = max(0.5, prop.line_value + line_change)
            
            # Odds movement correlated with line movement
            odds_change = random.uniform(-0.15, 0.15)
            base_odds = prop.odds_value or 2.0
            new_odds = max(1.1, min(3.0, base_odds + odds_change))
            
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
                sport="MLB",
                odds_value=round(new_odds, 2),
                market_type=prop.market_type,
                game_id=prop.game_id,
                league=prop.league
            )
            
            # Preserve metadata
            if hasattr(prop, '__dict__'):
                if 'is_pitcher' in prop.__dict__:
                    updated_prop.__dict__['is_pitcher'] = prop.__dict__['is_pitcher']
                if 'role' in prop.__dict__:
                    updated_prop.__dict__['role'] = prop.__dict__['role']
            
            updated_props.append(updated_prop)
            
        self.update_last_fetch_timestamp("MLB", current_time)
        self.logger.info(f"Retrieved {len(updated_props)} MLB incremental updates")
        
        return updated_props

    def _generate_props(self, limit=None, delta_mode=False):
        """Helper method for generating props with stable deterministic variation"""
        if delta_mode:
            # Return subset of props with slight modifications for incremental mode
            props_subset = random.sample(self._mock_props, min(50, len(self._mock_props)))
            return props_subset
        else:
            return self._mock_props[:limit] if limit else self._mock_props