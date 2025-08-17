"""
Taxonomy Service for Data Normalization

Maintains canonical mappings between external provider data and internal
taxonomy for prop categories, team names, and other standardized identifiers.

Provides caching and validation for consistent data normalization across
all ingestion pipelines.
"""

import logging
from datetime import datetime
from typing import Dict, Optional, Set
from threading import Lock

from ..models.dto import PropTypeEnum

logger = logging.getLogger(__name__)


class TaxonomyError(Exception):
    """Exception raised when taxonomy mapping fails."""
    pass


class TaxonomyService:
    """
    Service for managing canonical data mappings and normalization.
    
    Maintains thread-safe caches of mappings between external provider
    data and internal canonical identifiers.
    """
    
    def __init__(self):
        """Initialize the taxonomy service with default mappings."""
        self._prop_mapping_cache: Dict[str, PropTypeEnum] = {}
        self._team_mapping_cache: Dict[str, str] = {}
        self._last_reload_ts: Optional[datetime] = None
        self._lock = Lock()
        
        # Load initial mappings
        self._load_default_mappings()
    
    def _load_default_mappings(self):
        """Load default taxonomy mappings."""
        with self._lock:
            # Prop category mappings (external -> canonical)
            self._prop_mapping_cache = {
                # Points variations
                "Points": PropTypeEnum.POINTS,
                "points": PropTypeEnum.POINTS,
                "Player Points": PropTypeEnum.POINTS,
                "Total Points": PropTypeEnum.POINTS,
                "PTS": PropTypeEnum.POINTS,
                
                # Assists variations  
                "Assists": PropTypeEnum.ASSISTS,
                "assists": PropTypeEnum.ASSISTS,
                "Player Assists": PropTypeEnum.ASSISTS,
                "Total Assists": PropTypeEnum.ASSISTS,
                "AST": PropTypeEnum.ASSISTS,
                
                # Rebounds variations
                "Rebounds": PropTypeEnum.REBOUNDS,
                "rebounds": PropTypeEnum.REBOUNDS,
                "Player Rebounds": PropTypeEnum.REBOUNDS,
                "Total Rebounds": PropTypeEnum.REBOUNDS,
                "REB": PropTypeEnum.REBOUNDS,
                "Rebs": PropTypeEnum.REBOUNDS,
                
                # Combined stats
                "Points + Rebounds + Assists": PropTypeEnum.PRA,
                "PRA": PropTypeEnum.PRA,
                "Points+Rebounds+Assists": PropTypeEnum.PRA,
                "Pts+Reb+Ast": PropTypeEnum.PRA,
                
                # Three pointers
                "3-Point Field Goals Made": PropTypeEnum.THREE_POINTERS_MADE,
                "3PM": PropTypeEnum.THREE_POINTERS_MADE,
                "Three Pointers Made": PropTypeEnum.THREE_POINTERS_MADE,
                "Threes Made": PropTypeEnum.THREE_POINTERS_MADE,
                "3-Pointers Made": PropTypeEnum.THREE_POINTERS_MADE,
                "3FGM": PropTypeEnum.THREE_POINTERS_MADE,
                
                # Defensive stats
                "Steals": PropTypeEnum.STEALS,
                "steals": PropTypeEnum.STEALS,
                "STL": PropTypeEnum.STEALS,
                "Player Steals": PropTypeEnum.STEALS,
                
                "Blocks": PropTypeEnum.BLOCKS,
                "blocks": PropTypeEnum.BLOCKS,
                "BLK": PropTypeEnum.BLOCKS,
                "Player Blocks": PropTypeEnum.BLOCKS,
                
                "Turnovers": PropTypeEnum.TURNOVERS,
                "turnovers": PropTypeEnum.TURNOVERS,
                "TO": PropTypeEnum.TURNOVERS,
                "Player Turnovers": PropTypeEnum.TURNOVERS,
                
                # Other stats
                "Minutes": PropTypeEnum.MINUTES,
                "minutes": PropTypeEnum.MINUTES,
                "MIN": PropTypeEnum.MINUTES,
                "Playing Time": PropTypeEnum.MINUTES,
                
                # Special achievements
                "Double-Double": PropTypeEnum.DOUBLE_DOUBLE,
                "Double Double": PropTypeEnum.DOUBLE_DOUBLE,
                "DD": PropTypeEnum.DOUBLE_DOUBLE,
                
                "Triple-Double": PropTypeEnum.TRIPLE_DOUBLE,
                "Triple Double": PropTypeEnum.TRIPLE_DOUBLE,
                "TD": PropTypeEnum.TRIPLE_DOUBLE,
            }
            
            # NBA team mappings (external -> canonical abbreviation)
            self._team_mapping_cache = {
                # Standard abbreviations (already canonical)
                "ATL": "ATL", "BOS": "BOS", "BKN": "BKN", "CHA": "CHA", "CHI": "CHI",
                "CLE": "CLE", "DAL": "DAL", "DEN": "DEN", "DET": "DET", "GSW": "GSW",
                "HOU": "HOU", "IND": "IND", "LAC": "LAC", "LAL": "LAL", "MEM": "MEM",
                "MIA": "MIA", "MIL": "MIL", "MIN": "MIN", "NOP": "NOP", "NYK": "NYK",
                "OKC": "OKC", "ORL": "ORL", "PHI": "PHI", "PHX": "PHX", "POR": "POR",
                "SAC": "SAC", "SAS": "SAS", "TOR": "TOR", "UTA": "UTA", "WAS": "WAS",
                
                # Common variations
                "ATLANTA": "ATL", "BOSTON": "BOS", "BROOKLYN": "BKN", "CHARLOTTE": "CHA",
                "CHICAGO": "CHI", "CLEVELAND": "CLE", "DALLAS": "DAL", "DENVER": "DEN",
                "DETROIT": "DET", "GOLDEN STATE": "GSW", "HOUSTON": "HOU", "INDIANA": "IND",
                "LA CLIPPERS": "LAC", "LA LAKERS": "LAL", "LOS ANGELES CLIPPERS": "LAC",
                "LOS ANGELES LAKERS": "LAL", "MEMPHIS": "MEM", "MIAMI": "MIA",
                "MILWAUKEE": "MIL", "MINNESOTA": "MIN", "NEW ORLEANS": "NOP",
                "NEW YORK": "NYK", "OKLAHOMA CITY": "OKC", "ORLANDO": "ORL",
                "PHILADELPHIA": "PHI", "PHOENIX": "PHX", "PORTLAND": "POR",
                "SACRAMENTO": "SAC", "SAN ANTONIO": "SAS", "TORONTO": "TOR",
                "UTAH": "UTA", "WASHINGTON": "WAS",
                
                # Alternative abbreviations
                "BRK": "BKN", "GS": "GSW", "LAK": "LAL", "NO": "NOP", "NY": "NYK",
                "OKL": "OKC", "SA": "SAS", "WASH": "WAS",
                
                # Full team names
                "Hawks": "ATL", "Celtics": "BOS", "Nets": "BKN", "Hornets": "CHA",
                "Bulls": "CHI", "Cavaliers": "CLE", "Mavericks": "DAL", "Nuggets": "DEN",
                "Pistons": "DET", "Warriors": "GSW", "Rockets": "HOU", "Pacers": "IND",
                "Clippers": "LAC", "Lakers": "LAL", "Grizzlies": "MEM", "Heat": "MIA",
                "Bucks": "MIL", "Timberwolves": "MIN", "Pelicans": "NOP", "Knicks": "NYK",
                "Thunder": "OKC", "Magic": "ORL", "76ers": "PHI", "Suns": "PHX",
                "Trail Blazers": "POR", "Kings": "SAC", "Spurs": "SAS", "Raptors": "TOR",
                "Jazz": "UTA", "Wizards": "WAS",
            }
            
            self._last_reload_ts = datetime.utcnow()
            logger.info(f"Loaded {len(self._prop_mapping_cache)} prop mappings and "
                       f"{len(self._team_mapping_cache)} team mappings")
    
    def normalize_prop_category(self, raw_category: str, sport: str = "NBA") -> PropTypeEnum:
        """
        Normalize external prop category to canonical enum.
        
        Args:
            raw_category: Raw prop category from external provider
            sport: Sport context for sport-specific normalization (default: NBA for backward compatibility)
            
        Returns:
            Canonical PropTypeEnum value
            
        Raises:
            TaxonomyError: If mapping is not found
        """
        with self._lock:
            # Try exact match first
            if raw_category in self._prop_mapping_cache:
                return self._prop_mapping_cache[raw_category]
            
            # Try case-insensitive match
            lower_category = raw_category.lower()
            for key, value in self._prop_mapping_cache.items():
                if key.lower() == lower_category:
                    return value
            
            # Try partial matches for common patterns (sport-specific logic could go here)
            if "point" in lower_category:
                return PropTypeEnum.POINTS
            elif "assist" in lower_category:
                return PropTypeEnum.ASSISTS
            elif "rebound" in lower_category:
                return PropTypeEnum.REBOUNDS
            elif "three" in lower_category or "3" in lower_category:
                return PropTypeEnum.THREE_POINTERS_MADE
            elif "steal" in lower_category:
                return PropTypeEnum.STEALS
            elif "block" in lower_category:
                return PropTypeEnum.BLOCKS
            elif "turnover" in lower_category:
                return PropTypeEnum.TURNOVERS
            
            # Sport-specific patterns could be added here
            # For example, NFL might have different patterns than NBA
            if sport == "NFL":
                if "yard" in lower_category or "passing" in lower_category:
                    # Could map to a future NFL-specific enum
                    pass
            elif sport == "MLB":
                if "hit" in lower_category or "rbi" in lower_category:
                    # Could map to a future MLB-specific enum  
                    pass
            
            # No mapping found
            raise TaxonomyError(f"Unknown prop category for {sport}: '{raw_category}'")
    
    def normalize_team_code(self, raw_team: str, sport: str = "NBA") -> str:
        """
        Normalize external team identifier to canonical abbreviation.
        
        Args:
            raw_team: Raw team identifier from external provider
            sport: Sport context for sport-specific team mappings (default: NBA for backward compatibility)
            
        Returns:
            Canonical team abbreviation
            
        Raises:
            TaxonomyError: If mapping is not found
        """
        with self._lock:
            # Clean input
            clean_team = raw_team.strip().upper()
            
            # Try exact match (currently NBA-focused)
            # In the future, could have sport-specific team caches
            if clean_team in self._team_mapping_cache:
                return self._team_mapping_cache[clean_team]
            
            # Try with common variations
            for key, value in self._team_mapping_cache.items():
                if key.upper() == clean_team:
                    return value
            
            # Sport-specific team normalization could be added here
            # For example, NFL teams might have different abbreviations
            if sport == "NFL":
                # Could implement NFL-specific team mapping
                pass
            elif sport == "MLB":
                # Could implement MLB-specific team mapping
                pass
            
            # No mapping found
            raise TaxonomyError(f"Unknown team identifier for {sport}: '{raw_team}'")
    
    def get_supported_prop_types(self, sport: str = "NBA") -> Set[PropTypeEnum]:
        """Get all supported prop types for a specific sport."""
        with self._lock:
            # For now, all prop types are NBA-specific
            # In the future, could filter by sport
            if sport == "NBA":
                return set(self._prop_mapping_cache.values())
            else:
                # Could return sport-specific prop types
                # For now, return empty set for unsupported sports
                return set()
    
    def get_supported_teams(self, sport: str = "NBA") -> Set[str]:
        """Get all canonical team abbreviations for a specific sport."""
        with self._lock:
            # For now, all teams are NBA-specific
            # In the future, could have sport-specific team sets
            if sport == "NBA":
                return set(self._team_mapping_cache.values())
            else:
                # Could return sport-specific teams
                # For now, return empty set for unsupported sports
                return set()
    
    def add_prop_mapping(self, external_key: str, prop_type: PropTypeEnum, sport: str = "NBA"):
        """
        Add a new prop category mapping.
        
        Args:
            external_key: External prop category identifier
            prop_type: Canonical prop type enum
            sport: Sport context (for future sport-specific mappings)
        """
        with self._lock:
            # For now, all mappings go to the main cache
            # In the future, could have sport-specific caches
            self._prop_mapping_cache[external_key] = prop_type
            logger.info(f"Added prop mapping for {sport}: '{external_key}' -> {prop_type.value}")
    
    def add_team_mapping(self, external_key: str, canonical_abbrev: str, sport: str = "NBA"):
        """
        Add a new team mapping.
        
        Args:
            external_key: External team identifier
            canonical_abbrev: Canonical team abbreviation
            sport: Sport context (for future sport-specific mappings)
        """
        with self._lock:
            # For now, all mappings go to the main cache
            # In the future, could have sport-specific caches
            self._team_mapping_cache[external_key] = canonical_abbrev
            logger.info(f"Added team mapping for {sport}: '{external_key}' -> '{canonical_abbrev}'")
    
    def reload(self):
        """
        Reload mappings from configuration.
        
        TODO: Implement loading from database or configuration file.
        """
        logger.info("Reloading taxonomy mappings...")
        self._load_default_mappings()
        logger.info("Taxonomy mappings reloaded successfully")
    
    @property
    def last_reload_timestamp(self) -> Optional[datetime]:
        """Get timestamp of last mapping reload."""
        return self._last_reload_ts
    
    @property
    def prop_mapping_count(self) -> int:
        """Get count of prop mappings."""
        return len(self._prop_mapping_cache)
    
    @property
    def team_mapping_count(self) -> int:
        """Get count of team mappings."""
        return len(self._team_mapping_cache)
    
    def validate_prop_category(self, raw_category: str, sport: str = "NBA") -> bool:
        """
        Check if prop category can be normalized.
        
        Args:
            raw_category: Raw prop category to validate
            sport: Sport context (default: NBA for backward compatibility)
            
        Returns:
            True if category can be normalized, False otherwise
        """
        try:
            self.normalize_prop_category(raw_category, sport)
            return True
        except TaxonomyError:
            return False
    
    def validate_team_code(self, raw_team: str, sport: str = "NBA") -> bool:
        """
        Check if team code can be normalized.
        
        Args:
            raw_team: Raw team identifier to validate
            sport: Sport context (default: NBA for backward compatibility)
            
        Returns:
            True if team can be normalized, False otherwise
        """
        try:
            self.normalize_team_code(raw_team, sport)
            return True
        except TaxonomyError:
            return False


# Default singleton instance
taxonomy_service = TaxonomyService()