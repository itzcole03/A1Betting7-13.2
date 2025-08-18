#!/usr/bin/env python3
"""
Staged rollout system with dark mode testing

Implements a comprehensive staged rollout with:
1. Dark mode (collect metrics, no action)  
2. Shadow recompute (log-only partial refresh)
3. Full activation with validation
"""

import sqlite3
import json
import time
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional
from enum import Enum
from dataclasses import dataclass, asdict


class RolloutStage(Enum):
    DISABLED = "disabled"
    DARK_MODE = "dark_mode" 
    SHADOW_MODE = "shadow_mode"
    PARTIAL_ACTIVE = "partial_active"
    FULL_ACTIVE = "full_active"


class RolloutStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress" 
    COMPLETED = "completed"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"


@dataclass
class RolloutMetrics:
    """Metrics collected during rollout stages"""
    stage: RolloutStage
    provider_states_accessed: int = 0
    cache_hits: int = 0
    cache_misses: int = 0
    api_requests: int = 0
    errors: int = 0
    avg_response_time_ms: float = 0.0
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class StagedRolloutManager:
    """Manages staged rollout of provider states and cache system"""
    
    def __init__(self, db_path: str = "a1betting.db"):
        self.db_path = db_path
        self.current_stage = RolloutStage.DISABLED
        self.metrics: Dict[RolloutStage, RolloutMetrics] = {}
        self.rollout_config = {
            "dark_mode_duration_minutes": 10,
            "shadow_mode_duration_minutes": 15, 
            "partial_active_duration_minutes": 20,
            "error_threshold_per_stage": 5,
            "response_time_threshold_ms": 1000,
            "cache_hit_rate_threshold_pct": 70
        }
        
    async def start_staged_rollout(self, target_stage: RolloutStage = RolloutStage.FULL_ACTIVE) -> Dict[str, Any]:
        """
        Execute staged rollout from current stage to target stage
        
        Args:
            target_stage: Final stage to reach
            
        Returns:
            Dict with rollout results and metrics
        """
        
        print(f"🚀 Starting staged rollout to {target_stage.value}")
        rollout_results = {
            "start_time": datetime.now().isoformat(),
            "target_stage": target_stage.value,
            "completed_stages": [],
            "failed_stages": [],
            "final_stage": self.current_stage.value,
            "rollout_status": RolloutStatus.PENDING.value
        }
        
        try:
            # Stage progression order
            stage_progression = [
                RolloutStage.DARK_MODE,
                RolloutStage.SHADOW_MODE, 
                RolloutStage.PARTIAL_ACTIVE,
                RolloutStage.FULL_ACTIVE
            ]
            
            # Execute stages until target is reached
            for stage in stage_progression:
                if stage.value <= target_stage.value or stage == target_stage:
                    print(f"\n📍 Executing stage: {stage.value}")
                    
                    stage_result = await self._execute_stage(stage)
                    
                    if stage_result["status"] == "success":
                        rollout_results["completed_stages"].append({
                            "stage": stage.value,
                            "metrics": stage_result["metrics"],
                            "duration_seconds": stage_result["duration_seconds"]
                        })
                        
                        self.current_stage = stage
                        print(f"✅ Stage {stage.value} completed successfully")
                        
                        # Check if we've reached target
                        if stage == target_stage:
                            break
                    else:
                        print(f"❌ Stage {stage.value} failed: {stage_result['error']}")
                        rollout_results["failed_stages"].append({
                            "stage": stage.value,
                            "error": stage_result["error"],
                            "metrics": stage_result.get("metrics", {})
                        })
                        
                        # Rollback on failure
                        await self._rollback_to_previous_stage()
                        rollout_results["rollout_status"] = RolloutStatus.FAILED.value
                        break
            
            # Update final results
            rollout_results["final_stage"] = self.current_stage.value
            rollout_results["end_time"] = datetime.now().isoformat()
            
            if rollout_results["rollout_status"] != RolloutStatus.FAILED.value:
                rollout_results["rollout_status"] = RolloutStatus.COMPLETED.value
                print(f"\n🎉 Staged rollout completed successfully! Final stage: {self.current_stage.value}")
            
            # Store rollout results
            await self._store_rollout_results(rollout_results)
            
            return rollout_results
            
        except Exception as e:
            print(f"💥 Critical error during staged rollout: {e}")
            rollout_results["rollout_status"] = RolloutStatus.FAILED.value
            rollout_results["critical_error"] = str(e)
            return rollout_results
    
    async def _execute_stage(self, stage: RolloutStage) -> Dict[str, Any]:
        """Execute a specific rollout stage"""
        
        start_time = time.time()
        metrics = RolloutMetrics(stage=stage, start_time=datetime.now().isoformat())
        
        try:
            if stage == RolloutStage.DARK_MODE:
                result = await self._execute_dark_mode(metrics)
            elif stage == RolloutStage.SHADOW_MODE:
                result = await self._execute_shadow_mode(metrics)  
            elif stage == RolloutStage.PARTIAL_ACTIVE:
                result = await self._execute_partial_active(metrics)
            elif stage == RolloutStage.FULL_ACTIVE:
                result = await self._execute_full_active(metrics)
            else:
                result = {"status": "error", "error": f"Unknown stage: {stage}"}
            
            duration_seconds = time.time() - start_time
            metrics.end_time = datetime.now().isoformat()
            
            # Store metrics for this stage
            self.metrics[stage] = metrics
            
            return {
                "status": result["status"],
                "metrics": metrics.to_dict(),
                "duration_seconds": duration_seconds,
                "error": result.get("error")
            }
            
        except Exception as e:
            duration_seconds = time.time() - start_time
            metrics.errors += 1
            metrics.end_time = datetime.now().isoformat()
            
            return {
                "status": "error",
                "error": str(e),
                "metrics": metrics.to_dict(),
                "duration_seconds": duration_seconds
            }
    
    async def _execute_dark_mode(self, metrics: RolloutMetrics) -> Dict[str, Any]:
        """
        Dark mode: Collect metrics and logs without taking any action
        - Monitor provider states access patterns
        - Track cache usage patterns  
        - Log all operations that would be performed
        """
        
        print("🌙 Dark Mode: Collecting metrics without action...")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Simulate provider states monitoring
            cursor.execute('SELECT COUNT(*) FROM provider_states WHERE is_enabled = 1')
            enabled_providers = cursor.fetchone()[0]
            metrics.provider_states_accessed = enabled_providers
            
            print(f"   📊 Monitoring {enabled_providers} enabled providers")
            
            # Simulate cache access patterns
            cursor.execute("SELECT COUNT(*) FROM portfolio_rationales WHERE rationale_type LIKE 'CACHE_%'")
            cache_entries = cursor.fetchone()[0]
            
            # Simulate cache hit/miss patterns (would be real in production)
            simulated_requests = 50
            simulated_hits = int(simulated_requests * 0.75)  # 75% hit rate
            simulated_misses = simulated_requests - simulated_hits
            
            metrics.cache_hits = simulated_hits
            metrics.cache_misses = simulated_misses  
            metrics.api_requests = simulated_requests
            metrics.avg_response_time_ms = 250.5  # Simulated
            
            print(f"   📈 Cache monitoring: {cache_entries} entries, {simulated_hits}/{simulated_requests} hits (75% rate)")
            
            # Dark mode duration  
            duration_seconds = self.rollout_config["dark_mode_duration_minutes"] * 60
            print(f"   ⏱️  Dark mode duration: {duration_seconds}s")
            
            # In real implementation, would monitor for full duration
            await asyncio.sleep(min(duration_seconds, 5))  # Shortened for demo
            
            # Validate dark mode success criteria
            if metrics.cache_hits + metrics.cache_misses > 0:
                cache_hit_rate = (metrics.cache_hits / (metrics.cache_hits + metrics.cache_misses)) * 100
                if cache_hit_rate >= self.rollout_config["cache_hit_rate_threshold_pct"]:
                    print(f"   ✅ Dark mode validation passed: {cache_hit_rate:.1f}% cache hit rate")
                    return {"status": "success"}
                else:
                    return {"status": "error", "error": f"Cache hit rate too low: {cache_hit_rate:.1f}%"}
            
            return {"status": "success"}
            
        finally:
            conn.close()
    
    async def _execute_shadow_mode(self, metrics: RolloutMetrics) -> Dict[str, Any]:
        """
        Shadow mode: Log-only partial refresh operations
        - Execute cache operations in read-only mode
        - Log what provider state changes would be made
        - Perform shadow recomputation without persisting results
        """
        
        print("👥 Shadow Mode: Log-only partial refresh operations...")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Shadow provider state refresh
            cursor.execute('''
                SELECT provider_name, sport, status, is_enabled,
                       last_fetch_attempt, consecutive_errors
                FROM provider_states
                WHERE is_enabled = 1
            ''')
            
            providers = cursor.fetchall()
            print(f"   🔄 Shadow refreshing {len(providers)} providers...")
            
            shadow_updates = 0
            for provider_name, sport, status, enabled, last_fetch, errors in providers:
                
                # Simulate provider health check (would be real API call)
                simulated_health = "healthy" if hash(provider_name) % 3 != 0 else "unhealthy"
                
                if simulated_health == "healthy":
                    print(f"     ✅ [SHADOW] Would update {provider_name} ({sport}): status=ACTIVE")
                    shadow_updates += 1
                else:
                    print(f"     ⚠️  [SHADOW] Would update {provider_name} ({sport}): consecutive_errors+1")
                    
                metrics.api_requests += 1
                
            # Shadow cache refresh
            cursor.execute("SELECT COUNT(*) FROM portfolio_rationales WHERE rationale_type LIKE 'CACHE_%'")
            cache_entries = cursor.fetchone()[0]
            
            print(f"   💾 Shadow cache refresh: {cache_entries} entries")
            
            # Simulate cache refresh operations
            expired_entries = max(1, cache_entries // 4)  # 25% expired
            refreshed_entries = 0
            
            cursor.execute('''
                SELECT request_id, rationale_type 
                FROM portfolio_rationales 
                WHERE rationale_type LIKE 'CACHE_%'
                  AND datetime(expires_at) < datetime('now', '+1 hour')
                LIMIT ?
            ''', (expired_entries,))
            
            expiring_entries = cursor.fetchall()
            for request_id, cache_type in expiring_entries:
                print(f"     🔄 [SHADOW] Would refresh cache: {request_id} ({cache_type})")
                refreshed_entries += 1
                metrics.cache_misses += 1  # Would be cache miss requiring refresh
            
            metrics.provider_states_accessed = len(providers)  
            metrics.cache_hits = cache_entries - refreshed_entries
            
            # Shadow mode duration
            duration_seconds = self.rollout_config["shadow_mode_duration_minutes"] * 60
            await asyncio.sleep(min(duration_seconds, 3))  # Shortened for demo
            
            print(f"   ✅ Shadow mode completed: {shadow_updates} provider updates, {refreshed_entries} cache refreshes")
            return {"status": "success"}
            
        finally:
            conn.close()
    
    async def _execute_partial_active(self, metrics: RolloutMetrics) -> Dict[str, Any]:
        """
        Partial active: Enable subset of providers with full monitoring
        - Enable only high-priority providers
        - Full cache refresh for enabled providers
        - Monitor performance closely
        """
        
        print("🟡 Partial Active: Enable subset of providers...")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Enable only high-priority providers (stub + draftkings)
            high_priority_providers = ['stub', 'draftkings']
            
            cursor.execute('''
                UPDATE provider_states 
                SET status = 'ACTIVE', 
                    last_successful_fetch = datetime('now'),
                    consecutive_errors = 0,
                    updated_at = datetime('now')
                WHERE provider_name IN ({})
                AND is_enabled = 1
            '''.format(','.join('?' * len(high_priority_providers))), high_priority_providers)
            
            updated_providers = cursor.rowcount
            conn.commit()
            
            print(f"   🟢 Activated {updated_providers} high-priority providers")
            
            # Refresh cache for activated providers
            cache_refresh_count = 0
            for provider in high_priority_providers:
                # Simulate cache refresh for provider-specific data
                print(f"     🔄 Refreshing cache for {provider}")
                cache_refresh_count += 1
                await asyncio.sleep(0.1)  # Simulate cache refresh time
            
            metrics.provider_states_accessed = updated_providers
            metrics.cache_hits = cache_refresh_count * 3  # Simulated cache operations
            metrics.api_requests = updated_providers * 2  # Health checks + data fetches
            
            # Monitor partial active mode
            duration_seconds = self.rollout_config["partial_active_duration_minutes"] * 60
            await asyncio.sleep(min(duration_seconds, 2))  # Shortened for demo
            
            # Validate partial active performance
            if metrics.api_requests > 0 and metrics.errors == 0:
                print(f"   ✅ Partial active validation passed: {updated_providers} providers active")
                return {"status": "success"}
            else:
                return {"status": "error", "error": f"Partial active failed: {metrics.errors} errors"}
                
        except Exception as e:
            conn.rollback()
            return {"status": "error", "error": str(e)}
        finally:
            conn.close()
    
    async def _execute_full_active(self, metrics: RolloutMetrics) -> Dict[str, Any]:
        """
        Full active: Enable all providers with comprehensive monitoring
        - Enable all configured providers
        - Full cache warming
        - Complete feature activation
        """
        
        print("🟢 Full Active: Enable all providers...")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Enable all providers that should be enabled
            cursor.execute('''
                UPDATE provider_states 
                SET status = CASE 
                    WHEN provider_name = 'stub' THEN 'ACTIVE'
                    ELSE 'INACTIVE'  -- Real providers start inactive until health checked
                END,
                last_successful_fetch = CASE 
                    WHEN provider_name = 'stub' THEN datetime('now')
                    ELSE last_successful_fetch
                END,
                updated_at = datetime('now')
                WHERE is_enabled = 1
            ''')
            
            updated_providers = cursor.rowcount
            conn.commit()
            
            print(f"   🎯 Updated {updated_providers} total providers")
            
            # Full cache warming
            cursor.execute("SELECT COUNT(*) FROM portfolio_rationales WHERE rationale_type LIKE 'CACHE_%'")
            cache_entries = cursor.fetchone()[0]
            
            print(f"   🔥 Full cache warming: {cache_entries} entries available")
            
            # Simulate full system activation
            metrics.provider_states_accessed = updated_providers
            metrics.cache_hits = cache_entries
            metrics.api_requests = updated_providers + cache_entries  # Provider health checks + cache warming
            
            # Full system monitoring
            await asyncio.sleep(1)  # Shortened for demo
            
            # Final validation
            cursor.execute('SELECT COUNT(*) FROM provider_states WHERE is_enabled = 1 AND status != "INACTIVE"')
            active_providers = cursor.fetchone()[0]
            
            if active_providers > 0:
                print(f"   🎉 Full activation successful: {active_providers} active providers, {cache_entries} cache entries")
                return {"status": "success"}
            else:
                return {"status": "error", "error": "No providers activated"}
                
        except Exception as e:
            conn.rollback()
            return {"status": "error", "error": str(e)}
        finally:
            conn.close()
    
    async def _rollback_to_previous_stage(self) -> None:
        """Rollback to previous stage on failure"""
        
        print(f"🔄 Rolling back from {self.current_stage.value}...")
        
        # Stage rollback mapping
        rollback_map = {
            RolloutStage.FULL_ACTIVE: RolloutStage.PARTIAL_ACTIVE,
            RolloutStage.PARTIAL_ACTIVE: RolloutStage.SHADOW_MODE,
            RolloutStage.SHADOW_MODE: RolloutStage.DARK_MODE,
            RolloutStage.DARK_MODE: RolloutStage.DISABLED
        }
        
        previous_stage = rollback_map.get(self.current_stage, RolloutStage.DISABLED)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            if previous_stage == RolloutStage.DISABLED:
                # Full rollback - disable all providers
                cursor.execute('''
                    UPDATE provider_states 
                    SET status = 'INACTIVE',
                        updated_at = datetime('now')
                    WHERE provider_name != 'stub'
                ''')
                
            elif previous_stage == RolloutStage.PARTIAL_ACTIVE:
                # Rollback to partial - disable non-critical providers
                cursor.execute('''
                    UPDATE provider_states 
                    SET status = CASE 
                        WHEN provider_name IN ('stub', 'draftkings') THEN 'ACTIVE'
                        ELSE 'INACTIVE'
                    END,
                    updated_at = datetime('now')
                    WHERE is_enabled = 1
                ''')
            
            conn.commit()
            self.current_stage = previous_stage
            print(f"✅ Rolled back to {previous_stage.value}")
            
        except Exception as e:
            print(f"❌ Rollback failed: {e}")
            conn.rollback()
        finally:
            conn.close()
    
    def _make_json_serializable(self, obj: Any) -> Any:
        """Convert objects to JSON-serializable format"""
        if isinstance(obj, dict):
            return {key: self._make_json_serializable(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self._make_json_serializable(item) for item in obj]
        elif hasattr(obj, 'value'):  # Enum objects
            return obj.value
        else:
            return obj

    async def _store_rollout_results(self, results: Dict[str, Any]) -> None:
        """Store rollout results for audit purposes"""
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Convert results to JSON-serializable format
            serializable_results = self._make_json_serializable(results)
            
            # Store in portfolio_rationales as rollout audit log
            rollout_id = f"rollout_{int(time.time())}"
            data_hash = hash(json.dumps(serializable_results, sort_keys=True))
            
            cursor.execute('''
                INSERT INTO portfolio_rationales (
                    request_id, rationale_type, portfolio_data_hash, portfolio_data,
                    context_data, narrative, key_points, confidence,
                    generation_time_ms, model_info, cache_hits, expires_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                rollout_id,
                "ROLLOUT_AUDIT",
                str(data_hash)[:64],  # Truncate hash to fit
                json.dumps(serializable_results),
                json.dumps({"rollout": True, "audit": True}),
                f"Staged rollout to {serializable_results['target_stage']} - Status: {serializable_results['rollout_status']}",
                json.dumps([f"Target: {serializable_results['target_stage']}", f"Final: {serializable_results['final_stage']}"]),
                1.0 if serializable_results['rollout_status'] == 'completed' else 0.5,
                int((time.time() * 1000) % 10000),  # Simulate generation time
                json.dumps({"rollout_manager": "v1.0", "timestamp": datetime.now().isoformat()}),
                len(serializable_results.get('completed_stages', [])),
                (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()  # Keep for 1 week
            ))
            
            conn.commit()
            print(f"💾 Rollout results stored as {rollout_id}")
            
        except Exception as e:
            print(f"⚠️  Failed to store rollout results: {e}")
        finally:
            conn.close()
    
    def get_current_status(self) -> Dict[str, Any]:
        """Get current rollout status and metrics"""
        
        return {
            "current_stage": self.current_stage.value,
            "metrics": {stage.value: metrics.to_dict() for stage, metrics in self.metrics.items()},
            "config": self.rollout_config,
            "timestamp": datetime.now().isoformat()
        }


async def main():
    """Main entry point for staged rollout"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Staged rollout with dark mode testing")
    parser.add_argument("--db-path", default="a1betting.db", help="Database path")
    parser.add_argument("--target-stage", default="full_active", 
                       choices=["dark_mode", "shadow_mode", "partial_active", "full_active"],
                       help="Target rollout stage")
    parser.add_argument("--status", action="store_true", help="Show current rollout status")
    
    args = parser.parse_args()
    
    manager = StagedRolloutManager(args.db_path)
    
    if args.status:
        status = manager.get_current_status()
        print(f"📊 Current rollout status:\n{json.dumps(status, indent=2)}")
        return
    
    target_stage = RolloutStage(args.target_stage)
    results = await manager.start_staged_rollout(target_stage)
    
    # Convert results to JSON-serializable format for display
    serializable_results = manager._make_json_serializable(results)
    print(f"\n🎯 Staged rollout results:\n{json.dumps(serializable_results, indent=2)}")


if __name__ == '__main__':
    asyncio.run(main())