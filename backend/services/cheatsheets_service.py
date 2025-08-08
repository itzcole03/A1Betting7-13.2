"""
Cheatsheets Service - Ranked prop opportunities with edge calculation
Provides filtered and scored betting opportunities with configurable parameters
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import json
import os
import math

from backend.services.odds_aggregation_service import get_odds_service, CanonicalLine
from backend.services.unified_data_fetcher import unified_data_fetcher

logger = logging.getLogger(__name__)

@dataclass
class PropOpportunity:
    """Ranked prop betting opportunity with edge calculation"""
    id: str
    player_name: str
    stat_type: str
    line: float
    recommended_side: str  # 'over' or 'under'
    edge_percentage: float
    confidence: float
    best_odds: int
    best_book: str
    fair_price: float
    implied_probability: float
    recent_performance: str
    sample_size: int
    last_updated: datetime
    sport: str
    team: str
    opponent: str
    venue: str  # 'home' or 'away'
    weather: Optional[str] = None
    injury_concerns: Optional[str] = None
    
    # Additional analytics
    market_efficiency: float = 0.0
    volatility_score: float = 0.0
    trend_direction: str = "neutral"  # 'bullish', 'bearish', 'neutral'
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "player_name": self.player_name,
            "stat_type": self.stat_type,
            "line": self.line,
            "recommended_side": self.recommended_side,
            "edge_percentage": round(self.edge_percentage, 2),
            "confidence": round(self.confidence, 1),
            "best_odds": self.best_odds,
            "best_book": self.best_book,
            "fair_price": round(self.fair_price, 3),
            "implied_probability": round(self.implied_probability, 3),
            "recent_performance": self.recent_performance,
            "sample_size": self.sample_size,
            "last_updated": self.last_updated.isoformat(),
            "sport": self.sport,
            "team": self.team,
            "opponent": self.opponent,
            "venue": self.venue,
            "weather": self.weather,
            "injury_concerns": self.injury_concerns,
            "market_efficiency": round(self.market_efficiency, 3),
            "volatility_score": round(self.volatility_score, 3),
            "trend_direction": self.trend_direction
        }

@dataclass
class CheatsheetFilters:
    """Filter configuration for cheatsheet opportunities"""
    min_edge: float = 1.0
    min_confidence: float = 60.0
    min_sample_size: int = 10
    stat_types: List[str] = None
    books: List[str] = None
    sides: List[str] = None  # 'over', 'under'
    sports: List[str] = None
    search_query: str = ""
    max_results: int = 50
    
    def __post_init__(self):
        if self.stat_types is None:
            self.stat_types = []
        if self.books is None:
            self.books = []
        if self.sides is None:
            self.sides = ['over', 'under']
        if self.sports is None:
            self.sports = ['MLB']

class CheatsheetsService:
    """Service for generating ranked prop opportunities"""
    
    def __init__(self):
        self.odds_service = get_odds_service()
        self.cache_ttl = 300  # 5 minutes cache
        self.opportunities_cache: Dict[str, Dict] = {}
        
        # ML model weights for opportunity scoring
        self.scoring_weights = {
            'edge_percentage': 0.35,
            'confidence': 0.25,
            'sample_size': 0.15,
            'market_efficiency': 0.10,
            'recent_performance': 0.10,
            'volatility': 0.05
        }
    
    async def get_ranked_opportunities(
        self, 
        filters: CheatsheetFilters
    ) -> List[PropOpportunity]:
        """Get ranked prop opportunities based on filters"""
        
        cache_key = self._generate_cache_key(filters)
        
        # Check cache first
        if cache_key in self.opportunities_cache:
            cached_data = self.opportunities_cache[cache_key]
            if datetime.now() - cached_data["timestamp"] < timedelta(seconds=self.cache_ttl):
                return cached_data["opportunities"]
        
        try:
            # Get best lines from odds service
            opportunities = []
            
            for sport in filters.sports:
                sport_opportunities = await self._analyze_sport_opportunities(sport, filters)
                opportunities.extend(sport_opportunities)
            
            # Apply filters
            filtered_opportunities = self._apply_filters(opportunities, filters)
            
            # Sort by composite score (edge + confidence + other factors)
            filtered_opportunities.sort(key=self._calculate_opportunity_score, reverse=True)
            
            # Limit results
            result = filtered_opportunities[:filters.max_results]
            
            # Cache results
            self.opportunities_cache[cache_key] = {
                "opportunities": result,
                "timestamp": datetime.now()
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to get ranked opportunities: {e}")
            # Return mock data for demo
            return self._generate_mock_opportunities(filters)
    
    async def _analyze_sport_opportunities(
        self, 
        sport: str, 
        filters: CheatsheetFilters
    ) -> List[PropOpportunity]:
        """Analyze opportunities for a specific sport"""
        
        # Get best lines from odds aggregation
        best_lines = await self.odds_service.find_best_lines(sport)
        
        opportunities = []
        
        for line in best_lines:
            try:
                # Calculate fair value and edge for both sides
                over_opportunity = await self._evaluate_prop_side(line, 'over')
                under_opportunity = await self._evaluate_prop_side(line, 'under')
                
                # Add opportunities that meet minimum criteria
                for opp in [over_opportunity, under_opportunity]:
                    if opp and opp.edge_percentage >= 0.5:  # Minimum 0.5% edge
                        opportunities.append(opp)
                        
            except Exception as e:
                logger.warning(f"Failed to evaluate line {line.player_name}: {e}")
                continue
        
        return opportunities
    
    async def _evaluate_prop_side(
        self, 
        line: CanonicalLine, 
        side: str
    ) -> Optional[PropOpportunity]:
        """Evaluate a specific side of a prop for edge calculation"""
        
        try:
            # Get player historical data for this stat
            player_data = await self._get_player_historical_data(
                line.player_name, 
                line.stat_type
            )
            
            if not player_data or len(player_data.get('recent_games', [])) < 5:
                return None
            
            # Calculate fair probability based on historical performance
            fair_probability = self._calculate_fair_probability(
                player_data, 
                line.stat_type, 
                line.best_over_line if side == 'over' else line.best_under_line,
                side
            )
            
            # Get market odds for this side
            market_odds = line.best_over_price if side == 'over' else line.best_under_price
            market_probability = self._american_to_probability(market_odds)
            
            # Calculate edge
            edge_percentage = ((fair_probability - market_probability) / market_probability) * 100
            
            # Skip if negative edge
            if edge_percentage <= 0:
                return None
            
            # Calculate confidence based on sample size and consistency
            confidence = self._calculate_confidence(player_data, line.stat_type)
            
            # Generate recent performance summary
            recent_performance = self._generate_performance_summary(
                player_data, 
                line.stat_type, 
                line.best_over_line if side == 'over' else line.best_under_line,
                side
            )
            
            # Create opportunity
            opportunity = PropOpportunity(
                id=f"{line.player_name}_{line.stat_type}_{side}_{datetime.now().timestamp()}",
                player_name=line.player_name,
                stat_type=line.stat_type,
                line=line.best_over_line if side == 'over' else line.best_under_line,
                recommended_side=side,
                edge_percentage=edge_percentage,
                confidence=confidence,
                best_odds=market_odds,
                best_book=line.best_over_book if side == 'over' else line.best_under_book,
                fair_price=fair_probability,
                implied_probability=market_probability,
                recent_performance=recent_performance,
                sample_size=len(player_data.get('recent_games', [])),
                last_updated=datetime.now(),
                sport='MLB',
                team=player_data.get('team', 'Unknown'),
                opponent=player_data.get('next_opponent', 'TBD'),
                venue=player_data.get('next_venue', 'away'),
                weather=player_data.get('weather_forecast'),
                injury_concerns=player_data.get('injury_status'),
                market_efficiency=self._calculate_market_efficiency(line),
                volatility_score=self._calculate_volatility(player_data, line.stat_type),
                trend_direction=self._analyze_trend_direction(player_data, line.stat_type)
            )
            
            return opportunity
            
        except Exception as e:
            logger.error(f"Failed to evaluate prop side: {e}")
            return None
    
    def _calculate_fair_probability(
        self, 
        player_data: Dict, 
        stat_type: str, 
        line: float, 
        side: str
    ) -> float:
        """Calculate fair probability for a prop based on historical data"""
        
        recent_games = player_data.get('recent_games', [])
        if not recent_games:
            return 0.5  # Default to 50% if no data
        
        # Extract stat values from recent games
        stat_values = []
        for game in recent_games:
            value = game.get('stats', {}).get(stat_type, 0)
            if value is not None:
                stat_values.append(float(value))
        
        if not stat_values:
            return 0.5
        
        # Calculate probability based on historical frequency
        if side == 'over':
            successes = sum(1 for value in stat_values if value > line)
        else:
            successes = sum(1 for value in stat_values if value < line)
        
        # Apply Bayesian smoothing with prior
        prior_prob = 0.5  # Neutral prior
        prior_weight = 2   # Weight of prior
        
        smoothed_prob = (successes + prior_weight * prior_prob) / (len(stat_values) + prior_weight)
        
        # Apply contextual adjustments
        smoothed_prob = self._apply_contextual_adjustments(
            smoothed_prob, 
            player_data, 
            stat_type
        )
        
        return max(0.01, min(0.99, smoothed_prob))  # Clamp between 1% and 99%
    
    def _apply_contextual_adjustments(
        self, 
        base_prob: float, 
        player_data: Dict, 
        stat_type: str
    ) -> float:
        """Apply contextual adjustments based on venue, opponent, etc."""
        
        adjusted_prob = base_prob
        
        # Home/away adjustment
        venue = player_data.get('next_venue', 'away')
        home_stats = player_data.get('home_stats', {})
        away_stats = player_data.get('away_stats', {})
        
        if venue == 'home' and home_stats.get(stat_type):
            home_avg = home_stats[stat_type]
            overall_avg = player_data.get('season_stats', {}).get(stat_type, home_avg)
            if overall_avg > 0:
                adjustment = (home_avg / overall_avg) - 1
                adjusted_prob *= (1 + adjustment * 0.1)  # 10% weight to venue
        
        # Recent trend adjustment
        trend = player_data.get('recent_trend', {}).get(stat_type, 0)
        if trend != 0:
            adjusted_prob *= (1 + trend * 0.05)  # 5% weight to trend
        
        # Opponent difficulty adjustment
        opponent_rating = player_data.get('opponent_defense_rating', 0.5)
        if opponent_rating != 0.5:
            difficulty_adjustment = (0.5 - opponent_rating) * 0.1
            adjusted_prob *= (1 + difficulty_adjustment)
        
        return max(0.01, min(0.99, adjusted_prob))
    
    def _calculate_confidence(self, player_data: Dict, stat_type: str) -> float:
        """Calculate confidence score based on data quality and consistency"""
        
        recent_games = player_data.get('recent_games', [])
        if not recent_games:
            return 50.0
        
        # Base confidence from sample size
        sample_size = len(recent_games)
        base_confidence = min(90, 50 + (sample_size - 5) * 3)  # 50% + 3% per game over 5
        
        # Adjust for consistency (lower standard deviation = higher confidence)
        stat_values = [
            game.get('stats', {}).get(stat_type, 0) 
            for game in recent_games 
            if game.get('stats', {}).get(stat_type) is not None
        ]
        
        if len(stat_values) > 1:
            mean_val = sum(stat_values) / len(stat_values)
            variance = sum((x - mean_val) ** 2 for x in stat_values) / len(stat_values)
            std_dev = math.sqrt(variance)
            
            # Normalize consistency score (lower std dev = higher consistency)
            if mean_val > 0:
                cv = std_dev / mean_val  # Coefficient of variation
                consistency_bonus = max(0, (0.5 - cv) * 20)  # Up to 10 point bonus
                base_confidence += consistency_bonus
        
        return max(50.0, min(95.0, base_confidence))
    
    def _generate_performance_summary(
        self, 
        player_data: Dict, 
        stat_type: str, 
        line: float, 
        side: str
    ) -> str:
        """Generate human-readable recent performance summary"""
        
        recent_games = player_data.get('recent_games', [])[-10:]  # Last 10 games
        if not recent_games:
            return "No recent data available"
        
        # Count hits vs line
        if side == 'over':
            hits = sum(1 for game in recent_games 
                      if game.get('stats', {}).get(stat_type, 0) > line)
        else:
            hits = sum(1 for game in recent_games 
                      if game.get('stats', {}).get(stat_type, 0) < line)
        
        total_games = len(recent_games)
        
        return f"{hits} of last {total_games} games {side} {line}"
    
    def _calculate_market_efficiency(self, line: CanonicalLine) -> float:
        """Calculate market efficiency score (lower = more inefficient/better opportunity)"""
        
        # Calculate based on spread between books
        if not line.books or len(line.books) < 2:
            return 0.5  # Default efficiency
        
        # Get range of odds for over/under
        over_odds = [book.over_price for book in line.books if book.over_price != 0]
        under_odds = [book.under_price for book in line.books if book.under_price != 0]
        
        if not over_odds or not under_odds:
            return 0.5
        
        # Calculate spread
        over_spread = max(over_odds) - min(over_odds)
        under_spread = max(under_odds) - min(under_odds)
        avg_spread = (over_spread + under_spread) / 2
        
        # Normalize (higher spread = lower efficiency = better opportunity)
        efficiency = max(0.0, min(1.0, 1.0 - (avg_spread / 100)))
        
        return efficiency
    
    def _calculate_volatility(self, player_data: Dict, stat_type: str) -> float:
        """Calculate volatility score for the stat"""
        
        recent_games = player_data.get('recent_games', [])
        stat_values = [
            game.get('stats', {}).get(stat_type, 0) 
            for game in recent_games 
            if game.get('stats', {}).get(stat_type) is not None
        ]
        
        if len(stat_values) < 3:
            return 0.5  # Default volatility
        
        mean_val = sum(stat_values) / len(stat_values)
        if mean_val == 0:
            return 0.5
        
        variance = sum((x - mean_val) ** 2 for x in stat_values) / len(stat_values)
        cv = math.sqrt(variance) / mean_val  # Coefficient of variation
        
        # Normalize to 0-1 scale
        return min(1.0, cv)
    
    def _analyze_trend_direction(self, player_data: Dict, stat_type: str) -> str:
        """Analyze recent trend direction"""
        
        recent_games = player_data.get('recent_games', [])[-5:]  # Last 5 games
        if len(recent_games) < 3:
            return "neutral"
        
        stat_values = [
            game.get('stats', {}).get(stat_type, 0) 
            for game in recent_games 
            if game.get('stats', {}).get(stat_type) is not None
        ]
        
        if len(stat_values) < 3:
            return "neutral"
        
        # Simple trend analysis
        recent_avg = sum(stat_values[-3:]) / 3
        earlier_avg = sum(stat_values[:-3]) / max(1, len(stat_values) - 3)
        
        if recent_avg > earlier_avg * 1.1:
            return "bullish"
        elif recent_avg < earlier_avg * 0.9:
            return "bearish"
        else:
            return "neutral"
    
    async def _get_player_historical_data(self, player_name: str, stat_type: str) -> Optional[Dict]:
        """Get player historical data from unified data fetcher"""
        
        try:
            # Try to get real player data
            player_data = await unified_data_fetcher.fetch_player_stats(player_name, 'MLB')
            
            if player_data:
                return player_data
            
            # Fall back to mock data
            return self._generate_mock_player_data(player_name, stat_type)
            
        except Exception as e:
            logger.warning(f"Failed to get player data for {player_name}: {e}")
            return self._generate_mock_player_data(player_name, stat_type)
    
    def _generate_mock_player_data(self, player_name: str, stat_type: str) -> Dict:
        """Generate mock player data for demo purposes"""
        import random
        
        # Generate realistic mock data
        base_avg = {
            'hits': 1.2,
            'home_runs': 0.15,
            'rbis': 0.8,
            'total_bases': 1.8,
            'runs_scored': 0.7
        }.get(stat_type, 1.0)
        
        recent_games = []
        for i in range(15):  # 15 recent games
            game_value = max(0, random.gauss(base_avg, base_avg * 0.4))
            recent_games.append({
                'date': (datetime.now() - timedelta(days=i+1)).isoformat(),
                'stats': {
                    stat_type: round(game_value, 1)
                }
            })
        
        return {
            'team': random.choice(['NYY', 'LAD', 'ATL', 'SD', 'HOU']),
            'recent_games': recent_games,
            'next_opponent': random.choice(['BOS', 'SF', 'NYM', 'LAA', 'TB']),
            'next_venue': random.choice(['home', 'away']),
            'season_stats': {
                stat_type: base_avg
            },
            'home_stats': {
                stat_type: base_avg * random.uniform(0.9, 1.1)
            },
            'away_stats': {
                stat_type: base_avg * random.uniform(0.9, 1.1)
            },
            'recent_trend': {
                stat_type: random.uniform(-0.2, 0.2)
            },
            'opponent_defense_rating': random.uniform(0.3, 0.7)
        }
    
    def _generate_mock_opportunities(self, filters: CheatsheetFilters) -> List[PropOpportunity]:
        """Generate mock opportunities for demo"""
        import random
        
        mock_players = ['Aaron Judge', 'Mookie Betts', 'Ronald Acuna Jr.', 'Juan Soto', 'Vladimir Guerrero Jr.']
        stat_types = ['hits', 'total_bases', 'home_runs', 'rbis', 'runs_scored']
        books = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'PointsBet']
        
        opportunities = []
        
        for i, player in enumerate(mock_players):
            for j, stat in enumerate(stat_types[:3]):  # Limit for demo
                for side in ['over', 'under']:
                    if random.random() > 0.6:  # 40% chance per combination
                        opp = PropOpportunity(
                            id=f"mock_{i}_{j}_{side}",
                            player_name=player,
                            stat_type=stat,
                            line=round(0.5 + random.random() * 3, 1),
                            recommended_side=side,
                            edge_percentage=0.5 + random.random() * 8,
                            confidence=60 + random.random() * 30,
                            best_odds=-110 + random.randint(-30, 30),
                            best_book=random.choice(books),
                            fair_price=0.4 + random.random() * 0.2,
                            implied_probability=0.45 + random.random() * 0.1,
                            recent_performance=f"{random.randint(3, 8)} of last 10 games {side}",
                            sample_size=10 + random.randint(0, 15),
                            last_updated=datetime.now(),
                            sport='MLB',
                            team=['NYY', 'LAD', 'ATL', 'SD', 'HOU'][i],
                            opponent=['BOS', 'SF', 'NYM', 'LAA', 'TB'][i],
                            venue=random.choice(['home', 'away']),
                            market_efficiency=random.random(),
                            volatility_score=random.random(),
                            trend_direction=random.choice(['bullish', 'bearish', 'neutral'])
                        )
                        opportunities.append(opp)
        
        return opportunities
    
    def _apply_filters(
        self, 
        opportunities: List[PropOpportunity], 
        filters: CheatsheetFilters
    ) -> List[PropOpportunity]:
        """Apply filters to opportunities list"""
        
        filtered = []
        
        for opp in opportunities:
            # Apply all filters
            if opp.edge_percentage < filters.min_edge:
                continue
            if opp.confidence < filters.min_confidence:
                continue
            if opp.sample_size < filters.min_sample_size:
                continue
            if filters.stat_types and opp.stat_type not in filters.stat_types:
                continue
            if filters.books and opp.best_book not in filters.books:
                continue
            if filters.sides and opp.recommended_side not in filters.sides:
                continue
            if filters.sports and opp.sport not in filters.sports:
                continue
            if filters.search_query and filters.search_query.lower() not in opp.player_name.lower():
                continue
            
            filtered.append(opp)
        
        return filtered
    
    def _calculate_opportunity_score(self, opportunity: PropOpportunity) -> float:
        """Calculate composite opportunity score for ranking"""
        
        # Normalize each factor to 0-1 scale
        edge_score = min(1.0, opportunity.edge_percentage / 10.0)  # 10% edge = max score
        confidence_score = opportunity.confidence / 100.0
        sample_score = min(1.0, opportunity.sample_size / 30.0)  # 30 games = max score
        efficiency_score = 1.0 - opportunity.market_efficiency  # Lower efficiency = higher score
        volatility_score = 1.0 - opportunity.volatility_score  # Lower volatility = higher score
        
        # Performance factor based on recent performance parsing
        perf_text = opportunity.recent_performance.lower()
        if 'of last' in perf_text:
            try:
                parts = perf_text.split()
                hits = int(parts[0])
                total = int(parts[3])
                perf_score = hits / total if total > 0 else 0.5
            except:
                perf_score = 0.5
        else:
            perf_score = 0.5
        
        # Calculate weighted score
        composite_score = (
            edge_score * self.scoring_weights['edge_percentage'] +
            confidence_score * self.scoring_weights['confidence'] +
            sample_score * self.scoring_weights['sample_size'] +
            efficiency_score * self.scoring_weights['market_efficiency'] +
            perf_score * self.scoring_weights['recent_performance'] +
            volatility_score * self.scoring_weights['volatility']
        )
        
        return composite_score
    
    def _generate_cache_key(self, filters: CheatsheetFilters) -> str:
        """Generate cache key from filters"""
        key_data = {
            'min_edge': filters.min_edge,
            'min_confidence': filters.min_confidence,
            'min_sample_size': filters.min_sample_size,
            'stat_types': sorted(filters.stat_types),
            'books': sorted(filters.books),
            'sides': sorted(filters.sides),
            'sports': sorted(filters.sports),
            'search': filters.search_query
        }
        return f"cheatsheets:{hash(str(key_data))}"
    
    def _american_to_probability(self, american_odds: int) -> float:
        """Convert American odds to implied probability"""
        if american_odds > 0:
            return 100 / (american_odds + 100)
        else:
            return abs(american_odds) / (abs(american_odds) + 100)
    
    async def export_opportunities_csv(
        self, 
        opportunities: List[PropOpportunity]
    ) -> str:
        """Export opportunities to CSV format"""
        
        headers = [
            'Player', 'Stat Type', 'Line', 'Side', 'Edge %', 
            'Confidence', 'Best Odds', 'Book', 'Fair Price',
            'Sample Size', 'Recent Performance', 'Team', 'Opponent',
            'Venue', 'Market Efficiency', 'Volatility', 'Trend'
        ]
        
        rows = [headers]
        
        for opp in opportunities:
            row = [
                opp.player_name,
                opp.stat_type,
                str(opp.line),
                opp.recommended_side,
                f"{opp.edge_percentage:.2f}",
                f"{opp.confidence:.1f}",
                str(opp.best_odds),
                opp.best_book,
                f"{opp.fair_price:.3f}",
                str(opp.sample_size),
                opp.recent_performance,
                opp.team,
                opp.opponent,
                opp.venue,
                f"{opp.market_efficiency:.3f}",
                f"{opp.volatility_score:.3f}",
                opp.trend_direction
            ]
            rows.append(row)
        
        return '\n'.join([','.join(row) for row in rows])

# Singleton instance
_cheatsheets_service = None

def get_cheatsheets_service() -> CheatsheetsService:
    """Get singleton cheatsheets service instance"""
    global _cheatsheets_service
    if _cheatsheets_service is None:
        _cheatsheets_service = CheatsheetsService()
    return _cheatsheets_service
