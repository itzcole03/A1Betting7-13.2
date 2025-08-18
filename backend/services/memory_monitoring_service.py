"""
Memory Monitoring Service - Continuous RSS Tracking for Soak Testing
Comprehensive memory leak detection and performance monitoring
"""

import asyncio
import gc
import logging
import os
import sys
import threading
import time
import traceback
import weakref
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Set, Tuple, Union

try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False
    # Mock psutil for basic functionality
    class MemoryInfo:
        def __init__(self):
            self.rss = 1024 * 1024 * 100  # 100MB default
            self.vms = 1024 * 1024 * 200  # 200MB default
            self.shared = 0
            self.data = 0
            self.stack = 0
    
    class VirtualMemory:
        def __init__(self):
            self.available = 1024 * 1024 * 1024 * 4  # 4GB default
            self.percent = 50.0  # 50% default
    
    class MockProcess:
        def memory_info(self):
            return MemoryInfo()
        
        def memory_full_info(self):
            info = MemoryInfo()
            return info
        
        def num_threads(self):
            return 1
            
        def memory_percent(self):
            return 5.0
            
        def num_fds(self):
            return 10
            
        def num_handles(self):
            return 20
    
    class MockPsutil:
        @staticmethod
        def Process():
            return MockProcess()
        
        @staticmethod
        def virtual_memory():
            return VirtualMemory()
    
    psutil = MockPsutil()

try:
    from backend.services.unified_logging import unified_logging
    logger = unified_logging.get_logger("memory_monitoring")
except (ImportError, AttributeError):
    import logging
    logger = logging.getLogger("memory_monitoring")


class MemoryAlert(Enum):
    """Memory alert levels"""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
    EMERGENCY = "emergency"


class MemoryLeakType(Enum):
    """Types of memory leaks"""
    LINEAR_GROWTH = "linear_growth"
    EXPONENTIAL_GROWTH = "exponential_growth"
    STEPWISE_GROWTH = "stepwise_growth"
    OSCILLATING_GROWTH = "oscillating_growth"
    OBJECT_ACCUMULATION = "object_accumulation"
    CIRCULAR_REFERENCES = "circular_references"


@dataclass
class MemorySnapshot:
    """Single memory measurement snapshot"""
    timestamp: datetime
    rss_bytes: int  # Resident Set Size
    vms_bytes: int  # Virtual Memory Size
    shared_bytes: int  # Shared memory
    data_bytes: int  # Data segment
    stack_bytes: int  # Stack size
    
    # System memory
    system_available_bytes: int
    system_used_percent: float
    
    # Process-specific
    num_threads: int
    num_fds: int  # File descriptors (Unix)
    num_handles: int  # Handles (Windows)
    
    # Python-specific
    gc_collected: int  # Objects collected by GC
    gc_uncollectable: int  # Uncollectable objects
    object_count: int  # Total Python objects
    
    # Custom metrics
    request_count: int = 0
    active_connections: int = 0
    cache_size: int = 0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "timestamp": self.timestamp.isoformat(),
            "rss_mb": self.rss_bytes / (1024 * 1024),
            "vms_mb": self.vms_bytes / (1024 * 1024),
            "shared_mb": self.shared_bytes / (1024 * 1024),
            "data_mb": self.data_bytes / (1024 * 1024),
            "stack_mb": self.stack_bytes / (1024 * 1024),
            "system_available_mb": self.system_available_bytes / (1024 * 1024),
            "system_used_percent": self.system_used_percent,
            "num_threads": self.num_threads,
            "num_fds": self.num_fds,
            "num_handles": self.num_handles,
            "gc_collected": self.gc_collected,
            "gc_uncollectable": self.gc_uncollectable,
            "object_count": self.object_count,
            "request_count": self.request_count,
            "active_connections": self.active_connections,
            "cache_size": self.cache_size,
        }


@dataclass
class MemoryLeakDetection:
    """Memory leak detection result"""
    leak_type: MemoryLeakType
    severity: MemoryAlert
    growth_rate_mb_per_hour: float
    confidence: float  # 0.0 to 1.0
    detected_at: datetime
    data_points_analyzed: int
    baseline_mb: float
    current_mb: float
    projected_mb_in_24h: Optional[float] = None
    recommendation: str = ""


@dataclass
class SoakTestConfig:
    """Configuration for soak testing"""
    duration_hours: int = 4
    sampling_interval_seconds: int = 30
    memory_growth_threshold_percent: int = 10  # Alert if memory grows more than 10%
    critical_memory_threshold_percent: int = 90  # Alert if system memory usage > 90%
    gc_force_interval_minutes: int = 15  # Force GC every 15 minutes
    snapshot_retention_hours: int = 48  # Keep snapshots for 48 hours
    enable_object_tracking: bool = True
    enable_detailed_analysis: bool = True


class MemoryObjectTracker:
    """Track Python object creation and destruction"""
    
    def __init__(self):
        self.object_counts = defaultdict(int)
        self.object_sizes = defaultdict(int)
        self.creation_stacks = {}
        self.tracking_enabled = False
        self.tracked_types = {
            'list', 'dict', 'set', 'tuple', 'str', 'bytes',
            'function', 'method', 'frame', 'code', 'module'
        }
    
    def start_tracking(self):
        """Start object tracking"""
        if self.tracking_enabled:
            return
        
        self.tracking_enabled = True
        self.object_counts.clear()
        self.object_sizes.clear()
        
        # Install object creation hooks
        if hasattr(sys, 'setprofile'):
            sys.setprofile(self._profile_hook)
    
    def stop_tracking(self):
        """Stop object tracking"""
        if not self.tracking_enabled:
            return
        
        self.tracking_enabled = False
        
        # Remove hooks
        if hasattr(sys, 'setprofile'):
            sys.setprofile(None)
    
    def _profile_hook(self, frame, event, arg):
        """Profile hook for object tracking"""
        if not self.tracking_enabled:
            return
        
        try:
            if event == 'call':
                # Track object creation in constructors
                code = frame.f_code
                if code.co_name == '__init__':
                    obj_type = frame.f_locals.get('self').__class__.__name__
                    if obj_type in self.tracked_types:
                        self.object_counts[obj_type] += 1
                        
                        # Estimate size
                        obj = frame.f_locals.get('self')
                        if obj:
                            size = sys.getsizeof(obj)
                            self.object_sizes[obj_type] += size
        
        except Exception:
            # Ignore errors in tracking to avoid affecting the main application
            pass
    
    def get_object_stats(self) -> Dict[str, Any]:
        """Get current object tracking statistics"""
        return {
            "object_counts": dict(self.object_counts),
            "object_sizes_mb": {
                obj_type: size / (1024 * 1024) 
                for obj_type, size in self.object_sizes.items()
            },
            "tracking_enabled": self.tracking_enabled,
        }


class MemoryAnalyzer:
    """Analyze memory usage patterns and detect leaks"""
    
    def __init__(self):
        self.baseline_established = False
        self.baseline_snapshots = deque(maxlen=10)  # First 10 snapshots as baseline
        
    def analyze_snapshots(self, snapshots: List[MemorySnapshot]) -> List[MemoryLeakDetection]:
        """Analyze memory snapshots for potential leaks"""
        if len(snapshots) < 10:
            return []  # Need at least 10 snapshots
        
        detections = []
        
        # Establish baseline if needed
        if not self.baseline_established:
            self.baseline_snapshots.extend(snapshots[:10])
            self.baseline_established = True
        
        # Analyze different patterns
        detections.extend(self._detect_linear_growth(snapshots))
        detections.extend(self._detect_exponential_growth(snapshots))
        detections.extend(self._detect_stepwise_growth(snapshots))
        detections.extend(self._detect_object_accumulation(snapshots))
        
        return detections
    
    def _detect_linear_growth(self, snapshots: List[MemorySnapshot]) -> List[MemoryLeakDetection]:
        """Detect linear memory growth patterns"""
        if len(snapshots) < 20:
            return []
        
        # Extract RSS values
        rss_values = [s.rss_bytes for s in snapshots[-20:]]  # Last 20 snapshots
        timestamps = [s.timestamp for s in snapshots[-20:]]
        
        # Calculate linear regression
        x_values = [(ts - timestamps[0]).total_seconds() for ts in timestamps]
        y_values = [rss / (1024 * 1024) for rss in rss_values]  # Convert to MB
        
        if len(x_values) < 2:
            return []
        
        # Simple linear regression
        n = len(x_values)
        x_mean = sum(x_values) / n
        y_mean = sum(y_values) / n
        
        numerator = sum((x_values[i] - x_mean) * (y_values[i] - y_mean) for i in range(n))
        denominator = sum((x_values[i] - x_mean) ** 2 for i in range(n))
        
        if denominator == 0:
            return []
        
        slope = numerator / denominator  # MB per second
        growth_rate_mb_per_hour = slope * 3600  # MB per hour
        
        # Calculate R-squared for confidence
        y_pred = [slope * x + (y_mean - slope * x_mean) for x in x_values]
        ss_res = sum((y_values[i] - y_pred[i]) ** 2 for i in range(n))
        ss_tot = sum((y_values[i] - y_mean) ** 2 for i in range(n))
        
        r_squared = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0
        
        # Determine if this is a leak
        if growth_rate_mb_per_hour > 10 and r_squared > 0.7:  # >10MB/hour with good correlation
            severity = MemoryAlert.CRITICAL if growth_rate_mb_per_hour > 100 else MemoryAlert.WARNING
            
            baseline_mb = sum(s.rss_bytes for s in self.baseline_snapshots) / (len(self.baseline_snapshots) * 1024 * 1024)
            current_mb = snapshots[-1].rss_bytes / (1024 * 1024)
            
            return [MemoryLeakDetection(
                leak_type=MemoryLeakType.LINEAR_GROWTH,
                severity=severity,
                growth_rate_mb_per_hour=growth_rate_mb_per_hour,
                confidence=r_squared,
                detected_at=datetime.now(),
                data_points_analyzed=len(snapshots),
                baseline_mb=baseline_mb,
                current_mb=current_mb,
                projected_mb_in_24h=current_mb + (growth_rate_mb_per_hour * 24),
                recommendation=f"Linear memory growth detected at {growth_rate_mb_per_hour:.1f} MB/hour. "
                              "Check for unclosed resources, growing caches, or object accumulation."
            )]
        
        return []
    
    def _detect_exponential_growth(self, snapshots: List[MemorySnapshot]) -> List[MemoryLeakDetection]:
        """Detect exponential memory growth patterns"""
        if len(snapshots) < 15:
            return []
        
        recent_snapshots = snapshots[-15:]
        rss_values = [s.rss_bytes / (1024 * 1024) for s in recent_snapshots]
        
        # Check if memory is doubling periodically
        growth_ratios = []
        for i in range(1, len(rss_values)):
            if rss_values[i-1] > 0:
                ratio = rss_values[i] / rss_values[i-1]
                growth_ratios.append(ratio)
        
        avg_ratio = sum(growth_ratios) / len(growth_ratios) if growth_ratios else 1.0
        
        # Exponential growth if average ratio > 1.1 (10% growth per interval)
        if avg_ratio > 1.05 and len([r for r in growth_ratios if r > 1.1]) > len(growth_ratios) * 0.6:
            baseline_mb = sum(s.rss_bytes for s in self.baseline_snapshots) / (len(self.baseline_snapshots) * 1024 * 1024)
            current_mb = snapshots[-1].rss_bytes / (1024 * 1024)
            
            # Estimate growth rate
            time_span_hours = (recent_snapshots[-1].timestamp - recent_snapshots[0].timestamp).total_seconds() / 3600
            if time_span_hours > 0:
                growth_rate = (current_mb - rss_values[0]) / time_span_hours
            else:
                growth_rate = 0
            
            return [MemoryLeakDetection(
                leak_type=MemoryLeakType.EXPONENTIAL_GROWTH,
                severity=MemoryAlert.CRITICAL,
                growth_rate_mb_per_hour=growth_rate,
                confidence=0.9,  # High confidence for exponential growth
                detected_at=datetime.now(),
                data_points_analyzed=len(recent_snapshots),
                baseline_mb=baseline_mb,
                current_mb=current_mb,
                projected_mb_in_24h=current_mb * (avg_ratio ** (24 * 2)),  # Assuming 30min intervals
                recommendation="Exponential memory growth detected. This is critical - "
                              "likely caused by recursive object creation, memory amplification, or runaway processes."
            )]
        
        return []
    
    def _detect_stepwise_growth(self, snapshots: List[MemorySnapshot]) -> List[MemoryLeakDetection]:
        """Detect stepwise memory growth patterns"""
        if len(snapshots) < 30:
            return []
        
        recent_snapshots = snapshots[-30:]
        rss_values = [s.rss_bytes / (1024 * 1024) for s in recent_snapshots]
        
        # Look for significant jumps followed by plateaus
        jumps = []
        for i in range(1, len(rss_values)):
            if rss_values[i] - rss_values[i-1] > 50:  # Jump > 50MB
                jumps.append({
                    "index": i,
                    "jump_mb": rss_values[i] - rss_values[i-1],
                    "timestamp": recent_snapshots[i].timestamp
                })
        
        if len(jumps) >= 3:  # Multiple jumps indicate stepwise growth
            total_jump = sum(j["jump_mb"] for j in jumps)
            time_span_hours = (recent_snapshots[-1].timestamp - recent_snapshots[0].timestamp).total_seconds() / 3600
            growth_rate = total_jump / time_span_hours if time_span_hours > 0 else 0
            
            baseline_mb = sum(s.rss_bytes for s in self.baseline_snapshots) / (len(self.baseline_snapshots) * 1024 * 1024)
            current_mb = snapshots[-1].rss_bytes / (1024 * 1024)
            
            return [MemoryLeakDetection(
                leak_type=MemoryLeakType.STEPWISE_GROWTH,
                severity=MemoryAlert.WARNING,
                growth_rate_mb_per_hour=growth_rate,
                confidence=0.8,
                detected_at=datetime.now(),
                data_points_analyzed=len(recent_snapshots),
                baseline_mb=baseline_mb,
                current_mb=current_mb,
                recommendation=f"Stepwise memory growth detected with {len(jumps)} jumps totaling {total_jump:.1f}MB. "
                              "Likely caused by batch operations, periodic cache loading, or memory pool expansions."
            )]
        
        return []
    
    def _detect_object_accumulation(self, snapshots: List[MemorySnapshot]) -> List[MemoryLeakDetection]:
        """Detect object accumulation patterns"""
        if len(snapshots) < 20:
            return []
        
        recent_snapshots = snapshots[-20:]
        object_counts = [s.object_count for s in recent_snapshots]
        
        # Check if object count is steadily increasing
        increasing_count = sum(1 for i in range(1, len(object_counts)) 
                              if object_counts[i] > object_counts[i-1])
        
        if increasing_count > len(object_counts) * 0.7:  # 70% of samples show increase
            first_count = object_counts[0]
            last_count = object_counts[-1]
            growth_rate = ((last_count - first_count) / first_count) * 100 if first_count > 0 else 0
            
            if growth_rate > 20:  # 20% increase in object count
                baseline_mb = sum(s.rss_bytes for s in self.baseline_snapshots) / (len(self.baseline_snapshots) * 1024 * 1024)
                current_mb = snapshots[-1].rss_bytes / (1024 * 1024)
                
                return [MemoryLeakDetection(
                    leak_type=MemoryLeakType.OBJECT_ACCUMULATION,
                    severity=MemoryAlert.WARNING,
                    growth_rate_mb_per_hour=0,  # Will be calculated based on memory growth
                    confidence=0.7,
                    detected_at=datetime.now(),
                    data_points_analyzed=len(recent_snapshots),
                    baseline_mb=baseline_mb,
                    current_mb=current_mb,
                    recommendation=f"Object accumulation detected: {growth_rate:.1f}% increase in object count. "
                                  "Check for object references not being released, circular references, or growing collections."
                )]
        
        return []


class MemoryMonitoringService:
    """Main memory monitoring service for soak testing"""
    
    def __init__(self, config: Optional[SoakTestConfig] = None):
        self.config = config or SoakTestConfig()
        self.snapshots: deque[MemorySnapshot] = deque(maxlen=int(
            self.config.snapshot_retention_hours * 3600 / self.config.sampling_interval_seconds
        ))
        self.object_tracker = MemoryObjectTracker()
        self.analyzer = MemoryAnalyzer()
        
        self.is_monitoring = False
        self.monitoring_task: Optional[asyncio.Task] = None
        self.gc_task: Optional[asyncio.Task] = None
        
        self.leak_detections: List[MemoryLeakDetection] = []
        self.alerts: List[Dict[str, Any]] = []
        
        # Statistics
        self.total_snapshots = 0
        self.monitoring_start_time: Optional[datetime] = None
        self.last_gc_time: Optional[datetime] = None
        
        # Process reference
        self.process = psutil.Process()
        
    async def start_monitoring(self) -> bool:
        """Start memory monitoring"""
        if self.is_monitoring:
            logger.warning("Memory monitoring already running")
            return False
        
        logger.info("Starting memory monitoring service")
        self.is_monitoring = True
        self.monitoring_start_time = datetime.now()
        
        # Start object tracking if enabled
        if self.config.enable_object_tracking:
            self.object_tracker.start_tracking()
        
        # Start monitoring tasks
        self.monitoring_task = asyncio.create_task(self._monitoring_loop())
        self.gc_task = asyncio.create_task(self._gc_loop())
        
        logger.info(f"Memory monitoring started - sampling every {self.config.sampling_interval_seconds}s")
        return True
    
    async def stop_monitoring(self) -> Dict[str, Any]:
        """Stop memory monitoring and return final report"""
        if not self.is_monitoring:
            logger.warning("Memory monitoring not running")
            return {}
        
        logger.info("Stopping memory monitoring service")
        self.is_monitoring = False
        
        # Stop object tracking
        self.object_tracker.stop_tracking()
        
        # Cancel tasks
        if self.monitoring_task:
            self.monitoring_task.cancel()
            try:
                await self.monitoring_task
            except asyncio.CancelledError:
                pass
        
        if self.gc_task:
            self.gc_task.cancel()
            try:
                await self.gc_task
            except asyncio.CancelledError:
                pass
        
        # Generate final report
        final_report = await self.generate_soak_test_report()
        
        logger.info("Memory monitoring stopped")
        return final_report
    
    async def _monitoring_loop(self):
        """Main monitoring loop"""
        while self.is_monitoring:
            try:
                # Take snapshot
                snapshot = await self._take_snapshot()
                self.snapshots.append(snapshot)
                self.total_snapshots += 1
                
                # Analyze for leaks if we have enough data
                if len(self.snapshots) >= 20 and self.config.enable_detailed_analysis:
                    new_detections = self.analyzer.analyze_snapshots(list(self.snapshots))
                    self.leak_detections.extend(new_detections)
                    
                    # Generate alerts for new detections
                    for detection in new_detections:
                        await self._generate_alert(detection)
                
                # Check critical thresholds
                await self._check_critical_thresholds(snapshot)
                
                await asyncio.sleep(self.config.sampling_interval_seconds)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                await asyncio.sleep(self.config.sampling_interval_seconds)
    
    async def _gc_loop(self):
        """Garbage collection loop"""
        while self.is_monitoring:
            try:
                await asyncio.sleep(self.config.gc_force_interval_minutes * 60)
                
                if self.is_monitoring:
                    # Force garbage collection
                    collected = gc.collect()
                    self.last_gc_time = datetime.now()
                    
                    logger.info(f"Forced GC collected {collected} objects")
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in GC loop: {e}")
    
    async def _take_snapshot(self) -> MemorySnapshot:
        """Take a memory snapshot"""
        try:
            # Process memory info
            memory_info = self.process.memory_info()
            memory_full_info = self.process.memory_full_info() if hasattr(self.process, 'memory_full_info') else None
            
            # System memory info
            system_memory = psutil.virtual_memory()
            
            # Python GC stats
            gc_stats = gc.get_stats()
            total_collected = sum(stat['collections'] for stat in gc_stats)
            total_uncollectable = len(gc.garbage)
            
            # Object count (approximate)
            object_count = len(gc.get_objects()) if self.config.enable_object_tracking else 0
            
            # File descriptors / handles
            try:
                if PSUTIL_AVAILABLE and hasattr(self.process, 'num_fds'):
                    num_fds = self.process.num_fds()
                    num_handles = 0
                elif PSUTIL_AVAILABLE and hasattr(self.process, 'num_handles'):
                    num_fds = 0
                    num_handles = self.process.num_handles()
                else:
                    # Use mock values
                    num_fds = 10
                    num_handles = 20
            except:
                num_fds = 0
                num_handles = 0
            
            snapshot = MemorySnapshot(
                timestamp=datetime.now(),
                rss_bytes=memory_info.rss,
                vms_bytes=memory_info.vms,
                shared_bytes=getattr(memory_full_info, 'shared', 0) if memory_full_info else 0,
                data_bytes=getattr(memory_full_info, 'data', 0) if memory_full_info else 0,
                stack_bytes=getattr(memory_full_info, 'stack', 0) if memory_full_info else 0,
                system_available_bytes=system_memory.available,
                system_used_percent=system_memory.percent,
                num_threads=self.process.num_threads(),
                num_fds=num_fds,
                num_handles=num_handles,
                gc_collected=total_collected,
                gc_uncollectable=total_uncollectable,
                object_count=object_count,
            )
            
            return snapshot
            
        except Exception as e:
            logger.error(f"Error taking memory snapshot: {e}")
            # Return minimal snapshot
            return MemorySnapshot(
                timestamp=datetime.now(),
                rss_bytes=0,
                vms_bytes=0,
                shared_bytes=0,
                data_bytes=0,
                stack_bytes=0,
                system_available_bytes=0,
                system_used_percent=0,
                num_threads=0,
                num_fds=0,
                num_handles=0,
                gc_collected=0,
                gc_uncollectable=0,
                object_count=0,
            )
    
    async def _check_critical_thresholds(self, snapshot: MemorySnapshot):
        """Check for critical memory conditions"""
        # System memory threshold
        if snapshot.system_used_percent > self.config.critical_memory_threshold_percent:
            await self._generate_alert(None, MemoryAlert.CRITICAL,
                f"Critical system memory usage: {snapshot.system_used_percent:.1f}%")
        
        # Check memory growth if we have baseline
        if len(self.snapshots) > 10:
            baseline_snapshots = list(self.snapshots)[:10]
            baseline_rss = sum(s.rss_bytes for s in baseline_snapshots) / len(baseline_snapshots)
            current_rss = snapshot.rss_bytes
            
            growth_percent = ((current_rss - baseline_rss) / baseline_rss) * 100
            
            if growth_percent > self.config.memory_growth_threshold_percent:
                await self._generate_alert(None, MemoryAlert.WARNING,
                    f"Memory growth threshold exceeded: {growth_percent:.1f}% increase from baseline")
    
    async def _generate_alert(self, detection: Optional[MemoryLeakDetection], 
                            alert_type: Optional[MemoryAlert] = None, message: Optional[str] = None):
        """Generate memory alert"""
        alert = {
            "timestamp": datetime.now().isoformat(),
            "type": detection.severity.value if detection else (alert_type.value if alert_type else "unknown"),
            "source": "leak_detection" if detection else "threshold_check",
            "message": detection.recommendation if detection else (message or "No message"),
            "details": {
                "leak_type": detection.leak_type.value if detection else None,
                "growth_rate_mb_per_hour": detection.growth_rate_mb_per_hour if detection else None,
                "confidence": detection.confidence if detection else None,
                "current_memory_mb": (
                    list(self.snapshots)[-1].rss_bytes / (1024 * 1024) 
                    if self.snapshots else 0
                ),
            }
        }
        
        self.alerts.append(alert)
        
        # Log alert
        if detection:
            logger.warning(f"Memory leak detected: {detection.leak_type.value} - {detection.recommendation}")
        else:
            log_func = logger.critical if alert_type == MemoryAlert.CRITICAL else logger.warning
            log_func(f"Memory alert: {message}")
    
    async def generate_soak_test_report(self) -> Dict[str, Any]:
        """Generate comprehensive soak test report"""
        if not self.snapshots:
            return {"error": "No memory snapshots available"}
        
        snapshots_list = list(self.snapshots)
        first_snapshot = snapshots_list[0]
        last_snapshot = snapshots_list[-1]
        
        # Calculate memory growth
        initial_memory_mb = first_snapshot.rss_bytes / (1024 * 1024)
        final_memory_mb = last_snapshot.rss_bytes / (1024 * 1024)
        memory_growth_mb = final_memory_mb - initial_memory_mb
        memory_growth_percent = (memory_growth_mb / initial_memory_mb) * 100 if initial_memory_mb > 0 else 0
        
        # Calculate peak memory
        peak_memory_mb = max(s.rss_bytes for s in snapshots_list) / (1024 * 1024)
        
        # Calculate average memory
        avg_memory_mb = sum(s.rss_bytes for s in snapshots_list) / (len(snapshots_list) * 1024 * 1024)
        
        # Test duration
        duration_hours = (last_snapshot.timestamp - first_snapshot.timestamp).total_seconds() / 3600
        
        # Memory leak assessment
        memory_leak_detected = memory_growth_percent > self.config.memory_growth_threshold_percent
        
        # System stability metrics
        system_memory_values = [s.system_used_percent for s in snapshots_list]
        max_system_memory = max(system_memory_values)
        avg_system_memory = sum(system_memory_values) / len(system_memory_values)
        
        report = {
            "test_summary": {
                "start_time": first_snapshot.timestamp.isoformat(),
                "end_time": last_snapshot.timestamp.isoformat(),
                "duration_hours": duration_hours,
                "total_snapshots": len(snapshots_list),
                "sampling_interval_seconds": self.config.sampling_interval_seconds,
            },
            "memory_analysis": {
                "initial_memory_mb": initial_memory_mb,
                "final_memory_mb": final_memory_mb,
                "peak_memory_mb": peak_memory_mb,
                "average_memory_mb": avg_memory_mb,
                "memory_growth_mb": memory_growth_mb,
                "memory_growth_percent": memory_growth_percent,
                "memory_leak_detected": memory_leak_detected,
                "growth_threshold_percent": self.config.memory_growth_threshold_percent,
            },
            "system_stability": {
                "max_system_memory_percent": max_system_memory,
                "avg_system_memory_percent": avg_system_memory,
                "critical_threshold_breached": max_system_memory > self.config.critical_memory_threshold_percent,
            },
            "leak_detections": [
                {
                    "type": detection.leak_type.value,
                    "severity": detection.severity.value,
                    "growth_rate_mb_per_hour": detection.growth_rate_mb_per_hour,
                    "confidence": detection.confidence,
                    "detected_at": detection.detected_at.isoformat(),
                    "recommendation": detection.recommendation,
                    "projected_24h_mb": detection.projected_mb_in_24h,
                }
                for detection in self.leak_detections
            ],
            "alerts": self.alerts,
            "object_tracking": self.object_tracker.get_object_stats() if self.config.enable_object_tracking else {},
            "gc_statistics": {
                "last_gc_time": self.last_gc_time.isoformat() if self.last_gc_time else None,
                "final_gc_collected": last_snapshot.gc_collected,
                "final_uncollectable": last_snapshot.gc_uncollectable,
                "final_object_count": last_snapshot.object_count,
            },
            "performance_metrics": {
                "max_threads": max(s.num_threads for s in snapshots_list),
                "avg_threads": sum(s.num_threads for s in snapshots_list) / len(snapshots_list),
                "max_file_descriptors": max(s.num_fds for s in snapshots_list),
                "max_handles": max(s.num_handles for s in snapshots_list),
            },
            "verdict": {
                "passed": not memory_leak_detected and max_system_memory < 95,
                "memory_leak_detected": memory_leak_detected,
                "system_stable": max_system_memory < 95,
                "recommendations": self._generate_recommendations(memory_growth_percent, max_system_memory),
            }
        }
        
        return report
    
    def _generate_recommendations(self, memory_growth_percent: float, max_system_memory: float) -> List[str]:
        """Generate recommendations based on test results"""
        recommendations = []
        
        if memory_growth_percent > 10:
            recommendations.append("Memory growth exceeds threshold. Investigate for memory leaks.")
            recommendations.append("Review object lifecycle management and ensure proper cleanup.")
            recommendations.append("Consider implementing object pooling for frequently created/destroyed objects.")
        
        if memory_growth_percent > 20:
            recommendations.append("Significant memory growth detected. This may impact long-running operations.")
            recommendations.append("Profile memory usage to identify specific leak sources.")
        
        if max_system_memory > 90:
            recommendations.append("High system memory usage detected. Monitor resource consumption.")
            recommendations.append("Consider reducing memory footprint or increasing system resources.")
        
        if len(self.leak_detections) > 0:
            recommendations.append("Memory leak patterns detected. Review leak detection details.")
            recommendations.append("Implement more frequent garbage collection or memory cleanup cycles.")
        
        if not recommendations:
            recommendations.append("Memory usage appears stable throughout the test.")
            recommendations.append("No significant memory leaks detected.")
        
        return recommendations
    
    def get_current_status(self) -> Dict[str, Any]:
        """Get current monitoring status"""
        if not self.snapshots:
            return {"status": "no_data"}
        
        latest_snapshot = list(self.snapshots)[-1]
        
        return {
            "is_monitoring": self.is_monitoring,
            "monitoring_duration_minutes": (
                (datetime.now() - self.monitoring_start_time).total_seconds() / 60
                if self.monitoring_start_time else 0
            ),
            "total_snapshots": len(self.snapshots),
            "current_memory_mb": latest_snapshot.rss_bytes / (1024 * 1024),
            "current_system_memory_percent": latest_snapshot.system_used_percent,
            "leak_detections_count": len(self.leak_detections),
            "alerts_count": len(self.alerts),
            "object_tracking_enabled": self.config.enable_object_tracking,
            "last_snapshot_time": latest_snapshot.timestamp.isoformat(),
        }
    
    def get_memory_history(self, hours: int = 1) -> List[Dict[str, Any]]:
        """Get memory history for the specified number of hours"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        relevant_snapshots = [
            s for s in self.snapshots 
            if s.timestamp >= cutoff_time
        ]
        
        return [snapshot.to_dict() for snapshot in relevant_snapshots]


# Global memory monitoring service
global_memory_monitor: Optional[MemoryMonitoringService] = None


async def get_memory_monitor(config: Optional[SoakTestConfig] = None) -> MemoryMonitoringService:
    """Get global memory monitoring service"""
    global global_memory_monitor
    
    if global_memory_monitor is None:
        global_memory_monitor = MemoryMonitoringService(config)
    
    return global_memory_monitor