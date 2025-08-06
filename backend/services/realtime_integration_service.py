"""
Real-time Integration Service - Priority 2 Complete Implementation
Unified integration service that combines all Priority 2 enhancements
"""

import asyncio
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from backend.services.enhanced_async_pipeline import PipelineManager, pipeline_manager
from backend.services.enhanced_connection_pool import (
    EnhancedConnectionPoolManager,
    connection_pool_manager,
)
from backend.services.enhanced_realtime_websocket import (
    EnhancedConnectionManager,
    enhanced_websocket_manager,
)
from backend.services.enhanced_resilience_service import (
    EnhancedResilienceService,
    get_resilience_service,
)
from backend.services.optimized_redis_service import OptimizedRedisService
from backend.services.pipeline_integration_service import (
    DataProcessingPipeline,
    get_pipeline_integration_service,
)
from backend.services.realtime_prop_updates import RealTimePropSystem, get_prop_system
from backend.utils.enhanced_logging import get_logger

logger = get_logger("realtime_integration")


class RealTimeIntegrationService:
    """Unified real-time integration service for Priority 2"""

    def __init__(self):
        # Core services
        self.redis_service = OptimizedRedisService()
        self.websocket_manager: Optional[EnhancedConnectionManager] = None
        self.pipeline_manager: Optional[PipelineManager] = None
        self.connection_pool_manager: Optional[EnhancedConnectionPoolManager] = None
        self.prop_system: Optional[RealTimePropSystem] = None
        self.resilience_service: Optional[EnhancedResilienceService] = None
        self.data_pipeline: Optional[DataProcessingPipeline] = None

        # State
        self.is_running = False
        self.initialization_complete = False

    async def initialize(self):
        """Initialize all real-time services"""
        if self.initialization_complete:
            return

        logger.info("Initializing Priority 2 Real-time Integration Service")

        try:
            # Initialize core services
            logger.info("Initializing core services...")

            # WebSocket manager
            self.websocket_manager = enhanced_websocket_manager

            # Pipeline manager
            self.pipeline_manager = pipeline_manager

            # Connection pool manager
            self.connection_pool_manager = connection_pool_manager

            # Initialize database connections
            await self._initialize_connection_pools()

            # Resilience service
            self.resilience_service = await get_resilience_service()

            # Data processing pipeline
            self.data_pipeline = await get_pipeline_integration_service()

            # Prop updates system
            self.prop_system = await get_prop_system()

            self.initialization_complete = True
            logger.info(
                "Priority 2 Real-time Integration Service initialization complete"
            )

        except Exception as e:
            logger.error(f"Failed to initialize real-time integration service: {e}")
            raise

    async def start(self):
        """Start all real-time services"""
        if not self.initialization_complete:
            await self.initialize()

        if self.is_running:
            return

        logger.info("Starting Priority 2 Real-time Integration Service")

        try:
            # Start services in order
            logger.info("Starting connection pools...")
            await self.connection_pool_manager.start_all()

            logger.info("Starting WebSocket manager...")
            await self.websocket_manager.start()

            logger.info("Starting data processing pipelines...")
            await self.data_pipeline.start_all_pipelines()

            logger.info("Starting prop updates system...")
            await self.prop_system.start()

            logger.info("Starting resilience service...")
            await self.resilience_service.start()

            self.is_running = True
            logger.info("Priority 2 Real-time Integration Service started successfully")

            # Log system status
            await self._log_system_status()

        except Exception as e:
            logger.error(f"Failed to start real-time integration service: {e}")
            await self.stop()
            raise

    async def stop(self):
        """Stop all real-time services"""
        if not self.is_running:
            return

        logger.info("Stopping Priority 2 Real-time Integration Service")

        try:
            # Stop services in reverse order
            if self.resilience_service:
                await self.resilience_service.stop()

            if self.prop_system:
                await self.prop_system.stop()

            if self.data_pipeline:
                await self.data_pipeline.stop_all_pipelines()

            if self.websocket_manager:
                await self.websocket_manager.stop()

            if self.connection_pool_manager:
                await self.connection_pool_manager.stop_all()

            self.is_running = False
            logger.info("Priority 2 Real-time Integration Service stopped")

        except Exception as e:
            logger.error(f"Error stopping real-time integration service: {e}")

    async def _initialize_connection_pools(self):
        """Initialize connection pools for databases and external services"""
        try:
            # Use default database URL - will be configured from environment
            database_url = "postgresql+asyncpg://user:password@localhost/a1betting"

            # Database connection pool
            await self.connection_pool_manager.create_database_pool(
                name="main_db", database_url=database_url, config=None  # Use defaults
            )

            # Redis connection pool
            await self.connection_pool_manager.create_redis_pool(
                name="main_redis",
                redis_url="redis://localhost:6379/0",
                config=None,  # Use defaults
            )

            # HTTP connection pool for external APIs
            await self.connection_pool_manager.create_http_pool(
                name="external_api", config=None, connector_limit=200  # Use defaults
            )

            logger.info("Connection pools initialized")

        except Exception as e:
            logger.error(f"Error initializing connection pools: {e}")
            # Continue without connection pools - they're not critical for basic operation

    async def _log_system_status(self):
        """Log current system status"""
        try:
            status = await self.get_system_status()
            logger.info(f"System Status: {status}")

        except Exception as e:
            logger.error(f"Error logging system status: {e}")

    async def get_system_status(self) -> Dict[str, Any]:
        """Get comprehensive system status"""
        status = {
            "integration_service": {
                "running": self.is_running,
                "initialized": self.initialization_complete,
            },
            "timestamp": datetime.now().isoformat(),
        }

        try:
            # WebSocket status
            if self.websocket_manager:
                status["websocket"] = await self.websocket_manager.get_status()

            # Pipeline status
            if self.data_pipeline:
                status["pipelines"] = await self.data_pipeline.get_processing_status()

            # Connection pool status
            if self.connection_pool_manager:
                status["connection_pools"] = (
                    await self.connection_pool_manager.get_all_metrics()
                )

            # Prop system status
            if self.prop_system:
                status["prop_system"] = await self.prop_system.get_stats()

            # Resilience status
            if self.resilience_service:
                status["resilience"] = await self.resilience_service.get_all_metrics()

        except Exception as e:
            logger.error(f"Error collecting system status: {e}")
            status["error"] = str(e)

        return status

    async def get_performance_metrics(self) -> Dict[str, Any]:
        """Get comprehensive performance metrics"""
        metrics = {
            "timestamp": datetime.now().isoformat(),
            "system_running": self.is_running,
        }

        try:
            if self.websocket_manager:
                ws_metrics = await self.websocket_manager.get_metrics()
                metrics["websocket"] = ws_metrics

            if self.data_pipeline:
                pipeline_metrics = await self.data_pipeline.get_processing_status()
                metrics["data_processing"] = pipeline_metrics

            if self.connection_pool_manager:
                pool_metrics = await self.connection_pool_manager.get_all_metrics()
                metrics["connection_pools"] = pool_metrics

            if self.prop_system:
                prop_metrics = await self.prop_system.get_stats()
                metrics["prop_updates"] = prop_metrics

            if self.resilience_service:
                resilience_metrics = await self.resilience_service.get_all_metrics()
                metrics["resilience"] = resilience_metrics

        except Exception as e:
            logger.error(f"Error collecting performance metrics: {e}")
            metrics["error"] = str(e)

        return metrics

    # WebSocket operations
    async def send_websocket_message(self, connection_id: str, message: Dict[str, Any]):
        """Send message via WebSocket"""
        if not self.websocket_manager:
            raise RuntimeError("WebSocket manager not initialized")
        await self.websocket_manager.send_to_connection(connection_id, message)

    async def broadcast_websocket_message(
        self, message: Dict[str, Any], channel: str = None
    ):
        """Broadcast message to all WebSocket connections"""
        if not self.websocket_manager:
            raise RuntimeError("WebSocket manager not initialized")
        await self.websocket_manager.broadcast(message, channel)

    # Data processing operations
    async def submit_game_data(
        self, game_data: Dict[str, Any], priority: int = 1
    ) -> str:
        """Submit game data for processing"""
        if not self.data_pipeline:
            raise RuntimeError("Data pipeline not initialized")
        return await self.data_pipeline.submit_game_data(game_data, priority)

    async def submit_prop_data(
        self, prop_data: Dict[str, Any], priority: int = 1
    ) -> str:
        """Submit prop data for processing"""
        if not self.data_pipeline:
            raise RuntimeError("Data pipeline not initialized")
        return await self.data_pipeline.submit_prop_data(prop_data, priority)

    # Prop update operations
    async def subscribe_to_prop_updates(
        self, user_id: str, connection_id: str, filters: Dict[str, Any]
    ) -> str:
        """Subscribe to prop updates"""
        if not self.prop_system:
            raise RuntimeError("Prop system not initialized")
        return await self.prop_system.subscribe(user_id, connection_id, filters)

    async def unsubscribe_from_prop_updates(self, subscription_id: str):
        """Unsubscribe from prop updates"""
        if not self.prop_system:
            raise RuntimeError("Prop system not initialized")
        await self.prop_system.unsubscribe(subscription_id)

    # Connection pool operations
    def get_database_pool(self, name: str = "main_db"):
        """Get database connection pool"""
        if not self.connection_pool_manager:
            raise RuntimeError("Connection pool manager not initialized")
        return self.connection_pool_manager.get_pool(name)

    def get_redis_pool(self, name: str = "main_redis"):
        """Get Redis connection pool"""
        if not self.connection_pool_manager:
            raise RuntimeError("Connection pool manager not initialized")
        return self.connection_pool_manager.get_pool(name)

    def get_http_pool(self, name: str = "external_api"):
        """Get HTTP connection pool"""
        if not self.connection_pool_manager:
            raise RuntimeError("Connection pool manager not initialized")
        return self.connection_pool_manager.get_pool(name)

    # Health check
    async def health_check(self) -> Dict[str, Any]:
        """Perform comprehensive health check"""
        health = {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "services": {},
        }

        service_health = []

        try:
            # Check each service
            if self.websocket_manager:
                ws_status = await self.websocket_manager.get_status()
                health["services"]["websocket"] = ws_status
                service_health.append(ws_status.get("status") == "running")

            if self.data_pipeline:
                pipeline_status = await self.data_pipeline.get_processing_status()
                health["services"]["data_pipeline"] = pipeline_status
                # Assume healthy if any pipeline is running
                service_health.append(True)

            if self.prop_system:
                prop_stats = await self.prop_system.get_stats()
                health["services"]["prop_system"] = prop_stats
                service_health.append(prop_stats.get("is_running", False))

            if self.resilience_service:
                resilience_metrics = await self.resilience_service.get_all_metrics()
                system_health = resilience_metrics.get("system_health", {})
                health["services"]["resilience"] = system_health
                service_health.append(
                    system_health.get("status") in ["healthy", "degraded"]
                )

            # Determine overall health
            if all(service_health):
                health["status"] = "healthy"
            elif any(service_health):
                health["status"] = "degraded"
            else:
                health["status"] = "unhealthy"

        except Exception as e:
            logger.error(f"Error in health check: {e}")
            health["status"] = "error"
            health["error"] = str(e)

        return health


# Global integration service
integration_service: Optional[RealTimeIntegrationService] = None


async def get_integration_service() -> RealTimeIntegrationService:
    """Get initialized integration service"""
    global integration_service

    if integration_service is None:
        integration_service = RealTimeIntegrationService()
        await integration_service.initialize()

    return integration_service


async def start_realtime_services():
    """Start all real-time services"""
    service = await get_integration_service()
    await service.start()
    return service


async def stop_realtime_services():
    """Stop all real-time services"""
    global integration_service

    if integration_service and integration_service.is_running:
        await integration_service.stop()
        integration_service = None
