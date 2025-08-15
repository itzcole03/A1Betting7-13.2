"""
Data Streaming Integration for Enhanced WebSocket Service
Connects the room-based WebSocket system with real data sources
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional

from backend.services.enhanced_websocket_service import (
    enhanced_websocket_service,
    SubscriptionType,
    MessageType
)
from backend.utils.enhanced_logging import get_logger

logger = get_logger("websocket_data_streamer")


class WebSocketDataStreamer:
    """Integrates real data sources with WebSocket broadcasting"""
    
    def __init__(self):
        self.is_streaming = False
        self.stream_tasks: List[asyncio.Task] = []
        
    async def start_streaming(self):
        """Start data streaming to WebSocket clients"""
        if self.is_streaming:
            return
            
        self.is_streaming = True
        logger.info("Starting WebSocket data streaming")
        
        # Create streaming tasks
        self.stream_tasks = [
            asyncio.create_task(self._stream_odds_updates()),
            asyncio.create_task(self._stream_predictions()),
            asyncio.create_task(self._stream_analytics()),
            asyncio.create_task(self._stream_arbitrage_opportunities()),
            asyncio.create_task(self._stream_sport_updates()),
        ]
        
        # Wait for all tasks to complete (they run indefinitely)
        try:
            await asyncio.gather(*self.stream_tasks, return_exceptions=True)
        except Exception as e:
            logger.error(f"Error in streaming tasks: {e}")
    
    async def stop_streaming(self):
        """Stop data streaming"""
        self.is_streaming = False
        
        # Cancel all streaming tasks
        for task in self.stream_tasks:
            if not task.done():
                task.cancel()
        
        # Wait for tasks to complete cancellation
        if self.stream_tasks:
            await asyncio.gather(*self.stream_tasks, return_exceptions=True)
        
        self.stream_tasks.clear()
        logger.info("WebSocket data streaming stopped")
    
    async def _stream_odds_updates(self):
        """Stream live odds updates to subscribed clients"""
        while self.is_streaming:
            try:
                # Fetch odds from data source
                odds_data = await self._fetch_live_odds()
                
                if odds_data:
                    await enhanced_websocket_service.broadcast_odds_update(odds_data)
                    logger.debug(f"Broadcasted odds update with {len(odds_data.get('games', []))} games")
                
            except Exception as e:
                logger.error(f"Error streaming odds updates: {e}")
            
            await asyncio.sleep(30)  # Update every 30 seconds
    
    async def _stream_predictions(self):
        """Stream ML predictions to subscribed clients"""
        while self.is_streaming:
            try:
                predictions_data = await self._fetch_live_predictions()
                
                if predictions_data:
                    await enhanced_websocket_service.broadcast_prediction_update(predictions_data)
                    logger.debug(f"Broadcasted prediction update with {len(predictions_data.get('predictions', []))} predictions")
                
            except Exception as e:
                logger.error(f"Error streaming predictions: {e}")
            
            await asyncio.sleep(60)  # Update every minute
    
    async def _stream_analytics(self):
        """Stream analytics and insights"""
        while self.is_streaming:
            try:
                analytics_data = await self._fetch_live_analytics()
                
                if analytics_data:
                    # Broadcast to analytics subscribers
                    await enhanced_websocket_service.connection_manager.broadcast_to_room(
                        SubscriptionType.ANALYTICS,
                        MessageType.ANALYTICS_UPDATE,
                        analytics_data
                    )
                    logger.debug("Broadcasted analytics update")
                
            except Exception as e:
                logger.error(f"Error streaming analytics: {e}")
            
            await asyncio.sleep(120)  # Update every 2 minutes
    
    async def _stream_arbitrage_opportunities(self):
        """Stream arbitrage opportunities"""
        while self.is_streaming:
            try:
                arbitrage_data = await self._detect_arbitrage_opportunities()
                
                if arbitrage_data and arbitrage_data.get('opportunities'):
                    await enhanced_websocket_service.broadcast_arbitrage_alert(arbitrage_data)
                    logger.info(f"Broadcasted arbitrage alert with {len(arbitrage_data['opportunities'])} opportunities")
                
            except Exception as e:
                logger.error(f"Error streaming arbitrage opportunities: {e}")
            
            await asyncio.sleep(15)  # Check every 15 seconds for arbitrage
    
    async def _stream_sport_updates(self):
        """Stream sport-specific updates"""
        sports = ['MLB', 'NBA', 'NFL', 'NHL']
        
        while self.is_streaming:
            try:
                for sport in sports:
                    sport_data = await self._fetch_sport_specific_data(sport)
                    
                    if sport_data:
                        await enhanced_websocket_service.broadcast_sport_update(
                            sport,
                            MessageType.ODDS_UPDATE,  # Could be different based on data type
                            sport_data
                        )
                
                logger.debug("Completed sport-specific updates cycle")
                
            except Exception as e:
                logger.error(f"Error streaming sport updates: {e}")
            
            await asyncio.sleep(45)  # Update every 45 seconds
    
    async def _fetch_live_odds(self) -> Optional[Dict[str, Any]]:
        """Fetch live odds from odds providers"""
        try:
            # Mock odds data - in production, integrate with real odds APIs
            odds_data = {
                "source": "live_odds_api",
                "timestamp": datetime.now().isoformat(),
                "games": [
                    {
                        "game_id": "mlb_001",
                        "sport": "MLB",
                        "home_team": "New York Yankees",
                        "away_team": "Boston Red Sox",
                        "start_time": "2025-08-14T19:00:00Z",
                        "odds": {
                            "moneyline": {"home": -140, "away": 120},
                            "spread": {"home": -1.5, "away": 1.5, "home_odds": -110, "away_odds": -110},
                            "total": {"over": 9.5, "under": 9.5, "over_odds": -105, "under_odds": -115}
                        },
                        "updated_at": datetime.now().isoformat()
                    },
                    {
                        "game_id": "nba_001", 
                        "sport": "NBA",
                        "home_team": "Los Angeles Lakers",
                        "away_team": "Golden State Warriors",
                        "start_time": "2025-08-14T22:00:00Z",
                        "odds": {
                            "moneyline": {"home": -125, "away": 105},
                            "spread": {"home": -2.5, "away": 2.5, "home_odds": -110, "away_odds": -110},
                            "total": {"over": 235.5, "under": 235.5, "over_odds": -110, "under_odds": -110}
                        },
                        "updated_at": datetime.now().isoformat()
                    }
                ]
            }
            
            return odds_data
            
        except Exception as e:
            logger.error(f"Error fetching live odds: {e}")
            return None
    
    async def _fetch_live_predictions(self) -> Optional[Dict[str, Any]]:
        """Fetch live ML predictions"""
        try:
            # Mock prediction data - integrate with ML service
            predictions_data = {
                "source": "ml_prediction_service",
                "timestamp": datetime.now().isoformat(),
                "predictions": [
                    {
                        "game_id": "mlb_001",
                        "sport": "MLB",
                        "prediction_type": "game_winner",
                        "predicted_winner": "New York Yankees",
                        "confidence": 0.72,
                        "probability": 0.58,
                        "model_version": "v2.1.0",
                        "features_used": 47,
                        "updated_at": datetime.now().isoformat()
                    },
                    {
                        "game_id": "nba_001",
                        "sport": "NBA", 
                        "prediction_type": "spread_cover",
                        "predicted_team": "Los Angeles Lakers",
                        "confidence": 0.68,
                        "probability": 0.54,
                        "model_version": "v2.1.0",
                        "features_used": 52,
                        "updated_at": datetime.now().isoformat()
                    }
                ]
            }
            
            return predictions_data
            
        except Exception as e:
            logger.error(f"Error fetching live predictions: {e}")
            return None
    
    async def _fetch_live_analytics(self) -> Optional[Dict[str, Any]]:
        """Fetch live analytics and insights"""
        try:
            analytics_data = {
                "source": "analytics_service",
                "timestamp": datetime.now().isoformat(),
                "market_efficiency": {
                    "overall_score": 0.84,
                    "sharp_money_percentage": 62,
                    "public_money_percentage": 38,
                    "line_movement_frequency": "moderate"
                },
                "prediction_performance": {
                    "daily_accuracy": 0.73,
                    "weekly_accuracy": 0.71,
                    "total_predictions": 1247,
                    "profitable_predictions": 901
                },
                "betting_volume": {
                    "total_handle": 12500000,
                    "average_bet_size": 125,
                    "high_volume_games": ["mlb_001", "nba_001"]
                },
                "updated_at": datetime.now().isoformat()
            }
            
            return analytics_data
            
        except Exception as e:
            logger.error(f"Error fetching live analytics: {e}")
            return None
    
    async def _detect_arbitrage_opportunities(self) -> Optional[Dict[str, Any]]:
        """Detect current arbitrage opportunities"""
        try:
            # Mock arbitrage detection - integrate with real arbitrage detection
            arbitrage_data = {
                "source": "arbitrage_detector",
                "timestamp": datetime.now().isoformat(),
                "opportunities": [
                    {
                        "id": "arb_001",
                        "game_id": "mlb_001",
                        "sport": "MLB",
                        "game": "Yankees vs Red Sox",
                        "type": "two_way_arbitrage",
                        "profit_percentage": 2.3,
                        "stakes": {
                            "book_a": {"name": "DraftKings", "bet": "Yankees ML", "odds": -135, "stake": 574},
                            "book_b": {"name": "FanDuel", "bet": "Red Sox ML", "odds": 125, "stake": 426}
                        },
                        "guaranteed_profit": 23,
                        "total_stake": 1000,
                        "expires_in": "42 minutes",
                        "confidence": "high",
                        "detected_at": datetime.now().isoformat()
                    }
                ]
            }
            
            return arbitrage_data if arbitrage_data["opportunities"] else None
            
        except Exception as e:
            logger.error(f"Error detecting arbitrage opportunities: {e}")
            return None
    
    async def _fetch_sport_specific_data(self, sport: str) -> Optional[Dict[str, Any]]:
        """Fetch sport-specific data"""
        try:
            sport_data = {
                "sport": sport,
                "source": f"{sport.lower()}_data_api",
                "timestamp": datetime.now().isoformat(),
                "live_games": [],
                "upcoming_games": [],
                "recent_results": [],
                "injuries": [],
                "weather": {} if sport in ['MLB', 'NFL'] else None,
                "updated_at": datetime.now().isoformat()
            }
            
            # Add sport-specific mock data
            if sport == "MLB":
                sport_data.update({
                    "live_games": [{"game_id": "mlb_001", "inning": 7, "score": {"home": 4, "away": 2}}],
                    "weather": {"temperature": 72, "wind_speed": 8, "conditions": "clear"}
                })
            elif sport == "NBA":
                sport_data.update({
                    "live_games": [{"game_id": "nba_001", "quarter": 3, "score": {"home": 82, "away": 79}}]
                })
            
            return sport_data
            
        except Exception as e:
            logger.error(f"Error fetching {sport} specific data: {e}")
            return None


# Global data streamer instance
websocket_data_streamer = WebSocketDataStreamer()


async def start_websocket_streaming():
    """Start WebSocket data streaming service"""
    if enhanced_websocket_service.is_initialized:
        await websocket_data_streamer.start_streaming()
    else:
        logger.warning("WebSocket service not initialized, cannot start streaming")


async def stop_websocket_streaming():
    """Stop WebSocket data streaming service"""
    await websocket_data_streamer.stop_streaming()


# Integration with the main app startup
async def initialize_websocket_with_streaming():
    """Initialize WebSocket service and start data streaming"""
    await enhanced_websocket_service.initialize()
    await start_websocket_streaming()
    logger.info("WebSocket service with data streaming initialized")


async def shutdown_websocket_with_streaming():
    """Shutdown WebSocket service and stop data streaming"""
    await stop_websocket_streaming()
    await enhanced_websocket_service.shutdown()
    logger.info("WebSocket service with data streaming shut down")
