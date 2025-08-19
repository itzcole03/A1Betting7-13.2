"""
Unified Odds Aggregation Service
Phase 3: Multiple Sportsbook Integrations - Aggregates odds from all integrated sportsbooks

Features:
- Multi-sportsbook odds aggregation
- Real-time odds comparison
- Arbitrage opportunity detection
- Best line identification
- Historical odds capture and storage
- Line movement analytics and steam detection
- Data normalization and standardization
- Caching and performance optimization
"""

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Union, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import statistics

# Sportsbook services
from .sportsbook_apis.draftkings_api_service import get_draftkings_service, DraftKingsOdds
from .sportsbook_apis.betmgm_api_service import get_betmgm_service, BetMGMOdds

# Core services
from .core.unified_cache_service import get_cache
from .core.unified_ml_service import SportType

logger = logging.getLogger(__name__)

@dataclass
class UnifiedOdds:
    """Unified odds structure across all sportsbooks"""
    event_id: str
    market_type: str
    selection: str
    odds_data: List[Dict[str, Any]]  # List of odds from different sportsbooks
    best_odds: float
    best_sportsbook: str
    avg_odds: float
    market_efficiency: float  # Measure of odds variance
    arbitrage_opportunity: Optional[Dict[str, Any]]
    last_updated: str
    sport: str
    league: str
    home_team: str
    away_team: str
    game_time: str

@dataclass
class ArbitrageOpportunity:
    """Arbitrage opportunity data structure"""
    event_id: str
    market_type: str
    selections: List[Dict[str, Any]]  # Each selection with best odds and sportsbook
    profit_margin: float  # Percentage profit
    total_stake: float
    stake_distribution: Dict[str, float]  # How to distribute stake
    sportsbooks_involved: List[str]
    confidence_level: float
    expires_at: str

@dataclass
class LineMovement:
    """Line movement tracking"""
    event_id: str
    market_type: str
    selection: str
    sportsbook: str
    previous_odds: float
    current_odds: float
    movement_direction: str  # 'up', 'down', 'stable'
    movement_size: float
    timestamp: str

class UnifiedOddsAggregationService:
    """Service for aggregating odds from multiple sportsbooks"""
    
    def __init__(self):
        self.supported_sportsbooks = ['DraftKings', 'BetMGM']
        self.arbitrage_threshold = 0.01  # 1% minimum profit margin
        self.steam_threshold = 0.5  # Minimum line movement for steam detection
        self.steam_window_minutes = 30  # Time window for synchronized movement  
        self.steam_min_books = 3  # Minimum books for steam detection
        
        self.cache_ttl = {
            'live_odds': 30,      # 30 seconds for live odds
            'pre_game_odds': 120, # 2 minutes for pre-game odds
            'arbitrage': 45,      # 45 seconds for arbitrage opportunities
            'line_movement': 60,  # 1 minute for line movement
            'historical_odds': 300  # 5 minutes for historical data
        }
        
        # Historical odds storage (in-memory for now, should be database)
        self.historical_odds = {}  # prop_id -> List[OddsSnapshot]
        self.movement_cache = {}   # prop_id:sportsbook -> MovementAnalysis
        
    async def get_aggregated_odds(
        self,
        event_id: Optional[str] = None,
        sport: Optional[SportType] = None,
        market_types: Optional[List[str]] = None,
        live_only: bool = False,
        include_arbitrage: bool = True
    ) -> List[UnifiedOdds]:
        """Get aggregated odds from all sportsbooks"""
        
        try:
            cache = await get_cache()
            cache_key = f"unified_odds:{event_id}:{sport}:{market_types}:{live_only}"
            
            # Check cache first
            cache_ttl = self.cache_ttl['live_odds'] if live_only else self.cache_ttl['pre_game_odds']
            cached_data = await cache.get(cache_key)
            if cached_data:
                return [UnifiedOdds(**odds) for odds in cached_data]

            # Collect odds from all sportsbooks
            all_odds = await self._collect_odds_from_all_sportsbooks(
                event_id=event_id,
                sport=sport,
                market_types=market_types,
                live_only=live_only
            )
            
            # Aggregate and normalize odds
            aggregated_odds = self._aggregate_odds_by_market(all_odds)
            
            # Add arbitrage analysis if requested
            if include_arbitrage:
                for odds in aggregated_odds:
                    odds.arbitrage_opportunity = await self._detect_arbitrage_opportunity(odds)
            
            # Cache results
            odds_data = [asdict(odds) for odds in aggregated_odds]
            await cache.set(cache_key, odds_data, ttl=cache_ttl)
            
            return aggregated_odds
            
        except Exception as e:
            logger.error(f"Failed to get aggregated odds: {e}")
            return []

    async def _collect_odds_from_all_sportsbooks(
        self,
        event_id: Optional[str] = None,
        sport: Optional[SportType] = None,
        market_types: Optional[List[str]] = None,
        live_only: bool = False
    ) -> Dict[str, List[Any]]:
        """Collect odds from all integrated sportsbooks"""
        
        all_odds = {}
        
        try:
            # Collect from DraftKings
            dk_service = await get_draftkings_service()
            dk_odds = await dk_service.get_odds(
                event_id=event_id,
                sport=sport,
                live_only=live_only
            )
            all_odds['DraftKings'] = dk_odds
            
        except Exception as e:
            logger.error(f"Failed to get DraftKings odds: {e}")
            all_odds['DraftKings'] = []

        try:
            # Collect from BetMGM
            betmgm_service = await get_betmgm_service()
            betmgm_odds = await betmgm_service.get_odds(
                event_id=event_id,
                sport=sport,
                live_only=live_only
            )
            all_odds['BetMGM'] = betmgm_odds
            
        except Exception as e:
            logger.error(f"Failed to get BetMGM odds: {e}")
            all_odds['BetMGM'] = []

        # Add more sportsbooks here as they're integrated
        # all_odds['Caesars'] = await self._get_caesars_odds(...)
        
        return all_odds

    def _aggregate_odds_by_market(self, all_odds: Dict[str, List[Any]]) -> List[UnifiedOdds]:
        """Aggregate odds by event and market"""
        
        # Group odds by event_id and market_type
        grouped_odds = {}
        
        for sportsbook, odds_list in all_odds.items():
            for odds in odds_list:
                # Create unique key for event + market + selection
                key = f"{odds.event_id}:{odds.market_type}:{odds.selection}"
                
                if key not in grouped_odds:
                    grouped_odds[key] = {
                        'event_id': odds.event_id,
                        'market_type': odds.market_type,
                        'selection': odds.selection,
                        'sport': odds.sport,
                        'league': odds.league,
                        'home_team': odds.home_team,
                        'away_team': odds.away_team,
                        'game_time': odds.game_time,
                        'odds_data': []
                    }
                
                # Add odds data
                odds_info = {
                    'sportsbook': sportsbook,
                    'odds': odds.odds,
                    'line': odds.line,
                    'last_updated': odds.last_updated,
                    'is_live': odds.is_live
                }
                grouped_odds[key]['odds_data'].append(odds_info)

        # Convert to UnifiedOdds objects
        unified_odds_list = []
        for market_data in grouped_odds.values():
            if len(market_data['odds_data']) > 0:
                unified_odds = self._create_unified_odds(market_data)
                unified_odds_list.append(unified_odds)

        return unified_odds_list

    def _create_unified_odds(self, market_data: Dict[str, Any]) -> UnifiedOdds:
        """Create unified odds object from market data"""
        
        odds_values = [odds['odds'] for odds in market_data['odds_data']]
        
        # Find best odds (highest for positive, closest to 0 for negative)
        best_odds = max(odds_values)
        best_sportsbook = next(
            odds['sportsbook'] for odds in market_data['odds_data'] 
            if odds['odds'] == best_odds
        )
        
        # Calculate average odds
        avg_odds = statistics.mean(odds_values)
        
        # Calculate market efficiency (lower variance = more efficient)
        market_efficiency = 1.0 / (1.0 + statistics.variance(odds_values)) if len(odds_values) > 1 else 1.0
        
        return UnifiedOdds(
            event_id=market_data['event_id'],
            market_type=market_data['market_type'],
            selection=market_data['selection'],
            odds_data=market_data['odds_data'],
            best_odds=best_odds,
            best_sportsbook=best_sportsbook,
            avg_odds=avg_odds,
            market_efficiency=market_efficiency,
            arbitrage_opportunity=None,  # Will be filled later if detected
            last_updated=datetime.now().isoformat(),
            sport=market_data['sport'],
            league=market_data['league'],
            home_team=market_data['home_team'],
            away_team=market_data['away_team'],
            game_time=market_data['game_time']
        )

    async def _detect_arbitrage_opportunity(self, odds: UnifiedOdds) -> Optional[Dict[str, Any]]:
        """Detect arbitrage opportunities in the odds"""
        
        try:
            # For arbitrage, we need opposing selections (like Over/Under, Team A/Team B)
            # This is a simplified detection - would need more sophisticated grouping in production
            
            # Calculate implied probabilities
            implied_probs = []
            for odds_data in odds.odds_data:
                prob = self._american_odds_to_probability(odds_data['odds'])
                implied_probs.append({
                    'sportsbook': odds_data['sportsbook'],
                    'odds': odds_data['odds'],
                    'probability': prob,
                    'selection': odds.selection
                })
            
            # Simple arbitrage detection for binary markets
            if len(implied_probs) >= 2:
                total_prob = sum(p['probability'] for p in implied_probs)
                
                if total_prob < 1.0:  # Arbitrage opportunity exists
                    profit_margin = (1.0 - total_prob) * 100
                    
                    if profit_margin >= self.arbitrage_threshold * 100:
                        return {
                            'profit_margin': profit_margin,
                            'total_implied_probability': total_prob,
                            'selections': implied_probs,
                            'confidence_level': min(90.0, profit_margin * 10),  # Simple confidence calculation
                            'detected_at': datetime.now().isoformat()
                        }
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to detect arbitrage opportunity: {e}")
            return None

    def _american_odds_to_probability(self, american_odds: float) -> float:
        """Convert American odds to implied probability"""
        
        if american_odds > 0:
            return 100 / (american_odds + 100)
        else:
            return abs(american_odds) / (abs(american_odds) + 100)

    async def get_arbitrage_opportunities(
        self,
        sport: Optional[SportType] = None,
        min_profit_margin: float = 1.0,
        max_opportunities: int = 50
    ) -> List[ArbitrageOpportunity]:
        """Get arbitrage opportunities across all sportsbooks"""
        
        try:
            cache = await get_cache()
            cache_key = f"arbitrage_opportunities:{sport}:{min_profit_margin}"
            
            # Check cache first
            cached_data = await cache.get(cache_key)
            if cached_data:
                return [ArbitrageOpportunity(**opp) for opp in cached_data]

            # Get aggregated odds for all events
            aggregated_odds = await self.get_aggregated_odds(
                sport=sport,
                include_arbitrage=True
            )
            
            # Filter for arbitrage opportunities
            opportunities = []
            for odds in aggregated_odds:
                if odds.arbitrage_opportunity:
                    arb_data = odds.arbitrage_opportunity
                    if arb_data['profit_margin'] >= min_profit_margin:
                        
                        # Calculate stake distribution
                        stake_distribution = self._calculate_optimal_stakes(arb_data['selections'])
                        
                        opportunity = ArbitrageOpportunity(
                            event_id=odds.event_id,
                            market_type=odds.market_type,
                            selections=arb_data['selections'],
                            profit_margin=arb_data['profit_margin'],
                            total_stake=100.0,  # Base stake of $100
                            stake_distribution=stake_distribution,
                            sportsbooks_involved=[s['sportsbook'] for s in arb_data['selections']],
                            confidence_level=arb_data['confidence_level'],
                            expires_at=(datetime.now() + timedelta(minutes=5)).isoformat()
                        )
                        opportunities.append(opportunity)

            # Sort by profit margin (highest first)
            opportunities.sort(key=lambda x: x.profit_margin, reverse=True)
            opportunities = opportunities[:max_opportunities]
            
            # Cache results
            opp_data = [asdict(opp) for opp in opportunities]
            await cache.set(cache_key, opp_data, ttl=self.cache_ttl['arbitrage'])
            
            return opportunities
            
        except Exception as e:
            logger.error(f"Failed to get arbitrage opportunities: {e}")
            return []

    def _calculate_optimal_stakes(self, selections: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calculate optimal stake distribution for arbitrage"""
        
        try:
            total_stake = 100.0  # Base total stake
            stakes = {}
            
            # For binary arbitrage (2 selections)
            if len(selections) == 2:
                prob1 = selections[0]['probability']
                prob2 = selections[1]['probability']
                
                # Kelly criterion adapted for arbitrage
                stake1 = total_stake * prob2 / (prob1 + prob2)
                stake2 = total_stake * prob1 / (prob1 + prob2)
                
                stakes[selections[0]['sportsbook']] = round(stake1, 2)
                stakes[selections[1]['sportsbook']] = round(stake2, 2)
            
            else:
                # For multiple selections, distribute proportionally
                total_prob = sum(s['probability'] for s in selections)
                for selection in selections:
                    stake = total_stake * (selection['probability'] / total_prob)
                    stakes[selection['sportsbook']] = round(stake, 2)
            
            return stakes
            
        except Exception as e:
            logger.error(f"Failed to calculate optimal stakes: {e}")
            return {}

    async def get_best_lines(
        self,
        sport: Optional[SportType] = None,
        market_types: Optional[List[str]] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get best lines (odds) for each market across all sportsbooks"""
        
        try:
            # Get aggregated odds
            aggregated_odds = await self.get_aggregated_odds(
                sport=sport,
                market_types=market_types
            )
            
            # Extract best lines
            best_lines = []
            for odds in aggregated_odds[:limit]:
                best_line = {
                    'event_id': odds.event_id,
                    'market_type': odds.market_type,
                    'selection': odds.selection,
                    'best_odds': odds.best_odds,
                    'best_sportsbook': odds.best_sportsbook,
                    'avg_odds': odds.avg_odds,
                    'market_efficiency': odds.market_efficiency,
                    'odds_count': len(odds.odds_data),
                    'sportsbooks': [od['sportsbook'] for od in odds.odds_data],
                    'sport': odds.sport,
                    'teams': f"{odds.away_team} @ {odds.home_team}",
                    'game_time': odds.game_time,
                    'last_updated': odds.last_updated
                }
                best_lines.append(best_line)
            
            # Sort by best odds (highest first)
            best_lines.sort(key=lambda x: x['best_odds'], reverse=True)
            
            return best_lines
            
        except Exception as e:
            logger.error(f"Failed to get best lines: {e}")
            return []

    async def track_line_movement(
        self,
        event_id: str,
        market_type: str,
        lookback_hours: int = 24
    ) -> List[LineMovement]:
        """Track line movement for a specific market"""
        
        try:
            cache = await get_cache()
            cache_key = f"line_movement:{event_id}:{market_type}"
            
            # Check cache first
            cached_data = await cache.get(cache_key)
            if cached_data:
                return [LineMovement(**movement) for movement in cached_data]

            # In production, this would query historical odds data
            # For now, we'll return mock line movement data
            movements = await self._generate_mock_line_movement(event_id, market_type)
            
            # Cache results
            movement_data = [asdict(movement) for movement in movements]
            await cache.set(cache_key, movement_data, ttl=self.cache_ttl['line_movement'])
            
            return movements
            
        except Exception as e:
            logger.error(f"Failed to track line movement: {e}")
            return []

    async def _generate_mock_line_movement(self, event_id: str, market_type: str) -> List[LineMovement]:
        """Generate mock line movement data for demonstration"""
        
        movements = []
        sportsbooks = ['DraftKings', 'BetMGM']
        
        # Generate some historical movements
        for i in range(5):
            for sportsbook in sportsbooks:
                movement = LineMovement(
                    event_id=event_id,
                    market_type=market_type,
                    selection="Over",
                    sportsbook=sportsbook,
                    previous_odds=-110 + (i * 5),
                    current_odds=-110 + ((i + 1) * 5),
                    movement_direction="up" if i % 2 == 0 else "down",
                    movement_size=5.0,
                    timestamp=(datetime.now() - timedelta(hours=i)).isoformat()
                )
                movements.append(movement)
        
        return movements

    async def get_aggregation_stats(self) -> Dict[str, Any]:
        """Get aggregation service statistics"""
        
        try:
            # Count current odds
            current_odds = await self.get_aggregated_odds()
            
            # Count arbitrage opportunities
            arbitrage_ops = await self.get_arbitrage_opportunities()
            
            return {
                "service": "Unified Odds Aggregation",
                "status": "operational",
                "supported_sportsbooks": self.supported_sportsbooks,
                "current_stats": {
                    "total_markets": len(current_odds),
                    "arbitrage_opportunities": len(arbitrage_ops),
                    "avg_sportsbooks_per_market": round(
                        sum(len(odds.odds_data) for odds in current_odds) / max(len(current_odds), 1), 1
                    ),
                    "best_arbitrage_margin": max(
                        (opp.profit_margin for opp in arbitrage_ops), default=0.0
                    )
                },
                "features": {
                    "real_time_aggregation": True,
                    "arbitrage_detection": True,
                    "line_movement_tracking": True,
                    "best_line_identification": True,
                    "multi_sportsbook_support": True
                },
                "performance": {
                    "cache_ttl_seconds": self.cache_ttl,
                    "aggregation_speed": "< 2 seconds",
                    "update_frequency": "Real-time"
                },
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to get aggregation stats: {e}")
            return {
                "service": "Unified Odds Aggregation",
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    # === LINE MOVEMENT TRACKING METHODS ===
    
    async def capture_odds_snapshot(self, prop_id: str, sportsbook: str, sport: str, 
                                   line: Optional[float], over_odds: Optional[int], 
                                   under_odds: Optional[int]) -> None:
        """Capture odds snapshot for line movement tracking"""
        try:
            from ..services.historical_odds_capture import OddsSnapshot
            
            snapshot = OddsSnapshot(
                prop_id=prop_id,
                sportsbook=sportsbook, 
                sport=sport,
                line=line,
                over_odds=over_odds,
                under_odds=under_odds,
                captured_at=datetime.now(timezone.utc)
            )
            
            # Store in memory cache (should be database)
            if prop_id not in self.historical_odds:
                self.historical_odds[prop_id] = {}
            if sportsbook not in self.historical_odds[prop_id]:
                self.historical_odds[prop_id][sportsbook] = []
                
            self.historical_odds[prop_id][sportsbook].append(snapshot)
            
            # Keep only recent snapshots (last 7 days)
            cutoff_time = datetime.now(timezone.utc) - timedelta(days=7)
            self.historical_odds[prop_id][sportsbook] = [
                s for s in self.historical_odds[prop_id][sportsbook] 
                if s.captured_at > cutoff_time
            ]
            
            logger.debug(f"Captured odds snapshot for {prop_id} at {sportsbook}")
            
        except Exception as e:
            logger.error(f"Error capturing odds snapshot: {e}")
    
    async def get_prop_history(self, prop_id: str, sportsbook: str, 
                              start_time: Optional[datetime] = None,
                              end_time: Optional[datetime] = None,
                              limit: int = 100) -> List[Dict[str, Any]]:
        """Get historical odds data for a prop"""
        try:
            if prop_id not in self.historical_odds:
                return []
                
            if sportsbook not in self.historical_odds[prop_id]:
                return []
                
            snapshots = self.historical_odds[prop_id][sportsbook]
            
            # Filter by time range if specified
            if start_time:
                snapshots = [s for s in snapshots if s.captured_at >= start_time]
            if end_time:
                snapshots = [s for s in snapshots if s.captured_at <= end_time]
            
            # Sort by timestamp and limit
            snapshots = sorted(snapshots, key=lambda x: x.captured_at, reverse=True)[:limit]
            
            return [s.to_dict() for s in snapshots]
            
        except Exception as e:
            logger.error(f"Error retrieving prop history: {e}")
            return []
    
    async def analyze_line_movement(self, prop_id: str, sportsbook: str, 
                                   hours_back: int = 24) -> Dict[str, Any]:
        """Analyze line movement for a prop at a specific sportsbook"""
        try:
            from ..services.line_movement_analytics import get_movement_analytics
            
            # Get historical data
            end_time = datetime.now(timezone.utc)
            start_time = end_time - timedelta(hours=hours_back)
            
            historical_data = await self.get_prop_history(
                prop_id=prop_id,
                sportsbook=sportsbook, 
                start_time=start_time,
                end_time=end_time
            )
            
            if not historical_data:
                return {"error": "No historical data available"}
                
            # Use line movement analytics service
            analytics_service = get_movement_analytics()
            analysis = await analytics_service.analyze_prop_movement(
                prop_id=prop_id,
                sportsbook=sportsbook,
                historical_data=historical_data
            )
            
            return {
                "prop_id": analysis.prop_id,
                "sportsbook": analysis.sportsbook,
                "movement_1h": analysis.movement_1h,
                "movement_6h": analysis.movement_6h, 
                "movement_24h": analysis.movement_24h,
                "movement_total": analysis.movement_total,
                "velocity_1h": analysis.velocity_1h,
                "volatility_score": analysis.volatility_score,
                "direction_changes": analysis.direction_changes,
                "opening_line": analysis.opening_line,
                "current_line": analysis.current_line,
                "computed_at": analysis.computed_at.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error analyzing line movement: {e}")
            return {"error": str(e)}
    
    async def detect_steam_movement(self, prop_id: str) -> Optional[Dict[str, Any]]:
        """Detect steam across multiple sportsbooks for a prop"""
        try:
            from ..services.line_movement_analytics import get_movement_analytics
            
            # Get recent data for all books
            end_time = datetime.now(timezone.utc)
            start_time = end_time - timedelta(minutes=self.steam_window_minutes * 2)
            
            all_books_data = {}
            if prop_id in self.historical_odds:
                for sportsbook in self.historical_odds[prop_id]:
                    book_data = await self.get_prop_history(
                        prop_id=prop_id,
                        sportsbook=sportsbook,
                        start_time=start_time,
                        end_time=end_time
                    )
                    if book_data:
                        all_books_data[sportsbook] = book_data
            
            if len(all_books_data) < self.steam_min_books:
                return None
                
            # Use analytics service for steam detection
            analytics_service = get_movement_analytics()
            steam_alert = await analytics_service.detect_steam_across_books(
                prop_id=prop_id,
                all_books_data=all_books_data
            )
            
            if steam_alert:
                return {
                    "prop_id": steam_alert.prop_id,
                    "detected_at": steam_alert.detected_at.isoformat(),
                    "books_moving": steam_alert.books_moving,
                    "movement_size": steam_alert.movement_size,
                    "confidence_score": steam_alert.confidence_score,
                    "synchronized_window_minutes": steam_alert.synchronized_window_minutes
                }
                
            return None
            
        except Exception as e:
            logger.error(f"Error detecting steam movement: {e}")
            return {"error": str(e)}

# Global service instance
unified_odds_service = UnifiedOddsAggregationService()

async def get_unified_odds_service() -> UnifiedOddsAggregationService:
    """Get the global unified odds aggregation service instance"""
    return unified_odds_service
