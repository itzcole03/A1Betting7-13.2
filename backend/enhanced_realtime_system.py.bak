"""Enhanced Real-Time System - Phase 8C Implementation
Advanced stream processing, data validation, and high-frequency optimization
Built for production-grade sports betting analysis
"""

import asyncio
import logging
import json
import time
from typing import Dict, List, Any, Optional, Callable, Set
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from enum import Enum
import numpy as np
from collections import deque, defaultdict
import aioredis
import websockets
from prometheus_client import Counter, Histogram, Gauge

logger = logging.getLogger(__name__)

# Prometheus metrics for monitoring
stream_events_counter = Counter(
    "realtime_stream_events_total", "Total stream events processed", ["source", "event_type"]
)
stream_latency_histogram = Histogram(
    "realtime_stream_latency_seconds", "Stream processing latency", ["source"]
)
data_quality_gauge = Gauge(
    "realtime_data_quality_score", "Real-time data quality score", ["source"]
)
arbitrage_opportunities_counter = Counter(
    "arbitrage_opportunities_total", "Total arbitrage opportunities detected", ["market_pair"]
)

class StreamEventType(str, Enum):
    """Types of real-time stream events"""
    ODDS_UPDATE = "odds_update"
    GAME_STATUS = "game_status"
    PLAYER_INJURY = "player_injury"
    WEATHER_UPDATE = "weather_update"
    LINE_MOVEMENT = "line_movement"
    VOLUME_SURGE = "volume_surge"
    ARBITRAGE_OPPORTUNITY = "arbitrage_opportunity"
    MODEL_PREDICTION = "model_prediction"

class DataSource(str, Enum):
    """Real-time data sources"""
    SPORTSBOOK_API = "sportsbook_api"
    WEBSOCKET_FEED = "websocket_feed"
    SOCIAL_MEDIA = "social_media"
    NEWS_FEED = "news_feed"
    WEATHER_API = "weather_api"
    INJURY_REPORTS = "injury_reports"
    INTERNAL_MODELS = "internal_models"

@dataclass
class StreamEvent:
    """Real-time stream event"""
    event_id: str
    event_type: StreamEventType
    source: DataSource
    timestamp: datetime
    data: Dict[str, Any]
    confidence: float = 1.0
    processed: bool = False
    validation_score: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class DataQualityMetrics:
    """Data quality assessment metrics"""
    completeness: float  # 0-1 score for data completeness
    accuracy: float      # 0-1 score for data accuracy
    timeliness: float    # 0-1 score for data timeliness
    consistency: float   # 0-1 score for data consistency
    validity: float      # 0-1 score for data validity
    overall_score: float = 0.0
    
    def __post_init__(self):
        self.overall_score = np.mean([
            self.completeness, self.accuracy, self.timeliness, 
            self.consistency, self.validity
        ])

class RealTimeDataValidator:
    """Advanced data validation for real-time streams"""
    
    def __init__(self):
        self.validation_rules = {}
        self.historical_patterns = defaultdict(deque)
        self.anomaly_thresholds = {}
        
    async def validate_event(self, event: StreamEvent) -> DataQualityMetrics:
        """Validate incoming stream event"""
        try:
            # Basic validation
            completeness = await self._check_completeness(event)
            accuracy = await self._check_accuracy(event)
            timeliness = await self._check_timeliness(event)
            consistency = await self._check_consistency(event)
            validity = await self._check_validity(event)
            
            metrics = DataQualityMetrics(
                completeness=completeness,
                accuracy=accuracy,
                timeliness=timeliness,
                consistency=consistency,
                validity=validity
            )
            
            # Update quality gauge
            data_quality_gauge.labels(source=event.source.value).set(metrics.overall_score)
            
            return metrics
            
        except Exception as e:
            logger.error(f"Data validation failed for event {event.event_id}: {e}")
            return DataQualityMetrics(0.0, 0.0, 0.0, 0.0, 0.0)
    
    async def _check_completeness(self, event: StreamEvent) -> float:
        """Check data completeness"""
        required_fields = self._get_required_fields(event.event_type)
        
        if not required_fields:
            return 1.0
        
        present_fields = set(event.data.keys())
        missing_fields = required_fields - present_fields
        
        completeness = (len(required_fields) - len(missing_fields)) / len(required_fields)
        return max(0.0, completeness)
    
    async def _check_accuracy(self, event: StreamEvent) -> float:
        """Check data accuracy using historical patterns"""
        try:
            source_history = self.historical_patterns[event.source]
            
            if len(source_history) < 10:
                return 0.8  # Default score for new sources
            
            # Compare with recent historical data
            recent_events = list(source_history)[-10:]
            accuracy_score = self._calculate_pattern_similarity(event, recent_events)
            
            return accuracy_score
            
        except Exception:
            return 0.5
    
    async def _check_timeliness(self, event: StreamEvent) -> float:
        """Check data timeliness"""
        now = datetime.now(timezone.utc)
        age_seconds = (now - event.timestamp).total_seconds()
        
        # Timeliness decreases exponentially with age
        if age_seconds <= 1.0:
            return 1.0
        elif age_seconds <= 10.0:
            return 0.9
        elif age_seconds <= 60.0:
            return 0.7
        elif age_seconds <= 300.0:  # 5 minutes
            return 0.5
        else:
            return 0.1
    
    async def _check_consistency(self, event: StreamEvent) -> float:
        """Check data consistency across sources"""
        # Look for similar events from other sources
        similar_events = await self._find_similar_events(event)
        
        if not similar_events:
            return 0.8  # Default when no comparison available
        
        # Calculate consistency score
        consistency_scores = []
        for similar_event in similar_events:
            score = self._calculate_data_similarity(event.data, similar_event.data)
            consistency_scores.append(score)
        
        return np.mean(consistency_scores) if consistency_scores else 0.8
    
    async def _check_validity(self, event: StreamEvent) -> float:
        """Check data validity using business rules"""
        validity_score = 1.0
        
        # Check for obvious invalid values
        for key, value in event.data.items():
            if key == 'odds' and isinstance(value, (int, float)):
                if value <= 0 or value > 100:  # Invalid odds range
                    validity_score *= 0.5
            elif key == 'probability' and isinstance(value, (int, float)):
                if value < 0 or value > 1:  # Invalid probability
                    validity_score *= 0.3
            elif key == 'score' and isinstance(value, (int, float)):
                if value < 0:  # Negative scores are invalid
                    validity_score *= 0.7
        
        return max(0.0, validity_score)
    
    def _get_required_fields(self, event_type: StreamEventType) -> Set[str]:
        """Get required fields for event type"""
        field_requirements = {
            StreamEventType.ODDS_UPDATE: {'game_id', 'market', 'odds'},
            StreamEventType.GAME_STATUS: {'game_id', 'status', 'score'},
            StreamEventType.PLAYER_INJURY: {'player_id', 'injury_type', 'severity'},
            StreamEventType.LINE_MOVEMENT: {'game_id', 'market', 'old_line', 'new_line'},
        }
        
        return field_requirements.get(event_type, set())
    
    def _calculate_pattern_similarity(
        self, event: StreamEvent, historical_events: List[StreamEvent]
    ) -> float:
        """Calculate similarity with historical patterns"""
        similarities = []
        
        for hist_event in historical_events:
            if hist_event.event_type == event.event_type:
                similarity = self._calculate_data_similarity(event.data, hist_event.data)
                similarities.append(similarity)
        
        return np.mean(similarities) if similarities else 0.5
    
    def _calculate_data_similarity(self, data1: Dict[str, Any], data2: Dict[str, Any]) -> float:
        """Calculate similarity between two data dictionaries"""
        common_keys = set(data1.keys()) & set(data2.keys())
        
        if not common_keys:
            return 0.0
        
        similarities = []
        for key in common_keys:
            val1, val2 = data1[key], data2[key]
            
            if isinstance(val1, (int, float)) and isinstance(val2, (int, float)):
                # Numerical similarity
                if val2 != 0:
                    similarity = 1.0 - abs(val1 - val2) / abs(val2)
                else:
                    similarity = 1.0 if val1 == 0 else 0.0
            elif val1 == val2:
                similarity = 1.0
            else:
                similarity = 0.0
            
            similarities.append(max(0.0, similarity))
        
        return np.mean(similarities)
    
    async def _find_similar_events(self, event: StreamEvent) -> List[StreamEvent]:
        """Find similar events from other sources"""
        # This would query recent events from database/cache
        # Simplified implementation
        return []

class HighFrequencyArbitrageScanner:
    """High-frequency arbitrage opportunity scanner"""
    
    def __init__(self):
        self.odds_cache = {}
        self.opportunity_history = deque(maxlen=1000)
        self.market_latencies = defaultdict(deque)
        self.profit_thresholds = {
            'low_risk': 0.01,    # 1% minimum profit
            'medium_risk': 0.02, # 2% minimum profit
            'high_risk': 0.05    # 5% minimum profit
        }
        
    async def scan_for_opportunities(
        self, odds_update: StreamEvent
    ) -> List[Dict[str, Any]]:
        """Scan for arbitrage opportunities from odds update"""
        opportunities = []
        
        try:
            # Update odds cache
            await self._update_odds_cache(odds_update)
            
            # Extract game information
            game_id = odds_update.data.get('game_id')
            if not game_id:
                return opportunities
            
            # Get all odds for this game
            game_odds = self._get_game_odds(game_id)
            
            if len(game_odds) < 2:  # Need at least 2 markets for arbitrage
                return opportunities
            
            # Scan different bet types
            for bet_type in ['moneyline', 'spread', 'total']:
                arb_opportunities = await self._scan_bet_type_arbitrage(
                    game_id, bet_type, game_odds
                )
                opportunities.extend(arb_opportunities)
            
            # Filter by profit thresholds and risk levels
            filtered_opportunities = self._filter_opportunities(opportunities)
            
            # Update metrics
            for opp in filtered_opportunities:
                market_pair = f"{opp['market1']}_{opp['market2']}"
                arbitrage_opportunities_counter.labels(market_pair=market_pair).inc()
            
            return filtered_opportunities
            
        except Exception as e:
            logger.error(f"Arbitrage scanning failed: {e}")
            return []
    
    async def _update_odds_cache(self, odds_update: StreamEvent):
        """Update internal odds cache"""
        game_id = odds_update.data.get('game_id')
        market = odds_update.data.get('market')
        odds = odds_update.data.get('odds')
        
        if game_id and market and odds:
            if game_id not in self.odds_cache:
                self.odds_cache[game_id] = {}
            
            self.odds_cache[game_id][market] = {
                'odds': odds,
                'timestamp': odds_update.timestamp,
                'source': odds_update.source.value
            }
            
            # Track market latency
            latency = (datetime.now(timezone.utc) - odds_update.timestamp).total_seconds()
            self.market_latencies[market].append(latency)
            if len(self.market_latencies[market]) > 100:
                self.market_latencies[market].popleft()
    
    def _get_game_odds(self, game_id: str) -> Dict[str, Any]:
        """Get all odds for a specific game"""
        return self.odds_cache.get(game_id, {})
    
    async def _scan_bet_type_arbitrage(
        self, game_id: str, bet_type: str, game_odds: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Scan for arbitrage in specific bet type"""
        opportunities = []
        
        # Extract odds for this bet type from all markets
        market_odds = {}
        for market, odds_data in game_odds.items():
            odds = odds_data['odds']
            if bet_type in odds:
                market_odds[market] = {
                    'odds': odds[bet_type],
                    'timestamp': odds_data['timestamp'],
                    'source': odds_data['source']
                }
        
        if len(market_odds) < 2:
            return opportunities
        
        # Find arbitrage opportunities between market pairs
        markets = list(market_odds.keys())
        for i, market1 in enumerate(markets):
            for market2 in markets[i+1:]:
                arb_opp = await self._calculate_arbitrage_opportunity(
                    game_id, bet_type, market1, market2, market_odds
                )
                if arb_opp:
                    opportunities.append(arb_opp)
        
        return opportunities
    
    async def _calculate_arbitrage_opportunity(
        self,
        game_id: str,
        bet_type: str,
        market1: str,
        market2: str,
        market_odds: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Calculate arbitrage opportunity between two markets"""
        try:
            odds1 = market_odds[market1]['odds']
            odds2 = market_odds[market2]['odds']
            
            # For moneyline bets
            if bet_type == 'moneyline' and len(odds1) == 2 and len(odds2) == 2:
                teams = list(odds1.keys())
                
                # Find best odds for each team
                best_odds = {}
                best_markets = {}
                
                for team in teams:
                    if team in odds1 and team in odds2:
                        if odds1[team] > odds2[team]:
                            best_odds[team] = odds1[team]
                            best_markets[team] = market1
                        else:
                            best_odds[team] = odds2[team]
                            best_markets[team] = market2
                
                if len(best_odds) == 2:
                    # Calculate arbitrage
                    implied_probs = [1.0 / odd for odd in best_odds.values()]
                    total_implied_prob = sum(implied_probs)
                    
                    if total_implied_prob < 1.0:  # Arbitrage exists
                        profit_margin = (1.0 - total_implied_prob) / total_implied_prob
                        
                        # Calculate optimal bet allocation
                        bet_allocation = {}
                        for team, odd in best_odds.items():
                            bet_allocation[team] = (1.0 / odd) / total_implied_prob
                        
                        # Calculate market latency impact
                        avg_latency = self._calculate_average_latency([market1, market2])
                        
                        return {
                            'game_id': game_id,
                            'bet_type': bet_type,
                            'market1': market1,
                            'market2': market2,
                            'profit_margin': profit_margin,
                            'bet_allocation': bet_allocation,
                            'best_odds': best_odds,
                            'best_markets': best_markets,
                            'total_implied_probability': total_implied_prob,
                            'average_latency': avg_latency,
                            'risk_level': self._assess_risk_level(profit_margin, avg_latency),
                            'timestamp': datetime.now(timezone.utc)
                        }
            
            return None
            
        except Exception as e:
            logger.warning(f"Arbitrage calculation failed: {e}")
            return None
    
    def _calculate_average_latency(self, markets: List[str]) -> float:
        """Calculate average latency for markets"""
        latencies = []
        for market in markets:
            market_latencies = list(self.market_latencies.get(market, []))
            if market_latencies:
                latencies.extend(market_latencies[-5:])  # Last 5 updates
        
        return np.mean(latencies) if latencies else 0.5
    
    def _assess_risk_level(self, profit_margin: float, avg_latency: float) -> str:
        """Assess risk level of arbitrage opportunity"""
        # Higher latency increases risk
        latency_penalty = min(avg_latency * 0.1, 0.02)  # Max 2% penalty
        adjusted_profit = profit_margin - latency_penalty
        
        if adjusted_profit >= self.profit_thresholds['high_risk']:
            return 'low_risk'
        elif adjusted_profit >= self.profit_thresholds['medium_risk']:
            return 'medium_risk'
        elif adjusted_profit >= self.profit_thresholds['low_risk']:
            return 'high_risk'
        else:
            return 'very_high_risk'
    
    def _filter_opportunities(self, opportunities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Filter opportunities by risk and profit criteria"""
        filtered = []
        
        for opp in opportunities:
            risk_level = opp.get('risk_level', 'very_high_risk')
            profit_margin = opp.get('profit_margin', 0.0)
            
            # Only include opportunities that meet minimum thresholds
            if risk_level in ['low_risk', 'medium_risk', 'high_risk']:
                if profit_margin >= self.profit_thresholds['low_risk']:
                    filtered.append(opp)
        
        # Sort by profit margin (descending)
        filtered.sort(key=lambda x: x.get('profit_margin', 0.0), reverse=True)
        
        return filtered

class EnhancedRealTimeEngine:
    """Enhanced real-time processing engine"""
    
    def __init__(self):
        self.event_processors = {}
        self.data_validator = RealTimeDataValidator()
        self.arbitrage_scanner = HighFrequencyArbitrageScanner()
        self.event_queue = asyncio.Queue(maxsize=10000)
        self.processing_stats = defaultdict(int)
        self.redis_client = None
        self.websocket_connections = set()
        
    async def initialize(self):
        """Initialize the real-time engine"""
        try:
            # Initialize Redis connection
            self.redis_client = await aioredis.from_url("redis://localhost:6379")
            
            # Register event processors
            await self._register_event_processors()
            
            # Start background tasks
            asyncio.create_task(self._event_processing_loop())
            asyncio.create_task(self._stats_monitoring_loop())
            
            logger.info("Enhanced real-time engine initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize real-time engine: {e}")
            raise
    
    async def _register_event_processors(self):
        """Register event processors for different event types"""
        self.event_processors = {
            StreamEventType.ODDS_UPDATE: self._process_odds_update,
            StreamEventType.GAME_STATUS: self._process_game_status,
            StreamEventType.PLAYER_INJURY: self._process_player_injury,
            StreamEventType.LINE_MOVEMENT: self._process_line_movement,
        }
    
    async def process_stream_event(self, event: StreamEvent) -> Dict[str, Any]:
        """Process incoming stream event"""
        start_time = time.time()
        
        try:
            # Validate event data
            quality_metrics = await self.data_validator.validate_event(event)
            event.validation_score = quality_metrics.overall_score
            
            # Skip low-quality events
            if quality_metrics.overall_score < 0.5:
                logger.warning(f"Skipping low-quality event {event.event_id}")
                return {'status': 'skipped', 'reason': 'low_quality'}
            
            # Add to processing queue
            await self.event_queue.put(event)
            
            # Update metrics
            stream_events_counter.labels(
                source=event.source.value, 
                event_type=event.event_type.value
            ).inc()
            
            processing_time = time.time() - start_time
            stream_latency_histogram.labels(source=event.source.value).observe(processing_time)
            
            return {
                'status': 'queued',
                'event_id': event.event_id,
                'quality_score': quality_metrics.overall_score,
                'processing_time': processing_time
            }
            
        except Exception as e:
            logger.error(f"Failed to process stream event {event.event_id}: {e}")
            return {'status': 'error', 'error': str(e)}
    
    async def _event_processing_loop(self):
        """Main event processing loop"""
        while True:
            try:
                # Get event from queue
                event = await self.event_queue.get()
                
                # Process event
                await self._process_single_event(event)
                
                # Mark task as done
                self.event_queue.task_done()
                
            except Exception as e:
                logger.error(f"Error in event processing loop: {e}")
                await asyncio.sleep(0.1)
    
    async def _process_single_event(self, event: StreamEvent):
        """Process a single event"""
        try:
            # Get appropriate processor
            processor = self.event_processors.get(event.event_type)
            
            if processor:
                result = await processor(event)
                event.processed = True
                
                # Broadcast to websocket clients if needed
                if result.get('broadcast', False):
                    await self._broadcast_to_websockets(event, result)
                
                # Store in Redis for caching
                await self._cache_event_result(event, result)
                
            else:
                logger.warning(f"No processor found for event type {event.event_type}")
            
            # Update processing stats
            self.processing_stats[event.event_type.value] += 1
            
        except Exception as e:
            logger.error(f"Failed to process event {event.event_id}: {e}")
    
    async def _process_odds_update(self, event: StreamEvent) -> Dict[str, Any]:
        """Process odds update event"""
        # Scan for arbitrage opportunities
        arbitrage_opportunities = await self.arbitrage_scanner.scan_for_opportunities(event)
        
        result = {
            'event_type': 'odds_processed',
            'game_id': event.data.get('game_id'),
            'arbitrage_opportunities': len(arbitrage_opportunities),
            'broadcast': len(arbitrage_opportunities) > 0
        }
        
        # If arbitrage opportunities found, create alerts
        if arbitrage_opportunities:
            result['opportunities'] = arbitrage_opportunities
            await self._create_arbitrage_alerts(arbitrage_opportunities)
        
        return result
    
    async def _process_game_status(self, event: StreamEvent) -> Dict[str, Any]:
        """Process game status update"""
        return {
            'event_type': 'game_status_processed',
            'game_id': event.data.get('game_id'),
            'status': event.data.get('status'),
            'broadcast': True
        }
    
    async def _process_player_injury(self, event: StreamEvent) -> Dict[str, Any]:
        """Process player injury report"""
        return {
            'event_type': 'injury_processed',
            'player_id': event.data.get('player_id'),
            'severity': event.data.get('severity'),
            'broadcast': True
        }
    
    async def _process_line_movement(self, event: StreamEvent) -> Dict[str, Any]:
        """Process line movement event"""
        return {
            'event_type': 'line_movement_processed',
            'game_id': event.data.get('game_id'),
            'movement_size': abs(
                event.data.get('new_line', 0) - event.data.get('old_line', 0)
            ),
            'broadcast': True
        }
    
    async def _create_arbitrage_alerts(self, opportunities: List[Dict[str, Any]]):
        """Create alerts for arbitrage opportunities"""
        for opp in opportunities:
            alert_data = {
                'type': 'arbitrage_alert',
                'game_id': opp['game_id'],
                'profit_margin': opp['profit_margin'],
                'risk_level': opp['risk_level'],
                'markets': [opp['market1'], opp['market2']],
                'timestamp': opp['timestamp'].isoformat()
            }
            
            # Publish to Redis for real-time alerts
            if self.redis_client:
                await self.redis_client.publish('arbitrage_alerts', json.dumps(alert_data))
    
    async def _broadcast_to_websockets(self, event: StreamEvent, result: Dict[str, Any]):
        """Broadcast event to websocket clients"""
        if not self.websocket_connections:
            return
        
        broadcast_data = {
            'event_id': event.event_id,
            'event_type': event.event_type.value,
            'source': event.source.value,
            'timestamp': event.timestamp.isoformat(),
            'result': result
        }
        
        message = json.dumps(broadcast_data)
        
        # Broadcast to all connected clients
        disconnected = set()
        for websocket in self.websocket_connections:
            try:
                await websocket.send(message)
            except websockets.exceptions.ConnectionClosed:
                disconnected.add(websocket)
        
        # Remove disconnected clients
        self.websocket_connections -= disconnected
    
    async def _cache_event_result(self, event: StreamEvent, result: Dict[str, Any]):
        """Cache event result in Redis"""
        if not self.redis_client:
            return
        
        cache_key = f"event_result:{event.event_id}"
        cache_data = {
            'event': {
                'event_id': event.event_id,
                'event_type': event.event_type.value,
                'source': event.source.value,
                'timestamp': event.timestamp.isoformat(),
                'validation_score': event.validation_score
            },
            'result': result
        }
        
        # Cache for 1 hour
        await self.redis_client.setex(cache_key, 3600, json.dumps(cache_data))
    
    async def _stats_monitoring_loop(self):
        """Monitor processing statistics"""
        while True:
            try:
                await asyncio.sleep(60)  # Every minute
                
                # Log processing stats
                total_processed = sum(self.processing_stats.values())
                logger.info(f"Processed {total_processed} events in last period")
                
                # Reset stats
                self.processing_stats.clear()
                
            except Exception as e:
                logger.error(f"Error in stats monitoring: {e}")
    
    async def add_websocket_client(self, websocket):
        """Add websocket client for real-time updates"""
        self.websocket_connections.add(websocket)
        logger.info(f"Added websocket client. Total: {len(self.websocket_connections)}")
    
    async def remove_websocket_client(self, websocket):
        """Remove websocket client"""
        self.websocket_connections.discard(websocket)
        logger.info(f"Removed websocket client. Total: {len(self.websocket_connections)}")
    
    async def get_system_health(self) -> Dict[str, Any]:
        """Get real-time system health metrics"""
        return {
            'queue_size': self.event_queue.qsize(),
            'connected_clients': len(self.websocket_connections),
            'total_events_processed': sum(self.processing_stats.values()),
            'redis_connected': self.redis_client is not None,
            'average_processing_latency': 0.05,  # Placeholder
            'data_quality_average': 0.85,  # Placeholder
            'arbitrage_opportunities_found': self.arbitrage_scanner.opportunity_history.__len__()
        }

# Factory function
async def create_enhanced_realtime_engine() -> EnhancedRealTimeEngine:
    """Create and initialize enhanced real-time engine"""
    engine = EnhancedRealTimeEngine()
    await engine.initialize()
    return engine 