"""
Provider Reliability Integration

Integrates provider resilience monitoring with the main reliability orchestrator,
providing health summaries and anomaly detection for PROVIDER_OUTAGE scenarios.
"""

import asyncio
import time
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone

from .provider_resilience_manager import provider_resilience_manager
from .unified_logging import get_logger

try:
    from .reliability.reliability_orchestrator import ReliabilityOrchestrator
    RELIABILITY_AVAILABLE = True
except ImportError:
    RELIABILITY_AVAILABLE = False
    

logger = get_logger("provider_reliability_integration")


class ProviderReliabilityIntegrator:
    """
    Integrates provider resilience monitoring with the reliability orchestrator.
    Provides health summaries and anomaly detection for provider outages.
    """
    
    def __init__(self):
        self.logger = get_logger("provider_reliability_integrator")
        self.last_health_check = 0
        self.health_check_interval = 30  # 30 seconds between health checks
        self._reliability_orchestrator = None
        
        # Initialize reliability orchestrator if available
        if RELIABILITY_AVAILABLE:
            try:
                self._reliability_orchestrator = ReliabilityOrchestrator()
                self.logger.info("Successfully connected to ReliabilityOrchestrator")
            except Exception as e:
                self.logger.warning(f"Failed to connect to ReliabilityOrchestrator: {e}")
                self._reliability_orchestrator = None
    
    def get_provider_health_summaries(self) -> Dict[str, Any]:
        """
        Get health summaries for all registered providers.
        
        Returns:
            Dict containing provider health data formatted for reliability monitoring
        """
        # Get all provider states from resilience manager
        system_status = provider_resilience_manager.get_system_status()
        providers_data = system_status.get("providers_for_reliability", {})
        
        health_summaries = {}
        overall_status = {
            "healthy_count": 0,
            "degraded_count": 0,
            "outage_count": 0,
            "total_count": len(providers_data)
        }
        
        for provider_id, provider_wrapper in providers_data.items():
            health_summary = provider_wrapper.get("health_summary", {})
            
            if health_summary:
                health_summaries[provider_id] = health_summary
                
                # Update overall status counts
                health_status = health_summary.get("health_status", "unknown")
                if health_status == "healthy":
                    overall_status["healthy_count"] += 1
                elif health_status == "degraded":
                    overall_status["degraded_count"] += 1
                elif health_status == "outage":
                    overall_status["outage_count"] += 1
        
        return {
            "providers": health_summaries,
            "summary": overall_status,
            "timestamp": time.time(),
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
    
    def detect_provider_anomalies(self) -> List[Dict[str, Any]]:
        """
        Detect provider-specific anomalies for reliability monitoring.
        
        Returns:
            List of detected anomalies
        """
        anomalies = []
        health_data = self.get_provider_health_summaries()
        providers = health_data.get("providers", {})
        summary = health_data.get("summary", {})
        
        # Check for provider outages
        if summary.get("outage_count", 0) > 0:
            outage_providers = [
                provider_id for provider_id, health in providers.items()
                if health.get("health_status") == "outage"
            ]
            
            anomalies.append({
                "code": "PROVIDER_OUTAGE",
                "severity": "critical",
                "description": f"Provider outage detected: {len(outage_providers)} provider(s) unavailable",
                "recommendation": "Check provider connectivity and consider failover strategies",
                "detected_at": datetime.now(timezone.utc).isoformat(),
                "context": {
                    "outage_providers": outage_providers,
                    "total_providers": summary.get("total_count", 0),
                    "affected_percentage": (len(outage_providers) / max(summary.get("total_count", 1), 1)) * 100
                }
            })
        
        # Check for widespread degradation
        degraded_count = summary.get("degraded_count", 0)
        total_count = summary.get("total_count", 0)
        
        if total_count > 0 and (degraded_count / total_count) > 0.5:  # More than 50% degraded
            degraded_providers = [
                provider_id for provider_id, health in providers.items()
                if health.get("health_status") == "degraded"
            ]
            
            anomalies.append({
                "code": "PROVIDER_DEGRADED",
                "severity": "warning",
                "description": f"Widespread provider degradation: {degraded_count} of {total_count} providers degraded",
                "recommendation": "Monitor provider performance and check SLA compliance",
                "detected_at": datetime.now(timezone.utc).isoformat(),
                "context": {
                    "degraded_providers": degraded_providers,
                    "degraded_count": degraded_count,
                    "total_count": total_count,
                    "degradation_percentage": (degraded_count / total_count) * 100
                }
            })
        
        # Check for high latency across providers
        high_latency_providers = []
        for provider_id, health in providers.items():
            sla_metrics = health.get("sla_metrics", {})
            p95_latency = sla_metrics.get("p95_latency_ms", 0)
            
            if p95_latency > 3000:  # 3 seconds
                high_latency_providers.append({
                    "provider_id": provider_id,
                    "p95_latency_ms": p95_latency
                })
        
        if len(high_latency_providers) > 0 and total_count > 0:
            high_latency_percentage = (len(high_latency_providers) / total_count) * 100
            
            if high_latency_percentage > 30:  # More than 30% have high latency
                anomalies.append({
                    "code": "HIGH_PROVIDER_LATENCY",
                    "severity": "warning",
                    "description": f"High provider latency detected: {len(high_latency_providers)} providers with p95 > 3s",
                    "recommendation": "Review provider endpoints and network connectivity",
                    "detected_at": datetime.now(timezone.utc).isoformat(),
                    "context": {
                        "high_latency_providers": high_latency_providers,
                        "affected_count": len(high_latency_providers),
                        "total_count": total_count,
                        "max_latency_ms": max([p["p95_latency_ms"] for p in high_latency_providers]) if high_latency_providers else 0
                    }
                })
        
        return anomalies
    
    async def report_to_reliability_orchestrator(self) -> bool:
        """
        Report provider health data to the reliability orchestrator.
        
        Returns:
            True if successfully reported, False otherwise
        """
        if not self._reliability_orchestrator:
            self.logger.debug("Reliability orchestrator not available")
            return False
        
        try:
            # Get provider health data
            health_data = self.get_provider_health_summaries()
            anomalies = self.detect_provider_anomalies()
            
            # Log provider health directly using structured logging
            provider_report = {
                "component": "provider_resilience",
                "timestamp": time.time(),
                "health_data": health_data,
                "anomalies": anomalies,
                "summary": {
                    "total_providers": health_data.get("summary", {}).get("total_count", 0),
                    "healthy_providers": health_data.get("summary", {}).get("healthy_count", 0),
                    "degraded_providers": health_data.get("summary", {}).get("degraded_count", 0),
                    "outage_providers": health_data.get("summary", {}).get("outage_count", 0),
                    "anomaly_count": len(anomalies)
                }
            }
            
            # Log the provider health report
            self.logger.info("Provider reliability report", extra={"provider_reliability": provider_report})
            
            # Log individual anomalies with appropriate severity
            for anomaly in anomalies:
                severity = anomaly.get("severity", "warning")
                if severity == "critical":
                    self.logger.error(f"Provider anomaly: {anomaly.get('code')} - {anomaly.get('description')}", 
                                    extra={"provider_anomaly": anomaly})
                else:
                    self.logger.warning(f"Provider anomaly: {anomaly.get('code')} - {anomaly.get('description')}", 
                                      extra={"provider_anomaly": anomaly})
            
            self.logger.debug(f"Reported provider health data: {len(anomalies)} anomalies")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to report provider health data: {e}")
            return False
    
    async def periodic_health_monitoring(self):
        """
        Periodic health monitoring task that reports to reliability orchestrator.
        """
        while True:
            try:
                current_time = time.time()
                
                if current_time - self.last_health_check >= self.health_check_interval:
                    self.last_health_check = current_time
                    
                    # Report health status
                    await self.report_to_reliability_orchestrator()
                    
                    self.logger.debug("Completed periodic provider health check")
                
                # Sleep for a short interval
                await asyncio.sleep(5)
                
            except Exception as e:
                self.logger.error(f"Error in periodic health monitoring: {e}")
                await asyncio.sleep(30)  # Back off on error
    
    def get_provider_reliability_metrics(self) -> Dict[str, Any]:
        """
        Get comprehensive provider reliability metrics for monitoring dashboard.
        
        Returns:
            Dict containing formatted metrics for display
        """
        health_data = self.get_provider_health_summaries()
        anomalies = self.detect_provider_anomalies()
        
        # Calculate reliability scores
        providers = health_data.get("providers", {})
        provider_scores = {}
        
        for provider_id, health in providers.items():
            sla_metrics = health.get("sla_metrics", {})
            circuit_breaker = health.get("circuit_breaker", {})
            
            # Calculate reliability score (0-100)
            success_percentage = sla_metrics.get("success_percentage", 100)
            p95_latency = sla_metrics.get("p95_latency_ms", 0)
            
            # Latency score (100 for <500ms, 0 for >5000ms)
            latency_score = max(0, min(100, 100 - ((p95_latency - 500) / 45)))
            
            # Circuit breaker penalty
            circuit_penalty = 0
            if circuit_breaker.get("state") == "open":
                circuit_penalty = 50
            elif circuit_breaker.get("state") == "half_open":
                circuit_penalty = 25
            
            # Overall reliability score
            reliability_score = max(0, min(100, 
                (success_percentage * 0.6) +  # 60% weight on success rate
                (latency_score * 0.3) +       # 30% weight on latency
                (10 * 0.1) -                  # 10% base score
                circuit_penalty               # Penalty for circuit breaker issues
            ))
            
            provider_scores[provider_id] = {
                "reliability_score": round(reliability_score, 1),
                "success_percentage": success_percentage,
                "p95_latency_ms": p95_latency,
                "circuit_state": circuit_breaker.get("state", "unknown"),
                "health_status": health.get("health_status", "unknown"),
                "is_available": health.get("is_available", False)
            }
        
        return {
            "provider_scores": provider_scores,
            "system_health": health_data.get("summary", {}),
            "active_anomalies": anomalies,
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "monitoring_status": "active" if self._reliability_orchestrator else "limited"
        }


# Global integrator instance
provider_reliability_integrator = ProviderReliabilityIntegrator()


async def start_provider_reliability_monitoring():
    """Start the provider reliability monitoring background task"""
    task = asyncio.create_task(provider_reliability_integrator.periodic_health_monitoring())
    logger.info("Started provider reliability monitoring background task")
    return task


def get_provider_reliability_status() -> Dict[str, Any]:
    """Convenience function to get current provider reliability status"""
    return provider_reliability_integrator.get_provider_reliability_metrics()


# Export key components
__all__ = [
    "ProviderReliabilityIntegrator",
    "provider_reliability_integrator",
    "start_provider_reliability_monitoring",
    "get_provider_reliability_status",
]