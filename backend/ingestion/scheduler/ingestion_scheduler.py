"""
Ingestion Scheduler

Placeholder service for scheduling periodic data ingestion runs.
Provides background task management for automated data pipeline execution.

TODO: Integrate with proper job scheduler (Celery, APScheduler, or similar).
"""

import asyncio
import logging
from typing import Optional, Callable, Dict, Any
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class IngestionScheduler:
    """
    Background scheduler for automated ingestion pipeline execution.
    
    Provides basic periodic scheduling capabilities. This is a placeholder
    implementation that should be replaced with a proper job scheduler
    in production environments.
    """
    
    def __init__(self):
        """Initialize the scheduler."""
        self.running = False
        self.tasks: Dict[str, asyncio.Task] = {}
        self.schedules: Dict[str, Dict[str, Any]] = {}
        
    def schedule_periodic_nba_ingest(
        self, 
        interval_sec: int = 180,  # 3 minutes default
        limit: Optional[int] = None,
        allow_upsert: bool = True,
        auto_start: bool = False
    ) -> str:
        """
        Schedule periodic NBA ingestion.
        
        Args:
            interval_sec: Interval between runs in seconds
            limit: Max props per run
            allow_upsert: Whether to allow database writes
            auto_start: Whether to start immediately
            
        Returns:
            Schedule ID for management
        """
        schedule_id = f"nba_ingest_{int(datetime.now().timestamp())}"
        
        schedule_config = {
            "type": "nba_ingestion",
            "interval_sec": interval_sec,
            "limit": limit,
            "allow_upsert": allow_upsert,
            "created_at": datetime.now(),
            "last_run": None,
            "next_run": datetime.now() + timedelta(seconds=interval_sec if not auto_start else 0),
            "run_count": 0,
            "error_count": 0
        }
        
        self.schedules[schedule_id] = schedule_config
        logger.info(f"Scheduled NBA ingestion: {schedule_id} (interval: {interval_sec}s)")
        
        if auto_start:
            self.start_scheduler()
        
        return schedule_id
    
    def start_scheduler(self):
        """Start the background scheduler."""
        if self.running:
            logger.warning("Scheduler already running")
            return
            
        self.running = True
        logger.info("Starting ingestion scheduler...")
        
        # Create main scheduler task
        self.tasks["main_scheduler"] = asyncio.create_task(self._scheduler_loop())
    
    def stop_scheduler(self):
        """Stop the background scheduler."""
        if not self.running:
            logger.warning("Scheduler not running")
            return
            
        logger.info("Stopping ingestion scheduler...")
        self.running = False
        
        # Cancel all tasks
        for task_id, task in self.tasks.items():
            if not task.done():
                task.cancel()
                logger.info(f"Cancelled task: {task_id}")
        
        self.tasks.clear()
    
    def get_schedule_status(self, schedule_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a scheduled task."""
        if schedule_id not in self.schedules:
            return None
            
        schedule = self.schedules[schedule_id].copy()
        schedule["active"] = self.running
        return schedule
    
    def list_schedules(self) -> Dict[str, Dict[str, Any]]:
        """List all active schedules."""
        return {
            schedule_id: {
                **config,
                "active": self.running
            }
            for schedule_id, config in self.schedules.items()
        }
    
    def remove_schedule(self, schedule_id: str) -> bool:
        """Remove a schedule."""
        if schedule_id in self.schedules:
            del self.schedules[schedule_id]
            logger.info(f"Removed schedule: {schedule_id}")
            return True
        return False
    
    async def _scheduler_loop(self):
        """Main scheduler loop."""
        logger.info("Scheduler loop started")
        
        try:
            while self.running:
                current_time = datetime.now()
                
                # Check each schedule
                for schedule_id, config in self.schedules.items():
                    if current_time >= config["next_run"]:
                        # Time to run this schedule
                        logger.info(f"Triggering scheduled run: {schedule_id}")
                        
                        # Create execution task
                        task_id = f"{schedule_id}_run_{config['run_count']}"
                        self.tasks[task_id] = asyncio.create_task(
                            self._execute_scheduled_run(schedule_id, config)
                        )
                        
                        # Update schedule
                        config["last_run"] = current_time
                        config["next_run"] = current_time + timedelta(seconds=config["interval_sec"])
                        config["run_count"] += 1
                
                # Clean up completed tasks
                completed_tasks = [
                    task_id for task_id, task in self.tasks.items()
                    if task.done() and task_id != "main_scheduler"
                ]
                for task_id in completed_tasks:
                    del self.tasks[task_id]
                
                # Sleep for a bit before next check
                await asyncio.sleep(10)  # Check every 10 seconds
                
        except asyncio.CancelledError:
            logger.info("Scheduler loop cancelled")
        except Exception as e:
            logger.error(f"Scheduler loop error: {e}", exc_info=True)
        finally:
            logger.info("Scheduler loop ended")
    
    async def _execute_scheduled_run(self, schedule_id: str, config: Dict[str, Any]):
        """Execute a scheduled ingestion run."""
        try:
            logger.info(f"Executing scheduled {config['type']} run: {schedule_id}")
            
            if config["type"] == "nba_ingestion":
                from ..pipeline import run_nba_ingestion
                
                result = await run_nba_ingestion(
                    limit=config["limit"],
                    allow_upsert=config["allow_upsert"]
                )
                
                if result.status == "success":
                    logger.info(f"Scheduled run {schedule_id} completed successfully: "
                              f"{result.total_raw} props, {result.total_line_changes} changes")
                else:
                    logger.warning(f"Scheduled run {schedule_id} completed with issues: "
                                 f"{result.status}, {len(result.errors)} errors")
                    config["error_count"] += 1
            else:
                logger.error(f"Unknown schedule type: {config['type']}")
                config["error_count"] += 1
                
        except Exception as e:
            logger.error(f"Scheduled run {schedule_id} failed: {e}", exc_info=True)
            config["error_count"] += 1
    
    def __del__(self):
        """Cleanup on deletion."""
        if self.running:
            self.stop_scheduler()


# Global scheduler instance
_scheduler_instance: Optional[IngestionScheduler] = None


def get_scheduler() -> IngestionScheduler:
    """Get the global scheduler instance."""
    global _scheduler_instance
    if _scheduler_instance is None:
        _scheduler_instance = IngestionScheduler()
    return _scheduler_instance


def schedule_periodic_nba_ingest(interval_sec: int = 180) -> str:
    """
    Convenience function to schedule periodic NBA ingestion.
    
    Args:
        interval_sec: Interval between runs in seconds (default: 3 minutes)
        
    Returns:
        Schedule ID
    """
    scheduler = get_scheduler()
    return scheduler.schedule_periodic_nba_ingest(interval_sec=interval_sec)


# Example usage and testing functions
async def test_scheduler():
    """Test the scheduler functionality."""
    logger.info("Testing ingestion scheduler...")
    
    scheduler = get_scheduler()
    
    # Schedule a test run
    schedule_id = scheduler.schedule_periodic_nba_ingest(
        interval_sec=30,  # 30 seconds for testing
        limit=5,
        auto_start=True
    )
    
    # Let it run for a bit
    await asyncio.sleep(65)  # Wait for at least one execution
    
    # Check status
    status = scheduler.get_schedule_status(schedule_id)
    logger.info(f"Schedule status: {status}")
    
    # Stop scheduler
    scheduler.stop_scheduler()
    logger.info("Scheduler test completed")


if __name__ == "__main__":
    # Run scheduler test
    logging.basicConfig(level=logging.INFO)
    asyncio.run(test_scheduler())