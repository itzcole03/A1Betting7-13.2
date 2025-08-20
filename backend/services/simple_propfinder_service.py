"""
Simple PropFinder Mock Service for Phase 4.1 Frontend Integration

This service provides realistic test data for the PropFinder frontend without
the complex dependencies that are causing initialization issues. This will allow
us to focus on frontend integration and virtualization while maintaining
realistic data structures.
"""

import asyncio
import logging
from typing import List, Dict, Optional, Any
from datetime import datetime, timezone
from dataclasses import dataclass, asdict
from enum import Enum

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

class SimplePropFinderService:
    """Simplified PropFinder service for frontend testing"""
    
    def __init__(self):
        self.logger = logger
        self.logger.info("SimplePropFinderService initialized for Phase 4.1 testing")
    
    async def get_opportunities(self, filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Get mock opportunities matching the expected API format"""
        try:
            # Generate realistic test data
            opportunities = await self._generate_test_opportunities()
            
            # Apply basic filtering if provided
            if filters:
                opportunities = self._apply_filters(opportunities, filters)
            
            # Create summary statistics
            summary = self._create_summary(opportunities)
            
            return {
                "opportunities": [asdict(opp) for opp in opportunities],
                "total": len(opportunities),
                "filtered": len(opportunities),
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
    
    async def _generate_test_opportunities(self) -> List[SimpleOpportunity]:
        """Generate realistic test data for multiple sports and players"""
        opportunities = []
        
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
                # Generate bookmaker odds with slight variations
                base_odds = [-110, -105, -115, -108, -112]
                bookmakers = [
                    {"name": "DraftKings", "odds": base_odds[0] + (i * 2), "line": lines[i]},
                    {"name": "FanDuel", "odds": base_odds[1] + (i * 3), "line": lines[i]},
                    {"name": "BetMGM", "odds": base_odds[2] - (i * 1), "line": lines[i]},
                    {"name": "Caesars", "odds": base_odds[3] + (i * 1), "line": lines[i]},
                    {"name": "Barstool", "odds": base_odds[4] - (i * 2), "line": lines[i]}
                ]
                
                # Find best odds
                best_odds = max(bookmakers, key=lambda x: x["odds"] if x["odds"] > 0 else 1000 + x["odds"])["odds"]
                
                # Calculate probabilities and edge
                if best_odds > 0:
                    implied_prob = 100 / (best_odds + 100)
                else:
                    implied_prob = abs(best_odds) / (abs(best_odds) + 100)
                
                # AI probability varies by player/market combination
                ai_prob_base = 0.45 + (i * 0.05) + (j * 0.02)
                ai_prob = min(0.95, max(0.05, ai_prob_base + (opportunity_id % 20) * 0.02))
                
                edge = (ai_prob - implied_prob) * 100
                confidence = min(95, 50 + abs(edge) * 2.5)
                
                opportunity = SimpleOpportunity(
                    id=f"nba_{player.lower().replace(' ', '_')}_{market.lower().replace(' ', '_').replace('-', '')}_{opportunity_id}",
                    player=player,
                    playerImage=None,
                    team=team,
                    teamLogo=None,
                    opponent=opponent,
                    opponentLogo=None,
                    sport="NBA",
                    market=market,
                    line=lines[i],
                    pick="over" if (opportunity_id % 2 == 0) else "under",
                    odds=best_odds,
                    impliedProbability=round(implied_prob * 100, 1),
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
                        "current": lines[i],
                        "direction": "up" if opportunity_id % 3 == 0 else "down" if opportunity_id % 3 == 1 else "stable"
                    },
                    bookmakers=bookmakers,
                    isBookmarked=(opportunity_id % 7 == 0),  # Some bookmarked items
                    tags=self._generate_tags(edge, confidence, market),
                    socialSentiment=40 + (opportunity_id % 50),
                    sharpMoney="heavy" if edge > 15 else "moderate" if edge > 5 else "light",
                    lastUpdated=datetime.now(timezone.utc).isoformat(),
                    alertTriggered=(edge > 20),
                    alertSeverity="high" if edge > 25 else "medium" if edge > 15 else None
                )
                
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
                base_odds = [-115, -105, -120]
                bookmakers = [
                    {"name": "DraftKings", "odds": base_odds[j] + i, "line": lines[i]},
                    {"name": "FanDuel", "odds": base_odds[j] - i, "line": lines[i]},
                    {"name": "BetMGM", "odds": base_odds[j] + (i * 2), "line": lines[i]}
                ]
                
                best_odds = max(bookmakers, key=lambda x: x["odds"] if x["odds"] > 0 else 1000 + x["odds"])["odds"]
                
                if best_odds > 0:
                    implied_prob = 100 / (best_odds + 100)
                else:
                    implied_prob = abs(best_odds) / (abs(best_odds) + 100)
                
                ai_prob = 0.5 + (i * 0.03) + (j * 0.05)
                edge = (ai_prob - implied_prob) * 100
                
                opportunity = SimpleOpportunity(
                    id=f"mlb_{player.lower().replace(' ', '_').replace('.', '')}_{market.lower().replace(' ', '_')}_{opportunity_id}",
                    player=player,
                    playerImage=None,
                    team=team,
                    teamLogo=None,
                    opponent=opponent,
                    opponentLogo=None,
                    sport="MLB",
                    market=market,
                    line=lines[i],
                    pick="over",
                    odds=best_odds,
                    impliedProbability=round(implied_prob * 100, 1),
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
                        "current": lines[i],
                        "direction": "up"
                    },
                    bookmakers=bookmakers,
                    isBookmarked=(opportunity_id % 11 == 0),
                    tags=self._generate_tags(edge, min(95, 50 + abs(edge) * 3), market),
                    socialSentiment=45 + (opportunity_id % 35),
                    sharpMoney="moderate" if edge > 8 else "light",
                    lastUpdated=datetime.now(timezone.utc).isoformat(),
                    alertTriggered=(edge > 15),
                    alertSeverity="medium" if edge > 20 else "low" if edge > 10 else None
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
            
        # Add some variety
        import random
        additional_tags = ["Prime Time", "Revenge Game", "Home Cooking", "Bounce Back", "Trending Up"]
        if random.random() > 0.7:
            tags.append(random.choice(additional_tags))
            
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
        limit: int = 50
    ) -> List[PropOpportunity]:
        """Get prop opportunities with filtering - compatible with PropFinder routes"""
        try:
            # Generate test opportunities using PropOpportunity structure
            opportunities = await self._generate_propopportunity_data()
            
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

    async def _generate_propopportunity_data(self) -> List[PropOpportunity]:
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
        
        # Generate NBA opportunities
        for i, (player, team, opponent, market, line, pick, odds, implied, ai_prob, edge) in enumerate(nba_players):
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
                bookmakers=[
                    Bookmaker("DraftKings", odds, line),
                    Bookmaker("FanDuel", odds + 5, line),
                    Bookmaker("BetMGM", odds - 5, line + 0.5),
                ],
                isBookmarked=i < 3,  # First few bookmarked
                tags=["High Volume", "Sharp Money"] if edge > 6 else ["Trending"],
                socialSentiment=65 + int(edge),
                sharpMoney=SharpMoney.HEAVY if edge > 7 else SharpMoney.MODERATE,
                lastUpdated=current_time,
                alertTriggered=edge > 6,
                alertSeverity="high" if edge > 8 else "medium" if edge > 6 else None
            )
            opportunities.append(opp)
        
        # Generate MLB opportunities  
        for i, (player, team, opponent, market, line, pick, odds, implied, ai_prob, edge) in enumerate(mlb_players):
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
                bookmakers=[
                    Bookmaker("DraftKings", odds, line),
                    Bookmaker("FanDuel", odds + 10, line),
                    Bookmaker("Caesars", odds - 5, line),
                ],
                isBookmarked=i < 2,
                tags=["Weather Dependent"] if market == Market.HOME_RUNS else ["Trending"],
                socialSentiment=60 + int(edge),
                sharpMoney=SharpMoney.HEAVY if edge > 7 else SharpMoney.MODERATE,
                lastUpdated=current_time,
                alertTriggered=edge > 6,
                alertSeverity="high" if edge > 8 else "medium" if edge > 6 else None
            )
            opportunities.append(opp)
        
        return opportunities

# Remove duplicate class definition and fix dependency
_simple_service_instance = None

def get_simple_propfinder_service() -> SimplePropFinderService:
    """Dependency function for FastAPI routes"""
    global _simple_service_instance
    if _simple_service_instance is None:
        _simple_service_instance = SimplePropFinderService()
    return _simple_service_instance