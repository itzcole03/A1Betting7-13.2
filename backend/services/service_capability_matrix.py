"""
Service Capability Matrix System

Provides centralized service registration, health tracking, and degradation policy management.
Replaces binary "demo mode" with per-service degradation decisions.
"""

import asyncio
import json
import logging
import time
import uuid
from contextlib import asynccontextmanager
from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Set, Union

try:
    from backend.services.unified_config import unified_config
    from backend.services.unified_logging import unified_logger, LogComponent, LogContext
    UNIFIED_SERVICES_AVAILABLE = True
except ImportError:
    unified_config = None
    unified_logger = None
    LogComponent = None
    LogContext = None
    UNIFIED_SERVICES_AVAILABLE = False


class ServiceStatus(Enum):
    """Service status enumeration"""
    UP = "UP"
    DEGRADED = "DEGRADED"
    DOWN = "DOWN"
    DEMO = "DEMO"


class DegradedPolicy(Enum):
    """Degradation policies for services when dependencies are unavailable"""
    FAIL_FAST = "fail_fast"  # Immediately fail requests
    FALLBACK = "fallback"    # Use fallback implementation
    DEMO_MODE = "demo_mode"  # Return demo/mock data
    GRACEFUL = "graceful"    # Reduce functionality gracefully
    RETRY = "retry"          # Retry with backoff


class ServiceCategory(Enum):
    """Service categories for organization"""
    CORE = "core"              # Essential services
    DATA = "data"              # Data providers
    ML = "ml"                  # Machine learning services
    ANALYTICS = "analytics"    # Analytics and reporting
    EXTERNAL = "external"      # External API integrations
    UTILITY = "utility"        # Utility services
    MONITORING = "monitoring"  # Monitoring and observability


@dataclass
class ServiceHealthCheck:
    """Configuration for service health checks"""
    enabled: bool = True
    interval_seconds: int = 60
    timeout_seconds: int = 10
    failure_threshold: int = 3
    recovery_threshold: int = 2
    custom_check_function: Optional[Callable] = None


@dataclass
class ServiceDependency:
    """Service dependency specification"""
    service_name: str
    required: bool = True
    minimum_status: ServiceStatus = ServiceStatus.UP
    fallback_policy: DegradedPolicy = DegradedPolicy.FAIL_FAST


@dataclass
class ServiceCapability:
    """Individual service capability registration"""
    name: str
    version: str
    category: ServiceCategory
    description: str = ""
    required: bool = True
    degraded_policy: DegradedPolicy = DegradedPolicy.FAIL_FAST
    
    # Status tracking
    status: ServiceStatus = ServiceStatus.DOWN
    last_check: Optional[datetime] = None
    last_success: Optional[datetime] = None
    last_failure: Optional[datetime] = None
    failure_count: int = 0
    recovery_count: int = 0
    
    # Configuration
    health_check: ServiceHealthCheck = field(default_factory=ServiceHealthCheck)
    dependencies: List[ServiceDependency] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    # Performance metrics
    average_response_time_ms: float = 0.0
    total_requests: int = 0
    success_requests: int = 0
    failed_requests: int = 0

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        result = asdict(self)
        # Convert enums to strings
        result['category'] = self.category.value
        result['status'] = self.status.value
        result['degraded_policy'] = self.degraded_policy.value
        
        # Convert datetime objects
        if self.last_check:
            result['last_check'] = self.last_check.isoformat()
        if self.last_success:
            result['last_success'] = self.last_success.isoformat()
        if self.last_failure:
            result['last_failure'] = self.last_failure.isoformat()
            
        # Convert dependencies
        result['dependencies'] = [
            {
                'service_name': dep.service_name,
                'required': dep.required,
                'minimum_status': dep.minimum_status.value,
                'fallback_policy': dep.fallback_policy.value
            }
            for dep in self.dependencies
        ]
        
        # Convert health check
        health_check_dict = asdict(self.health_check)
        health_check_dict.pop('custom_check_function', None)  # Can't serialize functions
        result['health_check'] = health_check_dict
        
        return result

    @property
    def success_rate(self) -> float:
        """Calculate success rate percentage"""
        if self.total_requests == 0:
            return 0.0
        return (self.success_requests / self.total_requests) * 100.0

    @property
    def is_healthy(self) -> bool:
        """Check if service is considered healthy"""
        return self.status in [ServiceStatus.UP, ServiceStatus.DEGRADED]

    def update_performance_metrics(self, response_time_ms: float, success: bool):
        """Update performance metrics"""
        self.total_requests += 1
        if success:
            self.success_requests += 1
        else:
            self.failed_requests += 1
            
        # Update rolling average response time
        if self.total_requests == 1:
            self.average_response_time_ms = response_time_ms
        else:
            # Simple weighted average (could be improved with sliding window)
            self.average_response_time_ms = (
                (self.average_response_time_ms * (self.total_requests - 1) + response_time_ms) / 
                self.total_requests
            )


@dataclass
class SystemCapabilityMatrix:
    """Complete system capability matrix"""
    services: Dict[str, ServiceCapability] = field(default_factory=dict)
    matrix_version: str = "1.0.0"
    last_updated: datetime = field(default_factory=datetime.utcnow)
    global_status: ServiceStatus = ServiceStatus.DOWN
    demo_mode_services: Set[str] = field(default_factory=set)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API exposure"""
        return {
            'matrix_version': self.matrix_version,
            'last_updated': self.last_updated.isoformat(),
            'global_status': self.global_status.value,
            'demo_mode_services': list(self.demo_mode_services),
            'services': {name: service.to_dict() for name, service in self.services.items()},
            'summary': self._generate_summary()
        }
        
    def _generate_summary(self) -> Dict[str, Any]:
        """Generate capability matrix summary"""
        if not self.services:
            return {
                'total_services': 0,
                'status_breakdown': {},
                'category_breakdown': {},
                'overall_health': 0.0,
                'critical_services_down': 0
            }
            
        status_counts = {}
        category_counts = {}
        critical_services_down = 0
        total_health_score = 0.0
        
        for service in self.services.values():
            # Status breakdown
            status_counts[service.status.value] = status_counts.get(service.status.value, 0) + 1
            
            # Category breakdown
            category_counts[service.category.value] = category_counts.get(service.category.value, 0) + 1
            
            # Critical services check
            if service.required and not service.is_healthy:
                critical_services_down += 1
                
            # Health score calculation
            if service.status == ServiceStatus.UP:
                total_health_score += 1.0
            elif service.status == ServiceStatus.DEGRADED:
                total_health_score += 0.7
            elif service.status == ServiceStatus.DEMO:
                total_health_score += 0.5
            # DOWN services contribute 0
            
        overall_health = (total_health_score / len(self.services)) * 100.0 if self.services else 0.0
        
        return {
            'total_services': len(self.services),
            'status_breakdown': status_counts,
            'category_breakdown': category_counts,
            'overall_health': round(overall_health, 2),
            'critical_services_down': critical_services_down,
            'required_services': len([s for s in self.services.values() if s.required]),
            'optional_services': len([s for s in self.services.values() if not s.required])
        }


class ServiceCapabilityRegistry:
    """
    Centralized registry for service capabilities and health tracking
    """
    
    _instance: Optional['ServiceCapabilityRegistry'] = None
    _lock = asyncio.Lock()
    
    def __init__(self):
        self._capabilities: SystemCapabilityMatrix = SystemCapabilityMatrix()
        self._health_check_tasks: Dict[str, asyncio.Task] = {}
        self._monitoring_active = False
        self._logger = unified_logger if unified_logger else logging.getLogger(__name__)
        self._event_version = "validator.event.v1"
        
        # Initialize built-in service registrations
        self._register_core_services()
    
    @classmethod
    async def get_instance(cls) -> 'ServiceCapabilityRegistry':
        """Get singleton instance with async initialization"""
        if cls._instance is None:
            async with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
                    await cls._instance._initialize()
        return cls._instance
    
    @classmethod
    def get_instance_sync(cls) -> 'ServiceCapabilityRegistry':
        """Get singleton instance synchronously (may not be fully initialized)"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    async def _initialize(self):
        """Initialize the registry"""
        if UNIFIED_SERVICES_AVAILABLE and LogContext and LogComponent:
            context = LogContext(
                component=LogComponent.SYSTEM,
                operation="capability_registry_init"
            )
            self._logger.info("Initializing Service Capability Registry", context)
        else:
            print("🔧 Initializing Service Capability Registry")
        
        # Start monitoring if enabled
        if unified_config:
            try:
                config = unified_config.get_config_summary()
                if config and config.get("monitoring", {}).get("health_checks_enabled", True):
                    await self.start_health_monitoring()
            except Exception:
                # Default to enabling health monitoring
                await self.start_health_monitoring()
    
    def _register_core_services(self):
        """Register core system services with their capabilities"""
        core_services = [
            ServiceCapability(
                name="unified_config",
                version="1.0.0",
                category=ServiceCategory.CORE,
                description="Centralized configuration management",
                required=True,
                degraded_policy=DegradedPolicy.FAIL_FAST,
                health_check=ServiceHealthCheck(interval_seconds=300)  # Check every 5 minutes
            ),
            ServiceCapability(
                name="unified_logging",
                version="1.0.0", 
                category=ServiceCategory.CORE,
                description="Structured logging system",
                required=True,
                degraded_policy=DegradedPolicy.GRACEFUL,
                health_check=ServiceHealthCheck(interval_seconds=300)
            ),
            ServiceCapability(
                name="unified_cache",
                version="1.0.0",
                category=ServiceCategory.CORE,
                description="Multi-tier caching system",
                required=False,  # Can run without cache
                degraded_policy=DegradedPolicy.FALLBACK,
                health_check=ServiceHealthCheck(interval_seconds=120)
            ),
            ServiceCapability(
                name="database",
                version="1.0.0",
                category=ServiceCategory.CORE,
                description="Primary database connection",
                required=True,
                degraded_policy=DegradedPolicy.FAIL_FAST,
                health_check=ServiceHealthCheck(interval_seconds=60)
            ),
            ServiceCapability(
                name="websocket_service",
                version="1.0.0",
                category=ServiceCategory.CORE,
                description="WebSocket communication service",
                required=False,
                degraded_policy=DegradedPolicy.GRACEFUL,
                health_check=ServiceHealthCheck(interval_seconds=120)
            ),
            ServiceCapability(
                name="mlb_data_provider",
                version="1.0.0",
                category=ServiceCategory.DATA,
                description="MLB statistics and game data provider",
                required=True,
                degraded_policy=DegradedPolicy.DEMO_MODE,
                health_check=ServiceHealthCheck(interval_seconds=180),
                dependencies=[
                    ServiceDependency("unified_cache", required=False, fallback_policy=DegradedPolicy.FALLBACK)
                ]
            ),
            ServiceCapability(
                name="modern_ml_service",
                version="1.0.0",
                category=ServiceCategory.ML,
                description="Modern ML prediction engine",
                required=False,
                degraded_policy=DegradedPolicy.FALLBACK,
                health_check=ServiceHealthCheck(interval_seconds=300),
                dependencies=[
                    ServiceDependency("mlb_data_provider", required=True),
                    ServiceDependency("unified_cache", required=False)
                ]
            ),
            ServiceCapability(
                name="prizepicks_adapter",
                version="1.0.0",
                category=ServiceCategory.EXTERNAL,
                description="PrizePicks API integration",
                required=False,
                degraded_policy=DegradedPolicy.DEMO_MODE,
                health_check=ServiceHealthCheck(interval_seconds=300)
            ),
            ServiceCapability(
                name="baseball_savant_client",
                version="1.0.0",
                category=ServiceCategory.EXTERNAL,
                description="Baseball Savant/Statcast integration",
                required=False,
                degraded_policy=DegradedPolicy.DEMO_MODE,
                health_check=ServiceHealthCheck(interval_seconds=300)
            )
        ]
        
        for service in core_services:
            self._capabilities.services[service.name] = service
    
    async def register_service(self, capability: ServiceCapability) -> bool:
        """Register a new service capability"""
        try:
            if capability.name in self._capabilities.services:
                if UNIFIED_SERVICES_AVAILABLE and LogContext and LogComponent:
                    context = LogContext(
                        component=LogComponent.SYSTEM,
                        operation="service_registration",
                        additional_data={"service_name": capability.name}
                    )
                    self._logger.warning(f"Service {capability.name} already registered, updating", context)
                
            self._capabilities.services[capability.name] = capability
            self._capabilities.last_updated = datetime.utcnow()
            
            # Start health check task if monitoring is active
            if self._monitoring_active and capability.health_check.enabled:
                await self._start_service_health_check(capability.name)
            
            # Update global status
            self._update_global_status()
            
            if UNIFIED_SERVICES_AVAILABLE and LogContext and LogComponent:
                context = LogContext(
                    component=LogComponent.SYSTEM,
                    operation="service_registration",
                    additional_data={
                        "service_name": capability.name,
                        "version": capability.version,
                        "category": capability.category.value,
                        "required": capability.required
                    }
                )
                self._logger.info(f"Service {capability.name} v{capability.version} registered successfully", context)
            
            return True
            
        except Exception as e:
            if UNIFIED_SERVICES_AVAILABLE and LogContext and LogComponent:
                context = LogContext(
                    component=LogComponent.SYSTEM,
                    operation="service_registration_error",
                    additional_data={"service_name": capability.name, "error": str(e)}
                )
                self._logger.error(f"Failed to register service {capability.name}: {e}", context)
            
            return False
    
    async def update_service_status(self, service_name: str, status: ServiceStatus, 
                                  response_time_ms: Optional[float] = None) -> bool:
        """Update service status and performance metrics"""
        if service_name not in self._capabilities.services:
            return False
        
        service = self._capabilities.services[service_name]
        old_status = service.status
        service.status = status
        service.last_check = datetime.utcnow()
        
        if status == ServiceStatus.UP:
            service.last_success = datetime.utcnow()
            service.recovery_count += 1
            service.failure_count = 0  # Reset failure count on success
        elif status in [ServiceStatus.DOWN, ServiceStatus.DEGRADED]:
            service.last_failure = datetime.utcnow()
            service.failure_count += 1
        
        # Update performance metrics if provided
        if response_time_ms is not None:
            service.update_performance_metrics(response_time_ms, status == ServiceStatus.UP)
        
        # Update demo mode tracking
        if status == ServiceStatus.DEMO:
            self._capabilities.demo_mode_services.add(service_name)
        else:
            self._capabilities.demo_mode_services.discard(service_name)
        
        # Update global status
        self._update_global_status()
        self._capabilities.last_updated = datetime.utcnow()
        
        # Log status change
        if old_status != status and UNIFIED_SERVICES_AVAILABLE and LogContext and LogComponent:
            context = LogContext(
                component=LogComponent.SYSTEM,
                operation="service_status_change",
                additional_data={
                    "service_name": service_name,
                    "old_status": old_status.value,
                    "new_status": status.value,
                    "response_time_ms": response_time_ms
                }
            )
            self._logger.info(f"Service {service_name} status: {old_status.value} → {status.value}", context)
        
        return True
    
    def _update_global_status(self):
        """Update the global system status based on individual service statuses"""
        if not self._capabilities.services:
            self._capabilities.global_status = ServiceStatus.DOWN
            return
        
        required_services = [s for s in self._capabilities.services.values() if s.required]
        optional_services = [s for s in self._capabilities.services.values() if not s.required]
        
        # Check required services
        required_down = any(s.status == ServiceStatus.DOWN for s in required_services)
        required_degraded = any(s.status == ServiceStatus.DEGRADED for s in required_services)
        
        if required_down:
            self._capabilities.global_status = ServiceStatus.DOWN
        elif required_degraded:
            self._capabilities.global_status = ServiceStatus.DEGRADED
        else:
            # All required services are UP or DEMO
            optional_issues = any(s.status in [ServiceStatus.DOWN, ServiceStatus.DEGRADED] 
                                for s in optional_services)
            if optional_issues:
                self._capabilities.global_status = ServiceStatus.DEGRADED
            else:
                self._capabilities.global_status = ServiceStatus.UP
    
    async def get_service_capability(self, service_name: str) -> Optional[ServiceCapability]:
        """Get capability information for a specific service"""
        return self._capabilities.services.get(service_name)
    
    async def get_capabilities_matrix(self) -> SystemCapabilityMatrix:
        """Get the complete capabilities matrix"""
        return self._capabilities
    
    async def is_service_available(self, service_name: str, minimum_status: ServiceStatus = ServiceStatus.UP) -> bool:
        """Check if a service is available at the specified minimum status level"""
        service = self._capabilities.services.get(service_name)
        if not service:
            return False
        
        status_hierarchy = {
            ServiceStatus.UP: 4,
            ServiceStatus.DEGRADED: 3,
            ServiceStatus.DEMO: 2,
            ServiceStatus.DOWN: 1
        }
        
        return status_hierarchy.get(service.status, 0) >= status_hierarchy.get(minimum_status, 0)
    
    async def get_degradation_policy(self, service_name: str) -> Optional[DegradedPolicy]:
        """Get the degradation policy for a service"""
        service = self._capabilities.services.get(service_name)
        return service.degraded_policy if service else None
    
    async def start_health_monitoring(self):
        """Start health monitoring for all services"""
        if self._monitoring_active:
            return
            
        self._monitoring_active = True
        
        if UNIFIED_SERVICES_AVAILABLE and LogContext and LogComponent:
            context = LogContext(
                component=LogComponent.SYSTEM,
                operation="health_monitoring_start"
            )
            self._logger.info("Starting service health monitoring", context)
        
        # Start health check tasks for all services
        for service_name in self._capabilities.services:
            await self._start_service_health_check(service_name)
    
    async def stop_health_monitoring(self):
        """Stop health monitoring for all services"""
        self._monitoring_active = False
        
        # Cancel all health check tasks
        for task in self._health_check_tasks.values():
            task.cancel()
        
        # Wait for tasks to complete
        if self._health_check_tasks:
            await asyncio.gather(*self._health_check_tasks.values(), return_exceptions=True)
        
        self._health_check_tasks.clear()
        
        if UNIFIED_SERVICES_AVAILABLE and LogContext and LogComponent:
            context = LogContext(
                component=LogComponent.SYSTEM,
                operation="health_monitoring_stop"
            )
            self._logger.info("Stopped service health monitoring", context)
    
    async def _start_service_health_check(self, service_name: str):
        """Start health check task for a specific service"""
        service = self._capabilities.services.get(service_name)
        if not service or not service.health_check.enabled:
            return
        
        # Cancel existing task if any
        if service_name in self._health_check_tasks:
            self._health_check_tasks[service_name].cancel()
        
        # Start new health check task
        self._health_check_tasks[service_name] = asyncio.create_task(
            self._health_check_loop(service_name)
        )
    
    async def _health_check_loop(self, service_name: str):
        """Continuous health check loop for a service"""
        service = self._capabilities.services.get(service_name)
        if not service:
            return
        
        while self._monitoring_active and service.health_check.enabled:
            try:
                await self._perform_health_check(service_name)
                await asyncio.sleep(service.health_check.interval_seconds)
            except asyncio.CancelledError:
                break
            except Exception as e:
                if UNIFIED_SERVICES_AVAILABLE and LogContext and LogComponent:
                    context = LogContext(
                        component=LogComponent.SYSTEM,
                        operation="health_check_error",
                        additional_data={"service_name": service_name, "error": str(e)}
                    )
                    self._logger.error(f"Health check error for {service_name}: {e}", context)
                
                # Continue with reduced frequency on error
                await asyncio.sleep(min(service.health_check.interval_seconds * 2, 300))
    
    async def _perform_health_check(self, service_name: str):
        """Perform health check for a specific service"""
        service = self._capabilities.services.get(service_name)
        if not service:
            return
        
        start_time = time.time()
        
        try:
            # Use custom health check function if provided
            if service.health_check.custom_check_function:
                is_healthy = await service.health_check.custom_check_function()
            else:
                # Default health check logic based on service type
                is_healthy = await self._default_health_check(service_name)
            
            response_time_ms = (time.time() - start_time) * 1000
            
            if is_healthy:
                await self.update_service_status(service_name, ServiceStatus.UP, response_time_ms)
            else:
                # Determine status based on failure count and policy
                if service.failure_count >= service.health_check.failure_threshold:
                    if service.degraded_policy == DegradedPolicy.DEMO_MODE:
                        await self.update_service_status(service_name, ServiceStatus.DEMO, response_time_ms)
                    elif service.degraded_policy in [DegradedPolicy.GRACEFUL, DegradedPolicy.FALLBACK]:
                        await self.update_service_status(service_name, ServiceStatus.DEGRADED, response_time_ms)
                    else:
                        await self.update_service_status(service_name, ServiceStatus.DOWN, response_time_ms)
                else:
                    # Still within failure threshold, keep as degraded
                    await self.update_service_status(service_name, ServiceStatus.DEGRADED, response_time_ms)
                    
        except asyncio.TimeoutError:
            response_time_ms = service.health_check.timeout_seconds * 1000
            await self.update_service_status(service_name, ServiceStatus.DOWN, response_time_ms)
        except Exception as e:
            if UNIFIED_SERVICES_AVAILABLE and LogContext and LogComponent:
                context = LogContext(
                    component=LogComponent.SYSTEM,
                    operation="health_check_exception",
                    additional_data={"service_name": service_name, "error": str(e)}
                )
                self._logger.warning(f"Health check exception for {service_name}: {e}", context)
            
            await self.update_service_status(service_name, ServiceStatus.DOWN)
    
    async def _default_health_check(self, service_name: str) -> bool:
        """Default health check implementation for various service types"""
        try:
            if service_name == "unified_config":
                return unified_config is not None
            elif service_name == "unified_logging":
                return unified_logger is not None
            elif service_name == "unified_cache":
                # Try to import and test cache service
                try:
                    from backend.services.unified_cache_service import unified_cache_service
                    return unified_cache_service is not None
                except ImportError:
                    return False
            elif service_name == "database":
                # Try a simple database test
                try:
                    # Simple check - can import database modules
                    import sqlite3
                    return True
                except ImportError:
                    return False
            elif service_name in ["mlb_data_provider", "prizepicks_adapter", "baseball_savant_client"]:
                # For external services, a simple import test
                try:
                    if service_name == "mlb_data_provider":
                        from backend.services.unified_data_fetcher import unified_data_fetcher
                        return unified_data_fetcher is not None
                    elif service_name == "prizepicks_adapter":
                        # Check if PrizePicks related services exist
                        try:
                            # Just return True for now since we don't have the exact adapter
                            return True
                        except ImportError:
                            return False
                    elif service_name == "baseball_savant_client":
                        try:
                            from backend.services.baseball_savant_client import BaseballSavantClient
                            return BaseballSavantClient is not None
                        except ImportError:
                            return False
                except ImportError:
                    return False
            else:
                # Unknown service - assume it's up if registered
                return True
                
        except Exception:
            return False


# Global registry instance
_registry_instance: Optional[ServiceCapabilityRegistry] = None


async def get_capability_registry() -> ServiceCapabilityRegistry:
    """Get the global capability registry instance"""
    global _registry_instance
    if _registry_instance is None:
        _registry_instance = await ServiceCapabilityRegistry.get_instance()
    return _registry_instance


def get_capability_registry_sync() -> ServiceCapabilityRegistry:
    """Get the global capability registry instance synchronously"""
    global _registry_instance
    if _registry_instance is None:
        _registry_instance = ServiceCapabilityRegistry.get_instance_sync()
    return _registry_instance


# Convenience functions for service registration
async def register_service_capability(
    name: str,
    version: str,
    category: ServiceCategory,
    description: str = "",
    required: bool = True,
    degraded_policy: DegradedPolicy = DegradedPolicy.FAIL_FAST,
    health_check_interval: int = 60,
    dependencies: Optional[List[ServiceDependency]] = None
) -> bool:
    """Convenience function to register a service capability"""
    registry = await get_capability_registry()
    
    capability = ServiceCapability(
        name=name,
        version=version,
        category=category,
        description=description,
        required=required,
        degraded_policy=degraded_policy,
        health_check=ServiceHealthCheck(interval_seconds=health_check_interval),
        dependencies=dependencies or []
    )
    
    return await registry.register_service(capability)


async def update_service_status_quick(service_name: str, status: ServiceStatus) -> bool:
    """Quick convenience function to update service status"""
    registry = await get_capability_registry()
    return await registry.update_service_status(service_name, status)


async def is_service_available_quick(service_name: str, minimum_status: ServiceStatus = ServiceStatus.UP) -> bool:
    """Quick convenience function to check service availability"""
    registry = await get_capability_registry()
    return await registry.is_service_available(service_name, minimum_status)


# Export main classes and functions
__all__ = [
    'ServiceCapabilityRegistry',
    'ServiceCapability',
    'SystemCapabilityMatrix',
    'ServiceStatus',
    'DegradedPolicy',
    'ServiceCategory',
    'ServiceHealthCheck',
    'ServiceDependency',
    'get_capability_registry',
    'get_capability_registry_sync',
    'register_service_capability',
    'update_service_status_quick',
    'is_service_available_quick'
]