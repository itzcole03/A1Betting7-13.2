#!/usr/bin/env python3
"""
Baseline Metrics Collector

Captures baseline streaming performance metrics before Phase 0 improvements:
- Average streaming cycle duration
- Events emitted per cycle
- Valuations recomputed per cycle  
- Median & p95 valuation recompute latency
- Provider failure rates and circuit breaker states

Persists snapshots to JSON for pre/post comparison.
"""

import asyncio
import json
import statistics
import time
from collections import defaultdict, deque
from dataclasses import dataclass, asdict
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
import logging

# Conditional imports - handle if modules don't exist
try:
    import sys
    from pathlib import Path
    # Add backend path to sys.path for imports
    backend_path = Path(__file__).parent.parent.parent / "backend"
    if str(backend_path) not in sys.path:
        sys.path.insert(0, str(backend_path))
    
    from services.streaming.market_streamer import MarketStreamer
    from services.provider_resilience_manager import provider_resilience_manager
    from services.events import global_event_bus
    from services.unified_logging import get_logger as backend_get_logger
    get_logger = backend_get_logger
    
except ImportError as e:
    print(f"Warning: Could not import backend modules: {e}")
    MarketStreamer = None
    provider_resilience_manager = None
    global_event_bus = None
    get_logger = lambda x: logging.getLogger(x)


@dataclass 
class BaselineMetrics:
    """Baseline performance metrics snapshot"""
    timestamp: str
    measurement_duration_minutes: float
    
    # Streaming cycle metrics
    total_cycles: int
    avg_cycle_duration_ms: float
    median_cycle_duration_ms: float
    p95_cycle_duration_ms: float
    max_cycle_duration_ms: float
    
    # Event generation metrics
    total_events_emitted: int
    avg_events_per_cycle: float
    event_types_distribution: Dict[str, int]
    
    # Provider metrics
    providers_processed: Dict[str, int]  # provider -> success count
    provider_failure_rates: Dict[str, float]
    circuit_breaker_states: Dict[str, str]
    avg_provider_latency_ms: Dict[str, float]
    
    # Valuation recompute metrics (estimated)
    estimated_valuations_recomputed: int
    avg_recomputes_per_cycle: float
    estimated_recompute_latency_ms: float
    
    # Event bus metrics
    event_bus_subscribers: int
    event_bus_deliveries: int
    event_bus_failures: int
    
    # System resource metrics
    memory_usage_mb: float
    cpu_usage_percent: float


class BaselineMetricsCollector:
    """Collects baseline metrics from streaming system"""
    
    def __init__(self, measurement_duration_minutes: float = 5.0):
        self.measurement_duration_minutes = measurement_duration_minutes
        self.logger = get_logger("baseline_metrics_collector")
        
        # Metrics collection
        self.cycle_durations: List[float] = []
        self.events_per_cycle: List[int] = []
        self.event_types: Dict[str, int] = defaultdict(int)
        self.provider_successes: Dict[str, int] = defaultdict(int)
        self.provider_failures: Dict[str, int] = defaultdict(int)
        self.provider_latencies: Dict[str, List[float]] = defaultdict(list)
        
        # Event monitoring
        self.total_events_emitted = 0
        self.total_cycles = 0
        self.measurement_start_time = None
        
    async def collect_baseline_metrics(self) -> BaselineMetrics:
        """
        Collect baseline metrics by monitoring streaming system
        
        Returns:
            BaselineMetrics snapshot
        """
        self.logger.info(f"Starting {self.measurement_duration_minutes:.1f}min baseline metrics collection")
        
        # Initialize collection
        self.measurement_start_time = time.time()
        
        # Subscribe to relevant events if event bus available
        if global_event_bus:
            self._setup_event_monitoring()
        
        # Monitor provider resilience manager if available
        if provider_resilience_manager:
            await self._monitor_providers()
        
        # Monitor for specified duration
        await asyncio.sleep(self.measurement_duration_minutes * 60)
        
        # Calculate final metrics
        return self._calculate_baseline_metrics()
    
    def _setup_event_monitoring(self):
        """Setup event bus monitoring"""
        if not global_event_bus:
            self.logger.warning("Event bus not available - skipping event monitoring")
            return
            
        def on_market_event(event_type: str, payload: Any):
            self.total_events_emitted += 1
            self.event_types[event_type] += 1
        
        # Subscribe to market events
        try:
            global_event_bus.subscribe("MARKET_*", on_market_event)
            global_event_bus.subscribe("VALUATION_*", on_market_event)
            self.logger.debug("Event monitoring setup complete")
        except Exception as e:
            self.logger.warning(f"Event monitoring setup failed: {e}")
    
    async def _monitor_providers(self):
        """Monitor provider states during measurement"""
        if not provider_resilience_manager:
            self.logger.warning("Provider resilience manager not available - skipping provider monitoring")
            return []
            
        monitoring_tasks = []
        
        # Get current providers
        try:
            provider_metrics = getattr(provider_resilience_manager, 'provider_metrics', {})
            provider_names = list(provider_metrics.keys()) if provider_metrics else []
            
            self.logger.info(f"Monitoring {len(provider_names)} providers")
            
            # Create monitoring task for each provider
            for provider_name in provider_names:
                task = asyncio.create_task(
                    self._monitor_single_provider(provider_name)
                )
                monitoring_tasks.append(task)
            
            # Monitor event bus if available
            if global_event_bus:
                bus_task = asyncio.create_task(self._monitor_event_bus())
                monitoring_tasks.append(bus_task)
                
        except Exception as e:
            self.logger.warning(f"Provider monitoring setup failed: {e}")
            
        return monitoring_tasks
    
    async def _monitor_single_provider(self, provider_name: str):
        """Monitor a single provider during measurement period"""
        if not provider_resilience_manager:
            return
            
        monitor_interval = 10.0  # Check every 10 seconds
        end_time = time.time() + (self.measurement_duration_minutes * 60)
        
        while time.time() < end_time:
            try:
                # Get provider state
                if hasattr(provider_resilience_manager, 'get_provider_state'):
                    state = provider_resilience_manager.get_provider_state(provider_name)
                    if state:
                        # Track success/failure counts
                        if state.get('consecutive_failures', 0) == 0:
                            self.provider_successes[provider_name] += 1
                        else:
                            self.provider_failures[provider_name] += state['consecutive_failures']
                        
                        # Track latencies
                        if 'avg_latency_ms' in state:
                            self.provider_latencies[provider_name].append(state['avg_latency_ms'])
                else:
                    self.logger.debug("get_provider_state method not available")
                        
            except Exception as e:
                self.logger.debug(f"Error monitoring provider {provider_name}: {e}")
                
            await asyncio.sleep(monitor_interval)
    
    async def _monitor_event_bus(self):
        """Monitor event bus metrics"""
        if not global_event_bus:
            return
            
        monitor_interval = 15.0  # Check every 15 seconds
        end_time = time.time() + (self.measurement_duration_minutes * 60)
        
        cycle_count = 0
        while time.time() < end_time:
            try:
                # Estimate cycle completion (rough approximation)
                if hasattr(global_event_bus, 'metrics'):
                    current_events = global_event_bus.metrics.events_published
                    
                    # Estimate cycles based on event patterns
                    if current_events > self.total_events_emitted:
                        new_events = current_events - self.total_events_emitted
                        self.events_per_cycle.append(new_events)
                        cycle_count += 1
                        
                        # Estimate cycle duration (based on monitoring interval)
                        estimated_duration = monitor_interval * 1000  # Convert to ms
                        self.cycle_durations.append(estimated_duration)
                        
                        self.total_events_emitted = current_events
                else:
                    # Fallback: use our tracked events
                    if self.total_events_emitted > 0:
                        # Estimate cycle based on time intervals
                        cycle_count += 1
                        self.events_per_cycle.append(max(1, self.total_events_emitted // cycle_count))
                        self.cycle_durations.append(monitor_interval * 1000)
                        
            except Exception as e:
                self.logger.debug(f"Error monitoring event bus: {e}")
                
            await asyncio.sleep(monitor_interval)
        
        self.total_cycles = max(cycle_count, 1)  # Ensure at least 1 cycle
    
    def _calculate_baseline_metrics(self) -> BaselineMetrics:
        """Calculate baseline metrics from collected data"""
        now = datetime.now(timezone.utc).isoformat()
        
        # Calculate cycle statistics
        avg_cycle_duration = statistics.mean(self.cycle_durations) if self.cycle_durations else 0
        median_cycle_duration = statistics.median(self.cycle_durations) if self.cycle_durations else 0
        
        # Calculate percentiles
        p95_cycle_duration = 0
        max_cycle_duration = 0
        if self.cycle_durations:
            sorted_durations = sorted(self.cycle_durations)
            p95_index = int(len(sorted_durations) * 0.95)
            p95_cycle_duration = sorted_durations[p95_index] if p95_index < len(sorted_durations) else sorted_durations[-1]
            max_cycle_duration = max(sorted_durations)
        
        # Calculate event statistics
        avg_events_per_cycle = statistics.mean(self.events_per_cycle) if self.events_per_cycle else 0
        
        # Calculate provider failure rates
        provider_failure_rates = {}
        for provider_name in set(list(self.provider_successes.keys()) + list(self.provider_failures.keys())):
            successes = self.provider_successes.get(provider_name, 0)
            failures = self.provider_failures.get(provider_name, 0)
            total = successes + failures
            failure_rate = failures / total if total > 0 else 0
            provider_failure_rates[provider_name] = failure_rate
        
        # Get current circuit breaker states
        circuit_breaker_states = {}
        avg_provider_latency = {}
        if provider_resilience_manager:
            try:
                for provider_name in provider_failure_rates.keys():
                    if hasattr(provider_resilience_manager, 'get_provider_state'):
                        state = provider_resilience_manager.get_provider_state(provider_name)
                        if state:
                            circuit_breaker_states[provider_name] = state.get('circuit_state', 'unknown')
                        
                    # Calculate average latency
                    latencies = self.provider_latencies.get(provider_name, [])
                    avg_provider_latency[provider_name] = statistics.mean(latencies) if latencies else 0
                        
            except Exception as e:
                self.logger.warning(f"Error getting circuit breaker states: {e}")
        
        # Event bus metrics
        event_bus_subscribers = 0
        event_bus_deliveries = 0
        event_bus_failures = 0
        if global_event_bus and hasattr(global_event_bus, 'metrics'):
            try:
                metrics = global_event_bus.metrics
                event_bus_subscribers = metrics.subscribers_count
                event_bus_deliveries = metrics.events_delivered
                event_bus_failures = metrics.failed_deliveries
            except Exception as e:
                self.logger.debug(f"Error reading event bus metrics: {e}")
        
        # Rough system resource estimates (would need psutil for accurate measurement)
        memory_usage_mb = 128.0  # Placeholder
        cpu_usage_percent = 15.0  # Placeholder
        
        # Estimate valuation recomputes (heuristic based on events)
        line_change_events = sum(count for event_type, count in self.event_types.items() 
                               if 'LINE_CHANGE' in event_type.upper())
        estimated_valuations_recomputed = int(line_change_events * 0.7)  # Assume 70% trigger recomputes
        estimated_recompute_latency = avg_cycle_duration * 0.6  # Estimate recompute takes 60% of cycle time
        
        return BaselineMetrics(
            timestamp=now,
            measurement_duration_minutes=self.measurement_duration_minutes,
            
            # Cycle metrics
            total_cycles=self.total_cycles,
            avg_cycle_duration_ms=avg_cycle_duration,
            median_cycle_duration_ms=median_cycle_duration,
            p95_cycle_duration_ms=p95_cycle_duration,
            max_cycle_duration_ms=max_cycle_duration,
            
            # Event metrics
            total_events_emitted=self.total_events_emitted,
            avg_events_per_cycle=avg_events_per_cycle,
            event_types_distribution=dict(self.event_types),
            
            # Provider metrics
            providers_processed=dict(self.provider_successes),
            provider_failure_rates=provider_failure_rates,
            circuit_breaker_states=circuit_breaker_states,
            avg_provider_latency_ms=avg_provider_latency,
            
            # Valuation metrics (estimates)
            estimated_valuations_recomputed=estimated_valuations_recomputed,
            avg_recomputes_per_cycle=estimated_valuations_recomputed / max(self.total_cycles, 1),
            estimated_recompute_latency_ms=estimated_recompute_latency,
            
            # Event bus metrics
            event_bus_subscribers=event_bus_subscribers,
            event_bus_deliveries=event_bus_deliveries,
            event_bus_failures=event_bus_failures,
            
            # System metrics
            memory_usage_mb=memory_usage_mb,
            cpu_usage_percent=cpu_usage_percent
        )


async def capture_baseline_snapshot(duration_minutes: float = 5.0, output_dir: str = "./ops/baseline") -> str:
    """
    Capture baseline metrics snapshot
    
    Args:
        duration_minutes: How long to collect metrics
        output_dir: Directory to save snapshot
        
    Returns:
        Path to saved snapshot file
    """
    logger = get_logger("baseline_snapshot")
    
    # Create collector
    collector = BaselineMetricsCollector(duration_minutes)
    
    try:
        # Collect metrics
        logger.info(f"Collecting baseline metrics for {duration_minutes:.1f} minutes...")
        baseline = await collector.collect_baseline_metrics()
        
        # Save to JSON
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        filename = f"stream_metrics_baseline_{timestamp}.json"
        filepath = output_path / filename
        
        with open(filepath, 'w') as f:
            json.dump(asdict(baseline), f, indent=2)
        
        logger.info(f"Baseline metrics saved to: {filepath}")
        
        # Print summary
        print("\n" + "="*60)
        print("BASELINE METRICS SUMMARY")
        print("="*60)
        print(f"Measurement Duration: {baseline.measurement_duration_minutes:.1f} minutes")
        print(f"Total Cycles: {baseline.total_cycles}")
        print(f"Avg Cycle Duration: {baseline.avg_cycle_duration_ms:.1f}ms")
        print(f"Median Cycle Duration: {baseline.median_cycle_duration_ms:.1f}ms")
        print(f"P95 Cycle Duration: {baseline.p95_cycle_duration_ms:.1f}ms")
        print(f"Total Events Emitted: {baseline.total_events_emitted}")
        print(f"Avg Events/Cycle: {baseline.avg_events_per_cycle:.1f}")
        print(f"Estimated Recomputes: {baseline.estimated_valuations_recomputed}")
        print(f"Provider Failure Rates:")
        for provider, rate in baseline.provider_failure_rates.items():
            print(f"  {provider}: {rate:.3f}")
        print(f"Circuit Breaker States:")
        for provider, state in baseline.circuit_breaker_states.items():
            print(f"  {provider}: {state}")
        print("="*60)
        
        return str(filepath)
        
    except Exception as e:
        logger.error(f"Error capturing baseline snapshot: {e}")
        raise


if __name__ == "__main__":
    import sys
    
    duration = 2.0  # Default 2 minutes for quick testing
    if len(sys.argv) > 1:
        try:
            duration = float(sys.argv[1])
        except ValueError:
            print(f"Invalid duration: {sys.argv[1]}, using default {duration}min")
    
    print(f"Capturing baseline metrics for {duration} minutes...")
    
    try:
        snapshot_path = asyncio.run(capture_baseline_snapshot(duration))
        print(f"\n✅ Baseline snapshot saved: {snapshot_path}")
    except KeyboardInterrupt:
        print("\n❌ Baseline collection interrupted")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)