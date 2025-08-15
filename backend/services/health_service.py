"""
Health Service - Structured health monitoring with component status tracking
Provides detailed system health information including uptime, component status, and version info.
"""

import time
import asyncio
from typing import Dict, Literal, Optional, Union, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field

# Record startup time at module import
START_TIME = time.time()

ComponentStatus = Literal["up", "degraded", "down", "unknown"]
HealthStatus = Literal["ok", "degraded", "unhealthy"]


class ComponentHealth(BaseModel):
    """Individual component health status"""
    status: ComponentStatus = "unknown"
    last_check: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    response_time_ms: Optional[float] = None


class HealthStatusResponse(BaseModel):
    """Structured health status response model"""
    status: HealthStatus = "ok"
    uptime_seconds: float = Field(ge=0)
    version: str = "v2"
    timestamp: str = Field(description="ISO8601 timestamp")
    components: Dict[str, ComponentHealth] = Field(default_factory=dict)
    build_info: Optional[Dict[str, str]] = None


class HealthService:
    """Service for monitoring system and component health"""
    
    def __init__(self):
        self.last_health_check = None
        self.cached_component_status = {}
        self.cache_ttl = 30  # Cache component status for 30 seconds
        
    def get_uptime_seconds(self) -> float:
        """Calculate uptime since service start"""
        return time.time() - START_TIME
    
    async def check_websocket_health(self) -> ComponentHealth:
        """Check WebSocket service health"""
        try:
            # Simulate WebSocket health check
            # In production, this would check actual WS connection manager
            start_time = time.time()
            
            # Simulate a health check delay
            await asyncio.sleep(0.01)
            
            response_time = (time.time() - start_time) * 1000
            
            return ComponentHealth(
                status="up",
                last_check=datetime.now(timezone.utc).isoformat(),
                response_time_ms=response_time,
                details={"active_connections": 0}  # Simulated
            )
        except Exception as e:
            return ComponentHealth(
                status="down",
                last_check=datetime.now(timezone.utc).isoformat(),
                details={"error": str(e)}
            )
    
    async def check_cache_health(self) -> ComponentHealth:
        """Check cache service health"""
        try:
            start_time = time.time()
            
            # Simulate cache health check
            await asyncio.sleep(0.005)
            
            response_time = (time.time() - start_time) * 1000
            
            return ComponentHealth(
                status="up",
                last_check=datetime.now(timezone.utc).isoformat(),
                response_time_ms=response_time,
                details={"cache_type": "memory"}  # Simulated
            )
        except Exception as e:
            return ComponentHealth(
                status="degraded",
                last_check=datetime.now(timezone.utc).isoformat(),
                details={"error": str(e)}
            )
    
    async def check_model_inference_health(self) -> ComponentHealth:
        """Check ML model inference service health"""
        try:
            start_time = time.time()
            
            # Simulate model health check
            await asyncio.sleep(0.02)
            
            response_time = (time.time() - start_time) * 1000
            
            # Simulate occasional degraded status
            import random
            status = "degraded" if random.random() < 0.1 else "up"
            
            return ComponentHealth(
                status=status,
                last_check=datetime.now(timezone.utc).isoformat(),
                response_time_ms=response_time,
                details={
                    "model_loaded": True,
                    "inference_queue_size": random.randint(0, 5)
                }
            )
        except Exception as e:
            return ComponentHealth(
                status="down",
                last_check=datetime.now(timezone.utc).isoformat(),
                details={"error": str(e)}
            )
    
    async def get_component_statuses(self) -> Dict[str, ComponentHealth]:
        """Get health status for all monitored components"""
        current_time = time.time()
        
        # Use cached results if still valid
        if (self.last_health_check and 
            current_time - self.last_health_check < self.cache_ttl):
            return self.cached_component_status
        
        # Perform health checks for all components
        components = {}
        
        try:
            # Run health checks concurrently for better performance
            websocket_task = asyncio.create_task(self.check_websocket_health())
            cache_task = asyncio.create_task(self.check_cache_health())
            model_task = asyncio.create_task(self.check_model_inference_health())
            
            # Wait for all health checks with timeout
            websocket_health, cache_health, model_health = await asyncio.wait_for(
                asyncio.gather(websocket_task, cache_task, model_task),
                timeout=5.0
            )
            
            components = {
                "websocket": websocket_health,
                "cache": cache_health,
                "model_inference": model_health
            }
            
        except asyncio.TimeoutError:
            # If health checks timeout, mark components as degraded
            components = {
                "websocket": ComponentHealth(
                    status="degraded",
                    details={"error": "Health check timeout"}
                ),
                "cache": ComponentHealth(
                    status="degraded", 
                    details={"error": "Health check timeout"}
                ),
                "model_inference": ComponentHealth(
                    status="degraded",
                    details={"error": "Health check timeout"}
                )
            }
        except Exception as e:
            # Fallback for unexpected errors
            components = {
                "websocket": ComponentHealth(status="unknown"),
                "cache": ComponentHealth(status="unknown"),
                "model_inference": ComponentHealth(status="unknown")
            }
        
        # Update cache
        self.cached_component_status = components
        self.last_health_check = current_time
        
        return components
    
    def determine_overall_status(self, components: Dict[str, ComponentHealth]) -> HealthStatus:
        """Determine overall system health based on component statuses"""
        if not components:
            return "ok"  # No components to check
        
        down_count = sum(1 for comp in components.values() if comp.status == "down")
        degraded_count = sum(1 for comp in components.values() if comp.status == "degraded")
        
        # If any component is down, system is unhealthy
        if down_count > 0:
            return "unhealthy"
        
        # If any component is degraded, system is degraded
        if degraded_count > 0:
            return "degraded"
        
        # All components are up or unknown
        return "ok"
    
    def get_build_info(self) -> Dict[str, str]:
        """Get build and version information"""
        import os
        
        build_info = {
            "version": "1.0.0",
            "environment": os.getenv("ENVIRONMENT", "development")
        }
        
        # Add git commit hash if available from environment
        git_commit = os.getenv("GIT_COMMIT_HASH")
        if git_commit:
            build_info["git_commit"] = git_commit[:8]  # Short hash
        
        return build_info
    
    async def compute_health(self) -> HealthStatusResponse:
        """Compute comprehensive system health status"""
        components = await self.get_component_statuses()
        overall_status = self.determine_overall_status(components)
        
        return HealthStatusResponse(
            status=overall_status,
            uptime_seconds=self.get_uptime_seconds(),
            version="v2",
            timestamp=datetime.now(timezone.utc).isoformat(),
            components=components,
            build_info=self.get_build_info()
        )


# Global health service instance
health_service = HealthService()


# Convenience function for backward compatibility
async def get_health_status() -> HealthStatusResponse:
    """Get current health status - convenience wrapper"""
    return await health_service.compute_health()


# Legacy compatibility function
def get_simple_health() -> Dict[str, Union[str, bool]]:
    """Simple health check for legacy compatibility"""
    return {
        "status": "ok",
        "uptime_seconds": health_service.get_uptime_seconds(),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }