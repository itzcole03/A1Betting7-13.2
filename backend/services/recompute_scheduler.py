"""
Edge Recompute Scheduler & Worker System
========================================

Core component for the Model Integrity Phase - orchestrates fast vs full recompute
pipeline to maintain edge reliability with minimal latency.

Key Responsibilities:
- Queue management for recompute jobs
- Fast vs Full recompute decision logic  
- Debounce protection to prevent thrashing
- Priority scheduling for high-impact updates
- Performance metrics tracking

Design Principles:
- Fast recompute: <400ms for line changes
- Full recompute: triggered by structural changes (lineup, weather, etc)
- Debounce window: 2s to aggregate rapid changes
- Priority: player props > team props > futures
"""

import asyncio
import json
import time
from datetime import datetime, timedelta
from enum import Enum
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Set, Callable, Any, Tuple
from collections import defaultdict, deque
import uuid
import logging

from ..services.unified_cache_service import unified_cache_service
from ..services.unified_error_handler import unified_error_handler

# Use standard Python logging for simplicity
logger = logging.getLogger("recompute_scheduler")


class RecomputeType(Enum):
    """Classification of recompute operations"""
    FAST = "fast"  # Line changes only - <400ms target
    FULL = "full"  # Structural changes - <2.5s target
    FORCED = "forced"  # Manual override


class RecomputePriority(Enum):
    """Priority levels for recompute jobs"""
    CRITICAL = 1  # Player props, main markets
    HIGH = 2      # Team props, popular markets  
    MEDIUM = 3    # Secondary markets
    LOW = 4       # Futures, long-term bets


class RecomputeTrigger(Enum):
    """What triggered the recompute"""
    LINE_CHANGE = "line_change"
    LINEUP_UPDATE = "lineup_update"
    WEATHER_CHANGE = "weather_change"
    INJURY_UPDATE = "injury_update"
    LIVE_EVENT = "live_event"
    MANUAL = "manual"
    SCHEDULED = "scheduled"


class RecomputeDecisionReason(Enum):
    """Detailed reasons for recompute decisions (for explainability)"""
    # Fast recompute reasons
    MINOR_LINE_MOVE = "minor_line_move"
    ODDS_UPDATE = "odds_update"
    VOLUME_CHANGE = "volume_change"
    
    # Full recompute reasons
    MAJOR_LINE_MOVE = "major_line_move" 
    LINEUP_CHANGE = "lineup_change"
    WEATHER_UPDATE = "weather_update"
    INJURY_REPORT = "injury_report"
    LIVE_SCORING = "live_scoring"
    PITCHER_CHANGE = "pitcher_change"
    
    # Skip reasons
    DEBOUNCED = "debounced"
    QUEUE_SATURATED = "queue_saturated"
    CIRCUIT_BREAKER = "circuit_breaker"
    PROP_RETIRED = "prop_retired"
    STALE_REQUEST = "stale_request"
    
    # System reasons
    FORCED_OVERRIDE = "forced_override"
    SCHEDULED_MAINTENANCE = "scheduled_maintenance"
    BACKFILL = "backfill"


class QueueSaturationAction(Enum):
    """Actions to take when queue is saturated"""
    REJECT_NEW = "reject_new"  # Reject new low-priority requests
    PURGE_OLDEST = "purge_oldest"  # Remove oldest low-priority jobs
    DOWNGRADE_PRIORITY = "downgrade_priority"  # Convert full to fast recomputes


@dataclass
class RecomputeJob:
    """Individual recompute job specification"""
    id: str
    game_id: str
    prop_ids: List[str]  # Empty = all props for game
    recompute_type: RecomputeType
    priority: RecomputePriority
    trigger: RecomputeTrigger
    decision_reason: RecomputeDecisionReason  # NEW: Explicit reason for explainability
    created_at: float
    scheduled_for: float  # Unix timestamp
    attempts: int = 0
    max_attempts: int = 3
    context: Optional[Dict[str, Any]] = None  # Additional context data
    priority_boost: float = 0.0  # NEW: Priority aging boost
    
    def __post_init__(self):
        if self.context is None:
            self.context = {}
    
    def get_effective_priority(self) -> float:
        """Get priority with aging boost applied"""
        return max(1.0, self.priority.value - self.priority_boost)


@dataclass
class RecomputeResult:
    """Result of a recompute operation"""
    job_id: str
    success: bool
    duration_ms: float
    props_updated: int
    edges_created: int
    edges_retired: int
    error_message: Optional[str] = None
    performance_metrics: Optional[Dict[str, Any]] = None
    
    def __post_init__(self):
        if self.performance_metrics is None:
            self.performance_metrics = {}


class RecomputeScheduler:
    """
    Orchestrates edge recompute operations with fast/full pipeline
    
    Features:
    - Intelligent debouncing to prevent thrashing
    - Priority-based job scheduling
    - Fast vs full recompute decision logic
    - Performance metrics collection
    - Circuit breaker for reliability
    """
    
    def __init__(self):
        self.job_queue: asyncio.PriorityQueue = asyncio.PriorityQueue()
        self.active_jobs: Dict[str, RecomputeJob] = {}
        self.job_history: deque = deque(maxlen=1000)
        self.debounce_windows: Dict[str, float] = {}  # game_id -> last_update_time
        
        # Configuration
        self.debounce_window_seconds = 2.0
        self.max_concurrent_jobs = 4
        self.fast_recompute_timeout_ms = 400
        self.full_recompute_timeout_ms = 2500
        
        # NEW: Queue saturation handling
        self.queue_max_size = 100  # REVALUE_QUEUE_MAX_SIZE
        self.queue_saturation_threshold = 0.9  # 90% full triggers saturation handling
        self.priority_aging_rate = 0.05  # Priority boost per second waiting
        self.saturation_action = QueueSaturationAction.PURGE_OLDEST
        
        # Metrics
        self.metrics = {
            "jobs_queued": 0,
            "jobs_completed": 0,
            "jobs_failed": 0,
            "jobs_rejected": 0,  # NEW: Saturation rejections
            "jobs_purged": 0,    # NEW: Saturation purges  
            "jobs_downgraded": 0,  # NEW: Full->Fast downgrades
            "fast_recomputes": 0,
            "full_recomputes": 0,
            "debounce_hits": 0,
            "average_latency_ms": 0.0,
            "queue_depth": 0,
            "priority_aging_events": 0,  # NEW: Priority aging applications
            "saturation_events": 0       # NEW: Queue saturation triggers
        }
        
        # Worker control
        self.workers_running = False
        self.worker_tasks: List[asyncio.Task] = []
        
        # Circuit breaker (enhanced with prop-specific tracking)
        self.circuit_breaker = {
            "failures_threshold": 10,
            "failures_window_minutes": 5,
            "recent_failures": deque(maxlen=20),
            "is_open": False,
            "last_failure_time": 0,
            "failed_props": defaultdict(int),  # NEW: Track failing prop IDs
            "prop_failure_threshold": 3       # NEW: Max failures per prop
        }
        
        logger.info(f"RecomputeScheduler initialized - max_concurrent: {self.max_concurrent_jobs}, "
                   f"debounce: {self.debounce_window_seconds}s, fast_timeout: {self.fast_recompute_timeout_ms}ms, "
                   f"full_timeout: {self.full_recompute_timeout_ms}ms")

    async def start_workers(self):
        """Start the recompute worker tasks"""
        if self.workers_running:
            logger.warning("Workers already running")
            return
            
        self.workers_running = True
        logger.info(f"Starting recompute workers - count: {self.max_concurrent_jobs}")
        
        # Start worker tasks
        for i in range(self.max_concurrent_jobs):
            task = asyncio.create_task(self._worker(f"worker-{i}"))
            self.worker_tasks.append(task)
            
        # Start metrics collection task
        metrics_task = asyncio.create_task(self._metrics_collector())
        self.worker_tasks.append(metrics_task)

    async def stop_workers(self):
        """Stop all worker tasks gracefully"""
        if not self.workers_running:
            return
            
        logger.info("Stopping recompute workers")
        self.workers_running = False
        
        # Cancel all worker tasks
        for task in self.worker_tasks:
            task.cancel()
            
        # Wait for tasks to complete
        if self.worker_tasks:
            await asyncio.gather(*self.worker_tasks, return_exceptions=True)
            
        self.worker_tasks.clear()
        logger.info("All recompute workers stopped")

    def should_debounce(self, game_id: str) -> bool:
        """Check if we should debounce updates for this game"""
        now = time.time()
        last_update = self.debounce_windows.get(game_id, 0)
        
        if now - last_update < self.debounce_window_seconds:
            self.metrics["debounce_hits"] += 1
            logger.debug(f"Debouncing recompute for game {game_id} - "
                        f"time_since_last: {(now - last_update) * 1000:.0f}ms, "
                        f"window: {self.debounce_window_seconds * 1000:.0f}ms")
            return True
            
        return False

    def determine_recompute_type(self, trigger: RecomputeTrigger, context: Optional[Dict[str, Any]] = None) -> Tuple[RecomputeType, RecomputeDecisionReason]:
        """
        Determine whether to do fast or full recompute based on trigger type
        
        Fast Recompute Triggers:
        - Line changes only
        - Minor adjustments
        
        Full Recompute Triggers:  
        - Lineup changes
        - Weather updates
        - Injury reports
        - Live game events
        
        Returns:
            Tuple of (RecomputeType, RecomputeDecisionReason)
        """
        context = context or {}
        
        # Fast recompute for simple line changes
        if trigger == RecomputeTrigger.LINE_CHANGE:
            # Check if this is a major line movement that requires full recompute
            line_change_magnitude = context.get("line_change_magnitude", 0)
            if line_change_magnitude > 0.5:  # >50 cent line move
                logger.info(f"Upgrading to full recompute due to large line movement - "
                           f"trigger: {trigger.value}, magnitude: {line_change_magnitude}")
                return RecomputeType.FULL, RecomputeDecisionReason.MAJOR_LINE_MOVE
            return RecomputeType.FAST, RecomputeDecisionReason.MINOR_LINE_MOVE
            
        # Full recompute for structural changes
        elif trigger == RecomputeTrigger.LINEUP_UPDATE:
            return RecomputeType.FULL, RecomputeDecisionReason.LINEUP_CHANGE
        elif trigger == RecomputeTrigger.WEATHER_CHANGE:
            return RecomputeType.FULL, RecomputeDecisionReason.WEATHER_UPDATE
        elif trigger == RecomputeTrigger.INJURY_UPDATE:
            return RecomputeType.FULL, RecomputeDecisionReason.INJURY_REPORT
        elif trigger == RecomputeTrigger.LIVE_EVENT:
            return RecomputeType.FULL, RecomputeDecisionReason.LIVE_SCORING
        elif trigger == RecomputeTrigger.MANUAL:
            return RecomputeType.FULL, RecomputeDecisionReason.FORCED_OVERRIDE
        elif trigger == RecomputeTrigger.SCHEDULED:
            return RecomputeType.FULL, RecomputeDecisionReason.SCHEDULED_MAINTENANCE
            
        # Default to full for safety
        return RecomputeType.FULL, RecomputeDecisionReason.FORCED_OVERRIDE

    def determine_priority(self, prop_ids: List[str], context: Optional[Dict[str, Any]] = None) -> RecomputePriority:
        """Determine job priority based on prop types and market importance"""
        context = context or {}
        
        if not prop_ids:  # Full game recompute
            return RecomputePriority.HIGH
            
        # Check for critical prop types (player props, main markets)
        critical_prop_patterns = ["player_", "pitcher_strikeouts", "batter_hits"]
        for prop_id in prop_ids[:5]:  # Check first 5 props for efficiency
            if any(pattern in prop_id.lower() for pattern in critical_prop_patterns):
                return RecomputePriority.CRITICAL
                
        # Medium priority for most props
        return RecomputePriority.MEDIUM

    def is_queue_saturated(self) -> bool:
        """Check if queue is approaching saturation"""
        current_size = self.job_queue.qsize()
        saturation_size = int(self.queue_max_size * self.queue_saturation_threshold)
        return current_size >= saturation_size

    async def handle_queue_saturation(self) -> bool:
        """
        Handle queue saturation using configured strategy
        
        Returns:
            True if saturation was handled, False if queue is full
        """
        if not self.is_queue_saturated():
            return True
            
        self.metrics["saturation_events"] += 1
        current_size = self.job_queue.qsize()
        
        logger.warning(f"Queue saturation detected - size: {current_size}/{self.queue_max_size}, "
                      f"threshold: {self.queue_saturation_threshold}, action: {self.saturation_action.value}")
        
        if self.saturation_action == QueueSaturationAction.REJECT_NEW:
            # Reject new low-priority requests
            return current_size < self.queue_max_size
            
        elif self.saturation_action == QueueSaturationAction.PURGE_OLDEST:
            # Remove oldest low-priority jobs from queue
            return await self._purge_low_priority_jobs()
            
        elif self.saturation_action == QueueSaturationAction.DOWNGRADE_PRIORITY:
            # Convert full recomputes to fast recomputes in queue
            return await self._downgrade_queue_jobs()
            
        return False

    async def _purge_low_priority_jobs(self) -> bool:
        """Purge oldest low-priority jobs from queue"""
        jobs_to_purge = []
        jobs_to_keep = []
        
        # Extract all jobs to sort and filter
        while not self.job_queue.empty():
            try:
                priority, timestamp, job = self.job_queue.get_nowait()
                if job.priority in [RecomputePriority.LOW, RecomputePriority.MEDIUM]:
                    jobs_to_purge.append((priority, timestamp, job))
                else:
                    jobs_to_keep.append((priority, timestamp, job))
            except asyncio.QueueEmpty:
                break
        
        # Sort purge candidates by age (oldest first)
        jobs_to_purge.sort(key=lambda x: x[1])  # Sort by timestamp
        
        # Purge up to 20% of queue or until under threshold
        target_purge_count = min(
            len(jobs_to_purge),
            max(1, int(self.queue_max_size * 0.2))
        )
        
        purged_count = 0
        for priority, timestamp, job in jobs_to_purge[:target_purge_count]:
            logger.info(f"Purging job due to queue saturation - job_id: {job.id}, "
                       f"age: {time.time() - job.created_at:.1f}s, priority: {job.priority.value}")
            purged_count += 1
            
        # Re-queue remaining jobs
        remaining_jobs = jobs_to_keep + jobs_to_purge[target_purge_count:]
        for priority, timestamp, job in remaining_jobs:
            await self.job_queue.put((priority, timestamp, job))
            
        self.metrics["jobs_purged"] += purged_count
        logger.info(f"Purged {purged_count} jobs from queue - new size: {self.job_queue.qsize()}")
        
        return True

    async def _downgrade_queue_jobs(self) -> bool:
        """Downgrade full recomputes to fast recomputes in queue"""
        jobs_to_requeue = []
        downgraded_count = 0
        
        # Extract and process all jobs
        while not self.job_queue.empty():
            try:
                priority, timestamp, job = self.job_queue.get_nowait()
                
                # Downgrade full recomputes to fast if not critical
                if (job.recompute_type == RecomputeType.FULL and 
                    job.priority not in [RecomputePriority.CRITICAL] and
                    job.trigger == RecomputeTrigger.LINE_CHANGE):
                    
                    job.recompute_type = RecomputeType.FAST
                    job.decision_reason = RecomputeDecisionReason.MINOR_LINE_MOVE
                    downgraded_count += 1
                    
                    logger.info(f"Downgraded job from full to fast - job_id: {job.id}")
                
                jobs_to_requeue.append((priority, timestamp, job))
                
            except asyncio.QueueEmpty:
                break
        
        # Re-queue all jobs
        for priority, timestamp, job in jobs_to_requeue:
            await self.job_queue.put((priority, timestamp, job))
            
        self.metrics["jobs_downgraded"] += downgraded_count
        logger.info(f"Downgraded {downgraded_count} jobs from full to fast recompute")
        
        return True

    def apply_priority_aging(self, job: RecomputeJob) -> None:
        """Apply priority aging boost to job that has been waiting"""
        wait_time = time.time() - job.created_at
        aging_boost = wait_time * self.priority_aging_rate
        
        if aging_boost > 0.1:  # Only apply significant boosts
            job.priority_boost += aging_boost
            self.metrics["priority_aging_events"] += 1
            
            logger.debug(f"Applied priority aging to job {job.id} - "
                        f"wait_time: {wait_time:.1f}s, boost: {aging_boost:.2f}")

    def check_prop_circuit_breaker(self, prop_ids: List[str]) -> Tuple[bool, Optional[RecomputeDecisionReason]]:
        """
        Check if any props should be blocked due to repeated failures
        
        Returns:
            (should_block, reason)
        """
        if not prop_ids:
            return False, None
            
        for prop_id in prop_ids:
            failures = self.circuit_breaker["failed_props"].get(prop_id, 0)
            if failures >= self.circuit_breaker["prop_failure_threshold"]:
                logger.warning(f"Prop circuit breaker triggered for {prop_id} - "
                             f"failures: {failures}, threshold: {self.circuit_breaker['prop_failure_threshold']}")
                return True, RecomputeDecisionReason.PROP_RETIRED
                
        return False, None

    async def schedule_recompute(
        self,
        game_id: str,
        trigger: RecomputeTrigger,
        prop_ids: Optional[List[str]] = None,
        context: Optional[Dict[str, Any]] = None,
        force_type: Optional[RecomputeType] = None
    ) -> Optional[str]:
        """
        Schedule a recompute job with enhanced queue saturation handling
        
        Args:
            game_id: Target game ID
            trigger: What triggered this recompute
            prop_ids: Specific props to recompute (None = all)
            context: Additional context data
            force_type: Override automatic type determination
            
        Returns:
            Job ID if scheduled, None if rejected/skipped
        """
        # Check circuit breaker
        if self.circuit_breaker["is_open"]:
            logger.warning(f"Circuit breaker open, rejecting recompute request - "
                          f"game_id: {game_id}, trigger: {trigger.value}")
            self.metrics["jobs_rejected"] += 1
            return None
        
        # Check prop-specific circuit breaker
        should_block, block_reason = self.check_prop_circuit_breaker(prop_ids or [])
        if should_block and block_reason:
            logger.warning(f"Prop circuit breaker triggered - game_id: {game_id}, reason: {block_reason.value}")
            self.metrics["jobs_rejected"] += 1
            return None
            
        # Check debouncing
        if self.should_debounce(game_id) and trigger != RecomputeTrigger.MANUAL:
            logger.info(f"Skipping recompute due to debouncing - "
                        f"game_id: {game_id}, trigger: {trigger.value}")
            return None
            
        # Handle queue saturation
        if not await self.handle_queue_saturation():
            logger.warning(f"Rejecting recompute due to queue saturation - "
                          f"game_id: {game_id}, trigger: {trigger.value}")
            self.metrics["jobs_rejected"] += 1
            return None
            
        # Update debounce window
        self.debounce_windows[game_id] = time.time()
        
        # Determine job parameters
        context = context or {}
        
        if force_type:
            recompute_type = force_type
            decision_reason = RecomputeDecisionReason.FORCED_OVERRIDE
        else:
            recompute_type, decision_reason = self.determine_recompute_type(trigger, context)
            
        priority = self.determine_priority(prop_ids or [], context)
        
        # Create job
        job = RecomputeJob(
            id=str(uuid.uuid4()),
            game_id=game_id,
            prop_ids=prop_ids or [],
            recompute_type=recompute_type,
            priority=priority,
            trigger=trigger,
            decision_reason=decision_reason,
            created_at=time.time(),
            scheduled_for=time.time(),  # Immediate scheduling
            context=context
        )
        
        # Queue job (priority queue uses tuple: (effective_priority, timestamp, job))
        effective_priority = job.get_effective_priority()
        await self.job_queue.put((effective_priority, job.created_at, job))
        
        self.metrics["jobs_queued"] += 1
        self.metrics["queue_depth"] = self.job_queue.qsize()
        
        logger.info(f"Recompute job scheduled - job_id: {job.id}, game_id: {game_id}, "
                   f"type: {recompute_type.value}, priority: {priority.value}, trigger: {trigger.value}, "
                   f"reason: {decision_reason.value}, prop_count: {len(job.prop_ids) if job.prop_ids else 'all'}, "
                   f"queue_depth: {self.metrics['queue_depth']}")
        
        return job.id

    async def _worker(self, worker_id: str):
        """Individual worker that processes recompute jobs with priority aging"""
        logger.info(f"Recompute worker started - {worker_id}")
        
        while self.workers_running:
            try:
                # Get job from queue with timeout
                try:
                    priority, timestamp, job = await asyncio.wait_for(
                        self.job_queue.get(), 
                        timeout=1.0
                    )
                except asyncio.TimeoutError:
                    continue
                    
                self.metrics["queue_depth"] = self.job_queue.qsize()
                
                # Apply priority aging if job has been waiting
                self.apply_priority_aging(job)
                
                # Execute job
                try:
                    self.active_jobs[job.id] = job
                    result = await self._execute_job(job, worker_id)
                    
                    # Record result
                    self.job_history.append({
                        "job": asdict(job),
                        "result": asdict(result),
                        "worker_id": worker_id,
                        "completed_at": time.time()
                    })
                    
                    if result.success:
                        self.metrics["jobs_completed"] += 1
                        self._update_average_latency(result.duration_ms)
                        
                        if job.recompute_type == RecomputeType.FAST:
                            self.metrics["fast_recomputes"] += 1
                        else:
                            self.metrics["full_recomputes"] += 1
                            
                        # Clear prop failure counts on success
                        for prop_id in job.prop_ids:
                            if prop_id in self.circuit_breaker["failed_props"]:
                                del self.circuit_breaker["failed_props"][prop_id]
                    else:
                        self.metrics["jobs_failed"] += 1
                        self._record_failure(job.prop_ids)
                        
                except Exception as e:
                    logger.error(f"Job execution failed - job_id: {job.id}, worker_id: {worker_id}, "
                                f"error: {str(e)}")
                    self.metrics["jobs_failed"] += 1
                    self._record_failure(job.prop_ids)
                finally:
                    self.active_jobs.pop(job.id, None)
                    
            except Exception as e:
                logger.error(f"Worker error - worker_id: {worker_id}, error: {str(e)}")
                await asyncio.sleep(1)  # Brief pause on error
                
        logger.info(f"Recompute worker stopped - {worker_id}")

    async def _execute_job(self, job: RecomputeJob, worker_id: str) -> RecomputeResult:
        """Execute a single recompute job"""
        start_time = time.time()
        
        logger.info(f"Executing recompute job - job_id: {job.id}, game_id: {job.game_id}, "
                   f"type: {job.recompute_type.value}, worker_id: {worker_id}, "
                   f"prop_count: {len(job.prop_ids) if job.prop_ids else 'all'}")
        
        try:
            # Determine timeout based on recompute type
            timeout_ms = (
                self.fast_recompute_timeout_ms 
                if job.recompute_type == RecomputeType.FAST 
                else self.full_recompute_timeout_ms
            )
            
            # Execute the actual recompute logic
            # This will be implemented by importing and calling the appropriate services
            if job.recompute_type == RecomputeType.FAST:
                result = await self._execute_fast_recompute(job, timeout_ms)
            else:
                result = await self._execute_full_recompute(job, timeout_ms)
                
            duration_ms = (time.time() - start_time) * 1000
            
            logger.info(f"Recompute job completed - job_id: {job.id}, success: {result['success']}, "
                       f"duration: {duration_ms:.0f}ms, props_updated: {result.get('props_updated', 0)}, "
                       f"edges_created: {result.get('edges_created', 0)}, "
                       f"edges_retired: {result.get('edges_retired', 0)}")
            
            return RecomputeResult(
                job_id=job.id,
                success=result["success"],
                duration_ms=duration_ms,
                props_updated=result.get("props_updated", 0),
                edges_created=result.get("edges_created", 0),
                edges_retired=result.get("edges_retired", 0),
                performance_metrics=result.get("performance_metrics", {})
            )
            
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            error_msg = str(e)
            
            logger.error(f"Recompute job failed - job_id: {job.id}, duration: {duration_ms:.0f}ms, "
                        f"error: {error_msg}")
            
            return RecomputeResult(
                job_id=job.id,
                success=False,
                duration_ms=duration_ms,
                props_updated=0,
                edges_created=0,
                edges_retired=0,
                error_message=error_msg
            )

    async def _execute_fast_recompute(self, job: RecomputeJob, timeout_ms: int) -> Dict[str, Any]:
        """
        Execute fast recompute - line changes only
        Target: <400ms completion time
        """
        # TODO: Implement actual fast recompute logic
        # This should:
        # 1. Update valuations based on line changes
        # 2. Recalculate edges for affected props
        # 3. Update cache entries
        # 4. Return summary statistics
        
        # Placeholder implementation
        await asyncio.sleep(0.1)  # Simulate fast processing
        
        return {
            "success": True,
            "props_updated": len(job.prop_ids) if job.prop_ids else 50,
            "edges_created": 3,
            "edges_retired": 2,
            "performance_metrics": {
                "cache_hits": 15,
                "cache_misses": 2,
                "valuation_updates": len(job.prop_ids) if job.prop_ids else 50
            }
        }

    async def _execute_full_recompute(self, job: RecomputeJob, timeout_ms: int) -> Dict[str, Any]:
        """
        Execute full recompute - structural changes
        Target: <2.5s completion time
        """
        # TODO: Implement actual full recompute logic
        # This should:
        # 1. Rebuild all affected valuations from scratch
        # 2. Apply all adjustment layers (weather, lineups, injuries)
        # 3. Recalculate all edges and correlations
        # 4. Update all cache entries
        # 5. Return comprehensive statistics
        
        # Placeholder implementation
        await asyncio.sleep(0.5)  # Simulate full processing
        
        return {
            "success": True,
            "props_updated": 150,
            "edges_created": 12,
            "edges_retired": 8,
            "performance_metrics": {
                "adjustments_applied": 5,
                "correlations_updated": 25,
                "cache_invalidations": 100,
                "valuations_rebuilt": 150
            }
        }

    def _record_failure(self, prop_ids: Optional[List[str]] = None):
        """Record a failure for circuit breaker logic"""
        now = time.time()
        self.circuit_breaker["recent_failures"].append(now)
        self.circuit_breaker["last_failure_time"] = now
        
        # Track prop-specific failures
        if prop_ids:
            for prop_id in prop_ids:
                self.circuit_breaker["failed_props"][prop_id] += 1
                logger.debug(f"Recorded failure for prop {prop_id} - "
                            f"count: {self.circuit_breaker['failed_props'][prop_id]}")
        
        # Check if we should open the circuit breaker
        failures_in_window = [
            f for f in self.circuit_breaker["recent_failures"]
            if now - f < (self.circuit_breaker["failures_window_minutes"] * 60)
        ]
        
        if len(failures_in_window) >= self.circuit_breaker["failures_threshold"]:
            self.circuit_breaker["is_open"] = True
            logger.error(f"Circuit breaker opened due to high failure rate - "
                        f"failures_in_window: {len(failures_in_window)}, "
                        f"threshold: {self.circuit_breaker['failures_threshold']}, "
                        f"window_minutes: {self.circuit_breaker['failures_window_minutes']}")

    def _update_average_latency(self, duration_ms: float):
        """Update rolling average latency"""
        current_avg = self.metrics["average_latency_ms"]
        # Simple exponential moving average with alpha=0.1
        self.metrics["average_latency_ms"] = current_avg * 0.9 + duration_ms * 0.1

    async def _metrics_collector(self):
        """Collect and export metrics periodically with enhanced cardinality control"""
        while self.workers_running:
            try:
                # Export metrics every 30 seconds
                await asyncio.sleep(30)
                
                # Create structured counters with controlled cardinality
                structured_metrics = {
                    # Core counters
                    "recompute_decisions_total": {
                        f"fast_{RecomputeDecisionReason.MINOR_LINE_MOVE.value}": self.metrics.get("fast_minor_line", 0),
                        f"fast_{RecomputeDecisionReason.ODDS_UPDATE.value}": self.metrics.get("fast_odds", 0),
                        f"full_{RecomputeDecisionReason.MAJOR_LINE_MOVE.value}": self.metrics.get("full_major_line", 0),
                        f"full_{RecomputeDecisionReason.LINEUP_CHANGE.value}": self.metrics.get("full_lineup", 0),
                        f"full_{RecomputeDecisionReason.WEATHER_UPDATE.value}": self.metrics.get("full_weather", 0),
                        f"full_{RecomputeDecisionReason.INJURY_REPORT.value}": self.metrics.get("full_injury", 0),
                        f"skip_{RecomputeDecisionReason.DEBOUNCED.value}": self.metrics["debounce_hits"],
                        f"skip_{RecomputeDecisionReason.QUEUE_SATURATED.value}": self.metrics["jobs_rejected"],
                        f"skip_{RecomputeDecisionReason.CIRCUIT_BREAKER.value}": self.metrics.get("circuit_breaker_blocks", 0)
                    },
                    "recompute_failures_total": {
                        "timeout": self.metrics.get("timeout_failures", 0),
                        "exception": self.metrics.get("exception_failures", 0),
                        "circuit_breaker": self.metrics.get("circuit_breaker_failures", 0)
                    },
                    "queue_management_total": {
                        "jobs_purged": self.metrics["jobs_purged"],
                        "jobs_downgraded": self.metrics["jobs_downgraded"],
                        "priority_aging_events": self.metrics["priority_aging_events"],
                        "saturation_events": self.metrics["saturation_events"]
                    }
                }
                
                # Gauges
                queue_metrics = {
                    "recompute_queue_depth": self.job_queue.qsize(),
                    "valuation_staleness_seconds_avg": self._calculate_avg_staleness(),
                    "active_jobs_count": len(self.active_jobs),
                    "circuit_breaker_open": 1 if self.circuit_breaker["is_open"] else 0
                }
                
                # Histograms (percentile buckets aligned to SLOs)
                latency_buckets = {
                    "recompute_latency_ms": {
                        "fast_p50": self.metrics.get("fast_latency_p50", 0),
                        "fast_p95": self.metrics.get("fast_latency_p95", 0),
                        "fast_slo_violations": self.metrics.get("fast_slo_violations", 0),  # >150ms
                        "full_p50": self.metrics.get("full_latency_p50", 0), 
                        "full_p95": self.metrics.get("full_latency_p95", 0),
                        "full_slo_violations": self.metrics.get("full_slo_violations", 0)   # >500ms
                    }
                }
                
                metrics_snapshot = {
                    **self.metrics,
                    "active_jobs": len(self.active_jobs),
                    "circuit_breaker_open": self.circuit_breaker["is_open"],
                    "timestamp": time.time(),
                    "structured_counters": structured_metrics,
                    "gauges": queue_metrics,
                    "histograms": latency_buckets
                }
                
                # Store metrics in cache for API access
                await unified_cache_service.set(
                    "recompute_metrics",
                    metrics_snapshot,
                    ttl=60  # 1 minute TTL
                )
                
                logger.info(f"Enhanced metrics collected - queue: {queue_metrics['recompute_queue_depth']}, "
                           f"active: {queue_metrics['active_jobs_count']}, "
                           f"saturations: {self.metrics['saturation_events']}, "
                           f"rejections: {self.metrics['jobs_rejected']}")
                
            except Exception as e:
                logger.error(f"Metrics collection failed - error: {str(e)}")

    def _calculate_avg_staleness(self) -> float:
        """Calculate average staleness of active jobs"""
        if not self.active_jobs:
            return 0.0
            
        now = time.time()
        staleness_values = [now - job.created_at for job in self.active_jobs.values()]
        return sum(staleness_values) / len(staleness_values)

    def get_status(self) -> Dict[str, Any]:
        """Get current scheduler status"""
        return {
            "workers_running": self.workers_running,
            "worker_count": len(self.worker_tasks),
            "queue_depth": self.job_queue.qsize(),
            "active_jobs": len(self.active_jobs),
            "circuit_breaker_open": self.circuit_breaker["is_open"],
            "metrics": self.metrics.copy()
        }

    def get_job_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent job history"""
        return list(self.job_history)[-limit:]


# Global scheduler instance
recompute_scheduler = RecomputeScheduler()