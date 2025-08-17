"""
Alert Scheduler Service

Coordinates alert rule evaluation and dispatching through a unified scheduling system.
Manages background tasks, polling intervals, and integration with the alerting pipeline.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set, Any
from dataclasses import dataclass
from enum import Enum

from backend.services.unified_config import unified_config
from backend.services.alerting.rule_evaluator import AlertRuleEvaluator, AlertEvent
from backend.services.alerting.alert_dispatcher import AlertDispatcher


logger = logging.getLogger(__name__)


class SchedulerStatus(Enum):
    """Scheduler status states"""
    STOPPED = "STOPPED"
    STARTING = "STARTING"
    RUNNING = "RUNNING"
    STOPPING = "STOPPING"
    ERROR = "ERROR"


@dataclass
class SchedulerStats:
    """Statistics for scheduler performance"""
    rules_evaluated: int = 0
    alerts_triggered: int = 0
    alerts_dispatched: int = 0
    alerts_failed: int = 0
    last_evaluation_time: Optional[datetime] = None
    evaluation_duration_ms: int = 0
    uptime_seconds: int = 0
    

class AlertScheduler:
    """
    Alert Scheduler Service
    
    Coordinates the entire alerting pipeline including rule evaluation,
    event generation, and alert dispatching. Provides unified control
    over the alerting system lifecycle.
    """
    
    _instance = None
    
    def __init__(self):
        """Initialize alert scheduler"""
        if AlertScheduler._instance is not None:
            raise Exception("AlertScheduler is a singleton")
            
        self.config = unified_config.get_config_value("risk_management")
        self.status = SchedulerStatus.STOPPED
        self.start_time: Optional[datetime] = None
        
        # Get service instances
        self.rule_evaluator = AlertRuleEvaluator.get_instance()
        self.alert_dispatcher = AlertDispatcher.get_instance()
        
        # Scheduling configuration
        self.evaluation_interval = self.config.alert_evaluation_interval_seconds
        self.max_concurrent_evaluations = 5
        self.enable_batch_processing = True
        
        # Statistics and monitoring
        self.stats = SchedulerStats()
        self.active_evaluations: Set[asyncio.Task] = set()
        
        # Error tracking
        self.consecutive_errors = 0
        self.max_consecutive_errors = 5
        self.error_backoff_seconds = 30
        
        logger.info("AlertScheduler initialized")
        
    @classmethod
    def get_instance(cls):
        """Get singleton instance"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    async def start(self):
        """Start the alert scheduling system"""
        if self.status != SchedulerStatus.STOPPED:
            logger.warning(f"Scheduler already in state: {self.status}")
            return
            
        logger.info("Starting Alert Scheduler")
        self.status = SchedulerStatus.STARTING
        self.start_time = datetime.utcnow()
        
        try:
            # Start the rule evaluator loop
            evaluator_task = asyncio.create_task(self.rule_evaluator.start_evaluation_loop())
            
            # Start the alert dispatcher workers
            dispatcher_task = asyncio.create_task(self.alert_dispatcher.start_dispatch_workers())
            
            # Start the main scheduler loop
            scheduler_task = asyncio.create_task(self._scheduler_loop())
            
            # Start health monitoring
            health_task = asyncio.create_task(self._health_monitor_loop())
            
            self.status = SchedulerStatus.RUNNING
            logger.info("Alert Scheduler started successfully")
            
            # Wait for all tasks
            await asyncio.gather(
                evaluator_task,
                dispatcher_task, 
                scheduler_task,
                health_task,
                return_exceptions=True
            )
            
        except Exception as e:
            logger.error(f"Error starting Alert Scheduler: {e}")
            self.status = SchedulerStatus.ERROR
            raise
        finally:
            await self._cleanup()
    
    async def stop(self):
        """Stop the alert scheduling system"""
        if self.status == SchedulerStatus.STOPPED:
            logger.warning("Scheduler already stopped")
            return
            
        logger.info("Stopping Alert Scheduler")
        self.status = SchedulerStatus.STOPPING
        
        try:
            # Stop the rule evaluator
            await self.rule_evaluator.stop_evaluation_loop()
            
            # Stop the alert dispatcher
            await self.alert_dispatcher.stop_dispatch_workers()
            
            # Cancel active evaluation tasks
            for task in self.active_evaluations:
                if not task.done():
                    task.cancel()
            
            # Wait for tasks to complete
            if self.active_evaluations:
                await asyncio.gather(*self.active_evaluations, return_exceptions=True)
                
            self.status = SchedulerStatus.STOPPED
            logger.info("Alert Scheduler stopped successfully")
            
        except Exception as e:
            logger.error(f"Error stopping Alert Scheduler: {e}")
            self.status = SchedulerStatus.ERROR
    
    async def _scheduler_loop(self):
        """Main scheduler loop that coordinates alert processing"""
        logger.info("Starting main scheduler loop")
        
        while self.status == SchedulerStatus.RUNNING:
            try:
                start_time = datetime.utcnow()
                
                # Process any queued alerts or scheduled tasks
                await self._process_scheduled_alerts()
                
                # Update uptime statistics
                if self.start_time:
                    uptime = (datetime.utcnow() - self.start_time).total_seconds()
                    self.stats.uptime_seconds = int(uptime)
                
                # Update evaluation duration
                duration = (datetime.utcnow() - start_time).total_seconds() * 1000
                self.stats.evaluation_duration_ms = int(duration)
                self.stats.last_evaluation_time = start_time
                
                # Reset error counter on successful iteration
                self.consecutive_errors = 0
                
                # Wait for next iteration
                await asyncio.sleep(self.evaluation_interval)
                
            except Exception as e:
                logger.error(f"Error in scheduler loop: {e}")
                self.consecutive_errors += 1
                
                # Check if too many consecutive errors
                if self.consecutive_errors >= self.max_consecutive_errors:
                    logger.critical(f"Too many consecutive errors ({self.consecutive_errors}), stopping scheduler")
                    self.status = SchedulerStatus.ERROR
                    break
                
                # Back off on errors
                await asyncio.sleep(self.error_backoff_seconds)
        
        logger.info("Main scheduler loop stopped")
    
    async def _process_scheduled_alerts(self):
        """Process any queued or scheduled alerts"""
        try:
            # Check for alerts that were delayed due to quiet hours
            await self._process_quiet_hours_queue()
            
            # Process any failed alerts that need retry
            await self._process_retry_queue()
            
            # Perform maintenance tasks
            await self._perform_maintenance()
            
        except Exception as e:
            logger.error(f"Error processing scheduled alerts: {e}")
    
    async def _process_quiet_hours_queue(self):
        """Process alerts that were delayed due to quiet hours"""
        # Mock implementation - in production would check database for
        # alerts scheduled for delivery after quiet hours end
        logger.debug("Checking quiet hours queue")
    
    async def _process_retry_queue(self):
        """Process alerts that failed delivery and need retry"""
        # This would work with the alert dispatcher to retry failed deliveries
        logger.debug("Processing retry queue")
    
    async def _perform_maintenance(self):
        """Perform routine maintenance tasks"""
        # Clean up old data, update statistics, etc.
        logger.debug("Performing maintenance tasks")
    
    async def _health_monitor_loop(self):
        """Monitor health of alerting system components"""
        logger.info("Starting health monitor loop")
        health_check_interval = 60  # 1 minute
        
        while self.status == SchedulerStatus.RUNNING:
            try:
                await self._check_component_health()
                await asyncio.sleep(health_check_interval)
                
            except Exception as e:
                logger.error(f"Error in health monitor: {e}")
                await asyncio.sleep(health_check_interval)
        
        logger.info("Health monitor loop stopped")
    
    async def _check_component_health(self):
        """Check health of all alerting components"""
        # Check rule evaluator health
        if not self.rule_evaluator.evaluation_active:
            logger.warning("Rule evaluator is not active")
        
        # Check dispatcher health
        if not self.alert_dispatcher.dispatch_active:
            logger.warning("Alert dispatcher is not active")
        
        # Check queue sizes
        total_queue_size = sum(
            queue.qsize() for queue in self.alert_dispatcher.delivery_queues.values()
        )
        
        if total_queue_size > 100:  # Arbitrary threshold
            logger.warning(f"High queue size detected: {total_queue_size} pending alerts")
        
        # Log health status
        logger.debug(f"Health check: Evaluator active={self.rule_evaluator.evaluation_active}, "
                    f"Dispatcher active={self.alert_dispatcher.dispatch_active}, "
                    f"Queue size={total_queue_size}")
    
    async def _cleanup(self):
        """Cleanup resources when stopping"""
        self.active_evaluations.clear()
        logger.debug("Scheduler cleanup completed")
    
    # Public API methods
    
    async def trigger_immediate_evaluation(self, user_id: Optional[int] = None) -> List[AlertEvent]:
        """
        Trigger an immediate evaluation of alert rules
        
        Args:
            user_id: Optional user ID to limit evaluation to specific user
            
        Returns:
            List of triggered alert events
        """
        try:
            logger.info(f"Triggering immediate evaluation for user {user_id if user_id else 'all'}")
            
            # For this implementation, we'll use the existing evaluator
            # In production, this might query specific rules or users
            events = await self.rule_evaluator.evaluate_all_rules()
            
            # Dispatch any triggered events
            dispatch_count = 0
            for event in events:
                if user_id is None or event.user_id == user_id:
                    success = await self.alert_dispatcher.dispatch_alert(event)
                    if success:
                        dispatch_count += 1
            
            logger.info(f"Immediate evaluation triggered {len(events)} events, dispatched {dispatch_count}")
            
            # Update statistics
            self.stats.rules_evaluated += 1
            self.stats.alerts_triggered += len(events)
            self.stats.alerts_dispatched += dispatch_count
            
            return events
            
        except Exception as e:
            logger.error(f"Error in immediate evaluation: {e}")
            return []
    
    async def get_scheduler_status(self) -> Dict[str, Any]:
        """Get current scheduler status and statistics"""
        return {
            'status': self.status.value,
            'uptime_seconds': self.stats.uptime_seconds,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'stats': {
                'rules_evaluated': self.stats.rules_evaluated,
                'alerts_triggered': self.stats.alerts_triggered,
                'alerts_dispatched': self.stats.alerts_dispatched,
                'alerts_failed': self.stats.alerts_failed,
                'last_evaluation_time': self.stats.last_evaluation_time.isoformat() 
                                       if self.stats.last_evaluation_time else None,
                'evaluation_duration_ms': self.stats.evaluation_duration_ms
            },
            'health': {
                'consecutive_errors': self.consecutive_errors,
                'evaluator_active': self.rule_evaluator.evaluation_active,
                'dispatcher_active': self.alert_dispatcher.dispatch_active,
                'active_evaluations': len(self.active_evaluations),
                'queue_sizes': {
                    channel.value: queue.qsize() 
                    for channel, queue in self.alert_dispatcher.delivery_queues.items()
                }
            },
            'config': {
                'evaluation_interval': self.evaluation_interval,
                'max_concurrent_evaluations': self.max_concurrent_evaluations,
                'enable_batch_processing': self.enable_batch_processing
            }
        }
    
    async def update_config(self, config_updates: Dict[str, Any]):
        """Update scheduler configuration dynamically"""
        try:
            if 'evaluation_interval' in config_updates:
                self.evaluation_interval = config_updates['evaluation_interval']
                logger.info(f"Updated evaluation interval to {self.evaluation_interval} seconds")
            
            if 'max_concurrent_evaluations' in config_updates:
                self.max_concurrent_evaluations = config_updates['max_concurrent_evaluations']
                logger.info(f"Updated max concurrent evaluations to {self.max_concurrent_evaluations}")
            
            if 'enable_batch_processing' in config_updates:
                self.enable_batch_processing = config_updates['enable_batch_processing']
                logger.info(f"Updated batch processing to {self.enable_batch_processing}")
                
        except Exception as e:
            logger.error(f"Error updating scheduler config: {e}")
    
    # Integration hooks for external systems
    
    async def on_edge_detected(self, edge_data: Dict[str, Any]):
        """Hook called when new edges are detected"""
        # Trigger evaluation for edge-related alert rules
        logger.debug(f"Edge detected hook called: {edge_data.get('id', 'unknown')}")
        await self._trigger_edge_evaluations(edge_data)
    
    async def on_line_movement(self, movement_data: Dict[str, Any]):
        """Hook called when line movements are detected"""
        logger.debug(f"Line movement hook called: {movement_data.get('prop_id', 'unknown')}")
        await self._trigger_movement_evaluations(movement_data)
    
    async def on_ticket_submitted(self, ticket_data: Dict[str, Any]):
        """Hook called when tickets are submitted"""
        logger.debug(f"Ticket submitted hook called: {ticket_data.get('id', 'unknown')}")
        await self._trigger_risk_evaluations(ticket_data)
    
    async def _trigger_edge_evaluations(self, edge_data: Dict[str, Any]):
        """Trigger evaluations for edge-related alerts"""
        # Mock implementation - would trigger specific rule evaluations
        pass
    
    async def _trigger_movement_evaluations(self, movement_data: Dict[str, Any]):
        """Trigger evaluations for line movement alerts"""
        # Mock implementation - would trigger specific rule evaluations  
        pass
    
    async def _trigger_risk_evaluations(self, ticket_data: Dict[str, Any]):
        """Trigger evaluations for risk-related alerts"""
        # Mock implementation - would trigger specific rule evaluations
        pass


# Global instance
alert_scheduler = AlertScheduler.get_instance()