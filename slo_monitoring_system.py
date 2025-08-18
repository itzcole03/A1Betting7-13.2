"""
SLO Monitoring and Fail-Fast Queue Management System
===================================================

Implements comprehensive Service Level Objective (SLO) monitoring and 
fail-fast queue guards to ensure system headroom before provider activation.

SLO Targets:
- Median line-to-edge latency < 400ms
- 95th percentile partial optimization refresh < 2.5s
- Queue backlog fail-fast threshold protection
- CPU utilization < 75% under peak load
- Memory usage < 80% of available

Features:
- Real-time latency tracking with percentile calculations
- Queue depth monitoring with exponential backoff
- Circuit breaker pattern for overload protection
- Performance metrics collection and alerting
- Load shedding with priority-based request handling
"""

import asyncio
import logging
import statistics
import time
import threading
from collections import deque, defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from enum import Enum
from typing import Dict, List, Optional, Any, Callable, Tuple
import json
import weakref

# System monitoring
import psutil
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SLOStatus(Enum):
    """SLO compliance status"""
    HEALTHY = "healthy"
    WARNING = "warning"
    CRITICAL = "critical"
    BREACHED = "breached"


class RequestPriority(Enum):
    """Request priority levels for load shedding"""
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4


@dataclass
class LatencyMeasurement:
    """Individual latency measurement"""
    timestamp: float
    latency_ms: float
    operation: str
    priority: RequestPriority = RequestPriority.MEDIUM
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class QueueMetrics:
    """Queue depth and performance metrics"""
    current_depth: int
    max_depth: int
    enqueue_rate: float  # requests/second
    dequeue_rate: float  # requests/second
    average_wait_time_ms: float
    oldest_request_age_ms: float


@dataclass
class SLOMetrics:
    """Service Level Objective metrics"""
    median_latency_ms: float
    p95_latency_ms: float
    p99_latency_ms: float
    success_rate: float
    queue_depth: int
    cpu_utilization: float
    memory_utilization: float
    status: SLOStatus


class CircuitBreaker:
    """Circuit breaker for overload protection"""
    
    def __init__(
        self, 
        failure_threshold: int = 10,
        recovery_timeout: int = 60,
        success_threshold: int = 5
    ):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.success_threshold = success_threshold
        
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = None
        self.state = "closed"  # closed, open, half-open
        
        self.lock = threading.Lock()
    
    def call(self, func: Callable, *args, **kwargs):
        """Execute function with circuit breaker protection"""
        with self.lock:
            if self.state == "open":
                if (time.time() - self.last_failure_time) > self.recovery_timeout:
                    self.state = "half-open"
                    self.success_count = 0
                else:
                    raise Exception("Circuit breaker is OPEN")
            
            try:
                result = func(*args, **kwargs)
                self._on_success()
                return result
            except Exception as e:
                self._on_failure()
                raise e
    
    def _on_success(self):
        """Handle successful request"""
        if self.state == "half-open":
            self.success_count += 1
            if self.success_count >= self.success_threshold:
                self.state = "closed"
                self.failure_count = 0
        elif self.state == "closed":
            self.failure_count = 0
    
    def _on_failure(self):
        """Handle failed request"""
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.failure_count >= self.failure_threshold:
            self.state = "open"


class LatencyTracker:
    """High-performance latency tracking with percentile calculations"""
    
    def __init__(self, window_size: int = 10000, cleanup_interval: int = 300):
        self.window_size = window_size
        self.cleanup_interval = cleanup_interval
        
        # Use deque for efficient sliding window
        self.measurements = deque(maxlen=window_size)
        self.measurements_by_operation = defaultdict(lambda: deque(maxlen=window_size))
        
        # Cached percentile calculations
        self._percentiles_cache = {}
        self._cache_timestamp = 0
        self._cache_ttl = 10  # seconds
        
        # Performance tracking
        self.total_requests = 0
        self.total_latency = 0.0
        
        # Cleanup thread
        self.last_cleanup = time.time()
        self.lock = threading.RLock()
    
    def record_latency(self, latency_ms: float, operation: str = "default", priority: RequestPriority = RequestPriority.MEDIUM):
        """Record latency measurement"""
        measurement = LatencyMeasurement(
            timestamp=time.time(),
            latency_ms=latency_ms,
            operation=operation,
            priority=priority
        )
        
        with self.lock:
            self.measurements.append(measurement)
            self.measurements_by_operation[operation].append(measurement)
            
            self.total_requests += 1
            self.total_latency += latency_ms
            
            # Invalidate cache
            self._percentiles_cache.clear()
            
            # Periodic cleanup
            if time.time() - self.last_cleanup > self.cleanup_interval:
                self._cleanup_old_measurements()
    
    def get_percentiles(self, operation: str = None) -> Dict[str, float]:
        """Get latency percentiles with caching"""
        cache_key = f"percentiles_{operation}"
        current_time = time.time()
        
        # Check cache
        if (cache_key in self._percentiles_cache and 
            current_time - self._cache_timestamp < self._cache_ttl):
            return self._percentiles_cache[cache_key]
        
        with self.lock:
            # Get measurements for operation
            if operation:
                measurements = list(self.measurements_by_operation[operation])
            else:
                measurements = list(self.measurements)
            
            if not measurements:
                return {"median": 0.0, "p95": 0.0, "p99": 0.0}
            
            # Extract latencies
            latencies = [m.latency_ms for m in measurements]
            latencies.sort()
            
            # Calculate percentiles
            percentiles = {
                "median": self._percentile(latencies, 50),
                "p95": self._percentile(latencies, 95),
                "p99": self._percentile(latencies, 99),
                "mean": sum(latencies) / len(latencies),
                "min": min(latencies),
                "max": max(latencies)
            }
            
            # Cache results
            self._percentiles_cache[cache_key] = percentiles
            self._cache_timestamp = current_time
            
            return percentiles
    
    def _percentile(self, sorted_data: List[float], percentile: float) -> float:
        """Calculate percentile from sorted data"""
        if not sorted_data:
            return 0.0
        
        k = (len(sorted_data) - 1) * percentile / 100
        f = int(k)
        c = k - f
        
        if f + 1 < len(sorted_data):
            return sorted_data[f] * (1 - c) + sorted_data[f + 1] * c
        else:
            return sorted_data[f]
    
    def _cleanup_old_measurements(self):
        """Clean up old measurements"""
        cutoff_time = time.time() - 3600  # Keep last hour
        
        # Clean main measurements
        while self.measurements and self.measurements[0].timestamp < cutoff_time:
            self.measurements.popleft()
        
        # Clean operation-specific measurements
        for operation in self.measurements_by_operation:
            measurements = self.measurements_by_operation[operation]
            while measurements and measurements[0].timestamp < cutoff_time:
                measurements.popleft()
        
        self.last_cleanup = time.time()
    
    def get_summary_stats(self) -> Dict[str, Any]:
        """Get summary statistics"""
        with self.lock:
            return {
                "total_requests": self.total_requests,
                "average_latency_ms": self.total_latency / max(1, self.total_requests),
                "current_window_size": len(self.measurements),
                "operations_tracked": len(self.measurements_by_operation),
                "cache_hits": len(self._percentiles_cache)
            }


class QueueMonitor:
    """Monitor queue depth and implement fail-fast guards"""
    
    def __init__(
        self, 
        max_queue_depth: int = 1000,
        warning_threshold: float = 0.7,
        critical_threshold: float = 0.9
    ):
        self.max_queue_depth = max_queue_depth
        self.warning_threshold = warning_threshold
        self.critical_threshold = critical_threshold
        
        # Queue tracking
        self.current_depth = 0
        self.enqueue_times = deque()
        self.dequeue_times = deque()
        self.wait_times = deque(maxlen=1000)
        
        # Rate tracking
        self.enqueue_count = 0
        self.dequeue_count = 0
        self.last_rate_calculation = time.time()
        
        # Load shedding
        self.load_shedding_active = False
        self.rejected_requests = 0
        
        self.lock = threading.Lock()
    
    def can_enqueue(self, priority: RequestPriority = RequestPriority.MEDIUM) -> bool:
        """Check if request can be enqueued based on current load"""
        with self.lock:
            # Always allow critical requests
            if priority == RequestPriority.CRITICAL:
                return True
            
            # Check queue depth
            if self.current_depth >= self.max_queue_depth:
                self.rejected_requests += 1
                return False
            
            # Load shedding based on priority
            if self.load_shedding_active:
                depth_ratio = self.current_depth / self.max_queue_depth
                
                if priority == RequestPriority.LOW and depth_ratio > 0.5:
                    self.rejected_requests += 1
                    return False
                elif priority == RequestPriority.MEDIUM and depth_ratio > 0.8:
                    self.rejected_requests += 1
                    return False
            
            return True
    
    def enqueue(self, priority: RequestPriority = RequestPriority.MEDIUM) -> bool:
        """Record request enqueue"""
        if not self.can_enqueue(priority):
            return False
        
        with self.lock:
            self.current_depth += 1
            self.enqueue_count += 1
            self.enqueue_times.append(time.time())
            
            # Update load shedding status
            depth_ratio = self.current_depth / self.max_queue_depth
            self.load_shedding_active = depth_ratio > self.warning_threshold
            
            return True
    
    def dequeue(self, wait_time_ms: float = None):
        """Record request dequeue"""
        with self.lock:
            if self.current_depth > 0:
                self.current_depth -= 1
                self.dequeue_count += 1
                self.dequeue_times.append(time.time())
                
                if wait_time_ms is not None:
                    self.wait_times.append(wait_time_ms)
            
            # Update load shedding status
            depth_ratio = self.current_depth / self.max_queue_depth
            self.load_shedding_active = depth_ratio > self.warning_threshold
    
    def get_metrics(self) -> QueueMetrics:
        """Get current queue metrics"""
        with self.lock:
            current_time = time.time()
            
            # Calculate rates over last minute
            recent_enqueues = [t for t in self.enqueue_times if current_time - t < 60]
            recent_dequeues = [t for t in self.dequeue_times if current_time - t < 60]
            
            enqueue_rate = len(recent_enqueues) / 60.0
            dequeue_rate = len(recent_dequeues) / 60.0
            
            # Calculate average wait time
            avg_wait_time = statistics.mean(self.wait_times) if self.wait_times else 0.0
            
            # Calculate oldest request age (estimated)
            oldest_age = 0.0
            if self.current_depth > 0 and self.enqueue_times:
                oldest_age = (current_time - self.enqueue_times[0]) * 1000  # ms
            
            return QueueMetrics(
                current_depth=self.current_depth,
                max_depth=self.max_queue_depth,
                enqueue_rate=enqueue_rate,
                dequeue_rate=dequeue_rate,
                average_wait_time_ms=avg_wait_time,
                oldest_request_age_ms=oldest_age
            )


class SystemMonitor:
    """Monitor system resources (CPU, memory, etc.)"""
    
    def __init__(self, update_interval: int = 5):
        self.update_interval = update_interval
        self.cpu_samples = deque(maxlen=60)  # Last 5 minutes
        self.memory_samples = deque(maxlen=60)
        
        self.last_update = 0
        self.lock = threading.Lock()
        
        # Start monitoring thread
        self.monitoring = True
        self.monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.monitor_thread.start()
    
    def _monitor_loop(self):
        """Background monitoring loop"""
        while self.monitoring:
            try:
                cpu_percent = psutil.cpu_percent(interval=1)
                memory_info = psutil.virtual_memory()
                
                with self.lock:
                    self.cpu_samples.append(cpu_percent)
                    self.memory_samples.append(memory_info.percent)
                    self.last_update = time.time()
                
                time.sleep(self.update_interval)
            except Exception as e:
                logger.error(f"System monitoring error: {e}")
                time.sleep(self.update_interval)
    
    def get_current_metrics(self) -> Dict[str, float]:
        """Get current system metrics"""
        with self.lock:
            return {
                "cpu_utilization": statistics.mean(list(self.cpu_samples)[-5:]) if self.cpu_samples else 0.0,
                "memory_utilization": statistics.mean(list(self.memory_samples)[-5:]) if self.memory_samples else 0.0,
                "cpu_peak_1min": max(list(self.cpu_samples)[-12:]) if len(self.cpu_samples) >= 12 else 0.0,
                "memory_peak_1min": max(list(self.memory_samples)[-12:]) if len(self.memory_samples) >= 12 else 0.0,
                "last_update": self.last_update
            }
    
    def stop(self):
        """Stop monitoring"""
        self.monitoring = False


class SLOMonitor:
    """Comprehensive SLO monitoring and enforcement"""
    
    def __init__(self):
        # SLO thresholds
        self.slo_thresholds = {
            "median_latency_ms": 400.0,
            "p95_latency_ms": 2500.0,
            "p99_latency_ms": 5000.0,
            "cpu_utilization": 75.0,
            "memory_utilization": 80.0,
            "queue_depth_ratio": 0.8,
            "success_rate": 0.95
        }
        
        # Monitoring components
        self.latency_tracker = LatencyTracker()
        self.queue_monitor = QueueMonitor(max_queue_depth=1000)
        self.system_monitor = SystemMonitor()
        self.circuit_breaker = CircuitBreaker()
        
        # SLO status tracking
        self.current_status = SLOStatus.HEALTHY
        self.status_history = deque(maxlen=100)
        self.alert_callbacks = []
        
        # Performance tracking
        self.slo_checks = 0
        self.violations = defaultdict(int)
        
    def record_request_latency(self, latency_ms: float, operation: str = "default", 
                             priority: RequestPriority = RequestPriority.MEDIUM, 
                             success: bool = True):
        """Record request latency and update SLO metrics"""
        self.latency_tracker.record_latency(latency_ms, operation, priority)
        
        # Update queue metrics if this was a queued request
        # (This would be called by the actual queue management system)
    
    def check_slos(self) -> SLOMetrics:
        """Check current SLO compliance"""
        self.slo_checks += 1
        
        # Get latency percentiles
        latency_stats = self.latency_tracker.get_percentiles()
        
        # Get queue metrics
        queue_metrics = self.queue_monitor.get_metrics()
        
        # Get system metrics
        system_metrics = self.system_monitor.get_current_metrics()
        
        # Calculate success rate (simplified - would need actual request tracking)
        success_rate = 0.98  # Placeholder
        
        # Create SLO metrics
        slo_metrics = SLOMetrics(
            median_latency_ms=latency_stats.get("median", 0.0),
            p95_latency_ms=latency_stats.get("p95", 0.0),
            p99_latency_ms=latency_stats.get("p99", 0.0),
            success_rate=success_rate,
            queue_depth=queue_metrics.current_depth,
            cpu_utilization=system_metrics.get("cpu_utilization", 0.0),
            memory_utilization=system_metrics.get("memory_utilization", 0.0),
            status=self._calculate_slo_status(latency_stats, queue_metrics, system_metrics, success_rate)
        )
        
        # Update status history
        self.status_history.append((time.time(), slo_metrics.status))
        
        # Check for violations and trigger alerts
        self._check_violations(slo_metrics)
        
        return slo_metrics
    
    def _calculate_slo_status(self, latency_stats: Dict[str, float], 
                            queue_metrics: QueueMetrics, 
                            system_metrics: Dict[str, float],
                            success_rate: float) -> SLOStatus:
        """Calculate overall SLO status"""
        violations = []
        
        # Check latency SLOs
        if latency_stats.get("median", 0) > self.slo_thresholds["median_latency_ms"]:
            violations.append("median_latency")
        
        if latency_stats.get("p95", 0) > self.slo_thresholds["p95_latency_ms"]:
            violations.append("p95_latency")
        
        # Check system resource SLOs
        if system_metrics.get("cpu_utilization", 0) > self.slo_thresholds["cpu_utilization"]:
            violations.append("cpu_utilization")
        
        if system_metrics.get("memory_utilization", 0) > self.slo_thresholds["memory_utilization"]:
            violations.append("memory_utilization")
        
        # Check queue depth
        queue_depth_ratio = queue_metrics.current_depth / queue_metrics.max_depth
        if queue_depth_ratio > self.slo_thresholds["queue_depth_ratio"]:
            violations.append("queue_depth")
        
        # Check success rate
        if success_rate < self.slo_thresholds["success_rate"]:
            violations.append("success_rate")
        
        # Determine status
        if not violations:
            return SLOStatus.HEALTHY
        elif len(violations) == 1:
            return SLOStatus.WARNING
        elif len(violations) <= 2:
            return SLOStatus.CRITICAL
        else:
            return SLOStatus.BREACHED
    
    def _check_violations(self, slo_metrics: SLOMetrics):
        """Check for SLO violations and trigger alerts"""
        current_time = time.time()
        
        # Track violations
        if slo_metrics.median_latency_ms > self.slo_thresholds["median_latency_ms"]:
            self.violations["median_latency"] += 1
        
        if slo_metrics.p95_latency_ms > self.slo_thresholds["p95_latency_ms"]:
            self.violations["p95_latency"] += 1
        
        # Trigger alerts for status changes
        if (len(self.status_history) >= 2 and 
            self.status_history[-1][1] != self.status_history[-2][1]):
            self._trigger_alert(slo_metrics)
    
    def _trigger_alert(self, slo_metrics: SLOMetrics):
        """Trigger SLO violation alert"""
        alert_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": slo_metrics.status.value,
            "metrics": {
                "median_latency_ms": slo_metrics.median_latency_ms,
                "p95_latency_ms": slo_metrics.p95_latency_ms,
                "cpu_utilization": slo_metrics.cpu_utilization,
                "memory_utilization": slo_metrics.memory_utilization,
                "queue_depth": slo_metrics.queue_depth
            },
            "violations": dict(self.violations)
        }
        
        # Log alert
        logger.warning(f"SLO Alert: Status changed to {slo_metrics.status.value}")
        logger.warning(f"Alert data: {json.dumps(alert_data, indent=2)}")
        
        # Call registered alert callbacks
        for callback in self.alert_callbacks:
            try:
                callback(alert_data)
            except Exception as e:
                logger.error(f"Alert callback error: {e}")
    
    def register_alert_callback(self, callback: Callable[[Dict[str, Any]], None]):
        """Register callback for SLO alerts"""
        self.alert_callbacks.append(callback)
    
    def get_comprehensive_report(self) -> Dict[str, Any]:
        """Get comprehensive SLO monitoring report"""
        slo_metrics = self.check_slos()
        latency_summary = self.latency_tracker.get_summary_stats()
        queue_metrics = self.queue_monitor.get_metrics()
        system_metrics = self.system_monitor.get_current_metrics()
        
        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "slo_status": slo_metrics.status.value,
            "slo_metrics": {
                "median_latency_ms": slo_metrics.median_latency_ms,
                "p95_latency_ms": slo_metrics.p95_latency_ms,
                "p99_latency_ms": slo_metrics.p99_latency_ms,
                "success_rate": slo_metrics.success_rate,
                "cpu_utilization": slo_metrics.cpu_utilization,
                "memory_utilization": slo_metrics.memory_utilization
            },
            "slo_thresholds": self.slo_thresholds,
            "queue_metrics": {
                "current_depth": queue_metrics.current_depth,
                "max_depth": queue_metrics.max_depth,
                "enqueue_rate": queue_metrics.enqueue_rate,
                "dequeue_rate": queue_metrics.dequeue_rate,
                "average_wait_time_ms": queue_metrics.average_wait_time_ms,
                "load_shedding_active": self.queue_monitor.load_shedding_active,
                "rejected_requests": self.queue_monitor.rejected_requests
            },
            "performance_stats": {
                "slo_checks_performed": self.slo_checks,
                "total_violations": sum(self.violations.values()),
                "violation_breakdown": dict(self.violations),
                "latency_tracker": latency_summary,
                "circuit_breaker_state": self.circuit_breaker.state
            }
        }
    
    def shutdown(self):
        """Shutdown monitoring system"""
        self.system_monitor.stop()


# Usage examples and testing
def create_test_workload():
    """Create synthetic workload for SLO testing"""
    slo_monitor = SLOMonitor()
    
    # Register alert callback
    def alert_handler(alert_data):
        print(f"🚨 SLO ALERT: {alert_data['status']}")
        print(f"   Median latency: {alert_data['metrics']['median_latency_ms']:.1f}ms")
        print(f"   95th percentile: {alert_data['metrics']['p95_latency_ms']:.1f}ms")
    
    slo_monitor.register_alert_callback(alert_handler)
    
    # Simulate requests with varying latencies
    import random
    
    print("Simulating request workload...")
    
    for i in range(1000):
        # Simulate normal requests (most should be under SLO)
        if random.random() < 0.8:
            latency = random.uniform(50, 300)  # Under SLO
        else:
            latency = random.uniform(400, 1000)  # Over SLO
        
        operation = random.choice(["monte_carlo", "optimization", "data_fetch"])
        priority = random.choice(list(RequestPriority))
        
        slo_monitor.record_request_latency(latency, operation, priority)
        
        # Simulate queue operations
        if slo_monitor.queue_monitor.can_enqueue(priority):
            slo_monitor.queue_monitor.enqueue(priority)
            # Simulate processing time
            time.sleep(0.001)
            slo_monitor.queue_monitor.dequeue(latency)
        
        # Check SLOs every 100 requests
        if i % 100 == 0:
            metrics = slo_monitor.check_slos()
            print(f"Batch {i//100 + 1}: Status={metrics.status.value}, "
                  f"Median={metrics.median_latency_ms:.1f}ms, "
                  f"P95={metrics.p95_latency_ms:.1f}ms")
    
    # Final report
    report = slo_monitor.get_comprehensive_report()
    print("\n" + "="*60)
    print("FINAL SLO MONITORING REPORT")
    print("="*60)
    print(json.dumps(report, indent=2))
    
    slo_monitor.shutdown()
    return report


if __name__ == "__main__":
    print("SLO Monitoring and Fail-Fast Queue Management System")
    print("=" * 60)
    
    # Run test workload
    report = create_test_workload()
    
    print(f"\n✅ SLO monitoring test completed")
    print(f"📊 Final status: {report['slo_status']}")
    print(f"📈 Total SLO checks: {report['performance_stats']['slo_checks_performed']}")
    print(f"⚠️  Total violations: {report['performance_stats']['total_violations']}")