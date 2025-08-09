"""
Live Betting Engine with Real-Time Odds Integration
Advanced live betting system with real-time odds tracking, line movement analysis,
and automated opportunity detection across multiple sportsbooks.
Part of Phase 4: Elite Betting Operations and Automation
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any, Set
from dataclasses import dataclass, asdict
from enum import Enum
import numpy as np
import pandas as pd
from collections import defaultdict, deque
import websockets
import aiohttp
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

class BettingMarket(Enum):
    SPREAD = "spread"
    MONEYLINE = "moneyline"
    TOTAL = "total"
    PLAYER_PROPS = "player_props"
    TEAM_PROPS = "team_props"
    LIVE_PROPS = "live_props"

class OddsFormat(Enum):
    AMERICAN = "american"
    DECIMAL = "decimal"
    FRACTIONAL = "fractional"

class LineMovementDirection(Enum):
    UP = "up"
    DOWN = "down"
    STABLE = "stable"

@dataclass
class LiveOdds:
    """Real-time odds data structure"""
    odds_id: str
    sportsbook: str
    game_id: str
    sport: str
    market_type: BettingMarket
    selection: str  # team, player, or outcome
    odds_american: int
    odds_decimal: float
    line: Optional[float]  # spread or total line
    juice: float  # sportsbook margin
    timestamp: datetime
    is_available: bool
    max_bet: Optional[float]
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['market_type'] = self.market_type.value
        data['timestamp'] = self.timestamp.isoformat()
        return data

@dataclass
class LineMovement:
    """Line movement tracking"""
    movement_id: str
    odds_id: str
    previous_odds: int
    new_odds: int
    previous_line: Optional[float]
    new_line: Optional[float]
    direction: LineMovementDirection
    movement_amount: float
    timestamp: datetime
    volume_indicator: float  # 0-1, higher = more betting action
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['direction'] = self.direction.value
        data['timestamp'] = self.timestamp.isoformat()
        return data

@dataclass
class LiveGame:
    """Live game data structure"""
    game_id: str
    sport: str
    home_team: str
    away_team: str
    league: str
    start_time: datetime
    current_period: str
    time_remaining: str
    home_score: int
    away_score: int
    game_state: str  # pregame, live, halftime, final
    last_play: Optional[str]
    total_bet_volume: float
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['start_time'] = self.start_time.isoformat()
        return data

@dataclass
class BettingOpportunity:
    """Live betting opportunity"""
    opportunity_id: str
    game_id: str
    market_type: BettingMarket
    sportsbook: str
    selection: str
    recommended_odds: int
    fair_value_odds: int
    edge_percentage: float
    confidence_score: float
    max_stake: float
    time_sensitivity: int  # seconds until opportunity expires
    reasoning: str
    created_at: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['market_type'] = self.market_type.value
        data['created_at'] = self.created_at.isoformat()
        return data

class LiveBettingEngine:
    """
    Advanced live betting engine with real-time odds integration
    
    Features:
    - Real-time odds tracking from 15+ sportsbooks
    - Line movement analysis and prediction
    - Live game state monitoring
    - Automated opportunity detection
    - Risk management and position sizing
    - Market efficiency analysis
    - Steam detection and sharp money indicators
    """
    
    def __init__(self):
        # Data storage
        self.live_odds: Dict[str, LiveOdds] = {}
        self.line_movements: List[LineMovement] = []
        self.live_games: Dict[str, LiveGame] = {}
        self.betting_opportunities: List[BettingOpportunity] = []
        
        # WebSocket connections for real-time data
        self.websocket_connections: Dict[str, websockets.WebSocketServerProtocol] = {}
        self.data_feeds: Dict[str, bool] = {}
        
        # Line movement tracking
        self.movement_history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=100))
        self.sharp_money_indicators: Dict[str, float] = {}
        
        # Configuration
        self.supported_sportsbooks = [
            'DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'PointsBet',
            'BetRivers', 'WynnBET', 'Unibet', 'FOX Bet', 'TwinSpires',
            'Barstool', 'Betfred', 'William Hill', 'Circa Sports', 'SuperBook'
        ]
        
        self.market_efficiency_threshold = 0.95
        self.minimum_edge_percentage = 2.0
        self.max_opportunity_age_seconds = 300
        self.line_movement_significance = 0.5  # Minimum movement to trigger analysis
        
        # Real-time tracking
        self.is_running = False
        self.last_update = datetime.now()
        
    async def start_engine(self) -> None:
        """Start the live betting engine"""
        self.is_running = True
        logger.info("Starting Live Betting Engine")
        
        # Start background tasks
        tasks = [
            asyncio.create_task(self._odds_monitoring_loop()),
            asyncio.create_task(self._line_movement_analysis_loop()),
            asyncio.create_task(self._opportunity_detection_loop()),
            asyncio.create_task(self._market_efficiency_analysis_loop()),
            asyncio.create_task(self._cleanup_expired_data_loop())
        ]
        
        await asyncio.gather(*tasks)
    
    async def stop_engine(self) -> None:
        """Stop the live betting engine"""
        self.is_running = False
        
        # Close WebSocket connections
        for connection in self.websocket_connections.values():
            if not connection.closed:
                await connection.close()
        
        logger.info("Live Betting Engine stopped")
    
    async def _odds_monitoring_loop(self) -> None:
        """Main loop for monitoring odds across sportsbooks"""
        while self.is_running:
            try:
                # Fetch odds from all sportsbooks
                await self._fetch_all_sportsbook_odds()
                
                # Update line movements
                await self._track_line_movements()
                
                # Sleep for short interval to maintain real-time updates
                await asyncio.sleep(2)  # Update every 2 seconds
                
            except Exception as e:
                logger.error(f"Error in odds monitoring loop: {str(e)}")
                await asyncio.sleep(5)  # Wait longer on error
    
    async def _fetch_all_sportsbook_odds(self) -> None:
        """Fetch odds from all supported sportsbooks"""
        try:
            tasks = []
            for sportsbook in self.supported_sportsbooks:
                task = asyncio.create_task(self._fetch_sportsbook_odds(sportsbook))
                tasks.append(task)
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results
            successful_updates = 0
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    logger.warning(f"Failed to fetch odds from {self.supported_sportsbooks[i]}: {result}")
                else:
                    successful_updates += 1
            
            self.data_feeds = {book: i < len(results) and not isinstance(results[i], Exception) 
                             for i, book in enumerate(self.supported_sportsbooks)}
            
            logger.debug(f"Successfully updated odds from {successful_updates}/{len(self.supported_sportsbooks)} sportsbooks")
            
        except Exception as e:
            logger.error(f"Error fetching sportsbook odds: {str(e)}")
    
    async def _fetch_sportsbook_odds(self, sportsbook: str) -> None:
        """Fetch odds from a specific sportsbook"""
        try:
            # In production, this would connect to real sportsbook APIs
            # For now, simulate with mock data
            await self._generate_mock_odds(sportsbook)
            
        except Exception as e:
            logger.error(f"Error fetching odds from {sportsbook}: {str(e)}")
            raise
    
    async def _generate_mock_odds(self, sportsbook: str) -> None:
        """Generate mock odds data for testing"""
        try:
            current_time = datetime.now()
            
            # Generate mock live games
            mock_games = [
                {
                    'game_id': 'nba_lal_gsw_001',
                    'sport': 'NBA',
                    'home_team': 'Golden State Warriors',
                    'away_team': 'Los Angeles Lakers',
                    'league': 'NBA',
                    'current_period': '2nd Quarter',
                    'time_remaining': '8:42',
                    'home_score': 58,
                    'away_score': 62,
                    'game_state': 'live'
                },
                {
                    'game_id': 'nfl_buf_kc_001',
                    'sport': 'NFL',
                    'home_team': 'Kansas City Chiefs',
                    'away_team': 'Buffalo Bills',
                    'league': 'NFL',
                    'current_period': '3rd Quarter',
                    'time_remaining': '12:15',
                    'home_score': 21,
                    'away_score': 17,
                    'game_state': 'live'
                }
            ]
            
            for game_data in mock_games:
                game_id = game_data['game_id']
                
                # Create/update live game
                if game_id not in self.live_games:
                    self.live_games[game_id] = LiveGame(
                        game_id=game_id,
                        sport=game_data['sport'],
                        home_team=game_data['home_team'],
                        away_team=game_data['away_team'],
                        league=game_data['league'],
                        start_time=current_time - timedelta(hours=1),
                        current_period=game_data['current_period'],
                        time_remaining=game_data['time_remaining'],
                        home_score=game_data['home_score'],
                        away_score=game_data['away_score'],
                        game_state=game_data['game_state'],
                        last_play=f"Field goal attempt by {game_data['home_team']}",
                        total_bet_volume=150000.0
                    )
                
                # Generate mock odds for different markets
                markets = [
                    ('spread', game_data['home_team'], -3.5, -110),
                    ('spread', game_data['away_team'], 3.5, -110),
                    ('moneyline', game_data['home_team'], None, -150),
                    ('moneyline', game_data['away_team'], None, 130),
                    ('total', 'over', 225.5, -110),
                    ('total', 'under', 225.5, -110)
                ]
                
                for market_type, selection, line, base_odds in markets:
                    # Add some variance to odds
                    odds_variance = np.random.randint(-10, 11)
                    odds = base_odds + odds_variance
                    
                    # Add slight line variance
                    if line is not None:
                        line_variance = np.random.uniform(-0.5, 0.5)
                        line = line + line_variance
                    
                    odds_id = f"{sportsbook}_{game_id}_{market_type}_{selection}".replace(' ', '_').lower()
                    
                    new_odds = LiveOdds(
                        odds_id=odds_id,
                        sportsbook=sportsbook,
                        game_id=game_id,
                        sport=game_data['sport'],
                        market_type=BettingMarket(market_type),
                        selection=selection,
                        odds_american=odds,
                        odds_decimal=self._american_to_decimal(odds),
                        line=line,
                        juice=self._calculate_juice(odds),
                        timestamp=current_time,
                        is_available=True,
                        max_bet=10000.0
                    )
                    
                    self.live_odds[odds_id] = new_odds
                    
        except Exception as e:
            logger.error(f"Error generating mock odds: {str(e)}")
    
    def _american_to_decimal(self, american_odds: int) -> float:
        """Convert American odds to decimal format"""
        if american_odds > 0:
            return (american_odds / 100) + 1
        else:
            return (100 / abs(american_odds)) + 1
    
    def _calculate_juice(self, odds: int) -> float:
        """Calculate sportsbook juice/margin"""
        decimal_odds = self._american_to_decimal(odds)
        implied_probability = 1 / decimal_odds
        return max(0, 1 - implied_probability)  # Simplified juice calculation
    
    async def _track_line_movements(self) -> None:
        """Track and analyze line movements"""
        try:
            current_time = datetime.now()
            
            for odds_id, current_odds in self.live_odds.items():
                # Check if we have previous odds for comparison
                history = self.movement_history[odds_id]
                
                if history:
                    previous_odds_data = history[-1]
                    
                    # Check for significant movement
                    odds_change = abs(current_odds.odds_american - previous_odds_data['odds'])
                    line_change = 0
                    if current_odds.line and previous_odds_data.get('line'):
                        line_change = abs(current_odds.line - previous_odds_data['line'])
                    
                    if odds_change >= 5 or line_change >= 0.5:  # Significant movement thresholds
                        # Create line movement record
                        movement = LineMovement(
                            movement_id=f"mov_{odds_id}_{int(current_time.timestamp())}",
                            odds_id=odds_id,
                            previous_odds=previous_odds_data['odds'],
                            new_odds=current_odds.odds_american,
                            previous_line=previous_odds_data.get('line'),
                            new_line=current_odds.line,
                            direction=self._determine_movement_direction(
                                previous_odds_data['odds'], 
                                current_odds.odds_american
                            ),
                            movement_amount=odds_change,
                            timestamp=current_time,
                            volume_indicator=np.random.uniform(0.3, 0.9)  # Mock volume
                        )
                        
                        self.line_movements.append(movement)
                        
                        # Update sharp money indicators
                        self._update_sharp_money_indicators(odds_id, movement)
                
                # Add current odds to history
                history.append({
                    'odds': current_odds.odds_american,
                    'line': current_odds.line,
                    'timestamp': current_time,
                    'juice': current_odds.juice
                })
                
        except Exception as e:
            logger.error(f"Error tracking line movements: {str(e)}")
    
    def _determine_movement_direction(self, old_odds: int, new_odds: int) -> LineMovementDirection:
        """Determine direction of line movement"""
        if new_odds > old_odds:
            return LineMovementDirection.UP
        elif new_odds < old_odds:
            return LineMovementDirection.DOWN
        else:
            return LineMovementDirection.STABLE
    
    def _update_sharp_money_indicators(self, odds_id: str, movement: LineMovement) -> None:
        """Update sharp money indicators based on line movement"""
        try:
            # Sharp money typically moves lines against public betting
            sharp_score = 0.0
            
            # Large movements often indicate sharp action
            if movement.movement_amount >= 10:
                sharp_score += 0.3
            
            # Movements against likely public sentiment
            if movement.volume_indicator > 0.7:  # High volume
                sharp_score += 0.4
            
            # Early movements (closer to game start) often sharper
            sharp_score += 0.3
            
            self.sharp_money_indicators[odds_id] = min(1.0, sharp_score)
            
        except Exception as e:
            logger.error(f"Error updating sharp money indicators: {str(e)}")
    
    async def _opportunity_detection_loop(self) -> None:
        """Main loop for detecting betting opportunities"""
        while self.is_running:
            try:
                await self._detect_live_opportunities()
                await asyncio.sleep(5)  # Check every 5 seconds
                
            except Exception as e:
                logger.error(f"Error in opportunity detection loop: {str(e)}")
                await asyncio.sleep(10)
    
    async def _detect_live_opportunities(self) -> None:
        """Detect live betting opportunities"""
        try:
            current_time = datetime.now()
            
            # Clear old opportunities
            self.betting_opportunities = [
                opp for opp in self.betting_opportunities 
                if (current_time - opp.created_at).total_seconds() < self.max_opportunity_age_seconds
            ]
            
            # Group odds by game and market for comparison
            market_groups = defaultdict(list)
            for odds in self.live_odds.values():
                if odds.is_available:
                    key = f"{odds.game_id}_{odds.market_type.value}_{odds.selection}"
                    market_groups[key].append(odds)
            
            # Analyze each market group for opportunities
            for market_key, odds_list in market_groups.items():
                if len(odds_list) >= 2:  # Need multiple books for comparison
                    await self._analyze_market_for_opportunities(odds_list)
                    
        except Exception as e:
            logger.error(f"Error detecting live opportunities: {str(e)}")
    
    async def _analyze_market_for_opportunities(self, odds_list: List[LiveOdds]) -> None:
        """Analyze a specific market for betting opportunities"""
        try:
            current_time = datetime.now()
            
            # Sort by best odds
            odds_list.sort(key=lambda x: x.odds_american, reverse=True)
            best_odds = odds_list[0]
            
            # Calculate fair value using multiple methods
            fair_value = await self._calculate_fair_value(odds_list)
            
            if fair_value:
                edge = self._calculate_edge_percentage(best_odds.odds_american, fair_value)
                
                if edge >= self.minimum_edge_percentage:
                    # Check for sharp money indicators
                    sharp_indicator = self.sharp_money_indicators.get(best_odds.odds_id, 0.0)
                    
                    # Calculate confidence score
                    confidence = self._calculate_confidence_score(
                        edge, 
                        len(odds_list), 
                        sharp_indicator,
                        best_odds
                    )
                    
                    if confidence >= 0.6:  # Minimum confidence threshold
                        opportunity = BettingOpportunity(
                            opportunity_id=f"opp_{best_odds.odds_id}_{int(current_time.timestamp())}",
                            game_id=best_odds.game_id,
                            market_type=best_odds.market_type,
                            sportsbook=best_odds.sportsbook,
                            selection=best_odds.selection,
                            recommended_odds=best_odds.odds_american,
                            fair_value_odds=fair_value,
                            edge_percentage=edge,
                            confidence_score=confidence,
                            max_stake=min(best_odds.max_bet or 10000, 5000),  # Cap at $5k
                            time_sensitivity=180,  # 3 minutes default
                            reasoning=self._generate_opportunity_reasoning(
                                edge, confidence, sharp_indicator
                            ),
                            created_at=current_time
                        )
                        
                        self.betting_opportunities.append(opportunity)
                        logger.info(f"New betting opportunity detected: {opportunity.opportunity_id}")
                        
        except Exception as e:
            logger.error(f"Error analyzing market for opportunities: {str(e)}")
    
    async def _calculate_fair_value(self, odds_list: List[LiveOdds]) -> Optional[int]:
        """Calculate fair value odds using multiple methods"""
        try:
            if not odds_list:
                return None
            
            # Method 1: Average of all odds
            avg_decimal = np.mean([odds.odds_decimal for odds in odds_list])
            
            # Method 2: Remove outliers and average
            decimal_odds = [odds.odds_decimal for odds in odds_list]
            q25, q75 = np.percentile(decimal_odds, [25, 75])
            iqr = q75 - q25
            lower_bound = q25 - 1.5 * iqr
            upper_bound = q75 + 1.5 * iqr
            
            filtered_odds = [odds for odds in decimal_odds if lower_bound <= odds <= upper_bound]
            
            if filtered_odds:
                filtered_avg = np.mean(filtered_odds)
            else:
                filtered_avg = avg_decimal
            
            # Use the more conservative (lower) estimate
            fair_decimal = min(avg_decimal, filtered_avg)
            
            # Convert back to American odds
            if fair_decimal >= 2.0:
                fair_american = int((fair_decimal - 1) * 100)
            else:
                fair_american = int(-100 / (fair_decimal - 1))
            
            return fair_american
            
        except Exception as e:
            logger.error(f"Error calculating fair value: {str(e)}")
            return None
    
    def _calculate_edge_percentage(self, offered_odds: int, fair_odds: int) -> float:
        """Calculate edge percentage"""
        try:
            offered_decimal = self._american_to_decimal(offered_odds)
            fair_decimal = self._american_to_decimal(fair_odds)
            
            offered_prob = 1 / offered_decimal
            fair_prob = 1 / fair_decimal
            
            edge = (fair_prob - offered_prob) / offered_prob * 100
            return max(0, edge)
            
        except Exception as e:
            logger.error(f"Error calculating edge percentage: {str(e)}")
            return 0.0
    
    def _calculate_confidence_score(self, edge: float, num_books: int, 
                                  sharp_indicator: float, odds: LiveOdds) -> float:
        """Calculate confidence score for opportunity"""
        try:
            confidence = 0.0
            
            # Edge magnitude (higher edge = higher confidence)
            if edge >= 5.0:
                confidence += 0.4
            elif edge >= 3.0:
                confidence += 0.3
            else:
                confidence += 0.2
            
            # Number of sportsbooks (more books = higher confidence)
            if num_books >= 5:
                confidence += 0.3
            elif num_books >= 3:
                confidence += 0.2
            else:
                confidence += 0.1
            
            # Sharp money indicator
            confidence += sharp_indicator * 0.3
            
            return min(1.0, confidence)
            
        except Exception as e:
            logger.error(f"Error calculating confidence score: {str(e)}")
            return 0.0
    
    def _generate_opportunity_reasoning(self, edge: float, confidence: float, 
                                      sharp_indicator: float) -> str:
        """Generate reasoning for betting opportunity"""
        reasons = []
        
        if edge >= 5.0:
            reasons.append(f"Significant edge detected ({edge:.1f}%)")
        elif edge >= 3.0:
            reasons.append(f"Good edge identified ({edge:.1f}%)")
        
        if confidence >= 0.8:
            reasons.append("High confidence based on market analysis")
        elif confidence >= 0.6:
            reasons.append("Moderate confidence from cross-book comparison")
        
        if sharp_indicator >= 0.7:
            reasons.append("Sharp money indicators suggest professional interest")
        
        return ". ".join(reasons) if reasons else "Positive expected value detected"
    
    async def _market_efficiency_analysis_loop(self) -> None:
        """Analyze market efficiency across sportsbooks"""
        while self.is_running:
            try:
                await self._analyze_market_efficiency()
                await asyncio.sleep(30)  # Analyze every 30 seconds
                
            except Exception as e:
                logger.error(f"Error in market efficiency analysis: {str(e)}")
                await asyncio.sleep(60)
    
    async def _analyze_market_efficiency(self) -> None:
        """Analyze market efficiency and arbitrage opportunities"""
        try:
            # Group odds by market for efficiency analysis
            market_groups = defaultdict(list)
            for odds in self.live_odds.values():
                if odds.is_available:
                    key = f"{odds.game_id}_{odds.market_type.value}"
                    market_groups[key].append(odds)
            
            for market_key, odds_list in market_groups.items():
                if len(odds_list) >= 3:  # Need multiple books
                    efficiency = self._calculate_market_efficiency(odds_list)
                    
                    if efficiency < self.market_efficiency_threshold:
                        logger.info(f"Inefficient market detected: {market_key} (efficiency: {efficiency:.3f})")
                        
        except Exception as e:
            logger.error(f"Error analyzing market efficiency: {str(e)}")
    
    def _calculate_market_efficiency(self, odds_list: List[LiveOdds]) -> float:
        """Calculate market efficiency score"""
        try:
            if len(odds_list) < 2:
                return 1.0
            
            # Calculate implied probabilities
            implied_probs = [1 / odds.odds_decimal for odds in odds_list]
            
            # Market efficiency is inverse of probability variance
            prob_variance = np.var(implied_probs)
            efficiency = 1 / (1 + prob_variance * 100)  # Normalize
            
            return min(1.0, efficiency)
            
        except Exception as e:
            logger.error(f"Error calculating market efficiency: {str(e)}")
            return 1.0
    
    async def _cleanup_expired_data_loop(self) -> None:
        """Clean up expired data and opportunities"""
        while self.is_running:
            try:
                current_time = datetime.now()
                
                # Clean up old line movements (keep last 24 hours)
                cutoff_time = current_time - timedelta(hours=24)
                self.line_movements = [
                    movement for movement in self.line_movements 
                    if movement.timestamp > cutoff_time
                ]
                
                # Clean up old opportunities
                self.betting_opportunities = [
                    opp for opp in self.betting_opportunities 
                    if (current_time - opp.created_at).total_seconds() < self.max_opportunity_age_seconds
                ]
                
                # Clean up old odds (keep last 1 hour)
                odds_cutoff = current_time - timedelta(hours=1)
                self.live_odds = {
                    odds_id: odds for odds_id, odds in self.live_odds.items()
                    if odds.timestamp > odds_cutoff
                }
                
                await asyncio.sleep(300)  # Clean up every 5 minutes
                
            except Exception as e:
                logger.error(f"Error in cleanup loop: {str(e)}")
                await asyncio.sleep(600)
    
    # Public API methods
    async def get_live_odds(self, game_id: Optional[str] = None, 
                          sportsbook: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get current live odds"""
        try:
            filtered_odds = []
            
            for odds in self.live_odds.values():
                if game_id and odds.game_id != game_id:
                    continue
                if sportsbook and odds.sportsbook != sportsbook:
                    continue
                
                filtered_odds.append(odds.to_dict())
            
            return filtered_odds
            
        except Exception as e:
            logger.error(f"Error getting live odds: {str(e)}")
            return []
    
    async def get_betting_opportunities(self, sport: Optional[str] = None,
                                     min_edge: float = 0.0) -> List[Dict[str, Any]]:
        """Get current betting opportunities"""
        try:
            opportunities = []
            
            for opp in self.betting_opportunities:
                if sport:
                    game = self.live_games.get(opp.game_id)
                    if not game or game.sport != sport:
                        continue
                
                if opp.edge_percentage >= min_edge:
                    opportunities.append(opp.to_dict())
            
            # Sort by edge percentage descending
            opportunities.sort(key=lambda x: x['edge_percentage'], reverse=True)
            
            return opportunities
            
        except Exception as e:
            logger.error(f"Error getting betting opportunities: {str(e)}")
            return []
    
    async def get_line_movements(self, odds_id: Optional[str] = None,
                               hours_back: int = 24) -> List[Dict[str, Any]]:
        """Get line movement history"""
        try:
            cutoff_time = datetime.now() - timedelta(hours=hours_back)
            
            movements = []
            for movement in self.line_movements:
                if movement.timestamp < cutoff_time:
                    continue
                
                if odds_id and movement.odds_id != odds_id:
                    continue
                
                movements.append(movement.to_dict())
            
            # Sort by timestamp descending
            movements.sort(key=lambda x: x['timestamp'], reverse=True)
            
            return movements
            
        except Exception as e:
            logger.error(f"Error getting line movements: {str(e)}")
            return []
    
    async def get_live_games(self, sport: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get current live games"""
        try:
            games = []
            
            for game in self.live_games.values():
                if sport and game.sport != sport:
                    continue
                
                games.append(game.to_dict())
            
            return games
            
        except Exception as e:
            logger.error(f"Error getting live games: {str(e)}")
            return []
    
    async def get_engine_status(self) -> Dict[str, Any]:
        """Get engine status and statistics"""
        try:
            current_time = datetime.now()
            
            return {
                'is_running': self.is_running,
                'last_update': self.last_update.isoformat(),
                'total_odds_tracked': len(self.live_odds),
                'active_opportunities': len(self.betting_opportunities),
                'line_movements_24h': len([
                    m for m in self.line_movements 
                    if (current_time - m.timestamp).total_seconds() < 86400
                ]),
                'live_games': len(self.live_games),
                'sportsbook_status': self.data_feeds,
                'uptime_seconds': (current_time - self.last_update).total_seconds()
            }
            
        except Exception as e:
            logger.error(f"Error getting engine status: {str(e)}")
            return {}

# Global instance
live_betting_engine = LiveBettingEngine()

async def get_live_betting_engine() -> LiveBettingEngine:
    """Get the global live betting engine instance"""
    return live_betting_engine
