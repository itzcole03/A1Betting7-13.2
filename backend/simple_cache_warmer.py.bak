#!/usr/bin/env python3
"""
Simple cache warming system for demonstration

Creates sample correlation and factor cache entries for the top sports and prop types
to demonstrate the cache warming capability.
"""

import sqlite3
import json
import hashlib
import time
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any


def create_sample_cache_data() -> Dict[str, List[Dict]]:
    """Create sample cache warming targets based on common sports betting patterns"""
    
    # Top NBA prop types for correlation analysis
    nba_props = [
        {"prop_type": "points", "priority": "high", "correlation_strength": 0.75},
        {"prop_type": "rebounds", "priority": "high", "correlation_strength": 0.68},
        {"prop_type": "assists", "priority": "high", "correlation_strength": 0.72},
        {"prop_type": "threes", "priority": "medium", "correlation_strength": 0.45},
        {"prop_type": "steals", "priority": "medium", "correlation_strength": 0.38},
    ]
    
    # Top MLB prop types
    mlb_props = [
        {"prop_type": "hits", "priority": "high", "correlation_strength": 0.82},
        {"prop_type": "runs", "priority": "high", "correlation_strength": 0.71},
        {"prop_type": "rbis", "priority": "high", "correlation_strength": 0.69},
        {"prop_type": "home_runs", "priority": "medium", "correlation_strength": 0.55},
        {"prop_type": "strikeouts", "priority": "medium", "correlation_strength": 0.63},
    ]
    
    # Top NFL prop types
    nfl_props = [
        {"prop_type": "passing_yards", "priority": "high", "correlation_strength": 0.78},
        {"prop_type": "rushing_yards", "priority": "high", "correlation_strength": 0.73},
        {"prop_type": "touchdowns", "priority": "high", "correlation_strength": 0.66},
        {"prop_type": "receptions", "priority": "medium", "correlation_strength": 0.58},
        {"prop_type": "sacks", "priority": "medium", "correlation_strength": 0.42},
    ]
    
    # Factor models for different sports
    factor_models = [
        {"sport": "NBA", "model_version": "nba_v2.1", "factors": ["pace", "efficiency", "matchup"], "priority": "high"},
        {"sport": "MLB", "model_version": "mlb_v1.8", "factors": ["batting", "pitching", "ballpark"], "priority": "high"},
        {"sport": "NFL", "model_version": "nfl_v3.0", "factors": ["offense", "defense", "weather"], "priority": "high"},
        {"sport": "NHL", "model_version": "nhl_v1.5", "factors": ["shooting", "saves", "power_play"], "priority": "medium"},
    ]
    
    # Sample players for performance caching
    sample_players = [
        {"sport": "NBA", "player_name": "LeBron James", "team": "LAL", "prop_coverage": 15},
        {"sport": "NBA", "player_name": "Luka Doncic", "team": "DAL", "prop_coverage": 12},
        {"sport": "MLB", "player_name": "Aaron Judge", "team": "NYY", "prop_coverage": 10},
        {"sport": "MLB", "player_name": "Mookie Betts", "team": "LAD", "prop_coverage": 9},
        {"sport": "NFL", "player_name": "Josh Allen", "team": "BUF", "prop_coverage": 8},
        {"sport": "NFL", "player_name": "Patrick Mahomes", "team": "KC", "prop_coverage": 8},
    ]
    
    return {
        "correlation_targets": {
            "NBA": nba_props,
            "MLB": mlb_props, 
            "NFL": nfl_props
        },
        "factor_targets": factor_models,
        "player_targets": sample_players
    }


def warm_cache_with_sample_data(db_path: str = "a1betting.db", dry_run: bool = False) -> Dict[str, Any]:
    """Warm cache with sample correlation and factor data"""
    
    print("🔥 Starting cache warming with sample data...")
    
    if not dry_run:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
    
    sample_data = create_sample_cache_data()
    results = {
        "correlations_warmed": 0,
        "factors_warmed": 0,
        "players_warmed": 0,
        "total_cache_entries": 0
    }
    
    try:
        # Warm correlation caches
        print("\n🔗 Warming correlation caches...")
        for sport, props in sample_data["correlation_targets"].items():
            print(f"\n   {sport} correlations:")
            for prop in props:
                prop_type = prop["prop_type"]
                
                if dry_run:
                    print(f"     • Would warm: {prop_type} (strength: {prop['correlation_strength']}, {prop['priority']} priority)")
                    continue
                
                # Create correlation cache entry
                cache_data = {
                    "sport": sport,
                    "prop_type": prop_type,
                    "correlation_strength": prop["correlation_strength"],
                    "priority": prop["priority"],
                    "cache_type": "correlation_matrix",
                    "warmed_at": datetime.now().isoformat(),
                    "sample_correlations": [
                        {"prop_pair": f"{prop_type}_vs_minutes", "correlation": prop["correlation_strength"] * 0.8},
                        {"prop_pair": f"{prop_type}_vs_usage_rate", "correlation": prop["correlation_strength"] * 0.6},
                        {"prop_pair": f"{prop_type}_vs_team_pace", "correlation": prop["correlation_strength"] * 0.4},
                    ]
                }
                
                cache_key = f"correlation_{sport.lower()}_{prop_type}"
                data_hash = hashlib.sha256(json.dumps(cache_data, sort_keys=True).encode()).hexdigest()
                expires_at = datetime.now(timezone.utc) + timedelta(seconds=7200)  # 2 hours
                
                cursor.execute('''
                    INSERT OR REPLACE INTO portfolio_rationales (
                        request_id, rationale_type, portfolio_data_hash, portfolio_data,
                        context_data, narrative, key_points, confidence,
                        generation_time_ms, model_info, cache_hits, expires_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    cache_key,
                    "CACHE_CORRELATION",
                    data_hash,
                    json.dumps(cache_data),
                    json.dumps({"sport": sport, "cache_warming": True}),
                    f"Correlation cache for {sport} {prop_type} props",
                    json.dumps([f"Warmed {prop_type} correlations", f"Strength: {prop['correlation_strength']}"]),
                    prop["correlation_strength"],
                    100,  # Simulated generation time
                    json.dumps({"cache_service": "v1.0", "sport": sport}),
                    1,
                    expires_at.isoformat()
                ))
                
                results["correlations_warmed"] += 1
                print(f"     ✅ Warmed: {prop_type} (strength: {prop['correlation_strength']})")
        
        # Warm factor model caches
        print("\n🧮 Warming factor model caches...")
        for factor_model in sample_data["factor_targets"]:
            sport = factor_model["sport"]
            model_version = factor_model["model_version"]
            
            if dry_run:
                print(f"     • Would warm: {model_version} for {sport} (factors: {', '.join(factor_model['factors'])})")
                continue
            
            # Create factor model cache entry
            cache_data = {
                "sport": sport,
                "model_version": model_version,
                "factors": factor_model["factors"],
                "priority": factor_model["priority"],
                "cache_type": "factor_model",
                "warmed_at": datetime.now().isoformat(),
                "factor_loadings": {
                    factor: round(0.3 + (0.4 * hash(factor) % 100) / 100, 3)  # Simulated loadings
                    for factor in factor_model["factors"]
                }
            }
            
            cache_key = f"factor_{sport.lower()}_{model_version.replace('.', '_')}"
            data_hash = hashlib.sha256(json.dumps(cache_data, sort_keys=True).encode()).hexdigest()
            expires_at = datetime.now(timezone.utc) + timedelta(seconds=14400)  # 4 hours
            
            cursor.execute('''
                INSERT OR REPLACE INTO portfolio_rationales (
                    request_id, rationale_type, portfolio_data_hash, portfolio_data,
                    context_data, narrative, key_points, confidence,
                    generation_time_ms, model_info, cache_hits, expires_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                cache_key,
                "CACHE_FACTOR",
                data_hash,
                json.dumps(cache_data),
                json.dumps({"sport": sport, "cache_warming": True}),
                f"Factor model cache for {sport} {model_version}",
                json.dumps([f"Cached {model_version} factors", f"Factors: {', '.join(factor_model['factors'])}"]),
                0.85,  # High confidence for factor models
                200,  # Simulated generation time
                json.dumps({"cache_service": "v1.0", "model_version": model_version}),
                1,
                expires_at.isoformat()
            ))
            
            results["factors_warmed"] += 1
            print(f"     ✅ Warmed: {model_version} for {sport}")
        
        # Warm player performance caches
        print("\n👤 Warming player performance caches...")
        for player in sample_data["player_targets"]:
            if dry_run:
                print(f"     • Would warm: {player['player_name']} ({player['team']}) - {player['prop_coverage']} props")
                continue
            
            # Create player performance cache entry
            cache_data = {
                "sport": player["sport"],
                "player_name": player["player_name"],
                "team": player["team"],
                "prop_coverage": player["prop_coverage"],
                "cache_type": "player_performance",
                "warmed_at": datetime.now().isoformat(),
                "performance_metrics": {
                    "games_analyzed": 20 + (hash(player["player_name"]) % 10),
                    "consistency_score": round(0.6 + (0.3 * hash(player["player_name"]) % 100) / 100, 3),
                    "trend_direction": "positive" if hash(player["player_name"]) % 2 else "stable"
                }
            }
            
            cache_key = f"player_{player['sport'].lower()}_{player['player_name'].replace(' ', '_').lower()}"
            data_hash = hashlib.sha256(json.dumps(cache_data, sort_keys=True).encode()).hexdigest()
            expires_at = datetime.now(timezone.utc) + timedelta(seconds=3600)  # 1 hour
            
            cursor.execute('''
                INSERT OR REPLACE INTO portfolio_rationales (
                    request_id, rationale_type, portfolio_data_hash, portfolio_data,
                    context_data, narrative, key_points, confidence,
                    generation_time_ms, model_info, cache_hits, expires_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                cache_key,
                "CACHE_PLAYER",
                data_hash,
                json.dumps(cache_data),
                json.dumps({"sport": player["sport"], "cache_warming": True}),
                f"Player performance cache for {player['player_name']}",
                json.dumps([f"Cached {player['player_name']} performance", f"Coverage: {player['prop_coverage']} props"]),
                0.75,
                150,
                json.dumps({"cache_service": "v1.0", "player": player["player_name"]}),
                1,
                expires_at.isoformat()
            ))
            
            results["players_warmed"] += 1
            print(f"     ✅ Warmed: {player['player_name']} ({player['team']})")
        
        if not dry_run:
            conn.commit()
            
            # Get final count
            cursor.execute("SELECT COUNT(*) FROM portfolio_rationales WHERE rationale_type LIKE 'CACHE_%'")
            results["total_cache_entries"] = cursor.fetchone()[0]
        
        print(f"\n✅ Cache warming completed!")
        
        if dry_run:
            print("🔍 DRY RUN - No changes made to database")
            print(f"📊 Would create {sum(len(props) for props in sample_data['correlation_targets'].values())} correlation entries")
            print(f"📊 Would create {len(sample_data['factor_targets'])} factor model entries")
            print(f"📊 Would create {len(sample_data['player_targets'])} player performance entries")
        else:
            print(f"📊 Results: {results}")
        
        return results
        
    except Exception as e:
        if not dry_run:
            conn.rollback()
        print(f"❌ Error during cache warming: {e}")
        return {"error": str(e)}
    
    finally:
        if not dry_run:
            conn.close()


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Simple cache warming with sample data")
    parser.add_argument("--db-path", default="a1betting.db", help="Path to database")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be warmed without making changes")
    
    args = parser.parse_args()
    
    results = warm_cache_with_sample_data(args.db_path, args.dry_run)
    print(f"\n🎯 Final results: {json.dumps(results, indent=2)}")


if __name__ == '__main__':
    main()