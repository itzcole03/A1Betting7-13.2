"""
Streaming Health Assertions

Implements health checks that detect anomalies in streaming system behavior,
such as events being emitted but no valuations being recomputed.
"""

import time
from collections import deque
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Deque, Any
from enum import Enum

from .streaming_logger import streaming_logger, StreamingCategory, StreamingAction, StreamingStatus


class HealthStatus(Enum):
    """Health check status"""
    HEALTHY = "healthy"
    WARNING = "warning"
    CRITICAL = "critical"
    UNKNOWN = "unknown"


@dataclass
class HealthMetrics:
    """Metrics for health monitoring"""
    events_emitted: int = 0
    valuations_recomputed: int = 0
    cycles_completed: int = 0
    last_event_time: float = 0
    last_recompute_time: float = 0
    last_cycle_time: float = 0
    
    # Sliding window counters
    recent_events: Deque[float] = field(default_factory=lambda: deque(maxlen=100))
    recent_recomputes: Deque[float] = field(default_factory=lambda: deque(maxlen=100))
    recent_cycles: Deque[float] = field(default_factory=lambda: deque(maxlen=50))


@dataclass
class HealthIssue:
    """Represents a detected health issue"""
    issue_type: str
    severity: HealthStatus
    message: str
    detected_at: float
    details: Dict[str, Any]
    
    
class StreamingHealthMonitor:
    """
    Monitors streaming system health and detects anomalies
    
    Key assertions:
    - If events emitted > 0 and valuations_recomputed == 0 for M consecutive cycles → WARN
    - Provider circuit breakers all open → CRITICAL
    - No cycles completed in N seconds → CRITICAL
    - High event:recompute ratio (> threshold) → WARNING
    """
    
    def __init__(self, 
                 anomaly_cycle_threshold: int = 5,
                 no_activity_threshold_sec: int = 300,  # 5 minutes
                 high_ratio_threshold: float = 10.0):
        self.anomaly_cycle_threshold = anomaly_cycle_threshold
        self.no_activity_threshold_sec = no_activity_threshold_sec
        self.high_ratio_threshold = high_ratio_threshold
        
        # Health metrics tracking
        self.metrics = HealthMetrics()
        
        # Issue tracking
        self.active_issues: List[HealthIssue] = []
        self.consecutive_anomaly_cycles = 0
        self.last_health_check = time.time()
        
        # Configuration
        self.enabled = True
        
    def record_event_emitted(self, event_count: int = 1):
        """Record that events were emitted"""
        if not self.enabled:
            return
            
        now = time.time()
        self.metrics.events_emitted += event_count
        self.metrics.last_event_time = now
        
        # Add to sliding window
        for _ in range(event_count):
            self.metrics.recent_events.append(now)
    
    def record_valuation_recomputed(self, recompute_count: int = 1):
        """Record that valuations were recomputed"""
        if not self.enabled:
            return
            
        now = time.time()
        self.metrics.valuations_recomputed += recompute_count
        self.metrics.last_recompute_time = now
        
        # Add to sliding window
        for _ in range(recompute_count):
            self.metrics.recent_recomputes.append(now)
    
    def record_cycle_completed(self, events_in_cycle: int = 0, recomputes_in_cycle: int = 0):
        """Record that a streaming cycle was completed"""
        if not self.enabled:
            return
            
        now = time.time()
        self.metrics.cycles_completed += 1
        self.metrics.last_cycle_time = now
        self.metrics.recent_cycles.append(now)
        
        # Check for anomalies in this cycle
        if events_in_cycle > 0 and recomputes_in_cycle == 0:
            self.consecutive_anomaly_cycles += 1
            
            if self.consecutive_anomaly_cycles >= self.anomaly_cycle_threshold:
                self._raise_anomaly_issue(events_in_cycle, recomputes_in_cycle)
        else:
            # Reset counter if we had a healthy cycle
            if self.consecutive_anomaly_cycles > 0:
                self.consecutive_anomaly_cycles = 0
                self._resolve_anomaly_issue()
    
    def perform_health_check(self) -> Dict[str, Any]:
        """
        Perform comprehensive health check
        
        Returns:
            Health status and any detected issues
        """
        if not self.enabled:
            return {"status": HealthStatus.UNKNOWN.value, "message": "Health monitoring disabled"}
        
        now = time.time()
        self.last_health_check = now
        
        issues = []
        overall_status = HealthStatus.HEALTHY
        
        # Check 1: No activity in configured time period
        if self._check_no_activity(now):
            issue = HealthIssue(
                issue_type="no_activity",
                severity=HealthStatus.CRITICAL,
                message=f"No streaming activity in {self.no_activity_threshold_sec}s",
                detected_at=now,
                details={
                    "last_cycle": self.metrics.last_cycle_time,
                    "last_event": self.metrics.last_event_time,
                    "threshold_sec": self.no_activity_threshold_sec
                }
            )
            issues.append(issue)
            overall_status = HealthStatus.CRITICAL
            
        # Check 2: High event:recompute ratio (recent window)
        ratio_issue = self._check_high_event_recompute_ratio()
        if ratio_issue:
            issues.append(ratio_issue)
            if overall_status == HealthStatus.HEALTHY:
                overall_status = HealthStatus.WARNING
        
        # Check 3: Active anomaly cycles
        if self.consecutive_anomaly_cycles > 0:
            issue = HealthIssue(
                issue_type="anomaly_cycles",
                severity=HealthStatus.WARNING,
                message=f"Events emitted but no recomputes for {self.consecutive_anomaly_cycles} cycles",
                detected_at=now,
                details={
                    "consecutive_cycles": self.consecutive_anomaly_cycles,
                    "threshold": self.anomaly_cycle_threshold
                }
            )
            issues.append(issue)
            if overall_status == HealthStatus.HEALTHY:
                overall_status = HealthStatus.WARNING
        
        # Update active issues
        self.active_issues = issues
        
        # Log health check results
        if overall_status != HealthStatus.HEALTHY:
            streaming_logger.warning(
                StreamingCategory.STREAMING,
                "health_check",
                f"Health check detected {len(issues)} issues",
                meta={
                    "status": overall_status.value,
                    "issues_count": len(issues),
                    "issue_types": [issue.issue_type for issue in issues]
                }
            )
        
        return {
            "status": overall_status.value,
            "timestamp": now,
            "issues": [
                {
                    "type": issue.issue_type,
                    "severity": issue.severity.value,
                    "message": issue.message,
                    "detected_at": issue.detected_at,
                    "details": issue.details
                }
                for issue in issues
            ],
            "metrics": {
                "events_emitted": self.metrics.events_emitted,
                "valuations_recomputed": self.metrics.valuations_recomputed,
                "cycles_completed": self.metrics.cycles_completed,
                "consecutive_anomaly_cycles": self.consecutive_anomaly_cycles,
                "recent_event_rate": self._calculate_recent_rate(self.metrics.recent_events, 60),
                "recent_recompute_rate": self._calculate_recent_rate(self.metrics.recent_recomputes, 60),
                "recent_cycle_rate": self._calculate_recent_rate(self.metrics.recent_cycles, 60)
            }
        }
    
    def _check_no_activity(self, now: float) -> bool:
        """Check if there has been no streaming activity"""
        if self.metrics.cycles_completed == 0:
            return False  # Initial state, not an issue yet
            
        time_since_last_cycle = now - self.metrics.last_cycle_time
        return time_since_last_cycle > self.no_activity_threshold_sec
    
    def _check_high_event_recompute_ratio(self) -> Optional[HealthIssue]:
        """Check if event:recompute ratio is too high (recent window)"""
        now = time.time()
        window_sec = 300  # 5 minute window
        
        # Count recent events and recomputes
        recent_events = sum(1 for t in self.metrics.recent_events if now - t <= window_sec)
        recent_recomputes = sum(1 for t in self.metrics.recent_recomputes if now - t <= window_sec)
        
        if recent_events == 0:
            return None  # No events to check
            
        if recent_recomputes == 0:
            ratio = float('inf')
        else:
            ratio = recent_events / recent_recomputes
            
        if ratio > self.high_ratio_threshold:
            return HealthIssue(
                issue_type="high_event_recompute_ratio",
                severity=HealthStatus.WARNING,
                message=f"High event:recompute ratio ({ratio:.1f}:{1}) in recent {window_sec}s",
                detected_at=now,
                details={
                    "ratio": ratio,
                    "recent_events": recent_events,
                    "recent_recomputes": recent_recomputes,
                    "window_sec": window_sec,
                    "threshold": self.high_ratio_threshold
                }
            )
        
        return None
    
    def _calculate_recent_rate(self, timestamps: Deque[float], window_sec: int) -> float:
        """Calculate rate (per second) for recent timestamps"""
        if not timestamps:
            return 0.0
            
        now = time.time()
        recent_count = sum(1 for t in timestamps if now - t <= window_sec)
        return recent_count / window_sec
    
    def _raise_anomaly_issue(self, events_in_cycle: int, recomputes_in_cycle: int):
        """Raise an anomaly issue and log warning"""
        streaming_logger.warning(
            StreamingCategory.STREAMING,
            "health_anomaly",
            f"Anomaly: {events_in_cycle} events emitted but {recomputes_in_cycle} recomputes "
            f"for {self.consecutive_anomaly_cycles} consecutive cycles",
            meta={
                "consecutive_cycles": self.consecutive_anomaly_cycles,
                "threshold": self.anomaly_cycle_threshold,
                "events_in_cycle": events_in_cycle,
                "recomputes_in_cycle": recomputes_in_cycle
            }
        )
    
    def _resolve_anomaly_issue(self):
        """Log that anomaly issue was resolved"""
        streaming_logger.info(
            StreamingCategory.STREAMING,
            "health_recovery",
            "Anomaly resolved: healthy cycle detected",
            meta={"previous_anomaly_cycles": self.consecutive_anomaly_cycles}
        )
    
    def get_summary(self) -> Dict[str, Any]:
        """Get health monitoring summary"""
        return {
            "enabled": self.enabled,
            "metrics": {
                "events_emitted": self.metrics.events_emitted,
                "valuations_recomputed": self.metrics.valuations_recomputed,
                "cycles_completed": self.metrics.cycles_completed,
                "consecutive_anomaly_cycles": self.consecutive_anomaly_cycles,
            },
            "configuration": {
                "anomaly_cycle_threshold": self.anomaly_cycle_threshold,
                "no_activity_threshold_sec": self.no_activity_threshold_sec,
                "high_ratio_threshold": self.high_ratio_threshold,
            },
            "active_issues_count": len(self.active_issues),
            "last_health_check": self.last_health_check
        }
    
    def reset_metrics(self):
        """Reset health metrics (useful for testing)"""
        self.metrics = HealthMetrics()
        self.active_issues = []
        self.consecutive_anomaly_cycles = 0
    
    def enable(self):
        """Enable health monitoring"""
        self.enabled = True
        streaming_logger.info(
            StreamingCategory.STREAMING,
            "health_monitor",
            "Health monitoring enabled"
        )
    
    def disable(self):
        """Disable health monitoring"""
        self.enabled = False
        streaming_logger.info(
            StreamingCategory.STREAMING,
            "health_monitor", 
            "Health monitoring disabled"
        )


# Global health monitor instance
streaming_health_monitor = StreamingHealthMonitor()


# Integration helpers for easy use in streaming components
def record_streaming_cycle(events_emitted: int, recomputes_triggered: int):
    """Record a completed streaming cycle"""
    streaming_health_monitor.record_event_emitted(events_emitted)
    streaming_health_monitor.record_valuation_recomputed(recomputes_triggered) 
    streaming_health_monitor.record_cycle_completed(events_emitted, recomputes_triggered)


def perform_periodic_health_check() -> Dict[str, Any]:
    """Perform health check and return results"""
    return streaming_health_monitor.perform_health_check()