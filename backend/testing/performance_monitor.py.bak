"""
Real-time Performance Monitoring System
Monitors unified architecture performance and generates insights
"""

import asyncio
import time
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any
import psutil
import os

logger = logging.getLogger(__name__)

class RealTimePerformanceMonitor:
    """Real-time performance monitoring for unified architecture"""
    
    def __init__(self, monitoring_interval: int = 5):
        self.monitoring_interval = monitoring_interval
        self.metrics_history = []
        self.alerts = []
        self.is_monitoring = False
        self.process = psutil.Process()
        
    async def start_monitoring(self, duration_minutes: int = 30):
        """Start real-time performance monitoring"""
        logger.info(f"🔍 Starting performance monitoring for {duration_minutes} minutes...")
        
        self.is_monitoring = True
        start_time = time.time()
        end_time = start_time + (duration_minutes * 60)
        
        while self.is_monitoring and time.time() < end_time:
            try:
                metrics = await self._collect_metrics()
                self.metrics_history.append(metrics)
                
                # Check for performance alerts
                await self._check_alerts(metrics)
                
                # Log current metrics
                self._log_current_metrics(metrics)
                
                await asyncio.sleep(self.monitoring_interval)
                
            except Exception as e:
                logger.error(f"Error during monitoring: {e}")
                await asyncio.sleep(self.monitoring_interval)
        
        self.is_monitoring = False
        return await self._generate_monitoring_report()
    
    async def _collect_metrics(self) -> Dict[str, Any]:
        """Collect comprehensive system metrics"""
        timestamp = time.time()
        
        # System metrics
        try:
            memory_info = self.process.memory_info()
            cpu_percent = self.process.cpu_percent()
            
            system_memory = psutil.virtual_memory()
            system_cpu = psutil.cpu_percent(interval=1)
            disk_usage = psutil.disk_usage('/')
            
        except Exception as e:
            logger.warning(f"Failed to collect system metrics: {e}")
            memory_info = None
            cpu_percent = 0
            system_memory = None
            system_cpu = 0
            disk_usage = None
        
        # Database metrics (mock for now)
        database_metrics = await self._get_database_metrics()
        
        # Cache metrics
        cache_metrics = await self._get_cache_metrics()
        
        # API metrics (mock for now)
        api_metrics = await self._get_api_metrics()
        
        return {
            "timestamp": timestamp,
            "datetime": datetime.fromtimestamp(timestamp).isoformat(),
            "process_metrics": {
                "memory_rss_mb": memory_info.rss / 1024 / 1024 if memory_info else 0,
                "memory_vms_mb": memory_info.vms / 1024 / 1024 if memory_info else 0,
                "cpu_percent": cpu_percent
            },
            "system_metrics": {
                "memory_total_gb": system_memory.total / 1024 / 1024 / 1024 if system_memory else 0,
                "memory_used_gb": system_memory.used / 1024 / 1024 / 1024 if system_memory else 0,
                "memory_percent": system_memory.percent if system_memory else 0,
                "cpu_percent": system_cpu,
                "disk_used_gb": disk_usage.used / 1024 / 1024 / 1024 if disk_usage else 0,
                "disk_free_gb": disk_usage.free / 1024 / 1024 / 1024 if disk_usage else 0,
                "disk_percent": (disk_usage.used / disk_usage.total * 100) if disk_usage else 0
            },
            "database_metrics": database_metrics,
            "cache_metrics": cache_metrics,
            "api_metrics": api_metrics
        }
    
    async def _get_database_metrics(self) -> Dict[str, Any]:
        """Get database performance metrics"""
        try:
            # Mock database metrics - in real implementation would query actual DB
            return {
                "active_connections": 5,
                "total_connections": 20,
                "queries_per_second": 15.5,
                "avg_query_time_ms": 25.3,
                "cache_hit_ratio": 0.85,
                "status": "healthy"
            }
        except Exception as e:
            logger.warning(f"Failed to get database metrics: {e}")
            return {"status": "error", "error": str(e)}
    
    async def _get_cache_metrics(self) -> Dict[str, Any]:
        """Get cache performance metrics"""
        try:
            from domains.database import cache_service
            return await cache_service.get_stats()
        except Exception as e:
            logger.warning(f"Failed to get cache metrics: {e}")
            return {"status": "error", "error": str(e)}
    
    async def _get_api_metrics(self) -> Dict[str, Any]:
        """Get API performance metrics"""
        try:
            # Mock API metrics - in real implementation would track actual requests
            return {
                "requests_per_minute": 45.2,
                "avg_response_time_ms": 85.6,
                "p95_response_time_ms": 150.3,
                "error_rate_percent": 0.5,
                "active_users": 25,
                "status": "healthy"
            }
        except Exception as e:
            logger.warning(f"Failed to get API metrics: {e}")
            return {"status": "error", "error": str(e)}
    
    async def _check_alerts(self, metrics: Dict[str, Any]):
        """Check metrics against alert thresholds"""
        alerts = []
        
        # Memory alerts
        memory_percent = metrics["system_metrics"]["memory_percent"]
        if memory_percent > 90:
            alerts.append({
                "level": "critical",
                "type": "memory",
                "message": f"High memory usage: {memory_percent:.1f}%",
                "timestamp": metrics["timestamp"]
            })
        elif memory_percent > 80:
            alerts.append({
                "level": "warning",
                "type": "memory",
                "message": f"Elevated memory usage: {memory_percent:.1f}%",
                "timestamp": metrics["timestamp"]
            })
        
        # CPU alerts
        cpu_percent = metrics["system_metrics"]["cpu_percent"]
        if cpu_percent > 90:
            alerts.append({
                "level": "critical",
                "type": "cpu",
                "message": f"High CPU usage: {cpu_percent:.1f}%",
                "timestamp": metrics["timestamp"]
            })
        elif cpu_percent > 80:
            alerts.append({
                "level": "warning",
                "type": "cpu",
                "message": f"Elevated CPU usage: {cpu_percent:.1f}%",
                "timestamp": metrics["timestamp"]
            })
        
        # API response time alerts
        api_metrics = metrics["api_metrics"]
        if isinstance(api_metrics, dict) and "avg_response_time_ms" in api_metrics:
            response_time = api_metrics["avg_response_time_ms"]
            if response_time > 500:
                alerts.append({
                    "level": "critical",
                    "type": "api_performance",
                    "message": f"Slow API responses: {response_time:.1f}ms",
                    "timestamp": metrics["timestamp"]
                })
            elif response_time > 200:
                alerts.append({
                    "level": "warning",
                    "type": "api_performance",
                    "message": f"Elevated API response time: {response_time:.1f}ms",
                    "timestamp": metrics["timestamp"]
                })
        
        # Error rate alerts
        if isinstance(api_metrics, dict) and "error_rate_percent" in api_metrics:
            error_rate = api_metrics["error_rate_percent"]
            if error_rate > 5:
                alerts.append({
                    "level": "critical",
                    "type": "error_rate",
                    "message": f"High error rate: {error_rate:.1f}%",
                    "timestamp": metrics["timestamp"]
                })
            elif error_rate > 2:
                alerts.append({
                    "level": "warning",
                    "type": "error_rate",
                    "message": f"Elevated error rate: {error_rate:.1f}%",
                    "timestamp": metrics["timestamp"]
                })
        
        # Cache hit rate alerts
        cache_metrics = metrics["cache_metrics"]
        if isinstance(cache_metrics, dict) and "hit_rate_percent" in cache_metrics:
            hit_rate = cache_metrics["hit_rate_percent"]
            if hit_rate < 70:
                alerts.append({
                    "level": "warning",
                    "type": "cache_performance",
                    "message": f"Low cache hit rate: {hit_rate:.1f}%",
                    "timestamp": metrics["timestamp"]
                })
        
        # Add alerts to history
        self.alerts.extend(alerts)
        
        # Log critical alerts immediately
        for alert in alerts:
            if alert["level"] == "critical":
                logger.error(f"🚨 CRITICAL ALERT: {alert['message']}")
            elif alert["level"] == "warning":
                logger.warning(f"⚠️  WARNING: {alert['message']}")
    
    def _log_current_metrics(self, metrics: Dict[str, Any]):
        """Log current performance metrics"""
        process_metrics = metrics["process_metrics"]
        system_metrics = metrics["system_metrics"]
        api_metrics = metrics["api_metrics"]
        
        logger.info(
            f"📊 Performance: "
            f"Memory: {system_metrics['memory_percent']:.1f}% | "
            f"CPU: {system_metrics['cpu_percent']:.1f}% | "
            f"API: {api_metrics.get('avg_response_time_ms', 0):.1f}ms | "
            f"Requests/min: {api_metrics.get('requests_per_minute', 0):.1f}"
        )
    
    async def _generate_monitoring_report(self) -> Dict[str, Any]:
        """Generate comprehensive monitoring report"""
        if not self.metrics_history:
            return {"error": "No metrics collected"}
        
        # Calculate statistics
        report = {
            "monitoring_summary": {
                "start_time": self.metrics_history[0]["datetime"],
                "end_time": self.metrics_history[-1]["datetime"],
                "duration_minutes": (self.metrics_history[-1]["timestamp"] - self.metrics_history[0]["timestamp"]) / 60,
                "total_data_points": len(self.metrics_history),
                "monitoring_interval_seconds": self.monitoring_interval
            },
            "performance_statistics": self._calculate_performance_statistics(),
            "alerts_summary": self._summarize_alerts(),
            "recommendations": self._generate_recommendations(),
            "architecture_health": self._assess_architecture_health()
        }
        
        # Save report
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        report_file = f"backend/testing/monitoring_report_{timestamp}.json"
        
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        logger.info(f"📋 Monitoring report saved to: {report_file}")
        
        return report
    
    def _calculate_performance_statistics(self) -> Dict[str, Any]:
        """Calculate performance statistics from metrics history"""
        if not self.metrics_history:
            return {}
        
        # Extract time series data
        memory_usage = [m["system_metrics"]["memory_percent"] for m in self.metrics_history]
        cpu_usage = [m["system_metrics"]["cpu_percent"] for m in self.metrics_history]
        api_response_times = [m["api_metrics"].get("avg_response_time_ms", 0) for m in self.metrics_history if isinstance(m["api_metrics"], dict)]
        
        import statistics
        
        return {
            "memory_statistics": {
                "avg_percent": statistics.mean(memory_usage) if memory_usage else 0,
                "max_percent": max(memory_usage) if memory_usage else 0,
                "min_percent": min(memory_usage) if memory_usage else 0,
                "std_dev": statistics.stdev(memory_usage) if len(memory_usage) > 1 else 0
            },
            "cpu_statistics": {
                "avg_percent": statistics.mean(cpu_usage) if cpu_usage else 0,
                "max_percent": max(cpu_usage) if cpu_usage else 0,
                "min_percent": min(cpu_usage) if cpu_usage else 0,
                "std_dev": statistics.stdev(cpu_usage) if len(cpu_usage) > 1 else 0
            },
            "api_performance": {
                "avg_response_time_ms": statistics.mean(api_response_times) if api_response_times else 0,
                "max_response_time_ms": max(api_response_times) if api_response_times else 0,
                "min_response_time_ms": min(api_response_times) if api_response_times else 0,
                "std_dev_ms": statistics.stdev(api_response_times) if len(api_response_times) > 1 else 0
            }
        }
    
    def _summarize_alerts(self) -> Dict[str, Any]:
        """Summarize alerts generated during monitoring"""
        if not self.alerts:
            return {"total_alerts": 0, "message": "No alerts generated - excellent performance!"}
        
        alert_counts = {
            "critical": len([a for a in self.alerts if a["level"] == "critical"]),
            "warning": len([a for a in self.alerts if a["level"] == "warning"])
        }
        
        alert_types = {}
        for alert in self.alerts:
            alert_type = alert["type"]
            if alert_type not in alert_types:
                alert_types[alert_type] = {"critical": 0, "warning": 0}
            alert_types[alert_type][alert["level"]] += 1
        
        return {
            "total_alerts": len(self.alerts),
            "alert_counts": alert_counts,
            "alert_types": alert_types,
            "recent_alerts": self.alerts[-10:] if len(self.alerts) > 10 else self.alerts
        }
    
    def _generate_recommendations(self) -> List[str]:
        """Generate performance optimization recommendations"""
        recommendations = []
        
        if not self.metrics_history:
            return ["No metrics available for analysis"]
        
        # Analyze memory usage
        memory_usage = [m["system_metrics"]["memory_percent"] for m in self.metrics_history]
        avg_memory = sum(memory_usage) / len(memory_usage)
        
        if avg_memory > 80:
            recommendations.append("Consider increasing available memory or optimizing memory usage")
        elif avg_memory > 60:
            recommendations.append("Monitor memory usage trends for capacity planning")
        
        # Analyze CPU usage
        cpu_usage = [m["system_metrics"]["cpu_percent"] for m in self.metrics_history]
        avg_cpu = sum(cpu_usage) / len(cpu_usage)
        
        if avg_cpu > 70:
            recommendations.append("Consider CPU optimization or scaling to handle load")
        elif avg_cpu < 20:
            recommendations.append("System is well-provisioned for current load")
        
        # Analyze API performance
        api_response_times = [m["api_metrics"].get("avg_response_time_ms", 0) for m in self.metrics_history if isinstance(m["api_metrics"], dict)]
        if api_response_times:
            avg_response_time = sum(api_response_times) / len(api_response_times)
            
            if avg_response_time > 200:
                recommendations.append("API response times could be optimized - consider caching, database indexing, or code optimization")
            elif avg_response_time < 100:
                recommendations.append("Excellent API performance - well optimized")
        
        # Cache performance
        cache_hit_rates = [m["cache_metrics"].get("hit_rate_percent", 0) for m in self.metrics_history if isinstance(m["cache_metrics"], dict)]
        if cache_hit_rates:
            avg_hit_rate = sum(cache_hit_rates) / len(cache_hit_rates)
            
            if avg_hit_rate < 80:
                recommendations.append("Cache hit rate could be improved - review caching strategy and TTL settings")
            elif avg_hit_rate > 95:
                recommendations.append("Excellent cache performance")
        
        if not recommendations:
            recommendations.append("System is performing well across all metrics")
        
        return recommendations
    
    def _assess_architecture_health(self) -> Dict[str, Any]:
        """Assess overall health of the unified architecture"""
        if not self.metrics_history:
            return {"status": "unknown", "message": "No metrics available"}
        
        health_score = 100
        health_factors = []
        
        # Check average performance metrics
        memory_usage = [m["system_metrics"]["memory_percent"] for m in self.metrics_history]
        cpu_usage = [m["system_metrics"]["cpu_percent"] for m in self.metrics_history]
        api_response_times = [m["api_metrics"].get("avg_response_time_ms", 0) for m in self.metrics_history if isinstance(m["api_metrics"], dict)]
        
        avg_memory = sum(memory_usage) / len(memory_usage) if memory_usage else 0
        avg_cpu = sum(cpu_usage) / len(cpu_usage) if cpu_usage else 0
        avg_response_time = sum(api_response_times) / len(api_response_times) if api_response_times else 0
        
        # Memory health
        if avg_memory > 90:
            health_score -= 30
            health_factors.append("High memory usage")
        elif avg_memory > 80:
            health_score -= 15
            health_factors.append("Elevated memory usage")
        
        # CPU health
        if avg_cpu > 90:
            health_score -= 25
            health_factors.append("High CPU usage")
        elif avg_cpu > 80:
            health_score -= 10
            health_factors.append("Elevated CPU usage")
        
        # API performance health
        if avg_response_time > 500:
            health_score -= 25
            health_factors.append("Slow API response times")
        elif avg_response_time > 200:
            health_score -= 10
            health_factors.append("Elevated API response times")
        
        # Alert count impact
        critical_alerts = len([a for a in self.alerts if a["level"] == "critical"])
        warning_alerts = len([a for a in self.alerts if a["level"] == "warning"])
        
        health_score -= (critical_alerts * 15)
        health_score -= (warning_alerts * 5)
        
        if critical_alerts > 0:
            health_factors.append(f"{critical_alerts} critical alerts")
        if warning_alerts > 0:
            health_factors.append(f"{warning_alerts} warning alerts")
        
        # Determine health status
        health_score = max(0, health_score)
        
        if health_score >= 90:
            status = "excellent"
        elif health_score >= 80:
            status = "good"
        elif health_score >= 70:
            status = "fair"
        elif health_score >= 50:
            status = "poor"
        else:
            status = "critical"
        
        return {
            "status": status,
            "health_score": health_score,
            "health_factors": health_factors if health_factors else ["System performing optimally"],
            "architecture_metrics": {
                "avg_memory_usage_percent": avg_memory,
                "avg_cpu_usage_percent": avg_cpu,
                "avg_api_response_time_ms": avg_response_time,
                "total_alerts": len(self.alerts),
                "monitoring_duration_minutes": (self.metrics_history[-1]["timestamp"] - self.metrics_history[0]["timestamp"]) / 60
            }
        }

async def run_performance_monitoring(duration_minutes: int = 10):
    """Run performance monitoring for specified duration"""
    monitor = RealTimePerformanceMonitor()
    
    print(f"🔍 Starting {duration_minutes}-minute performance monitoring...")
    print("Monitoring unified architecture performance in real-time...")
    print("=" * 60)
    
    try:
        report = await monitor.start_monitoring(duration_minutes)
        
        print("\n" + "=" * 60)
        print("PERFORMANCE MONITORING COMPLETE")
        print("=" * 60)
        
        # Print summary
        health = report["architecture_health"]
        stats = report["performance_statistics"]
        alerts = report["alerts_summary"]
        
        print(f"🏥 System Health: {health['status'].upper()} (Score: {health['health_score']}/100)")
        print(f"📊 Average Memory Usage: {health['architecture_metrics']['avg_memory_usage_percent']:.1f}%")
        print(f"⚡ Average CPU Usage: {health['architecture_metrics']['avg_cpu_usage_percent']:.1f}%")
        print(f"🚀 Average API Response Time: {health['architecture_metrics']['avg_api_response_time_ms']:.1f}ms")
        print(f"🚨 Total Alerts: {alerts['total_alerts']} ({alerts['alert_counts'].get('critical', 0)} critical, {alerts['alert_counts'].get('warning', 0)} warnings)")
        
        # Print recommendations
        print("\n📋 RECOMMENDATIONS:")
        for i, rec in enumerate(report["recommendations"], 1):
            print(f"  {i}. {rec}")
        
        return report
        
    except Exception as e:
        print(f"❌ Monitoring failed: {e}")
        return {"status": "failed", "error": str(e)}

if __name__ == "__main__":
    # Run 10-minute performance monitoring
    results = asyncio.run(run_performance_monitoring(10))
    
    if results.get("status") != "failed":
        print("\n✅ Performance monitoring completed successfully!")
    else:
        print("\n❌ Performance monitoring failed!")
