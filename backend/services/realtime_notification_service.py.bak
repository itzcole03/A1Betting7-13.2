"""
Real-time WebSocket Notification Service
Comprehensive notification infrastructure for live betting updates
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set, Any, Callable
from enum import Enum
from dataclasses import dataclass, asdict
from fastapi import WebSocket
import redis
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)

class NotificationType(Enum):
    """Types of notifications"""
    ODDS_CHANGE = "odds_change"
    ARBITRAGE_OPPORTUNITY = "arbitrage_opportunity"
    PREDICTION_UPDATE = "prediction_update"
    GAME_STATUS_UPDATE = "game_status_update"
    INJURY_UPDATE = "injury_update"
    LINE_MOVEMENT = "line_movement"
    SYSTEM_ALERT = "system_alert"
    PORTFOLIO_ALERT = "portfolio_alert"
    BANKROLL_ALERT = "bankroll_alert"
    HIGH_VALUE_BET = "high_value_bet"

class NotificationPriority(Enum):
    """Priority levels for notifications"""
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

@dataclass
class NotificationMessage:
    """Structured notification message"""
    id: str
    type: NotificationType
    priority: NotificationPriority
    title: str
    message: str
    data: Dict[str, Any]
    user_id: Optional[str] = None
    timestamp: datetime = None
    expires_at: Optional[datetime] = None
    tags: List[str] = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow()
        if self.tags is None:
            self.tags = []
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        result = asdict(self)
        result['type'] = self.type.value
        result['priority'] = self.priority.value
        result['timestamp'] = self.timestamp.isoformat()
        if self.expires_at:
            result['expires_at'] = self.expires_at.isoformat()
        return result

@dataclass
class SubscriptionFilter:
    """WebSocket subscription filters"""
    notification_types: Set[NotificationType]
    min_priority: NotificationPriority = NotificationPriority.LOW
    tags: Set[str] = None
    sports: Set[str] = None
    players: Set[str] = None
    
    def __post_init__(self):
        if self.tags is None:
            self.tags = set()
        if self.sports is None:
            self.sports = set()
        if self.players is None:
            self.players = set()
    
    def matches(self, notification: NotificationMessage) -> bool:
        """Check if notification matches filter criteria"""
        # Check notification type
        if notification.type not in self.notification_types:
            return False
        
        # Check priority
        if notification.priority.value < self.min_priority.value:
            return False
        
        # Check tags
        if self.tags and not any(tag in notification.tags for tag in self.tags):
            return False
        
        # Check sports
        if self.sports and notification.data.get('sport') not in self.sports:
            return False
        
        # Check players
        if self.players and notification.data.get('player_name') not in self.players:
            return False
        
        return True

class WebSocketConnection:
    """Enhanced WebSocket connection with user context"""
    
    def __init__(self, websocket: WebSocket, user_id: Optional[str] = None):
        self.websocket = websocket
        self.user_id = user_id
        self.connected_at = datetime.utcnow()
        self.last_ping = datetime.utcnow()
        self.subscription_filters: List[SubscriptionFilter] = []
        self.message_count = 0
        self.is_active = True
    
    async def send_message(self, notification: NotificationMessage):
        """Send notification if it matches filters"""
        try:
            # Check if any filter matches
            if not self.subscription_filters or any(
                f.matches(notification) for f in self.subscription_filters
            ):
                await self.websocket.send_text(json.dumps(notification.to_dict()))
                self.message_count += 1
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to send message to {self.user_id}: {e}")
            self.is_active = False
            raise
    
    async def ping(self):
        """Send ping to keep connection alive"""
        try:
            await self.websocket.send_text(json.dumps({
                "type": "ping",
                "timestamp": datetime.utcnow().isoformat()
            }))
            self.last_ping = datetime.utcnow()
        except Exception as e:
            logger.error(f"Failed to ping connection {self.user_id}: {e}")
            self.is_active = False
            raise

class RealtimeNotificationService:
    """Comprehensive real-time notification service"""
    
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.connections: Dict[str, WebSocketConnection] = {}
        self.redis_client = None
        self.notification_queue = asyncio.Queue()
        self.processing_task = None
        self.cleanup_task = None
        self.ping_task = None
        self.redis_url = redis_url
        
        # Statistics
        self.stats = {
            'total_notifications': 0,
            'total_connections': 0,
            'notifications_sent': 0,
            'failed_sends': 0,
            'active_connections': 0
        }
    
    async def initialize(self):
        """Initialize the notification service"""
        try:
            self.redis_client = redis.from_url(self.redis_url, decode_responses=True)
            
            # Start background tasks
            self.processing_task = asyncio.create_task(self._process_notifications())
            self.cleanup_task = asyncio.create_task(self._cleanup_connections())
            self.ping_task = asyncio.create_task(self._ping_connections())
            
            logger.info("RealtimeNotificationService initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize notification service: {e}")
            raise
    
    async def shutdown(self):
        """Shutdown the notification service"""
        # Cancel background tasks
        if self.processing_task:
            self.processing_task.cancel()
        if self.cleanup_task:
            self.cleanup_task.cancel()
        if self.ping_task:
            self.ping_task.cancel()
        
        # Close all connections
        for connection in list(self.connections.values()):
            try:
                await connection.websocket.close()
            except:
                pass
        
        self.connections.clear()
        logger.info("RealtimeNotificationService shutdown complete")
    
    async def add_connection(
        self, 
        websocket: WebSocket, 
        user_id: Optional[str] = None,
        filters: Optional[List[SubscriptionFilter]] = None
    ) -> str:
        """Add new WebSocket connection"""
        connection_id = f"{user_id or 'anonymous'}_{datetime.utcnow().timestamp()}"
        
        connection = WebSocketConnection(websocket, user_id)
        if filters:
            connection.subscription_filters = filters
        
        self.connections[connection_id] = connection
        self.stats['total_connections'] += 1
        self.stats['active_connections'] = len(self.connections)
        
        logger.info(f"Added WebSocket connection: {connection_id}")
        
        # Send welcome message
        welcome_notification = NotificationMessage(
            id=f"welcome_{connection_id}",
            type=NotificationType.SYSTEM_ALERT,
            priority=NotificationPriority.LOW,
            title="Connected",
            message="Successfully connected to real-time notifications",
            data={"connection_id": connection_id}
        )
        
        try:
            await connection.send_message(welcome_notification)
        except:
            pass
        
        return connection_id
    
    async def remove_connection(self, connection_id: str):
        """Remove WebSocket connection"""
        if connection_id in self.connections:
            connection = self.connections[connection_id]
            try:
                await connection.websocket.close()
            except:
                pass
            
            del self.connections[connection_id]
            self.stats['active_connections'] = len(self.connections)
            logger.info(f"Removed WebSocket connection: {connection_id}")
    
    async def send_notification(self, notification: NotificationMessage):
        """Queue notification for processing"""
        await self.notification_queue.put(notification)
        self.stats['total_notifications'] += 1
    
    async def send_targeted_notification(
        self, 
        notification: NotificationMessage, 
        user_ids: List[str]
    ):
        """Send notification to specific users"""
        for connection_id, connection in self.connections.items():
            if connection.user_id in user_ids:
                try:
                    sent = await connection.send_message(notification)
                    if sent:
                        self.stats['notifications_sent'] += 1
                except Exception as e:
                    self.stats['failed_sends'] += 1
                    logger.error(f"Failed to send targeted notification: {e}")
    
    async def broadcast_system_alert(self, title: str, message: str, priority: NotificationPriority = NotificationPriority.MEDIUM):
        """Broadcast system-wide alert"""
        notification = NotificationMessage(
            id=f"system_alert_{datetime.utcnow().timestamp()}",
            type=NotificationType.SYSTEM_ALERT,
            priority=priority,
            title=title,
            message=message,
            data={"system": True},
            tags=["system", "broadcast"]
        )
        
        await self.send_notification(notification)
    
    async def _process_notifications(self):
        """Background task to process notification queue"""
        while True:
            try:
                notification = await self.notification_queue.get()
                
                # Send to all matching connections
                for connection_id, connection in list(self.connections.items()):
                    if not connection.is_active:
                        continue
                    
                    try:
                        sent = await connection.send_message(notification)
                        if sent:
                            self.stats['notifications_sent'] += 1
                    except Exception as e:
                        self.stats['failed_sends'] += 1
                        logger.error(f"Failed to send notification to {connection_id}: {e}")
                        # Mark connection as inactive
                        connection.is_active = False
                
                # Store in Redis for persistence (optional)
                if self.redis_client:
                    try:
                        await self._store_notification_redis(notification)
                    except Exception as e:
                        logger.error(f"Failed to store notification in Redis: {e}")
                
            except Exception as e:
                logger.error(f"Error processing notifications: {e}")
                await asyncio.sleep(1)
    
    async def _cleanup_connections(self):
        """Background task to cleanup inactive connections"""
        while True:
            try:
                await asyncio.sleep(30)  # Check every 30 seconds
                
                now = datetime.utcnow()
                inactive_connections = []
                
                for connection_id, connection in self.connections.items():
                    # Remove connections inactive for more than 5 minutes
                    if (
                        not connection.is_active or 
                        now - connection.last_ping > timedelta(minutes=5)
                    ):
                        inactive_connections.append(connection_id)
                
                for connection_id in inactive_connections:
                    await self.remove_connection(connection_id)
                
                if inactive_connections:
                    logger.info(f"Cleaned up {len(inactive_connections)} inactive connections")
                
            except Exception as e:
                logger.error(f"Error in cleanup task: {e}")
    
    async def _ping_connections(self):
        """Background task to ping connections"""
        while True:
            try:
                await asyncio.sleep(60)  # Ping every minute
                
                for connection in list(self.connections.values()):
                    if connection.is_active:
                        try:
                            await connection.ping()
                        except:
                            connection.is_active = False
                
            except Exception as e:
                logger.error(f"Error in ping task: {e}")
    
    async def _store_notification_redis(self, notification: NotificationMessage):
        """Store notification in Redis for persistence"""
        try:
            key = f"notification:{notification.id}"
            data = notification.to_dict()
            
            # Store with TTL of 24 hours
            self.redis_client.setex(key, 86400, json.dumps(data))
            
            # Add to user-specific notifications if user_id exists
            if notification.user_id:
                user_key = f"user_notifications:{notification.user_id}"
                self.redis_client.lpush(user_key, notification.id)
                self.redis_client.ltrim(user_key, 0, 99)  # Keep last 100 notifications
                self.redis_client.expire(user_key, 86400)  # 24 hour TTL
            
        except Exception as e:
            logger.error(f"Failed to store notification in Redis: {e}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get service statistics"""
        return {
            **self.stats,
            'queue_size': self.notification_queue.qsize(),
            'connection_details': {
                conn_id: {
                    'user_id': conn.user_id,
                    'connected_at': conn.connected_at.isoformat(),
                    'message_count': conn.message_count,
                    'is_active': conn.is_active
                }
                for conn_id, conn in self.connections.items()
            }
        }

# Global service instance
notification_service = RealtimeNotificationService()

# Context manager for service lifecycle
@asynccontextmanager
async def notification_service_lifespan():
    """Context manager for notification service lifecycle"""
    await notification_service.initialize()
    try:
        yield notification_service
    finally:
        await notification_service.shutdown()

# Utility functions for easy notification creation
async def send_odds_change_notification(
    sport: str,
    event: str,
    old_odds: float,
    new_odds: float,
    sportsbook: str,
    player_name: Optional[str] = None
):
    """Send odds change notification"""
    notification = NotificationMessage(
        id=f"odds_change_{datetime.utcnow().timestamp()}",
        type=NotificationType.ODDS_CHANGE,
        priority=NotificationPriority.MEDIUM,
        title=f"Odds Changed: {player_name or event}",
        message=f"{sportsbook}: {old_odds} → {new_odds}",
        data={
            "sport": sport,
            "event": event,
            "old_odds": old_odds,
            "new_odds": new_odds,
            "sportsbook": sportsbook,
            "player_name": player_name,
            "change_percent": ((new_odds - old_odds) / old_odds) * 100 if old_odds else 0
        },
        tags=["odds", sport, sportsbook]
    )
    
    await notification_service.send_notification(notification)

async def send_arbitrage_notification(
    sport: str,
    event: str,
    profit_margin: float,
    sportsbooks: List[str],
    player_name: Optional[str] = None
):
    """Send arbitrage opportunity notification"""
    notification = NotificationMessage(
        id=f"arbitrage_{datetime.utcnow().timestamp()}",
        type=NotificationType.ARBITRAGE_OPPORTUNITY,
        priority=NotificationPriority.HIGH,
        title=f"Arbitrage Opportunity: {player_name or event}",
        message=f"Profit margin: {profit_margin:.2f}% across {', '.join(sportsbooks)}",
        data={
            "sport": sport,
            "event": event,
            "profit_margin": profit_margin,
            "sportsbooks": sportsbooks,
            "player_name": player_name
        },
        tags=["arbitrage", "profit", sport] + sportsbooks,
        expires_at=datetime.utcnow() + timedelta(minutes=10)  # Arbitrage expires quickly
    )
    
    await notification_service.send_notification(notification)

async def send_high_value_bet_notification(
    sport: str,
    event: str,
    expected_value: float,
    confidence: float,
    recommended_stake: float,
    player_name: Optional[str] = None
):
    """Send high value bet notification"""
    priority = NotificationPriority.HIGH if expected_value > 10 else NotificationPriority.MEDIUM
    
    notification = NotificationMessage(
        id=f"high_value_bet_{datetime.utcnow().timestamp()}",
        type=NotificationType.HIGH_VALUE_BET,
        priority=priority,
        title=f"High Value Bet: {player_name or event}",
        message=f"EV: {expected_value:.2f}% | Confidence: {confidence:.1f}% | Stake: ${recommended_stake:.2f}",
        data={
            "sport": sport,
            "event": event,
            "expected_value": expected_value,
            "confidence": confidence,
            "recommended_stake": recommended_stake,
            "player_name": player_name
        },
        tags=["high_value", "ev_positive", sport]
    )
    
    await notification_service.send_notification(notification)
