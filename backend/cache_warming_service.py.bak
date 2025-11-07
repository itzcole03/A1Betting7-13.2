#!/usr/bin/env python3
"""
Cache warming system for correlations and factors

This script implements cache warming for frequently accessed data patterns,
focusing on prop correlations, player performance factors, and betting patterns.
"""

import sqlite3
import json
import hashlib
import asyncio
import aiohttp
import time
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional, Tuple
from collections import defaultdict
import os


class CacheWarmingService:
    """Service for warming various cache layers"""
    
    def __init__(self, db_path: str = "a1betting.db", api_base_url: str = "http://localhost:8000"):
        self.db_path = db_path
        self.api_base_url = api_base_url
        self.cache_stats = {
            "correlation_warmups": 0,
            "factor_warmups": 0,
            "player_warmups": 0,
            "prop_type_warmups": 0,
            "errors": 0,
            "start_time": time.time()
        }
        
    async def warm_all_caches(self, 
                             warm_correlations: bool = True,
                             warm_factors: bool = True,
                             warm_player_data: bool = True,
                             dry_run: bool = False) -> Dict[str, Any]:
        """
        Warm all cache layers based on historical data patterns
        
        Args:
            warm_correlations: Whether to warm prop correlation caches
            warm_factors: Whether to warm factor model caches  
            warm_player_data: Whether to warm player performance caches
            dry_run: If True, only analyze what would be warmed without making requests
        """
        
        print("🔥 Starting comprehensive cache warming...")
        results = {}
        
        try:
            # 1. Analyze existing data to identify warming targets
            warming_targets = await self._analyze_warming_targets()
            
            if dry_run:
                print("🔍 DRY RUN: Cache warming analysis:")
                self._print_warming_analysis(warming_targets)
                return {"dry_run": True, "targets": warming_targets}
            
            # 2. Warm correlation caches
            if warm_correlations and warming_targets.get("correlations"):
                print("\n🔗 Warming correlation caches...")
                results["correlations"] = await self._warm_correlation_cache(
                    warming_targets["correlations"]
                )
                
            # 3. Warm factor model caches
            if warm_factors and warming_targets.get("factors"):
                print("\n🧮 Warming factor model caches...")
                results["factors"] = await self._warm_factor_cache(
                    warming_targets["factors"]
                )
                
            # 4. Warm player performance caches
            if warm_player_data and warming_targets.get("players"):
                print("\n👤 Warming player data caches...")
                results["players"] = await self._warm_player_cache(
                    warming_targets["players"]
                )
                
            # 5. Store warming results in portfolio_rationales for tracking
            await self._store_cache_warming_results(results)
            
            elapsed = time.time() - self.cache_stats["start_time"]
            print(f"\n✅ Cache warming completed in {elapsed:.2f}s")
            print(f"📊 Stats: {self.cache_stats}")
            
            return results
            
        except Exception as e:
            print(f"❌ Error during cache warming: {e}")
            self.cache_stats["errors"] += 1
            return {"error": str(e), "stats": self.cache_stats}
    
    async def _analyze_warming_targets(self) -> Dict[str, Any]:
        """Analyze database to identify top cache warming targets"""
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            targets = {
                "correlations": [],
                "factors": [],
                "players": []
            }
            
            # Find top prop types for correlation analysis
            cursor.execute('''
                SELECT p.prop_type, COUNT(*) as prediction_count,
                       COUNT(DISTINCT p.player_id) as unique_players
                FROM predictions p 
                JOIN model_predictions mp ON p.id = mp.prediction_id
                WHERE p.created_at >= date('now', '-30 days')
                GROUP BY p.prop_type
                HAVING prediction_count >= 10
                ORDER BY prediction_count DESC
                LIMIT 10
            ''')
            
            prop_type_data = cursor.fetchall()
            if prop_type_data:
                targets["correlations"] = [
                    {
                        "prop_type": prop_type,
                        "prediction_count": count,
                        "unique_players": players,
                        "priority": "high" if count > 50 else "medium"
                    }
                    for prop_type, count, players in prop_type_data
                ]
            
            # Find top players for performance factor analysis  
            cursor.execute('''
                SELECT p.player_id, t.full_name as team_name,
                       COUNT(*) as prediction_count,
                       COUNT(DISTINCT p.prop_type) as prop_types,
                       AVG(CASE WHEN p.actual_value IS NOT NULL THEN 1.0 ELSE 0.0 END) as completion_rate
                FROM predictions p
                LEFT JOIN teams t ON p.team_id = t.id
                WHERE p.created_at >= date('now', '-30 days')
                  AND p.player_id IS NOT NULL
                GROUP BY p.player_id, t.full_name
                HAVING prediction_count >= 5
                ORDER BY prediction_count DESC, prop_types DESC
                LIMIT 20
            ''')
            
            player_data = cursor.fetchall()
            if player_data:
                targets["players"] = [
                    {
                        "player_id": player_id,
                        "team_name": team_name or "Unknown",
                        "prediction_count": count,
                        "prop_types": prop_types,
                        "completion_rate": completion_rate,
                        "priority": "high" if count > 20 else "medium"
                    }
                    for player_id, team_name, count, prop_types, completion_rate in player_data
                ]
            
            # Find factor combinations for warming
            cursor.execute('''
                SELECT mp.model_version, COUNT(*) as usage_count,
                       COUNT(DISTINCT p.prop_type) as prop_type_coverage,
                       AVG(mp.confidence) as avg_confidence
                FROM model_predictions mp
                JOIN predictions p ON mp.prediction_id = p.id
                WHERE mp.created_at >= date('now', '-14 days')
                GROUP BY mp.model_version
                HAVING usage_count >= 5
                ORDER BY usage_count DESC, avg_confidence DESC
                LIMIT 8
            ''')
            
            factor_data = cursor.fetchall()
            if factor_data:
                targets["factors"] = [
                    {
                        "model_version": model_version,
                        "usage_count": usage_count,
                        "prop_type_coverage": coverage,
                        "avg_confidence": avg_confidence,
                        "priority": "high" if usage_count > 15 else "medium"
                    }
                    for model_version, usage_count, coverage, avg_confidence in factor_data
                ]
            
            return targets
            
        finally:
            conn.close()
    
    def _print_warming_analysis(self, targets: Dict[str, Any]) -> None:
        """Print analysis of cache warming targets"""
        
        print("\n🎯 Cache Warming Targets Analysis:")
        
        if targets.get("correlations"):
            print(f"\n🔗 Correlation Cache Targets ({len(targets['correlations'])} prop types):")
            for target in targets["correlations"][:5]:  # Show top 5
                print(f"   • {target['prop_type']}: {target['prediction_count']} predictions, "
                     f"{target['unique_players']} players ({target['priority']} priority)")
        
        if targets.get("players"):
            print(f"\n👤 Player Cache Targets ({len(targets['players'])} players):")
            for target in targets["players"][:5]:  # Show top 5
                print(f"   • Player {target['player_id']} ({target['team_name']}): "
                     f"{target['prediction_count']} predictions, {target['prop_types']} prop types "
                     f"({target['priority']} priority)")
        
        if targets.get("factors"):
            print(f"\n🧮 Factor Cache Targets ({len(targets['factors'])} models):")
            for target in targets["factors"][:5]:  # Show top 5
                print(f"   • Model {target['model_version']}: {target['usage_count']} uses, "
                     f"{target['prop_type_coverage']} prop types "
                     f"({target['priority']} priority)")
    
    async def _warm_correlation_cache(self, targets: List[Dict]) -> Dict[str, Any]:
        """Warm correlation caches for top prop types"""
        
        results = {"success": 0, "failed": 0, "prop_types": []}
        
        async with aiohttp.ClientSession() as session:
            for target in targets:
                try:
                    prop_type = target["prop_type"]
                    
                    # Simulate correlation matrix request for prop type
                    # In a real implementation, this would call actual correlation endpoints
                    cache_key = f"prop_correlation_{prop_type}"
                    
                    # For now, simulate cache warming by storing placeholder data
                    await self._store_cache_entry(
                        cache_key=cache_key,
                        entry_type="CORRELATION",
                        data={"prop_type": prop_type, "warmed_at": datetime.now().isoformat()},
                        ttl_seconds=7200  # 2 hours
                    )
                    
                    results["success"] += 1
                    results["prop_types"].append(prop_type)
                    self.cache_stats["correlation_warmups"] += 1
                    
                    print(f"   ✅ Warmed correlation cache for {prop_type}")
                    
                    # Small delay to avoid overwhelming
                    await asyncio.sleep(0.1)
                    
                except Exception as e:
                    print(f"   ❌ Failed to warm correlation cache for {target.get('prop_type', 'unknown')}: {e}")
                    results["failed"] += 1
                    self.cache_stats["errors"] += 1
        
        return results
    
    async def _warm_factor_cache(self, targets: List[Dict]) -> Dict[str, Any]:
        """Warm factor model caches"""
        
        results = {"success": 0, "failed": 0, "models": []}
        
        for target in targets:
            try:
                model_version = target["model_version"]
                
                # Simulate factor model cache warming
                cache_key = f"factor_model_{model_version}"
                
                await self._store_cache_entry(
                    cache_key=cache_key,
                    entry_type="FACTOR",
                    data={"model_version": model_version, "warmed_at": datetime.now().isoformat()},
                    ttl_seconds=14400  # 4 hours
                )
                
                results["success"] += 1
                results["models"].append(model_version)
                self.cache_stats["factor_warmups"] += 1
                
                print(f"   ✅ Warmed factor cache for model {model_version}")
                
            except Exception as e:
                print(f"   ❌ Failed to warm factor cache for {target.get('model_version', 'unknown')}: {e}")
                results["failed"] += 1
                self.cache_stats["errors"] += 1
        
        return results
    
    async def _warm_player_cache(self, targets: List[Dict]) -> Dict[str, Any]:
        """Warm player performance caches"""
        
        results = {"success": 0, "failed": 0, "players": []}
        
        for target in targets:
            try:
                player_id = target["player_id"]
                
                # Simulate player performance cache warming
                cache_key = f"player_performance_{player_id}"
                
                await self._store_cache_entry(
                    cache_key=cache_key,
                    entry_type="PLAYER",
                    data={
                        "player_id": player_id,
                        "team_name": target["team_name"],
                        "warmed_at": datetime.now().isoformat()
                    },
                    ttl_seconds=3600  # 1 hour
                )
                
                results["success"] += 1  
                results["players"].append(player_id)
                self.cache_stats["player_warmups"] += 1
                
                print(f"   ✅ Warmed player cache for {player_id} ({target['team_name']})")
                
            except Exception as e:
                print(f"   ❌ Failed to warm player cache for {target.get('player_id', 'unknown')}: {e}")
                results["failed"] += 1
                self.cache_stats["errors"] += 1
        
        return results
    
    async def _store_cache_entry(self, cache_key: str, entry_type: str, 
                                data: Dict[str, Any], ttl_seconds: int) -> None:
        """Store cache entry in portfolio_rationales table (repurposed for caching)"""
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            expires_at = datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)
            data_hash = hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()
            
            cursor.execute('''
                INSERT OR REPLACE INTO portfolio_rationales (
                    request_id, rationale_type, portfolio_data_hash, portfolio_data,
                    context_data, narrative, key_points, confidence,
                    generation_time_ms, model_info, cache_hits, expires_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                cache_key,  # request_id used as cache key
                f"CACHE_WARM_{entry_type}",  # rationale_type as cache type
                data_hash,  # portfolio_data_hash
                json.dumps(data),  # portfolio_data
                json.dumps({"cache_warming": True, "warmed_at": datetime.now().isoformat()}),  # context_data
                f"Cache warming entry for {entry_type}",  # narrative
                json.dumps([f"Warmed cache for {cache_key}"]),  # key_points
                1.0,  # confidence
                0,  # generation_time_ms
                json.dumps({"cache_warming_service": "v1.0"}),  # model_info
                1,  # cache_hits
                expires_at.isoformat()  # expires_at
            ))
            
            conn.commit()
            
        finally:
            conn.close()
    
    async def _store_cache_warming_results(self, results: Dict[str, Any]) -> None:
        """Store cache warming session results"""
        
        session_data = {
            "session_id": f"cache_warm_{int(time.time())}",
            "results": results,
            "stats": self.cache_stats,
            "completed_at": datetime.now().isoformat()
        }
        
        await self._store_cache_entry(
            cache_key=f"cache_warming_session_{int(time.time())}",
            entry_type="SESSION",
            data=session_data,
            ttl_seconds=86400  # 24 hours
        )


async def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Cache warming service for correlations and factors")
    parser.add_argument("--db-path", default="a1betting.db", 
                       help="Path to SQLite database")
    parser.add_argument("--api-url", default="http://localhost:8000",
                       help="Base URL for API requests")
    parser.add_argument("--dry-run", action="store_true",
                       help="Analyze warming targets without making changes")
    parser.add_argument("--correlations", action="store_true", default=True,
                       help="Warm correlation caches")
    parser.add_argument("--factors", action="store_true", default=True, 
                       help="Warm factor model caches")
    parser.add_argument("--players", action="store_true", default=True,
                       help="Warm player performance caches")
    
    args = parser.parse_args()
    
    service = CacheWarmingService(args.db_path, args.api_url)
    
    results = await service.warm_all_caches(
        warm_correlations=args.correlations,
        warm_factors=args.factors,
        warm_player_data=args.players,
        dry_run=args.dry_run
    )
    
    print(f"\n🎯 Cache warming results: {json.dumps(results, indent=2)}")


if __name__ == '__main__':
    asyncio.run(main())