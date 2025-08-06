"""
Real-Time WebSocket Service for Live Data Streaming
Implements WebSocket connections for real-time odds, predictions, and analytics updates.
"""

import asyncio
import json
import logging
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Set

import redis.asyncio as redis
from fastapi import WebSocket, WebSocketDisconnect

from backend.services.enhanced_ml_service import enhanced_ml_service
from backend.services.real_data_integration import real_data_service
from backend.utils.enhanced_logging import get_logger

logger = get_logger("realtime_websocket")


class ConnectionManager:
    """Manages WebSocket connections and broadcasting"""

    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.connection_metadata: Dict[str, Dict[str, Any]] = {}
        self.redis_client: Optional[redis.Redis] = None

    async def initialize(self):
        """Initialize connection manager"""
        try:
            self.redis_client = redis.from_url("redis://localhost:6379/0")
            await self.redis_client.ping()
            logger.info("Connection manager initialized with Redis")
        except Exception as e:
            logger.error(f"Failed to initialize Redis for connection manager: {e}")

    async def connect(self, websocket: WebSocket, client_id: str = None) -> str:
        """Connect a new WebSocket client"""
        await websocket.accept()
        self.active_connections.append(websocket)

        if not client_id:
            client_id = str(uuid.uuid4())

        self.connection_metadata[client_id] = {
            "websocket": websocket,
            "connected_at": datetime.now().isoformat(),
            "subscriptions": [],
            "last_ping": datetime.now().isoformat(),
        }

        logger.info(f"New WebSocket connection: {client_id}")
        return client_id

    async def disconnect(self, websocket: WebSocket, client_id: str = None):
        """Disconnect a WebSocket client"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

        if client_id and client_id in self.connection_metadata:
            del self.connection_metadata[client_id]

        logger.info(f"WebSocket disconnected: {client_id}")

    async def send_personal_message(self, message: Dict[str, Any], client_id: str):
        """Send message to specific client"""
        try:
            client_data = self.connection_metadata.get(client_id)
            if client_data:
                websocket = client_data["websocket"]
                await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"Failed to send personal message to {client_id}: {e}")

    async def broadcast(self, message: Dict[str, Any], subscription_filter: str = None):
        """Broadcast message to all or filtered connections"""
        if not self.active_connections:
            return

        message_json = json.dumps(message)
        disconnected_clients = []

        for client_id, client_data in self.connection_metadata.items():
            try:
                # Check subscription filter
                if subscription_filter:
                    subscriptions = client_data.get("subscriptions", [])
                    if subscription_filter not in subscriptions:
                        continue

                websocket = client_data["websocket"]
                await websocket.send_text(message_json)

            except WebSocketDisconnect:
                disconnected_clients.append(client_id)
            except Exception as e:
                logger.error(f"Error broadcasting to {client_id}: {e}")
                disconnected_clients.append(client_id)

        # Clean up disconnected clients
        for client_id in disconnected_clients:
            if client_id in self.connection_metadata:
                websocket = self.connection_metadata[client_id]["websocket"]
                await self.disconnect(websocket, client_id)

    async def add_subscription(self, client_id: str, subscription: str):
        """Add subscription for a client"""
        if client_id in self.connection_metadata:
            subs = self.connection_metadata[client_id].get("subscriptions", [])
            if subscription not in subs:
                subs.append(subscription)
                self.connection_metadata[client_id]["subscriptions"] = subs
                logger.info(
                    f"Added subscription '{subscription}' for client {client_id}"
                )

    async def remove_subscription(self, client_id: str, subscription: str):
        """Remove subscription for a client"""
        if client_id in self.connection_metadata:
            subs = self.connection_metadata[client_id].get("subscriptions", [])
            if subscription in subs:
                subs.remove(subscription)
                self.connection_metadata[client_id]["subscriptions"] = subs
                logger.info(
                    f"Removed subscription '{subscription}' for client {client_id}"
                )


class RealTimeDataStreamer:
    """Streams real-time sports data and predictions"""

    def __init__(self, connection_manager: ConnectionManager):
        self.connection_manager = connection_manager
        self.is_streaming = False
        self.stream_interval = 30  # seconds
        self.redis_client: Optional[redis.Redis] = None

    async def initialize(self):
        """Initialize the data streamer"""
        try:
            self.redis_client = redis.from_url("redis://localhost:6379/0")
            await self.redis_client.ping()
            logger.info("Real-time data streamer initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Redis for data streamer: {e}")

    async def start_streaming(self):
        """Start real-time data streaming"""
        if self.is_streaming:
            logger.warning("Data streaming already active")
            return

        self.is_streaming = True
        logger.info("Starting real-time data streaming")

        # Start streaming tasks
        asyncio.create_task(self._stream_odds_updates())
        asyncio.create_task(self._stream_predictions())
        asyncio.create_task(self._stream_analytics())
        asyncio.create_task(self._stream_arbitrage_opportunities())

    async def stop_streaming(self):
        """Stop real-time data streaming"""
        self.is_streaming = False
        logger.info("Stopped real-time data streaming")

    async def _stream_odds_updates(self):
        """Stream live odds updates"""
        while self.is_streaming:
            try:
                # Get latest odds from real data service
                odds_data = await self._fetch_latest_odds()

                if odds_data:
                    message = {
                        "type": "odds_update",
                        "data": odds_data,
                        "timestamp": datetime.now().isoformat(),
                    }

                    await self.connection_manager.broadcast(
                        message, subscription_filter="odds_updates"
                    )

                    # Cache in Redis
                    if self.redis_client:
                        await self.redis_client.setex(
                            "realtime:latest_odds",
                            300,  # 5 minutes
                            json.dumps(odds_data),
                        )

            except Exception as e:
                logger.error(f"Error streaming odds updates: {e}")

            await asyncio.sleep(self.stream_interval)

    async def _stream_predictions(self):
        """Stream live prediction updates"""
        while self.is_streaming:
            try:
                # Get latest predictions from enhanced ML service
                predictions = await self._fetch_latest_predictions()

                if predictions:
                    message = {
                        "type": "prediction_update",
                        "data": predictions,
                        "timestamp": datetime.now().isoformat(),
                    }

                    await self.connection_manager.broadcast(
                        message, subscription_filter="predictions"
                    )

            except Exception as e:
                logger.error(f"Error streaming predictions: {e}")

            await asyncio.sleep(self.stream_interval * 2)  # Less frequent updates

    async def _stream_analytics(self):
        """Stream real-time analytics and insights"""
        while self.is_streaming:
            try:
                analytics = await self._fetch_latest_analytics()

                if analytics:
                    message = {
                        "type": "analytics_update",
                        "data": analytics,
                        "timestamp": datetime.now().isoformat(),
                    }

                    await self.connection_manager.broadcast(
                        message, subscription_filter="analytics"
                    )

            except Exception as e:
                logger.error(f"Error streaming analytics: {e}")

            await asyncio.sleep(self.stream_interval * 3)  # Even less frequent

    async def _stream_arbitrage_opportunities(self):
        """Stream arbitrage and value betting opportunities"""
        while self.is_streaming:
            try:
                opportunities = await self._detect_arbitrage_opportunities()

                if opportunities:
                    message = {
                        "type": "arbitrage_alert",
                        "data": opportunities,
                        "timestamp": datetime.now().isoformat(),
                        "priority": "high",
                    }

                    await self.connection_manager.broadcast(
                        message, subscription_filter="arbitrage"
                    )

            except Exception as e:
                logger.error(f"Error streaming arbitrage opportunities: {e}")

            await asyncio.sleep(self.stream_interval // 2)  # More frequent checks

    async def _fetch_latest_odds(self) -> Optional[Dict[str, Any]]:
        """Fetch latest odds from multiple sources"""
        try:
            # This would integrate with real odds APIs
            odds_data = {
                "NFL": await self._get_nfl_odds(),
                "NBA": await self._get_nba_odds(),
                "MLB": await self._get_mlb_odds(),
                "updated_at": datetime.now().isoformat(),
            }

            return odds_data

        except Exception as e:
            logger.error(f"Error fetching latest odds: {e}")
            return None

    async def _get_nfl_odds(self) -> List[Dict[str, Any]]:
        """Get current NFL odds"""
        # Mock data for now - would integrate with real APIs
        return [
            {
                "game_id": "nfl_001",
                "home_team": "Kansas City Chiefs",
                "away_team": "Buffalo Bills",
                "spread": {"home": -3.5, "away": 3.5},
                "moneyline": {"home": -165, "away": 145},
                "total": {"over": 52.5, "under": 52.5},
                "updated_at": datetime.now().isoformat(),
            }
        ]

    async def _get_nba_odds(self) -> List[Dict[str, Any]]:
        """Get current NBA odds"""
        return [
            {
                "game_id": "nba_001",
                "home_team": "Los Angeles Lakers",
                "away_team": "Golden State Warriors",
                "spread": {"home": -2.5, "away": 2.5},
                "moneyline": {"home": -125, "away": 105},
                "total": {"over": 235.5, "under": 235.5},
                "updated_at": datetime.now().isoformat(),
            }
        ]

    async def _get_mlb_odds(self) -> List[Dict[str, Any]]:
        """Get current MLB odds"""
        return [
            {
                "game_id": "mlb_001",
                "home_team": "New York Yankees",
                "away_team": "Boston Red Sox",
                "moneyline": {"home": -140, "away": 120},
                "run_line": {"home": -1.5, "away": 1.5},
                "total": {"over": 9.5, "under": 9.5},
                "updated_at": datetime.now().isoformat(),
            }
        ]

    async def _fetch_latest_predictions(self) -> Optional[Dict[str, Any]]:
        """Fetch latest ML predictions"""
        try:
            # Get predictions from enhanced ML service
            if not enhanced_ml_service.is_initialized:
                return None

            predictions = {
                "NFL": await self._get_sport_predictions("NFL"),
                "NBA": await self._get_sport_predictions("NBA"),
                "MLB": await self._get_sport_predictions("MLB"),
                "updated_at": datetime.now().isoformat(),
            }

            return predictions

        except Exception as e:
            logger.error(f"Error fetching predictions: {e}")
            return None

    async def _get_sport_predictions(self, sport: str) -> List[Dict[str, Any]]:
        """Get predictions for a specific sport"""
        try:
            # Sample features for prediction
            sample_features = {
                "home_team_rating": 1600,
                "away_team_rating": 1550,
                "home_advantage": 0.1,
            }

            prediction = await enhanced_ml_service.predict_enhanced(
                sport, sample_features
            )

            return [
                {
                    "sport": sport,
                    "prediction": prediction.get("prediction", 0.5),
                    "confidence": prediction.get("confidence", 0.7),
                    "models_used": prediction.get("ensemble_size", 0),
                    "timestamp": prediction.get("prediction_timestamp"),
                }
            ]

        except Exception as e:
            logger.error(f"Error getting {sport} predictions: {e}")
            return []

    async def _fetch_latest_analytics(self) -> Optional[Dict[str, Any]]:
        """Fetch latest analytics and insights"""
        try:
            analytics = {
                "market_efficiency": await self._calculate_market_efficiency(),
                "betting_volume": await self._get_betting_volume_analysis(),
                "prediction_accuracy": await self._get_prediction_accuracy(),
                "updated_at": datetime.now().isoformat(),
            }

            return analytics

        except Exception as e:
            logger.error(f"Error fetching analytics: {e}")
            return None

    async def _calculate_market_efficiency(self) -> Dict[str, Any]:
        """Calculate market efficiency metrics"""
        return {
            "efficiency_score": 0.85,
            "arbitrage_opportunities": 3,
            "value_bets_found": 12,
            "market_bias": "slight_underdog_bias",
        }

    async def _get_betting_volume_analysis(self) -> Dict[str, Any]:
        """Get betting volume analysis"""
        return {
            "total_volume": 2500000,
            "sharp_money_percentage": 65,
            "public_money_percentage": 35,
            "line_movement_direction": "home_team_favored",
        }

    async def _get_prediction_accuracy(self) -> Dict[str, Any]:
        """Get current prediction accuracy metrics"""
        if enhanced_ml_service.is_initialized:
            performance = await enhanced_ml_service.get_model_performance_summary()
            return {
                "overall_accuracy": performance.get("overall_performance", {}).get(
                    "mean_accuracy", 0.75
                ),
                "models_active": performance.get("total_models", 0),
                "last_updated": performance.get("last_updated"),
            }
        else:
            return {
                "overall_accuracy": 0.7,
                "models_active": 0,
                "status": "initializing",
            }

    async def _detect_arbitrage_opportunities(self) -> Optional[List[Dict[str, Any]]]:
        """Detect arbitrage opportunities across sportsbooks"""
        try:
            # This would analyze odds from multiple books
            opportunities = [
                {
                    "game": "NFL - Chiefs vs Bills",
                    "opportunity_type": "arbitrage",
                    "profit_percentage": 2.5,
                    "book_a": {
                        "name": "DraftKings",
                        "bet": "Chiefs -3.5",
                        "odds": -110,
                    },
                    "book_b": {"name": "FanDuel", "bet": "Bills +3.5", "odds": 105},
                    "stake_a": 550,
                    "stake_b": 450,
                    "guaranteed_profit": 25,
                    "expires_in": "45 minutes",
                }
            ]

            return opportunities if opportunities else None

        except Exception as e:
            logger.error(f"Error detecting arbitrage opportunities: {e}")
            return None


class RealTimeWebSocketService:
    """Main WebSocket service for real-time features"""

    def __init__(self):
        self.connection_manager = ConnectionManager()
        self.data_streamer = RealTimeDataStreamer(self.connection_manager)
        self.is_initialized = False

    async def initialize(self):
        """Initialize the WebSocket service"""
        try:
            await self.connection_manager.initialize()
            await self.data_streamer.initialize()
            await self.data_streamer.start_streaming()

            self.is_initialized = True
            logger.info("Real-time WebSocket service initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize WebSocket service: {e}")

    async def handle_websocket_connection(
        self, websocket: WebSocket, client_id: str = None
    ):
        """Handle new WebSocket connection"""
        try:
            client_id = await self.connection_manager.connect(websocket, client_id)

            # Send welcome message
            welcome_message = {
                "type": "connection_established",
                "client_id": client_id,
                "available_subscriptions": [
                    "odds_updates",
                    "predictions",
                    "analytics",
                    "arbitrage",
                ],
                "timestamp": datetime.now().isoformat(),
            }
            await self.connection_manager.send_personal_message(
                welcome_message, client_id
            )

            # Handle incoming messages
            while True:
                try:
                    data = await websocket.receive_text()
                    message = json.loads(data)
                    await self._handle_client_message(client_id, message)

                except WebSocketDisconnect:
                    break
                except Exception as e:
                    logger.error(f"Error handling message from {client_id}: {e}")

        except Exception as e:
            logger.error(f"Error in WebSocket connection handling: {e}")
        finally:
            await self.connection_manager.disconnect(websocket, client_id)

    async def _handle_client_message(self, client_id: str, message: Dict[str, Any]):
        """Handle incoming client message"""
        message_type = message.get("type")

        if message_type == "subscribe":
            subscription = message.get("subscription")
            if subscription:
                await self.connection_manager.add_subscription(client_id, subscription)
                response = {
                    "type": "subscription_confirmed",
                    "subscription": subscription,
                    "timestamp": datetime.now().isoformat(),
                }
                await self.connection_manager.send_personal_message(response, client_id)

        elif message_type == "unsubscribe":
            subscription = message.get("subscription")
            if subscription:
                await self.connection_manager.remove_subscription(
                    client_id, subscription
                )
                response = {
                    "type": "unsubscription_confirmed",
                    "subscription": subscription,
                    "timestamp": datetime.now().isoformat(),
                }
                await self.connection_manager.send_personal_message(response, client_id)

        elif message_type == "ping":
            # Update last ping time
            if client_id in self.connection_manager.connection_metadata:
                self.connection_manager.connection_metadata[client_id][
                    "last_ping"
                ] = datetime.now().isoformat()

            response = {"type": "pong", "timestamp": datetime.now().isoformat()}
            await self.connection_manager.send_personal_message(response, client_id)

        elif message_type == "get_status":
            status = await self._get_service_status()
            await self.connection_manager.send_personal_message(status, client_id)

    async def _get_service_status(self) -> Dict[str, Any]:
        """Get current service status"""
        return {
            "type": "service_status",
            "data": {
                "active_connections": len(self.connection_manager.active_connections),
                "streaming_active": self.data_streamer.is_streaming,
                "ml_service_status": (
                    "initialized"
                    if enhanced_ml_service.is_initialized
                    else "initializing"
                ),
                "last_odds_update": datetime.now().isoformat(),
                "system_health": "healthy",
            },
            "timestamp": datetime.now().isoformat(),
        }


# Global WebSocket service instance
realtime_websocket_service = RealTimeWebSocketService()
