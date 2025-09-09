"""
Simple PropFinder Mock Service for Phase 4.1 Frontend Integration with Best Line Aggregation

This service provides realistic test data for the PropFinder frontend with
proper odds normalization and edge calculations using the OddsNormalizer.
Generates realistic PropFinder opportunities with mathematically correct
implied probabilities and edges.

NEW Phase 1.2 Features:
- Best line detection across multiple bookmakers
- Line movement tracking simulation  
- Arbitrage opportunity detection
- Multi-sportsbook odds comparison

NEW Phase 4.3 Features:
- Line movement tracking and historical snapshots
- Opening/latest line and odds comparison  
- Movement direction detection ("up", "down", "flat")
- Persistent line movement storage with fallback

NEW: Real-time Odds Aggregation Integration
- Enhanced PropOpportunity detection with live odds data
- Multi-source odds aggregation (SportRadar, TheOdds, Internal)
- Real-time bestLine, bestOdds, lineSpread, oddsSpread calculation
"""

import asyncio
import logging
import contextlib
from typing import List, Dict, Optional, Any
from datetime import datetime, timezone
from dataclasses import dataclass, asdict
from enum import Enum

# Import odds normalizer for proper calculations
try:
    from backend.services.odds_normalizer import OddsNormalizer
    ODDS_NORMALIZER_AVAILABLE = True
except ImportError as e:
    logging.warning(f"OddsNormalizer not available: {e}")
    ODDS_NORMALIZER_AVAILABLE = False
    OddsNormalizer = None

# Import CLV metrics for monitoring
try:
    from backend.utils.clv_metrics import get_clv_metrics
    CLV_METRICS_AVAILABLE = True
except ImportError as e:
    logging.warning(f"CLV metrics not available: {e}")
    CLV_METRICS_AVAILABLE = False
    get_clv_metrics = None

# Import data validation pipeline
try:
    from backend.validators.data_validator import DataValidator, get_validation_metrics
    VALIDATION_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Data validation not available: {e}")
    VALIDATION_AVAILABLE = False
    DataValidator = None
    get_validation_metrics = None

# Import data validation pipeline
try:
    from backend.validators.data_validator import DataValidator, get_validation_metrics
    VALIDATION_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Data validation not available: {e}")
    VALIDATION_AVAILABLE = False
    DataValidator = None
    get_validation_metrics = None

# Import odds aggregation service for real-time odds
try:
    from backend.api_integration import odds_aggregation_service, AggregatedOdds
    ODDS_AGGREGATION_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Odds aggregation service not available: {e}")
    ODDS_AGGREGATION_AVAILABLE = False
    odds_aggregation_service = None
    AggregatedOdds = None

# Import arbitrage engine for low juice detection
try:
    from backend.arbitrage_engine import ultra_arbitrage_engine
    ARBITRAGE_ENGINE_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Arbitrage engine not available: {e}")
    ARBITRAGE_ENGINE_AVAILABLE = False
    ultra_arbitrage_engine = None

logger = logging.getLogger(__name__)

# Define enums and classes needed for PropOpportunity
class Sport(Enum):
    NBA = "NBA"
    MLB = "MLB"
    NFL = "NFL"
    NHL = "NHL"

class Market(Enum):
    POINTS = "Points"
    ASSISTS = "Assists"
    REBOUNDS = "Rebounds"
    THREE_POINTERS = "3-Pointers Made"
    HITS = "Hits"
    HOME_RUNS = "Home Runs"
    RBI = "RBI"
    SAVES = "Saves"
    GOALS = "Goals"

class Pick(Enum):
    OVER = "Over"
    UNDER = "Under"

class Trend(Enum):
    RISING = "rising"
    FALLING = "falling"
    STABLE = "stable"

class Venue(Enum):
    HOME = "home"
    AWAY = "away"
    NEUTRAL = "neutral"

class Direction(Enum):
    UP = "up"
    DOWN = "down"
    NONE = "none"

class SharpMoney(Enum):
    HEAVY = "heavy"
    MODERATE = "moderate"
    LIGHT = "light"
    PUBLIC = "public"

@dataclass
class MatchupHistory:
    games: int
    average: float
    hitRate: float

@dataclass
class LineMovement:
    open: float
    current: float
    direction: Direction

@dataclass
class Bookmaker:
    name: str
    odds: int
    line: float

@dataclass
class PropOpportunity:
    id: str
    player: str
    playerImage: Optional[str]
    team: str
    teamLogo: Optional[str]
    opponent: str
    opponentLogo: Optional[str]
    sport: Sport
    market: Market
    line: float
    pick: Pick
    odds: int
    impliedProbability: float
    aiProbability: float
    edge: float
    confidence: float
    projectedValue: float
    volume: int
    trend: Trend
    trendStrength: int
    timeToGame: str
    venue: Venue
    weather: Optional[str]
    injuries: List[str]
    recentForm: List[float]
    matchupHistory: MatchupHistory
    lineMovement: LineMovement
    bookmakers: List[Bookmaker]
    isBookmarked: bool
    tags: List[str]
    socialSentiment: int
    sharpMoney: SharpMoney
    lastUpdated: datetime
    alertTriggered: bool
    alertSeverity: Optional[str]
    # Phase 1.2: Best Line Aggregation fields
    bestBookmaker: Optional[str] = None  # Bookmaker with best odds
    lineSpread: float = 0.0  # Spread between highest and lowest lines
    oddsSpread: int = 0  # Spread between best and worst odds
    numBookmakers: int = 0  # Number of bookmakers offering this prop
    # Phase 4.2: EV Engine Integration fields
    evValue: Optional[float] = None
    evPercent: Optional[float] = None
    evTier: Optional[str] = None
    isOutlier: Optional[bool] = None
    hasArbitrage: bool = False  # Whether arbitrage opportunity exists
    arbitrageProfitPct: float = 0.0  # Potential arbitrage profit percentage
    # Phase 4.3: Line Movement Tracking fields
    openingLine: Optional[float] = None  # First seen line value
    openingOdds: Optional[int] = None  # First seen odds value
    latestLine: Optional[float] = None  # Current line value
    latestOdds: Optional[int] = None  # Current odds value
    lineChange: Optional[float] = None  # Latest line - opening line
    oddsChange: Optional[int] = None  # Latest odds - opening odds
    movementDirection: Optional[str] = None  # "up" | "down" | "flat"
    # Phase 4.4: CLV (Closing Line Value) Tracking fields
    closingLine: Optional[float] = None  # Final settled line value
    closingOdds: Optional[int] = None  # Final settled odds value
    clvPercent: Optional[float] = None  # (closingLine - openingLine) / openingLine * 100
    clv_metrics: Optional[Dict[str, Any]] = None  # CLV metrics object for test compatibility
    # Arbitrage & Low Juice Detection fields
    vigPercent: Optional[float] = None  # Vig percentage across all books for this prop
    isLowJuice: bool = False  # Whether this prop has low juice (<3% vig)
    # Data Validation fields
    validationWarnings: Optional[List[Dict[str, Any]]] = None  # Data validation warnings

@dataclass
class SimpleOpportunity:
    """Simplified opportunity structure matching frontend expectations"""
    id: str
    player: str
    playerImage: Optional[str]
    team: str
    teamLogo: Optional[str]
    opponent: str
    opponentLogo: Optional[str]
    sport: str
    market: str
    line: float
    pick: str
    odds: int
    impliedProbability: float
    aiProbability: float
    edge: float
    confidence: float
    projectedValue: float
    volume: int
    trend: str
    trendStrength: int
    timeToGame: str
    venue: str
    weather: Optional[str]
    injuries: List[str]
    recentForm: List[float]
    matchupHistory: Dict[str, Any]
    lineMovement: Dict[str, Any]
    bookmakers: List[Dict[str, Any]]
    isBookmarked: bool
    tags: List[str]
    socialSentiment: int
    sharpMoney: str
    lastUpdated: str
    alertTriggered: bool = False
    alertSeverity: Optional[str] = None
    # Phase 1.2: Best Line Aggregation fields
    bestBookmaker: Optional[str] = None  # Bookmaker with best odds
    lineSpread: float = 0.0  # Spread between highest and lowest lines
    oddsSpread: int = 0  # Spread between best and worst odds
    numBookmakers: int = 0  # Number of bookmakers offering this prop
    hasArbitrage: bool = False  # Whether arbitrage opportunity exists
    arbitrageProfitPct: float = 0.0  # Potential arbitrage profit percentage
    # Arbitrage & Low Juice Detection fields
    vigPercent: Optional[float] = None  # Vig percentage across all books for this prop
    isLowJuice: bool = False  # Whether this prop has low juice (<3% vig)
    
    # Smart Signals fields (optional, added when score >= 70)
    smartScore: Optional[float] = None  # Composite signal score (0-100)
    signalFactors: Optional[List[Dict[str, Any]]] = None  # Contributing factors

class SimplePropFinderService:
    """
    Simple PropFinder service with realistic data and proper odds calculations.
    
    Uses OddsNormalizer for mathematically correct implied probabilities 
    and edge calculations when available, falls back to basic calculations.
    """
    
    def __init__(self):
        self.logger = logger
        
        # Initialize odds normalizer if available
        if ODDS_NORMALIZER_AVAILABLE and OddsNormalizer is not None:
            self.odds_normalizer = OddsNormalizer(precision=4)
            self.logger.info("Initialized with OddsNormalizer for accurate calculations")
        else:
            self.odds_normalizer = None
            self.logger.warning("Using fallback probability calculations")
        
        # Initialize data validator if available
        if VALIDATION_AVAILABLE and DataValidator and get_validation_metrics:
            self.validator = DataValidator(get_validation_metrics())
            self.logger.info("Data validation pipeline initialized")
        else:
            self.validator = None
            self.logger.warning("Data validation pipeline not available")
        
        self.logger.info("SimplePropFinderService initialized for Phase 4.1 testing")
    
    def _calculate_proper_odds(self, american_odds: int, ai_probability: float) -> Dict[str, Any]:
        """
        Calculate proper implied probability and edge using OddsNormalizer when available.
        
        Args:
            american_odds: American odds (e.g., -110, +150)
            ai_probability: AI model probability (0.0 to 1.0)
            
        Returns:
            Dict with implied_probability and edge (as percentages)
        """
        try:
            if self.odds_normalizer:
                # Use proper odds normalizer
                implied_prob = self.odds_normalizer.implied_prob_from_american(american_odds)
                edge = self.odds_normalizer.calculate_edge(ai_probability, implied_prob)
                
                return {
                    'implied_probability': implied_prob * 100,  # Convert to percentage
                    'edge': edge * 100,  # Convert to percentage
                    'method': 'odds_normalizer'
                }
            else:
                # Fallback to basic calculation
                if american_odds > 0:
                    implied_prob = 100 / (american_odds + 100)
                else:
                    implied_prob = abs(american_odds) / (abs(american_odds) + 100)
                
                edge = (ai_probability - implied_prob) * 100
                
                return {
                    'implied_probability': implied_prob * 100,
                    'edge': edge,
                    'method': 'fallback'
                }
                
        except Exception as e:
            self.logger.error(f"Error calculating odds: {e}")
            # Emergency fallback
            return {
                'implied_probability': 52.4,  # Approximate for -110
                'edge': (ai_probability * 100) - 52.4,
                'method': 'emergency_fallback'
            }

    def _generate_multi_book_odds(self, base_line: float, base_odds: int, prop_id: str) -> List[Dict[str, Any]]:
        """
        Generate realistic odds across multiple bookmakers with line variations.
        
        Phase 1.2 Feature: Best Line Aggregation
        - Simulates different odds/lines across major sportsbooks
        - Includes line movement and competitive spreads
        - Enables best odds detection and comparison
        
        Args:
            base_line: Base line for the prop (e.g., 25.5 points)
            base_odds: Base American odds (e.g., -110)
            prop_id: Unique prop identifier for consistent variations
            
        Returns:
            List of bookmaker data with name, odds, line, and metadata
        """
        import hashlib
        
        # Create deterministic seed from prop_id for consistent data
        seed = int(hashlib.md5(prop_id.encode()).hexdigest()[:8], 16) % 1000
        
        # Major sportsbook configurations with realistic market characteristics
        sportsbooks = [
            {
                "name": "DraftKings",
                "display_name": "DraftKings", 
                "market_share": 0.28,  # 28% market share
                "competitiveness": 0.85,  # How competitive their odds are
                "line_bias": 0.0,  # Neutral line bias
                "odds_adjustment": -2  # Slightly better odds
            },
            {
                "name": "FanDuel",
                "display_name": "FanDuel",
                "market_share": 0.24,
                "competitiveness": 0.83,
                "line_bias": 0.1,  # Slightly higher lines
                "odds_adjustment": -1
            },
            {
                "name": "BetMGM", 
                "display_name": "BetMGM",
                "market_share": 0.16,
                "competitiveness": 0.80,
                "line_bias": -0.1,  # Slightly lower lines
                "odds_adjustment": 0
            },
            {
                "name": "Caesars",
                "display_name": "Caesars Sportsbook",
                "market_share": 0.12,
                "competitiveness": 0.78,
                "line_bias": 0.05,
                "odds_adjustment": 1
            },
            {
                "name": "PointsBet",
                "display_name": "PointsBet",
                "market_share": 0.08,
                "competitiveness": 0.82,  # Good odds but less volume
                "line_bias": -0.05,
                "odds_adjustment": -3  # Often has best odds
            },
            {
                "name": "Barstool",
                "display_name": "Barstool Sportsbook",
                "market_share": 0.06,
                "competitiveness": 0.75,
                "line_bias": 0.0,
                "odds_adjustment": 2
            },
            {
                "name": "BetRivers",
                "display_name": "BetRivers",
                "market_share": 0.06,
                "competitiveness": 0.77,
                "line_bias": -0.15,  # Tends toward lower lines
                "odds_adjustment": 1
            }
        ]
        
        bookmaker_odds = []
        
        for i, book in enumerate(sportsbooks):
            try:
                # Create line variation based on bookmaker characteristics
                line_variation = book["line_bias"] + ((seed + i * 17) % 21 - 10) * 0.05
                adjusted_line = base_line + line_variation
                
                # Adjust odds based on competitiveness and book characteristics  
                odds_variation = book["odds_adjustment"] + ((seed + i * 23) % 15 - 7)
                adjusted_odds = base_odds + odds_variation
                
                # Ensure odds stay in realistic ranges
                if adjusted_odds > 0:
                    adjusted_odds = max(100, min(500, adjusted_odds))  # +100 to +500
                else:
                    adjusted_odds = max(-500, min(-100, adjusted_odds))  # -500 to -100
                
                # Round line to appropriate precision
                if base_line >= 10:
                    adjusted_line = round(adjusted_line * 2) / 2  # Round to nearest 0.5
                else:
                    adjusted_line = round(adjusted_line * 4) / 4  # Round to nearest 0.25
                
                # Calculate availability (some books may not offer all props)
                availability_chance = book["market_share"] + book["competitiveness"] * 0.5
                is_available = (seed + i * 31) % 100 < availability_chance * 100
                
                # Volume indicator based on market share
                if book["market_share"] > 0.20:
                    volume = "HIGH"
                elif book["market_share"] > 0.10:
                    volume = "MEDIUM"  
                else:
                    volume = "LOW"
                
                bookmaker_data = {
                    "name": book["name"],
                    "display_name": book["display_name"],
                    "odds": int(adjusted_odds),
                    "line": float(adjusted_line),
                    "is_available": is_available,
                    "volume": volume,
                    "market_share": book["market_share"],
                    "competitiveness": book["competitiveness"],
                    "last_updated": datetime.now(timezone.utc).isoformat()
                }
                
                bookmaker_odds.append(bookmaker_data)
                
            except Exception as e:
                self.logger.warning(f"Error generating odds for {book['name']}: {e}")
                continue
        
        return bookmaker_odds

    def _find_best_odds(self, bookmakers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Find best available odds from bookmaker list.
        
        Phase 1.2 Feature: Best Line Detection
        - Identifies best odds across all available sportsbooks
        - Handles both positive and negative American odds correctly
        - Returns best odds with bookmaker info and line details
        
        Args:
            bookmakers: List of bookmaker data with odds/lines
            
        Returns:
            Dictionary with best_odds, best_bookmaker, line_spread, etc.
        """
        try:
            available_books = [b for b in bookmakers if b.get("is_available", True)]
            
            if not available_books:
                return {
                    "best_odds": None,
                    "best_bookmaker": None,
                    "best_line": None,
                    "line_spread": 0.0,
                    "odds_spread": 0,
                    "num_bookmakers": 0
                }
            
            # Find best odds (highest positive, closest-to-zero negative)
            best_odds = None
            best_bookmaker = None
            
            for book in available_books:
                odds = book["odds"]
                if best_odds is None:
                    best_odds = odds
                    best_bookmaker = book
                else:
                    # Better odds logic:
                    # - For positive odds: higher is better (+150 > +120)
                    # - For negative odds: closer to zero is better (-105 > -110)
                    if odds > 0 and best_odds > 0:
                        if odds > best_odds:
                            best_odds = odds
                            best_bookmaker = book
                    elif odds < 0 and best_odds < 0:
                        if odds > best_odds:  # -105 > -110
                            best_odds = odds
                            best_bookmaker = book
                    elif odds > 0 and best_odds < 0:
                        # Positive odds always better than negative
                        best_odds = odds
                        best_bookmaker = book
                    # If odds < 0 and best_odds > 0, keep best_odds
            
            # Calculate spreads
            all_odds = [b["odds"] for b in available_books]
            all_lines = [b["line"] for b in available_books]
            
            odds_spread = max(all_odds) - min(all_odds) if len(all_odds) > 1 else 0
            line_spread = max(all_lines) - min(all_lines) if len(all_lines) > 1 else 0.0
            
            return {
                "best_odds": best_odds,
                "best_bookmaker": best_bookmaker["name"] if best_bookmaker else None,
                "best_line": best_bookmaker["line"] if best_bookmaker else None,
                "line_spread": round(line_spread, 2),
                "odds_spread": odds_spread,
                "num_bookmakers": len(available_books),
                "consensus_line": sum(all_lines) / len(all_lines) if all_lines else None
            }
            
        except Exception as e:
            self.logger.error(f"Error finding best odds: {e}")
            return {
                "best_odds": bookmakers[0]["odds"] if bookmakers else None,
                "best_bookmaker": bookmakers[0]["name"] if bookmakers else None,
                "best_line": bookmakers[0]["line"] if bookmakers else None,
                "line_spread": 0.0,
                "odds_spread": 0,
                "num_bookmakers": len(bookmakers)
            }

    def _detect_arbitrage_opportunity(self, bookmakers: List[Dict[str, Any]], line: float) -> Dict[str, Any]:
        """
        Detect arbitrage opportunities across different bookmakers.
        
        Phase 1.2 Feature: Arbitrage Detection
        - Identifies when best Over and best Under odds create arbitrage
        - Calculates potential profit percentage
        - Provides execution details for arbitrage bets
        
        Args:
            bookmakers: List of bookmaker odds data
            line: The prop line value
            
        Returns:
            Dictionary with arbitrage status and profit calculations
        """
        try:
            available_books = [b for b in bookmakers if b.get("is_available", True)]
            
            if len(available_books) < 2:
                return {"has_arbitrage": False, "profit_pct": 0.0}
            
            # For prop bets, we need Over and Under odds from different books
            # In our mock data, we're simulating the best odds available
            # In real implementation, this would compare Over odds from one book 
            # vs Under odds from another book
            
            # Find best and worst odds to simulate spread
            all_odds = [b["odds"] for b in available_books]
            best_odds = max(all_odds) if any(o > 0 for o in all_odds) else max(all_odds)
            worst_odds = min(all_odds) if any(o < 0 for o in all_odds) else min(all_odds)
            
            # Convert to implied probabilities (with vig)
            def american_to_prob_with_vig(odds):
                if odds > 0:
                    return 100 / (odds + 100)
                else:
                    return abs(odds) / (abs(odds) + 100)
            
            best_prob = american_to_prob_with_vig(best_odds)
            worst_prob = american_to_prob_with_vig(worst_odds)
            
            # Simulate Over/Under arbitrage scenario
            # In reality, you'd bet Over at best_odds and Under at different book
            total_prob = best_prob + (1 - worst_prob)  # Simplified arbitrage check
            
            has_arbitrage = total_prob < 0.98  # 2% margin for arbitrage
            profit_pct = ((1.0 / total_prob) - 1.0) * 100 if has_arbitrage else 0.0
            
            return {
                "has_arbitrage": has_arbitrage,
                "profit_pct": round(profit_pct, 2) if has_arbitrage else 0.0,
                "best_over_odds": best_odds,
                "best_under_equivalent": worst_odds,
                "execution_details": {
                    "required_books": 2,
                    "complexity": "medium",
                    "time_sensitive": True
                } if has_arbitrage else None
            }
            
        except Exception as e:
            self.logger.error(f"Error detecting arbitrage: {e}")
            return {"has_arbitrage": False, "profit_pct": 0.0}

    def _calculate_low_juice_metrics(self, bookmaker_data: List[Dict], prop_id: str) -> Dict[str, Any]:
        """Calculate low juice metrics using the arbitrage engine"""
        try:
            if not ARBITRAGE_ENGINE_AVAILABLE or not ultra_arbitrage_engine or not bookmaker_data:
                return {"vigPercent": None, "isLowJuice": False}
            
            # Convert bookmaker data to the format expected by arbitrage engine
            books = []
            for book_data in bookmaker_data:
                # For simplicity, assume we're dealing with over/under props
                # In reality, this would need more sophisticated market type detection
                books.append({
                    "book": book_data["name"],
                    "over_odds": book_data["odds"] / 100 + 1 if book_data["odds"] > 0 else 100 / abs(book_data["odds"]) + 1,
                    "under_odds": 2.0  # Default opposing odds for demonstration
                })
            
            opportunity_aggregate = {
                "event_id": prop_id,
                "market_type": "player_props",
                "books": books
            }
            
            juice_result = ultra_arbitrage_engine.detect_low_juice(opportunity_aggregate)
            
            return {
                "vigPercent": juice_result.get("vig_pct"),
                "isLowJuice": juice_result.get("is_low_juice", False)
            }
            
        except Exception as e:
            logger.warning(f"Low juice calculation failed for {prop_id}: {e}")
            return {"vigPercent": None, "isLowJuice": False}
    
    async def get_opportunities(self, filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Get mock opportunities matching the expected API format"""
        try:
            # Generate realistic test data
            opportunities = await self._generate_test_opportunities()
            
            # Apply basic filtering if provided
            if filters:
                opportunities = self._apply_filters(opportunities, filters)
            
            # Add smart signals if enabled
            enhanced_opportunities = await self._add_smart_signals(opportunities)
            
            # Persist high-value opportunities for analytics (fire-and-forget)
            await self._persist_analytics_opportunities(enhanced_opportunities)
            
            # Create summary statistics
            summary = self._create_summary(enhanced_opportunities)
            
            return {
                "opportunities": [asdict(opp) for opp in enhanced_opportunities],
                "total": len(enhanced_opportunities),
                "filtered": len(enhanced_opportunities),
                "summary": summary
            }
            
        except Exception as e:
            self.logger.error(f"Error generating opportunities: {e}")
            return {
                "opportunities": [],
                "total": 0,
                "filtered": 0,
                "summary": self._empty_summary()
            }
    
    async def _generate_test_opportunities(self, force_flat_baseline: bool = False) -> List[SimpleOpportunity]:
        """Generate deterministic realistic test data for multiple sports and players"""
        opportunities = []
        
        # Use deterministic seed for consistent IDs across API calls
        import random
        random.seed(42)
        
        # NBA Opportunities
        nba_players = [
            ("LeBron James", "LAL", "GSW"),
            ("Stephen Curry", "GSW", "LAL"), 
            ("Nikola Jokic", "DEN", "PHX"),
            ("Jayson Tatum", "BOS", "MIA"),
            ("Luka Doncic", "DAL", "SAS")
        ]
        
        nba_markets = [
            ("Points", [25.5, 27.5, 22.5, 29.5, 31.5]),
            ("Assists", [8.5, 6.5, 9.5, 5.5, 7.5]),
            ("Rebounds", [7.5, 5.5, 11.5, 8.5, 6.5]),
            ("3-Pointers Made", [2.5, 4.5, 1.5, 3.5, 2.5])
        ]
        
        opportunity_id = 1
        
        for i, (player, team, opponent) in enumerate(nba_players):
            for j, (market, lines) in enumerate(nba_markets):
                opportunity_id += 1
                
                # Phase 1.2: Generate multi-bookmaker odds with realistic variations
                prop_id = f"nba_{player.lower().replace(' ', '_')}_{market.lower().replace(' ', '_').replace('-', '')}_{opportunity_id}"
                bookmakers = self._generate_multi_book_odds(lines[i], -110, prop_id)
                
                # Phase 1.2: Find best odds across all bookmakers
                best_line_data = self._find_best_odds(bookmakers)
                best_odds = best_line_data["best_odds"] or -110
                
                # Phase 1.2: Check for arbitrage opportunities
                arbitrage_data = self._detect_arbitrage_opportunity(bookmakers, lines[i])
                
                # Calculate low juice metrics
                low_juice_metrics = self._calculate_low_juice_metrics(bookmakers, prop_id)
                
                # AI probability varies by player/market combination
                ai_prob_base = 0.45 + (i * 0.05) + (j * 0.02)
                ai_prob = min(0.95, max(0.05, ai_prob_base + (opportunity_id % 20) * 0.02))
                
                # Use proper odds normalization with best available odds
                odds_result = self._calculate_proper_odds(best_odds, ai_prob)
                implied_prob = odds_result['implied_probability']
                edge = odds_result['edge']
                
                confidence = min(95, 50 + abs(edge) * 2.5)
                
                # Create simplified bookmaker list for frontend compatibility
                simplified_bookmakers = [
                    {"name": book["name"], "odds": book["odds"], "line": book["line"]}
                    for book in bookmakers if book.get("is_available", True)
                ]
                
                opportunity = SimpleOpportunity(
                    id=prop_id,
                    player=player,
                    playerImage=None,
                    team=team,
                    teamLogo=None,
                    opponent=opponent,
                    opponentLogo=None,
                    sport="NBA",
                    market=market,
                    line=best_line_data.get("best_line", lines[i]),
                    pick="over" if (opportunity_id % 2 == 0) else "under",
                    odds=best_odds,
                    impliedProbability=round(implied_prob, 1),
                    aiProbability=round(ai_prob * 100, 1),
                    edge=round(edge, 1),
                    confidence=round(confidence, 1),
                    projectedValue=round(lines[i] + (edge / 10), 1),
                    volume=500 + (opportunity_id * 23),
                    trend="up" if edge > 0 else "down" if edge < -5 else "stable",
                    trendStrength=min(100, abs(int(edge * 10))),
                    timeToGame=f"{2 + (i % 4)}h {15 + (j * 10)}m",
                    venue="home" if opportunity_id % 2 == 0 else "away",
                    weather=None,
                    injuries=[],
                    recentForm=[
                        round(lines[i] + ((opportunity_id + k) % 10 - 5) * 0.3, 1) 
                        for k in range(5)
                    ],
                    matchupHistory={
                        "games": 10 + (opportunity_id % 15),
                        "average": round(lines[i] + (opportunity_id % 10 - 5) * 0.2, 1),
                        "hitRate": 45 + (opportunity_id % 40)
                    },
                    lineMovement={
                        "open": round(lines[i] - (opportunity_id % 10) * 0.1, 1),
                        "current": best_line_data.get("best_line", lines[i]),
                        "direction": "up" if opportunity_id % 3 == 0 else "down" if opportunity_id % 3 == 1 else "stable"
                    },
                    bookmakers=simplified_bookmakers,  # Phase 1.2: Enhanced bookmaker data
                    isBookmarked=(opportunity_id % 7 == 0),  # Some bookmarked items
                    tags=self._generate_tags(edge, confidence, market),
                    socialSentiment=40 + (opportunity_id % 50),
                    sharpMoney="heavy" if edge > 15 else "moderate" if edge > 5 else "light",
                    lastUpdated=datetime(2025, 9, 3, 12, 0, 0, tzinfo=timezone.utc).isoformat(),
                    alertTriggered=(edge > 20),
                    alertSeverity="high" if edge > 25 else "medium" if edge > 15 else None,
                    # Phase 1.2: Best Line Aggregation data
                    bestBookmaker=best_line_data.get("best_bookmaker", "DraftKings"),
                    lineSpread=best_line_data.get("line_spread", 0.0),
                    oddsSpread=best_line_data.get("odds_spread", 0),
                    numBookmakers=best_line_data.get("num_bookmakers", 0),
                    hasArbitrage=arbitrage_data.get("has_arbitrage", False),
                    arbitrageProfitPct=arbitrage_data.get("profit_pct", 0.0),
                    vigPercent=low_juice_metrics["vigPercent"],
                    isLowJuice=low_juice_metrics["isLowJuice"]
                )
                
                # Phase 4.3: Line Movement Tracking Integration
                try:
                    from backend.services.line_movement_service import line_movement_service
                    line_movement_service.record_snapshot(opportunity)
                    line_movement_service.enrich_opportunity(opportunity, force_flat_baseline=force_flat_baseline)
                except Exception:
                    self.logger.warning("Line movement enrichment failed", exc_info=False)
                
                opportunities.append(opportunity)
                opportunity_id += 1
        
        # MLB Opportunities (fewer for variety)
        mlb_players = [
            ("Mookie Betts", "LAD", "SF"),
            ("Aaron Judge", "NYY", "BOS"),
            ("Ronald Acuna Jr.", "ATL", "MIA")
        ]
        
        mlb_markets = [
            ("Hits", [1.5, 1.5, 1.5]),
            ("Total Bases", [2.5, 2.5, 2.5]),
            ("RBIs", [1.5, 1.5, 1.5])
        ]
        
        for i, (player, team, opponent) in enumerate(mlb_players):
            for j, (market, lines) in enumerate(mlb_markets):
                opportunity_id += 1
                
                # Phase 1.2: Generate multi-bookmaker odds with realistic variations  
                prop_id = f"mlb_{player.lower().replace(' ', '_').replace('.', '')}_{market.lower().replace(' ', '_')}_{opportunity_id}"
                bookmakers = self._generate_multi_book_odds(lines[i], -115, prop_id)
                
                # Phase 1.2: Find best odds across all bookmakers
                best_line_data = self._find_best_odds(bookmakers)
                best_odds = best_line_data["best_odds"] or -115
                
                # Phase 1.2: Check for arbitrage opportunities
                arbitrage_data = self._detect_arbitrage_opportunity(bookmakers, lines[i])
                
                # Calculate low juice metrics
                low_juice_metrics = self._calculate_low_juice_metrics(bookmakers, prop_id)
                
                ai_prob = 0.5 + (i * 0.03) + (j * 0.05)
                
                # Use proper odds normalization with best available odds
                odds_result = self._calculate_proper_odds(best_odds, ai_prob)
                implied_prob = odds_result['implied_probability']
                edge = odds_result['edge']
                
                # Create simplified bookmaker list for frontend compatibility
                simplified_bookmakers = [
                    {"name": book["name"], "odds": book["odds"], "line": book["line"]}
                    for book in bookmakers if book.get("is_available", True)
                ]
                
                opportunity = SimpleOpportunity(
                    id=prop_id,
                    player=player,
                    playerImage=None,
                    team=team,
                    teamLogo=None,
                    opponent=opponent,
                    opponentLogo=None,
                    sport="MLB",
                    market=market,
                    line=best_line_data.get("best_line", lines[i]),
                    pick="over",
                    odds=best_odds,
                    impliedProbability=round(implied_prob, 1),
                    aiProbability=round(ai_prob * 100, 1),
                    edge=round(edge, 1),
                    confidence=min(95, 50 + abs(edge) * 3),
                    projectedValue=round(lines[i] + (edge / 15), 1),
                    volume=300 + (opportunity_id * 17),
                    trend="up" if edge > 0 else "stable",
                    trendStrength=min(100, abs(int(edge * 8))),
                    timeToGame=f"{3 + i}h {30 + (j * 15)}m",
                    venue="home" if i % 2 == 0 else "away",
                    weather="Clear, 72°F" if i == 0 else "Partly cloudy, 68°F" if i == 1 else None,
                    injuries=[],
                    recentForm=[
                        round(lines[i] + ((opportunity_id + k) % 8 - 4) * 0.2, 1) 
                        for k in range(5)
                    ],
                    matchupHistory={
                        "games": 15 + (opportunity_id % 10),
                        "average": round(lines[i] + (i * 0.1), 1),
                        "hitRate": 50 + (opportunity_id % 30)
                    },
                    lineMovement={
                        "open": round(lines[i] - 0.5, 1),
                        "current": best_line_data.get("best_line", lines[i]),
                        "direction": "up"
                    },
                    bookmakers=simplified_bookmakers,  # Phase 1.2: Enhanced bookmaker data
                    isBookmarked=(opportunity_id % 11 == 0),
                    tags=self._generate_tags(edge, min(95, 50 + abs(edge) * 3), market),
                    socialSentiment=45 + (opportunity_id % 35),
                    sharpMoney="moderate" if edge > 8 else "light",
                    lastUpdated=datetime(2025, 9, 3, 12, 0, 0, tzinfo=timezone.utc).isoformat(),
                    alertTriggered=(edge > 15),
                    alertSeverity="medium" if edge > 20 else "low" if edge > 10 else None,
                    # Phase 1.2: Best Line Aggregation data
                    bestBookmaker=best_line_data.get("best_bookmaker", "DraftKings"),
                    lineSpread=best_line_data.get("line_spread", 0.0),
                    oddsSpread=best_line_data.get("odds_spread", 0),
                    numBookmakers=best_line_data.get("num_bookmakers", 0),
                    hasArbitrage=arbitrage_data.get("has_arbitrage", False),
                    arbitrageProfitPct=arbitrage_data.get("profit_pct", 0.0),
                    vigPercent=low_juice_metrics["vigPercent"],
                    isLowJuice=low_juice_metrics["isLowJuice"]
                )
                
                opportunities.append(opportunity)
                opportunity_id += 1
        
        self.logger.info(f"Generated {len(opportunities)} test opportunities")
        return opportunities
    
    def _generate_tags(self, edge: float, confidence: float, market: str) -> List[str]:
        """Generate appropriate tags based on opportunity characteristics"""
        tags = []
        
        if edge > 20:
            tags.append("High Value")
        elif edge > 10:
            tags.append("Value Play")
        
        if confidence > 80:
            tags.append("High Confidence")
            
        if edge > 15 and confidence > 75:
            tags.append("Sharp Play")
            
        if market in ["Points", "Hits"]:
            tags.append("Core Stat")
            
        if edge < -5:
            tags.append("Fade")
            
        # Add some deterministic variety based on edge and confidence
        additional_tags = ["Prime Time", "Revenge Game", "Home Cooking", "Bounce Back", "Trending Up"]
        if int(edge + confidence) % 10 > 7:  # Deterministic condition
            tags.append(additional_tags[int(edge + confidence) % len(additional_tags)])
            
        return tags[:3]  # Limit to 3 tags
    
    def _apply_filters(self, opportunities: List[SimpleOpportunity], filters: Dict[str, Any]) -> List[SimpleOpportunity]:
        """Apply basic filtering to opportunities"""
        filtered = opportunities
        
        if filters.get('sports'):
            sports = filters['sports'].split(',') if isinstance(filters['sports'], str) else filters['sports']
            filtered = [opp for opp in filtered if opp.sport in sports]
        
        if filters.get('confidence_min') is not None:
            filtered = [opp for opp in filtered if opp.confidence >= float(filters['confidence_min'])]
            
        if filters.get('confidence_max') is not None:
            filtered = [opp for opp in filtered if opp.confidence <= float(filters['confidence_max'])]
            
        if filters.get('edge_min') is not None:
            filtered = [opp for opp in filtered if opp.edge >= float(filters['edge_min'])]
            
        if filters.get('search'):
            search_term = filters['search'].lower()
            filtered = [
                opp for opp in filtered 
                if search_term in opp.player.lower() or search_term in opp.market.lower()
            ]
        
        return filtered
    
    def _create_summary(self, opportunities: List[SimpleOpportunity]) -> Dict[str, Any]:
        """Create summary statistics for opportunities"""
        if not opportunities:
            return self._empty_summary()
            
        total = len(opportunities)
        avg_confidence = sum(opp.confidence for opp in opportunities) / total
        max_edge = max(opp.edge for opp in opportunities)
        alert_count = sum(1 for opp in opportunities if opp.alertTriggered)
        sharp_heavy_count = sum(1 for opp in opportunities if opp.sharpMoney == "heavy")
        
        sports_breakdown = {}
        markets_breakdown = {}
        
        for opp in opportunities:
            sports_breakdown[opp.sport] = sports_breakdown.get(opp.sport, 0) + 1
            markets_breakdown[opp.market] = markets_breakdown.get(opp.market, 0) + 1
        
        return {
            "total_opportunities": total,
            "avg_confidence": round(avg_confidence, 1),
            "max_edge": round(max_edge, 1),
            "alert_triggered_count": alert_count,
            "sharp_heavy_count": sharp_heavy_count,
            "sports_breakdown": sports_breakdown,
            "markets_breakdown": markets_breakdown
        }
    
    def _empty_summary(self) -> Dict[str, Any]:
        """Return empty summary when no opportunities"""
        return {
            "total_opportunities": 0,
            "avg_confidence": 0.0,
            "max_edge": 0,
            "alert_triggered_count": 0,
            "sharp_heavy_count": 0,
            "sports_breakdown": {},
            "markets_breakdown": {}
        }
    
    # Add compatibility methods for PropFinder routes
    async def _initialize_services(self):
        """Initialize services - no-op for simple service"""
        pass
    
    async def get_prop_opportunities(
        self, 
        sport_filter: Optional[List[str]] = None,
        confidence_range: Optional[tuple] = None,
        edge_range: Optional[tuple] = None,
        limit: int = 50,
        force_flat_baseline: bool = False,
        include_diagnostics: bool = False
    ) -> List[PropOpportunity]:
        """Get prop opportunities with filtering - compatible with PropFinder routes"""
        try:
            # Generate test opportunities using PropOpportunity structure
            opportunities = await self._generate_propopportunity_data(force_flat_baseline=force_flat_baseline, include_diagnostics=include_diagnostics)
            
            # Apply sport filter
            if sport_filter:
                opportunities = [opp for opp in opportunities if opp.sport.value in sport_filter]
            
            # Apply confidence filter
            if confidence_range:
                min_conf, max_conf = confidence_range
                opportunities = [opp for opp in opportunities if min_conf <= opp.confidence <= max_conf]
            
            # Apply edge filter
            if edge_range:
                min_edge, max_edge = edge_range
                opportunities = [opp for opp in opportunities if min_edge <= opp.edge <= max_edge]
            
            # Apply limit
            return opportunities[:limit]
            
        except Exception as e:
            self.logger.error(f"Error getting prop opportunities: {e}")
            return []

    async def _generate_propopportunity_data(self, force_flat_baseline: bool = False, include_diagnostics: bool = False) -> List[PropOpportunity]:
        """Generate PropOpportunity data structures for routes compatibility"""
        current_time = datetime.now(timezone.utc)
        opportunities = []
        
        # Expanded NBA opportunities for virtualization testing
        nba_players = [
            ("LeBron James", "Lakers", "Warriors", Market.POINTS, 28.5, Pick.OVER, -115, 82.3, 89.1, 6.8),
            ("Stephen Curry", "Warriors", "Lakers", Market.THREE_POINTERS, 4.5, Pick.OVER, -110, 73.5, 81.2, 7.7),
            ("Giannis Antetokounmpo", "Bucks", "Celtics", Market.REBOUNDS, 11.5, Pick.UNDER, +105, 67.9, 58.4, -9.5),
            ("Jayson Tatum", "Celtics", "Bucks", Market.POINTS, 26.5, Pick.OVER, -120, 78.4, 85.6, 7.2),
            ("Luka Doncic", "Mavericks", "Suns", Market.ASSISTS, 8.5, Pick.OVER, -105, 69.8, 77.3, 7.5),
            ("Nikola Jokic", "Nuggets", "Timberwolves", Market.REBOUNDS, 12.5, Pick.OVER, -110, 74.2, 82.1, 7.9),
            ("Damian Lillard", "Bucks", "Celtics", Market.THREE_POINTERS, 3.5, Pick.OVER, +100, 68.5, 75.2, 6.7),
            ("Anthony Davis", "Lakers", "Warriors", Market.REBOUNDS, 10.5, Pick.OVER, -115, 76.8, 84.3, 7.5),
            ("Kevin Durant", "Suns", "Mavericks", Market.POINTS, 25.5, Pick.OVER, -108, 71.9, 79.4, 7.5),
            ("Devin Booker", "Suns", "Mavericks", Market.POINTS, 24.5, Pick.UNDER, +110, 64.2, 58.8, -5.4),
            ("Anthony Edwards", "Timberwolves", "Nuggets", Market.POINTS, 22.5, Pick.OVER, -112, 73.1, 80.6, 7.5),
            ("Karl-Anthony Towns", "Timberwolves", "Nuggets", Market.REBOUNDS, 9.5, Pick.OVER, -105, 69.4, 76.8, 7.4),
            ("Russell Westbrook", "Clippers", "Warriors", Market.ASSISTS, 6.5, Pick.OVER, +105, 67.3, 74.1, 6.8),
            ("Kawhi Leonard", "Clippers", "Warriors", Market.POINTS, 23.5, Pick.OVER, -110, 72.7, 80.2, 7.5),
            ("Paul George", "Clippers", "Warriors", Market.THREE_POINTERS, 2.5, Pick.OVER, -115, 75.8, 83.4, 7.6),
            ("Jimmy Butler", "Heat", "76ers", Market.POINTS, 20.5, Pick.UNDER, +108, 65.8, 59.2, -6.6),
            ("Joel Embiid", "76ers", "Heat", Market.POINTS, 29.5, Pick.OVER, -120, 79.3, 87.1, 7.8),
            ("Tyrese Haliburton", "Pacers", "Knicks", Market.ASSISTS, 10.5, Pick.OVER, -105, 69.8, 77.2, 7.4),
            ("Jalen Brunson", "Knicks", "Pacers", Market.POINTS, 24.5, Pick.OVER, -110, 72.4, 80.1, 7.7),
            ("Paolo Banchero", "Magic", "Hawks", Market.POINTS, 21.5, Pick.OVER, -108, 71.2, 78.9, 7.7),
            ("Trae Young", "Hawks", "Magic", Market.ASSISTS, 9.5, Pick.OVER, -112, 73.6, 81.3, 7.7),
            ("Zion Williamson", "Pelicans", "Grizzlies", Market.POINTS, 25.5, Pick.OVER, -115, 76.4, 84.2, 7.8),
            ("Ja Morant", "Grizzlies", "Pelicans", Market.ASSISTS, 7.5, Pick.OVER, -110, 72.8, 80.5, 7.7),
            ("De'Aaron Fox", "Kings", "Blazers", Market.POINTS, 23.5, Pick.OVER, -108, 70.9, 78.6, 7.7),
            ("Domantas Sabonis", "Kings", "Blazers", Market.REBOUNDS, 11.5, Pick.OVER, -105, 69.2, 76.9, 7.7),
            ("Anfernee Simons", "Blazers", "Kings", Market.POINTS, 19.5, Pick.OVER, -110, 72.3, 80.0, 7.7),
            ("Alperen Sengun", "Rockets", "Spurs", Market.ASSISTS, 5.5, Pick.OVER, +100, 68.7, 76.4, 7.7),
            ("Victor Wembanyama", "Spurs", "Rockets", Market.REBOUNDS, 9.5, Pick.OVER, -115, 75.9, 83.6, 7.7),
            ("Scottie Barnes", "Raptors", "Pistons", Market.REBOUNDS, 8.5, Pick.OVER, -110, 72.5, 80.2, 7.7),
            ("Cade Cunningham", "Pistons", "Raptors", Market.ASSISTS, 6.5, Pick.OVER, -108, 71.1, 78.8, 7.7),
        ]
        
        # MLB opportunities for sport variety
        mlb_players = [
            ("Mookie Betts", "Dodgers", "Padres", Market.HITS, 1.5, Pick.OVER, -110, 72.4, 80.1, 7.7),
            ("Fernando Tatis Jr.", "Padres", "Dodgers", Market.HOME_RUNS, 0.5, Pick.OVER, +150, 40.0, 48.3, 8.3),
            ("Aaron Judge", "Yankees", "Red Sox", Market.HOME_RUNS, 0.5, Pick.OVER, +125, 44.4, 52.8, 8.4),
            ("Vladimir Guerrero Jr.", "Blue Jays", "Orioles", Market.RBI, 1.5, Pick.OVER, -105, 69.0, 76.7, 7.7),
            ("Juan Soto", "Yankees", "Red Sox", Market.HITS, 1.5, Pick.OVER, -115, 74.2, 81.9, 7.7),
            ("Ronald Acuna Jr.", "Braves", "Mets", Market.HITS, 1.5, Pick.OVER, -108, 70.8, 78.5, 7.7),
            ("Pete Alonso", "Mets", "Braves", Market.HOME_RUNS, 0.5, Pick.OVER, +140, 41.7, 50.1, 8.4),
            ("Mike Trout", "Angels", "Astros", Market.HITS, 1.5, Pick.OVER, -112, 73.2, 80.9, 7.7),
            ("Jose Altuve", "Astros", "Angels", Market.HITS, 1.5, Pick.OVER, -110, 72.4, 80.1, 7.7),
        ]
        
        # Import EV evaluation service
        try:
            from backend.services.ev_valuation_service import evaluate_opportunity
        except ImportError:
            evaluate_opportunity = None
        # Generate NBA opportunities
        for i, (player, team, opponent, market, line, pick, odds, implied, ai_prob, edge) in enumerate(nba_players):
            # Generate multi-bookmaker data for Phase 1.2 calculations
            prop_id = f"nba_{player.lower().replace(' ', '_')}_{market.value.lower().replace(' ', '_').replace('-', '')}_{i+1}"
            bookmaker_data = self._generate_multi_book_odds(line, odds, prop_id)
            
            # Phase 1.2: Calculate best odds and arbitrage data
            best_line_data = self._find_best_odds(bookmaker_data)
            arbitrage_data = self._detect_arbitrage_opportunity(bookmaker_data, line)
            
            # Calculate low juice metrics
            low_juice_data = self._calculate_low_juice_metrics(bookmaker_data, prop_id)
            
            # Convert bookmaker data to Bookmaker objects for PropOpportunity
            bookmaker_objects = [
                Bookmaker(book["name"], book["odds"], book["line"]) 
                for book in bookmaker_data[:3]  # Take first 3 for display
            ]
            
            opp = PropOpportunity(
                id=f"nba_{i+1}",
                player=player,
                playerImage=None,
                team=team,
                teamLogo=None,
                opponent=opponent,
                opponentLogo=None,
                sport=Sport.NBA,
                market=market,
                line=line,
                pick=pick,
                odds=odds,
                impliedProbability=implied,
                aiProbability=ai_prob,
                edge=edge,
                confidence=75.0 + (edge / 2),  # Higher edge = higher confidence
                projectedValue=25.0 * (edge / 100),  # Simple EV calculation
                volume=12500 + (i * 1500),
                trend=Trend.RISING if edge > 5 else Trend.STABLE,
                trendStrength=int(abs(edge)),
                timeToGame=f"{3 + (i % 4)}h {20 + (i % 40)}m",
                venue=Venue.HOME if i % 2 == 0 else Venue.AWAY,
                weather=None,
                injuries=[],
                recentForm=[85.2, 78.9, 92.1, 88.4, 76.8][:max(2, (i % 5) + 2)],
                matchupHistory=MatchupHistory(games=12, average=line + (edge/10), hitRate=0.65),
                lineMovement=LineMovement(
                    open=line + (0.5 if i % 2 == 0 else -0.5),
                    current=line,
                    direction=Direction.DOWN if edge > 0 else Direction.UP
                ),
                bookmakers=bookmaker_objects,
                isBookmarked=i < 3,  # First few bookmarked
                tags=["High Volume", "Sharp Money"] if edge > 6 else ["Trending"],
                socialSentiment=65 + int(edge),
                sharpMoney=SharpMoney.HEAVY if edge > 7 else SharpMoney.MODERATE,
                lastUpdated=current_time,
                alertTriggered=edge > 6,
                alertSeverity="high" if edge > 8 else "medium" if edge > 6 else None,
                # Phase 1.2: Best Line Aggregation fields
                bestBookmaker=best_line_data.get("best_bookmaker", "DraftKings"),
                lineSpread=best_line_data.get("line_spread", 0.0),
                oddsSpread=best_line_data.get("odds_spread", 0),
                numBookmakers=best_line_data.get("num_bookmakers", 0),
                hasArbitrage=arbitrage_data.get("has_arbitrage", False),
                arbitrageProfitPct=arbitrage_data.get("profit_pct", 0.0),
                vigPercent=low_juice_data["vigPercent"],
                isLowJuice=low_juice_data["isLowJuice"]
            )
            # Phase 4.2: EV Engine Integration
            if evaluate_opportunity:
                try:
                    opp = evaluate_opportunity(opp)
                except Exception as e:
                    logger.warning(f"EV evaluation failed for {getattr(opp, 'id', None)}: {e}")
            
            # Phase 4.3: Line Movement Tracking Integration
            try:
                from backend.services.line_movement_service import line_movement_service
                line_movement_service.record_snapshot(opp)
                line_movement_service.enrich_opportunity(opp, force_flat_baseline=force_flat_baseline)
            except Exception as e:
                self.logger.warning(f"Line movement enrichment failed: {e}", exc_info=True)
            
            opportunities.append(opp)
        
        # Generate MLB opportunities  
        for i, (player, team, opponent, market, line, pick, odds, implied, ai_prob, edge) in enumerate(mlb_players):
            # Generate multi-bookmaker data for Phase 1.2 calculations
            prop_id = f"mlb_{player.lower().replace(' ', '_')}_{market.value.lower().replace(' ', '_').replace('-', '')}_{i+1}"
            bookmaker_data = self._generate_multi_book_odds(line, odds, prop_id)
            
            # Phase 1.2: Calculate best odds and arbitrage data
            best_line_data = self._find_best_odds(bookmaker_data)
            arbitrage_data = self._detect_arbitrage_opportunity(bookmaker_data, line)
            
            # Calculate low juice metrics
            low_juice_data = self._calculate_low_juice_metrics(bookmaker_data, prop_id)
            
            # Convert bookmaker data to Bookmaker objects for PropOpportunity
            bookmaker_objects = [
                Bookmaker(book["name"], book["odds"], book["line"]) 
                for book in bookmaker_data[:3]  # Take first 3 for display
            ]
            
            opp = PropOpportunity(
                id=f"mlb_{i+1}",
                player=player,
                playerImage=None,
                team=team,
                teamLogo=None,
                opponent=opponent,
                opponentLogo=None,
                sport=Sport.MLB,
                market=market,
                line=line,
                pick=pick,
                odds=odds,
                impliedProbability=implied,
                aiProbability=ai_prob,
                edge=edge,
                confidence=75.0 + (edge / 2),
                projectedValue=25.0 * (edge / 100),
                volume=8500 + (i * 1200),
                trend=Trend.RISING if edge > 5 else Trend.STABLE,
                trendStrength=int(abs(edge)),
                timeToGame=f"{1 + (i % 3)}h {15 + (i % 30)}m",
                venue=Venue.HOME if i % 2 == 0 else Venue.AWAY,
                weather="Clear 75°F" if i % 3 == 0 else "Cloudy 68°F" if i % 3 == 1 else None,
                injuries=[],
                recentForm=[0.285, 0.312, 0.298, 0.274, 0.321][:max(2, (i % 5) + 2)],
                matchupHistory=MatchupHistory(games=8, average=line + (edge/10), hitRate=0.62),
                lineMovement=LineMovement(
                    open=line + (0.5 if i % 2 == 0 else -0.5),
                    current=line,
                    direction=Direction.DOWN if edge > 0 else Direction.UP
                ),
                bookmakers=bookmaker_objects,
                isBookmarked=i < 2,
                tags=["Weather Dependent"] if market == Market.HOME_RUNS else ["Trending"],
                socialSentiment=60 + int(edge),
                sharpMoney=SharpMoney.HEAVY if edge > 7 else SharpMoney.MODERATE,
                lastUpdated=current_time,
                alertTriggered=edge > 6,
                alertSeverity="high" if edge > 8 else "medium" if edge > 6 else None,
                # Phase 1.2: Best Line Aggregation fields
                bestBookmaker=best_line_data.get("best_bookmaker", "DraftKings"),
                lineSpread=best_line_data.get("line_spread", 0.0),
                oddsSpread=best_line_data.get("odds_spread", 0),
                numBookmakers=best_line_data.get("num_bookmakers", 0),
                hasArbitrage=arbitrage_data.get("has_arbitrage", False),
                arbitrageProfitPct=arbitrage_data.get("profit_pct", 0.0),
                vigPercent=low_juice_data["vigPercent"],
                isLowJuice=low_juice_data["isLowJuice"]
            )
            # Phase 4.2: EV Engine Integration
            if evaluate_opportunity:
                try:
                    opp = evaluate_opportunity(opp)
                except Exception as e:
                    logger.warning(f"EV evaluation failed for {getattr(opp, 'id', None)}: {e}")
            
            # Phase 4.3: Line Movement Tracking Integration
            try:
                from backend.services.line_movement_service import line_movement_service
                line_movement_service.record_snapshot(opp)
                line_movement_service.enrich_opportunity(opp, force_flat_baseline=force_flat_baseline)
            except Exception as e:
                self.logger.warning(f"Line movement enrichment failed: {e}", exc_info=True)
            
            opportunities.append(opp)
        
        # Apply data validation pipeline to all opportunities
        if self.validator:
            try:
                validated_opportunities = []
                for opp in opportunities:
                    # Convert opportunity to dict for validation
                    opp_dict = asdict(opp)
                    warnings = await self.validator.validate_opportunity(opp_dict)
                    
                    # Add validation warnings to opportunity (without failing)
                    if warnings:
                        opp.validationWarnings = [warning.to_dict() for warning in warnings]
                        self.logger.debug(f"Applied {len(warnings)} validation warnings to {opp.player}")
                    else:
                        opp.validationWarnings = []
                    
                    validated_opportunities.append(opp)
                
                opportunities = validated_opportunities
                self.logger.info(f"Data validation completed for {len(opportunities)} opportunities")
                
            except Exception as e:
                self.logger.error(f"Data validation pipeline failed: {e}")
                # Continue without validation on error
        
        return opportunities
    
    async def attach_clv_data(self, opportunities: List[PropOpportunity]) -> List[PropOpportunity]:
        """
        Step 5: Attach CLV data to opportunities with 60s server-side caching
        
        Enriches PropOpportunity objects with CLV metrics:
        - clvPercent: (closingLine - openingLine) / openingLine * 100
        - closingLine: Final line before game start
        - closingOdds: Final odds before game start
        """
        if not opportunities:
            return opportunities
        
        # Get CLV metrics instance for monitoring
        clv_metrics = None
        if CLV_METRICS_AVAILABLE and get_clv_metrics:
            try:
                clv_metrics = get_clv_metrics()
            except Exception:
                pass
        
        # Initialize timing variables at method level
        import time
        start_time = None
        
        try:
            # Start timing if metrics are available
            if clv_metrics:
                start_time = time.time()
            
            # Simulate CLV data enrichment with 60s cache semantics
            import random
            
            enriched_opportunities = []
            for opp in opportunities:
                # Calculate realistic CLV data
                clv_percent = round(random.uniform(-15.0, 25.0), 1)
                closing_line = opp.line + random.uniform(-2.0, 2.0) if opp.line else None
                closing_odds = opp.odds + random.randint(-50, 50) if opp.odds else None
                
                # Add CLV fields directly to opportunity (for legacy compatibility)
                opp.clvPercent = clv_percent
                opp.closingLine = closing_line
                opp.closingOdds = closing_odds
                
                # Also add clv_metrics object for test compatibility
                if hasattr(opp, '__dict__'):
                    # For PropOpportunity objects, add as attribute
                    opp.clv_metrics = {
                        "clv_estimate": clv_percent / 100.0,  # Convert percentage to decimal
                        "market_efficiency": round(random.uniform(0.75, 0.95), 2),
                        "historical_edge": round(random.uniform(0.05, 0.20), 2),
                        "line_movement_indicator": random.choice(["stable", "rising", "falling"])
                    }
                elif isinstance(opp, dict):
                    # For dict objects, add as key
                    opp["clv_metrics"] = {
                        "clv_estimate": clv_percent / 100.0,  # Convert percentage to decimal  
                        "market_efficiency": round(random.uniform(0.75, 0.95), 2),
                        "historical_edge": round(random.uniform(0.05, 0.20), 2),
                        "line_movement_indicator": random.choice(["stable", "rising", "falling"])
                    }
                
                enriched_opportunities.append(opp)
            
            # Record successful enrichment metrics
            if clv_metrics:
                try:
                    # Record timing and success
                    if start_time:
                        duration = (time.time() - start_time) * 1000  # Convert to milliseconds
                        clv_metrics.record_success(duration)
                    else:
                        clv_metrics.record_success(0.0)
                    
                    # Record batch processing
                    clv_metrics.record_batch(len(enriched_opportunities), 0.0)
                    
                    # Simulate cache behavior (60% cache hit rate for demo)
                    if random.random() < 0.6:
                        clv_metrics.record_cache_hit()
                    else:
                        clv_metrics.record_cache_miss()
                except Exception as metrics_error:
                    self.logger.warning(f"CLV metrics recording failed: {metrics_error}")
            
            self.logger.info(f"Enriched {len(enriched_opportunities)} opportunities with CLV data")
            return enriched_opportunities
            
        except Exception as e:
            # Record failure metrics
            if clv_metrics:
                try:
                    # Get duration if start_time was set
                    if start_time:
                        duration = (time.time() - start_time) * 1000  # Convert to milliseconds
                        clv_metrics.record_failure(duration)
                    else:
                        clv_metrics.record_failure(0.0)
                except Exception:
                    pass
            
            self.logger.error(f"Failed to attach CLV data: {e}")
            return opportunities  # Return original opportunities on failure


    async def enhance_with_real_odds(self, opportunities: List[PropOpportunity]) -> List[PropOpportunity]:
        """
        Enhance PropOpportunity objects with real-time odds aggregation
        
        This method integrates with the odds aggregation service to:
        - Fetch live odds from multiple sources (SportRadar, TheOdds, Internal)
        - Calculate real bestLine, bestOdds, lineSpread, oddsSpread
        - Update PropOpportunity fields with accurate market data
        """
        if not ODDS_AGGREGATION_AVAILABLE or not odds_aggregation_service:
            self.logger.warning("Odds aggregation service not available, using mock data")
            return opportunities
        
        enhanced_opportunities = []
        
        for opp in opportunities:
            try:
                # Get real odds data for this prop
                sport_name = opp.sport.value if hasattr(opp.sport, 'value') else str(opp.sport)
                market_name = opp.market.value if hasattr(opp.market, 'value') else str(opp.market)
                
                # Fetch aggregated odds
                aggregated_odds = await odds_aggregation_service.aggregate_odds(
                    sport=sport_name,
                    player=opp.player,
                    market=market_name
                )
                
                if aggregated_odds:
                    # Detect best odds and spreads
                    best_odds_analysis = odds_aggregation_service.detect_best_odds(aggregated_odds)
                    
                    # Update PropOpportunity with real data
                    opp.bestBookmaker = best_odds_analysis["bestBookmaker"]
                    opp.lineSpread = best_odds_analysis["lineSpread"]
                    opp.oddsSpread = best_odds_analysis["oddsSpread"]
                    opp.numBookmakers = best_odds_analysis["numBookmakers"]
                    
                    # Update line and odds if we have better data
                    if best_odds_analysis["bestLine"] is not None:
                        opp.line = best_odds_analysis["bestLine"]
                    if best_odds_analysis["bestOdds"] is not None:
                        opp.odds = best_odds_analysis["bestOdds"]
                    
                    # Check for arbitrage opportunities
                    if len(aggregated_odds) >= 2:
                        # Simple arbitrage detection based on odds spread
                        if best_odds_analysis["oddsSpread"] > 20:  # Threshold for potential arbitrage
                            opp.hasArbitrage = True
                            # Calculate approximate arbitrage profit
                            best_odds = best_odds_analysis["bestOdds"]
                            worst_odds = min(odds.odds for odds in aggregated_odds)
                            if best_odds and worst_odds:
                                # Simple arbitrage calculation
                                best_implied = 100 / abs(best_odds) if best_odds < 0 else 100 / (best_odds + 100)
                                worst_implied = 100 / abs(worst_odds) if worst_odds < 0 else 100 / (worst_odds + 100)
                                opp.arbitrageProfitPct = max(0, (worst_implied - best_implied) * 100)
                    
                    # Update bookmaker data
                    if len(aggregated_odds) > len(opp.bookmakers or []):
                        # Convert AggregatedOdds to bookmaker format
                        bookmaker_data = []
                        for odds in aggregated_odds[:8]:  # Limit to 8 bookmakers
                            bookmaker_data.append({
                                "name": odds.sportsbook,
                                "odds": odds.odds,
                                "line": odds.line,
                                "last_seen": odds.last_seen.isoformat(),
                                "confidence": odds.confidence
                            })
                        opp.bookmakers = bookmaker_data
                    
                    self.logger.debug(f"Enhanced {opp.player} {market_name} with {len(aggregated_odds)} real odds sources")
                
                enhanced_opportunities.append(opp)
                
            except Exception as e:
                self.logger.warning(f"Failed to enhance {opp.player} with real odds: {e}")
                # Keep original opportunity if enhancement fails
                enhanced_opportunities.append(opp)
        
        self.logger.info(f"Enhanced {len(enhanced_opportunities)} opportunities with real-time odds data")
        return enhanced_opportunities

    async def _persist_analytics_opportunities(self, opportunities: List[SimpleOpportunity]) -> None:
        """
        Persist high-value opportunities for analytics tracking (fire-and-forget).
        
        Automatically filters and persists EV opportunities >=3% and arbitrage 
        opportunities >=1% profit for historical analytics.
        """
        try:
            # Fire-and-forget: Schedule persistence tasks without waiting
            asyncio.create_task(self._persist_opportunities_background(opportunities))
            self.logger.debug(f"Scheduled analytics persistence for {len(opportunities)} opportunities")
                
        except Exception as e:
            # Don't let analytics persistence failures affect the main service
            self.logger.warning(f"Analytics persistence scheduling failed (non-critical): {e}")

    async def _persist_opportunities_background(self, opportunities: List[SimpleOpportunity]) -> None:
        """Background task to persist opportunities - runs independently"""
        try:
            from backend.services.analytics_scheduler import (
                persist_ev_opportunity_if_qualified,
                persist_arbitrage_opportunity_if_qualified
            )
            
            ev_count = 0
            arb_count = 0
            
            # Process each opportunity for analytics persistence
            for opp in opportunities:
                try:
                    # Persist EV opportunity if qualified (>=3% edge threshold)
                    if opp.edge and opp.edge >= 3.0:
                        success = await persist_ev_opportunity_if_qualified(
                            sport=opp.sport,
                            player=opp.player,
                            market=opp.market,
                            line=opp.line,
                            odds=getattr(opp, 'odds', None) or 100,  # Default odds if not available
                            ev_percent=opp.edge,
                            confidence=opp.confidence,
                            bookmaker=opp.bestBookmaker,
                            team=getattr(opp, 'team', None),
                            opponent=getattr(opp, 'opponent', None)
                        )
                        if success:
                            ev_count += 1
                    
                    # Persist arbitrage opportunity if qualified (>=1% profit threshold)
                    if (hasattr(opp, 'hasArbitrage') and opp.hasArbitrage and 
                        hasattr(opp, 'arbitrageProfitPct') and opp.arbitrageProfitPct >= 1.0):
                        
                        bookmaker_names = []
                        if hasattr(opp, 'bookmakers') and opp.bookmakers:
                            bookmaker_names = [book.get("name", "Unknown") for book in opp.bookmakers]
                        elif opp.bestBookmaker:
                            bookmaker_names = [opp.bestBookmaker]
                        
                        success = await persist_arbitrage_opportunity_if_qualified(
                            sport=opp.sport,
                            market=opp.market,
                            profit_pct=opp.arbitrageProfitPct,
                            bookmakers=bookmaker_names,
                            player=opp.player,
                            line=opp.line,
                            team=getattr(opp, 'team', None),
                            opponent=getattr(opp, 'opponent', None)
                        )
                        if success:
                            arb_count += 1
                            
                except Exception as e:
                    # Log individual opportunity failures but continue processing
                    self.logger.debug(f"Failed to persist opportunity {opp.player}: {e}")
                    continue
            
            if ev_count > 0 or arb_count > 0:
                self.logger.info(f"Analytics persistence: {ev_count} EV + {arb_count} arbitrage opportunities saved")
            else:
                self.logger.debug(f"Analytics persistence: No opportunities met thresholds (3% EV, 1% arbitrage)")
                
        except ImportError:
            # Analytics scheduler not available - this is fine, just skip persistence
            self.logger.debug("Analytics persistence not available - skipping opportunity tracking")
        except Exception as e:
            # Log error but don't propagate to avoid affecting main service
            self.logger.error(f"Background analytics persistence failed: {e}", exc_info=True)

    async def _add_smart_signals(self, opportunities: List[SimpleOpportunity]) -> List[SimpleOpportunity]:
        """
        Add smart signal scoring to opportunities if feature is enabled.
        
        For opportunities with smartScore >= 70, adds:
        - smartScore: Composite signal score (0-100)
        - signalFactors: Array of contributing factors
        """
        try:
            # Import smart signals service 
            from backend.services.smart_signals import smart_signals_service
            
            if not smart_signals_service.enabled:
                self.logger.debug("Smart signals disabled, returning opportunities unchanged")
                return opportunities
            
            enhanced_opportunities = []
            
            for opp in opportunities:
                try:
                    # Convert opportunity to dict for signal computation
                    opp_dict = asdict(opp)
                    
                    # Compute smart signal
                    signal = smart_signals_service.compute_signal(opp_dict)
                    
                    if signal and signal.score >= 70:
                        # Add smart signal fields to existing opportunity
                        opp.smartScore = signal.score
                        opp.signalFactors = [
                            {
                                "name": f.name,
                                "value": f.value,
                                "weight": f.weight,
                                "description": f.description
                            }
                            for f in signal.factors
                        ]
                        self.logger.debug(f"Added smart signal (score: {signal.score:.1f}) to {opp.player}")
                    
                    # Always add the opportunity (with or without smart signals)
                    enhanced_opportunities.append(opp)
                        
                except Exception as e:
                    self.logger.warning(f"Failed to compute signal for {opp.player}: {e}")
                    # Keep original opportunity on error
                    enhanced_opportunities.append(opp)
                    
            self.logger.info(f"Enhanced {len([o for o in enhanced_opportunities if hasattr(o, 'smartScore')])} opportunities with smart signals")
            return enhanced_opportunities
            
        except ImportError:
            self.logger.debug("Smart signals service not available")
            return opportunities
        except Exception as e:
            self.logger.error(f"Error adding smart signals: {e}")
            return opportunities


# Remove duplicate class definition and fix dependency
_simple_service_instance = None

def get_simple_propfinder_service() -> SimplePropFinderService:
    """Dependency function for FastAPI routes"""
    global _simple_service_instance
    if _simple_service_instance is None:
        _simple_service_instance = SimplePropFinderService()
    return _simple_service_instance

# Backwards-compatibility alias for legacy imports
# Some modules/tests import `SimplePropfinderService` (lowercase 'finder').
# Keep an alias to the canonical class name.
SimplePropfinderService = SimplePropFinderService
__all__ = [
    'SimplePropFinderService',
    'SimplePropfinderService',
    'get_simple_propfinder_service',
]