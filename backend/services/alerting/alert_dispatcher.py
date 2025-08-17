"""
Alert Dispatcher Service

Handles the dispatching and delivery of alerts to users through various channels.
Manages alert queuing, delivery preferences, and delivery status tracking.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set, Any
from dataclasses import dataclass, field
from enum import Enum

from backend.services.unified_config import unified_config
from backend.models.risk_personalization import DeliveryChannel, AlertStatus
from backend.services.alerting.rule_evaluator import AlertEvent, AlertEventType


logger = logging.getLogger(__name__)


class DeliveryStatus(Enum):
    """Alert delivery status"""
    PENDING = "PENDING"
    SENT = "SENT"
    FAILED = "FAILED"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    DISMISSED = "DISMISSED"


@dataclass
class DeliveryAttempt:
    """Represents an alert delivery attempt"""
    alert_event_id: str
    channel: DeliveryChannel
    attempt_number: int
    attempted_at: datetime
    status: DeliveryStatus
    error_message: Optional[str] = None
    delivered_at: Optional[datetime] = None


@dataclass
class UserDeliveryPreferences:
    """User preferences for alert delivery"""
    user_id: int
    enabled_channels: Set[DeliveryChannel]
    quiet_hours_start: Optional[int] = None  # Hour of day (0-23)
    quiet_hours_end: Optional[int] = None
    severity_thresholds: Dict[DeliveryChannel, str] = field(default_factory=dict)  # Min severity per channel
    rate_limit_per_hour: int = 10  # Max alerts per hour
    

class AlertDispatcher:
    """
    Alert Dispatcher Service
    
    Manages the delivery of alerts to users through various channels
    including in-app notifications, email, and webhooks.
    """
    
    _instance = None
    
    def __init__(self):
        """Initialize alert dispatcher"""
        if AlertDispatcher._instance is not None:
            raise Exception("AlertDispatcher is a singleton")
            
        self.config = unified_config.get_config_value("risk_management")
        self.dispatch_active = False
        
        # Delivery queues per channel
        self.delivery_queues: Dict[DeliveryChannel, asyncio.Queue] = {
            DeliveryChannel.IN_APP: asyncio.Queue(),
            DeliveryChannel.EMAIL: asyncio.Queue(),
            DeliveryChannel.WEBHOOK: asyncio.Queue(),
        }
        
        # Track delivery attempts and failures
        self.delivery_attempts: List[DeliveryAttempt] = []
        self.failed_deliveries: List[DeliveryAttempt] = []
        
        # Rate limiting tracking
        self.user_delivery_counts: Dict[int, List[datetime]] = {}
        
        # User preferences cache
        self.user_preferences_cache: Dict[int, UserDeliveryPreferences] = {}
        
        logger.info("AlertDispatcher initialized")
        
    @classmethod
    def get_instance(cls):
        """Get singleton instance"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    async def start_dispatch_workers(self):
        """Start delivery worker tasks for each channel"""
        if self.dispatch_active:
            logger.warning("Dispatch workers already active")
            return
            
        self.dispatch_active = True
        logger.info("Starting alert dispatch workers")
        
        # Start worker for each delivery channel
        tasks = []
        for channel in DeliveryChannel:
            task = asyncio.create_task(self._delivery_worker(channel))
            tasks.append(task)
            
        # Start cleanup worker for failed deliveries
        tasks.append(asyncio.create_task(self._cleanup_worker()))
        
        try:
            await asyncio.gather(*tasks)
        except Exception as e:
            logger.error(f"Error in dispatch workers: {e}")
        finally:
            self.dispatch_active = False
            
    async def stop_dispatch_workers(self):
        """Stop all dispatch workers"""
        self.dispatch_active = False
        logger.info("Stopped alert dispatch workers")
    
    async def dispatch_alert(self, alert_event: AlertEvent) -> bool:
        """
        Dispatch an alert to the appropriate channels based on user preferences
        
        Args:
            alert_event: The alert event to dispatch
            
        Returns:
            bool: True if queued for delivery, False if blocked by rate limiting
        """
        try:
            # Get user delivery preferences
            preferences = await self._get_user_delivery_preferences(alert_event.user_id)
            
            # Check rate limiting
            if not self._check_rate_limit(alert_event.user_id, preferences.rate_limit_per_hour):
                logger.warning(f"Rate limit exceeded for user {alert_event.user_id}")
                return False
            
            # Check quiet hours
            if self._is_quiet_hours(preferences):
                logger.debug(f"Quiet hours active for user {alert_event.user_id}, delaying alert")
                # Queue for later delivery
                await self._queue_for_quiet_hours(alert_event)
                return True
            
            # Queue for delivery through appropriate channels
            delivery_count = 0
            for channel in preferences.enabled_channels:
                # Check severity threshold for this channel
                if self._meets_severity_threshold(alert_event.severity, preferences.severity_thresholds.get(channel, 'low')):
                    await self.delivery_queues[channel].put(alert_event)
                    delivery_count += 1
                    logger.debug(f"Queued alert {alert_event.alert_rule_id} for {channel.value} delivery")
            
            if delivery_count > 0:
                # Track delivery count for rate limiting
                self._track_delivery_count(alert_event.user_id)
                logger.info(f"Dispatched alert {alert_event.alert_rule_id} to {delivery_count} channels")
                return True
            else:
                logger.debug(f"No channels met severity threshold for alert {alert_event.alert_rule_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error dispatching alert: {e}")
            return False
    
    async def _delivery_worker(self, channel: DeliveryChannel):
        """Worker task for delivering alerts through a specific channel"""
        logger.info(f"Starting delivery worker for {channel.value}")
        
        while self.dispatch_active:
            try:
                # Wait for alert in queue (with timeout to allow checking dispatch_active)
                try:
                    alert_event = await asyncio.wait_for(
                        self.delivery_queues[channel].get(), 
                        timeout=5.0
                    )
                except asyncio.TimeoutError:
                    continue
                
                # Attempt delivery
                success = await self._deliver_alert(alert_event, channel)
                
                # Record delivery attempt
                attempt = DeliveryAttempt(
                    alert_event_id=f"{alert_event.alert_rule_id}_{alert_event.triggered_at.isoformat()}",
                    channel=channel,
                    attempt_number=self._get_attempt_number(alert_event, channel),
                    attempted_at=datetime.utcnow(),
                    status=DeliveryStatus.SENT if success else DeliveryStatus.FAILED,
                    delivered_at=datetime.utcnow() if success else None
                )
                
                self.delivery_attempts.append(attempt)
                
                if not success:
                    self.failed_deliveries.append(attempt)
                    logger.warning(f"Failed to deliver alert via {channel.value}")
                else:
                    logger.debug(f"Successfully delivered alert via {channel.value}")
                    
            except Exception as e:
                logger.error(f"Error in {channel.value} delivery worker: {e}")
                await asyncio.sleep(1)
                
        logger.info(f"Stopped delivery worker for {channel.value}")
    
    async def _deliver_alert(self, alert_event: AlertEvent, channel: DeliveryChannel) -> bool:
        """
        Deliver an alert through a specific channel
        
        Args:
            alert_event: The alert to deliver
            channel: The delivery channel to use
            
        Returns:
            bool: True if delivery was successful
        """
        try:
            if channel == DeliveryChannel.IN_APP:
                return await self._deliver_in_app(alert_event)
            elif channel == DeliveryChannel.EMAIL:
                return await self._deliver_email(alert_event)
            elif channel == DeliveryChannel.WEBHOOK:
                return await self._deliver_webhook(alert_event)
            else:
                logger.error(f"Unknown delivery channel: {channel}")
                return False
                
        except Exception as e:
            logger.error(f"Error delivering alert via {channel.value}: {e}")
            return False
    
    async def _deliver_in_app(self, alert_event: AlertEvent) -> bool:
        """Deliver alert as in-app notification"""
        try:
            # Mock implementation - in production this would:
            # 1. Store notification in database
            # 2. Send via WebSocket to active user sessions
            # 3. Update notification count
            
            logger.info(f"IN-APP ALERT for user {alert_event.user_id}: {alert_event.title}")
            logger.info(f"Message: {alert_event.message}")
            logger.info(f"Severity: {alert_event.severity}")
            
            # Simulate storing in database
            await self._store_alert_delivery(alert_event, DeliveryChannel.IN_APP)
            
            # Simulate WebSocket delivery
            await self._send_websocket_notification(alert_event)
            
            return True
            
        except Exception as e:
            logger.error(f"Error delivering in-app alert: {e}")
            return False
    
    async def _deliver_email(self, alert_event: AlertEvent) -> bool:
        """Deliver alert via email"""
        try:
            # Mock implementation - in production this would:
            # 1. Format email template
            # 2. Send via SMTP or email service
            # 3. Handle bounces and failures
            
            logger.info(f"EMAIL ALERT for user {alert_event.user_id}: {alert_event.title}")
            logger.info(f"Message: {alert_event.message}")
            
            # Simulate email formatting and sending
            email_content = self._format_email_content(alert_event)
            success = await self._send_email(alert_event.user_id, email_content)
            
            return success
            
        except Exception as e:
            logger.error(f"Error delivering email alert: {e}")
            return False
    
    async def _deliver_webhook(self, alert_event: AlertEvent) -> bool:
        """Deliver alert via webhook"""
        try:
            # Mock implementation - in production this would:
            # 1. Get user's webhook URL
            # 2. Format webhook payload
            # 3. Send HTTP POST with retries
            
            logger.info(f"WEBHOOK ALERT for user {alert_event.user_id}: {alert_event.title}")
            
            webhook_url = await self._get_user_webhook_url(alert_event.user_id)
            if not webhook_url:
                logger.debug(f"No webhook URL configured for user {alert_event.user_id}")
                return False
            
            payload = self._format_webhook_payload(alert_event)
            success = await self._send_webhook(webhook_url, payload)
            
            return success
            
        except Exception as e:
            logger.error(f"Error delivering webhook alert: {e}")
            return False
    
    async def _cleanup_worker(self):
        """Worker to clean up old delivery attempts and retry failed deliveries"""
        logger.info("Starting cleanup worker")
        
        while self.dispatch_active:
            try:
                await self._cleanup_old_attempts()
                await self._retry_failed_deliveries()
                await asyncio.sleep(300)  # Run every 5 minutes
                
            except Exception as e:
                logger.error(f"Error in cleanup worker: {e}")
                await asyncio.sleep(60)
                
        logger.info("Stopped cleanup worker")
    
    async def _cleanup_old_attempts(self):
        """Clean up old delivery attempts"""
        cutoff_time = datetime.utcnow() - timedelta(days=7)
        
        before_count = len(self.delivery_attempts)
        self.delivery_attempts = [
            attempt for attempt in self.delivery_attempts 
            if attempt.attempted_at > cutoff_time
        ]
        after_count = len(self.delivery_attempts)
        
        if before_count > after_count:
            logger.debug(f"Cleaned up {before_count - after_count} old delivery attempts")
    
    async def _retry_failed_deliveries(self):
        """Retry failed deliveries that are eligible for retry"""
        max_retries = 3
        retry_delay_minutes = 15
        
        retry_cutoff = datetime.utcnow() - timedelta(minutes=retry_delay_minutes)
        
        for attempt in self.failed_deliveries[:]:  # Copy list to allow modification
            if (attempt.status == DeliveryStatus.FAILED and 
                attempt.attempt_number < max_retries and
                attempt.attempted_at < retry_cutoff):
                
                # Create retry attempt (this is simplified - would need original alert_event)
                logger.info(f"Retrying failed delivery: {attempt.alert_event_id} via {attempt.channel.value}")
                
                # Remove from failed list (in practice, would re-queue the original alert)
                self.failed_deliveries.remove(attempt)
    
    def _check_rate_limit(self, user_id: int, limit_per_hour: int) -> bool:
        """Check if user is within rate limit"""
        now = datetime.utcnow()
        hour_ago = now - timedelta(hours=1)
        
        # Get recent delivery times for user
        if user_id not in self.user_delivery_counts:
            self.user_delivery_counts[user_id] = []
        
        # Clean up old entries
        self.user_delivery_counts[user_id] = [
            delivery_time for delivery_time in self.user_delivery_counts[user_id]
            if delivery_time > hour_ago
        ]
        
        # Check if under limit
        return len(self.user_delivery_counts[user_id]) < limit_per_hour
    
    def _track_delivery_count(self, user_id: int):
        """Track a delivery for rate limiting"""
        if user_id not in self.user_delivery_counts:
            self.user_delivery_counts[user_id] = []
        
        self.user_delivery_counts[user_id].append(datetime.utcnow())
    
    def _is_quiet_hours(self, preferences: UserDeliveryPreferences) -> bool:
        """Check if current time is within user's quiet hours"""
        if not preferences.quiet_hours_start or not preferences.quiet_hours_end:
            return False
        
        current_hour = datetime.utcnow().hour
        start = preferences.quiet_hours_start
        end = preferences.quiet_hours_end
        
        if start < end:
            return start <= current_hour < end
        else:  # Quiet hours span midnight
            return current_hour >= start or current_hour < end
    
    def _meets_severity_threshold(self, alert_severity: str, channel_threshold: str) -> bool:
        """Check if alert severity meets channel threshold"""
        severity_order = {'low': 0, 'medium': 1, 'high': 2, 'critical': 3}
        
        alert_level = severity_order.get(alert_severity.lower(), 0)
        threshold_level = severity_order.get(channel_threshold.lower(), 0)
        
        return alert_level >= threshold_level
    
    def _get_attempt_number(self, alert_event: AlertEvent, channel: DeliveryChannel) -> int:
        """Get the attempt number for this alert/channel combination"""
        alert_id = f"{alert_event.alert_rule_id}_{alert_event.triggered_at.isoformat()}"
        
        existing_attempts = [
            attempt for attempt in self.delivery_attempts
            if attempt.alert_event_id == alert_id and attempt.channel == channel
        ]
        
        return len(existing_attempts) + 1
    
    # Mock implementation methods
    
    async def _get_user_delivery_preferences(self, user_id: int) -> UserDeliveryPreferences:
        """Get user delivery preferences"""
        # Check cache first
        if user_id in self.user_preferences_cache:
            return self.user_preferences_cache[user_id]
        
        # Mock preferences - in production would query database
        preferences = UserDeliveryPreferences(
            user_id=user_id,
            enabled_channels={DeliveryChannel.IN_APP, DeliveryChannel.EMAIL},
            quiet_hours_start=23,  # 11 PM
            quiet_hours_end=7,     # 7 AM
            severity_thresholds={
                DeliveryChannel.IN_APP: 'low',
                DeliveryChannel.EMAIL: 'medium',
                DeliveryChannel.WEBHOOK: 'high'
            },
            rate_limit_per_hour=10
        )
        
        # Cache preferences
        self.user_preferences_cache[user_id] = preferences
        return preferences
    
    async def _queue_for_quiet_hours(self, alert_event: AlertEvent):
        """Queue alert for delivery after quiet hours end"""
        # Mock implementation - in production would store in database
        # with scheduled delivery time
        logger.debug(f"Queued alert {alert_event.alert_rule_id} for post-quiet-hours delivery")
    
    async def _store_alert_delivery(self, alert_event: AlertEvent, channel: DeliveryChannel):
        """Store alert delivery in database"""
        # Mock implementation - in production would insert into AlertDelivered table
        logger.debug(f"Stored alert delivery record for {alert_event.alert_rule_id}")
    
    async def _send_websocket_notification(self, alert_event: AlertEvent):
        """Send real-time notification via WebSocket"""
        # Mock implementation - in production would send to WebSocket connections
        logger.debug(f"Sent WebSocket notification for alert {alert_event.alert_rule_id}")
    
    def _format_email_content(self, alert_event: AlertEvent) -> Dict[str, str]:
        """Format email content"""
        return {
            'subject': f"A1Betting Alert: {alert_event.title}",
            'body': f"{alert_event.message}\n\nAlert details: {alert_event.data}",
            'html_body': f"<h3>{alert_event.title}</h3><p>{alert_event.message}</p>"
        }
    
    async def _send_email(self, user_id: int, content: Dict[str, str]) -> bool:
        """Send email to user"""
        # Mock implementation
        logger.debug(f"Sent email to user {user_id}: {content['subject']}")
        return True  # Assume success
    
    async def _get_user_webhook_url(self, user_id: int) -> Optional[str]:
        """Get user's webhook URL"""
        # Mock implementation
        return f"https://api.user-app.com/webhooks/user_{user_id}"
    
    def _format_webhook_payload(self, alert_event: AlertEvent) -> Dict[str, Any]:
        """Format webhook payload"""
        return {
            'alert_id': alert_event.alert_rule_id,
            'user_id': alert_event.user_id,
            'event_type': alert_event.event_type.value,
            'severity': alert_event.severity,
            'title': alert_event.title,
            'message': alert_event.message,
            'data': alert_event.data,
            'triggered_at': alert_event.triggered_at.isoformat(),
            'expires_at': alert_event.expires_at.isoformat() if alert_event.expires_at else None
        }
    
    async def _send_webhook(self, url: str, payload: Dict[str, Any]) -> bool:
        """Send webhook POST request"""
        # Mock implementation - in production would use aiohttp
        logger.debug(f"Sent webhook to {url}: {payload['title']}")
        return True  # Assume success


# Global instance
alert_dispatcher = AlertDispatcher.get_instance()