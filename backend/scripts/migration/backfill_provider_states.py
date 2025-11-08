#!/usr/bin/env python3
"""
Backfill provider_states table with existing providers

This script populates the provider_states table with default values for all 
known providers across different sports.
"""

import sqlite3
import os
from datetime import datetime, timezone
from typing import List, Dict, Any


# Known providers from the system
KNOWN_PROVIDERS = {
    "NBA": [
        "stub",
        "draftkings", 
        "fanduel",
        "prizepicks",
        "betmgm",
        "theodds",
        "sportsradar"
    ],
    "MLB": [
        "stub",
        "draftkings",
        "fanduel", 
        "prizepicks",
        "betmgm",
        "theodds",
        "sportsradar"
    ],
    "NFL": [
        "stub",
        "draftkings",
        "fanduel",
        "prizepicks", 
        "betmgm",
        "theodds",
        "sportsradar"
    ],
    "NHL": [
        "stub",
        "draftkings",
        "fanduel",
        "prizepicks",
        "betmgm", 
        "theodds",
        "sportsradar"
    ]
}


def get_default_provider_state(provider_name: str, sport: str) -> Dict[str, Any]:
    """Get default state for a provider"""
    
    # Determine if provider should be enabled by default
    is_enabled = provider_name in ["stub", "draftkings", "fanduel"]  # From config
    
    # Determine default status
    if provider_name == "stub":
        status = "ACTIVE"  # Stub provider is always active
    else:
        status = "INACTIVE"  # Real providers start inactive until health checked
    
    # Provider-specific configurations
    provider_configs = {
        "stub": {
            "poll_interval_seconds": 300,  # 5 minutes for stub
            "timeout_seconds": 10,
            "max_retries": 1,
            "capabilities": {
                "supports_live_odds": False,
                "supports_props": True,
                "supports_futures": False,
                "rate_limit_per_minute": 60
            }
        },
        "draftkings": {
            "poll_interval_seconds": 60,  # 1 minute for real providers
            "timeout_seconds": 30,
            "max_retries": 3,
            "capabilities": {
                "supports_live_odds": True,
                "supports_props": True,
                "supports_futures": True,
                "rate_limit_per_minute": 120
            }
        },
        "fanduel": {
            "poll_interval_seconds": 60,
            "timeout_seconds": 30,  
            "max_retries": 3,
            "capabilities": {
                "supports_live_odds": True,
                "supports_props": True,
                "supports_futures": True,
                "rate_limit_per_minute": 120
            }
        },
        "prizepicks": {
            "poll_interval_seconds": 120,  # 2 minutes - more conservative
            "timeout_seconds": 45,
            "max_retries": 3,
            "capabilities": {
                "supports_live_odds": False,
                "supports_props": True,
                "supports_futures": False,
                "multiplier_based": True,
                "rate_limit_per_minute": 60
            }
        },
        "betmgm": {
            "poll_interval_seconds": 60,
            "timeout_seconds": 30,
            "max_retries": 3, 
            "capabilities": {
                "supports_live_odds": True,
                "supports_props": True,
                "supports_futures": True,
                "rate_limit_per_minute": 100
            }
        },
        "theodds": {
            "poll_interval_seconds": 90,  # Respectful to free API
            "timeout_seconds": 60,
            "max_retries": 2,
            "capabilities": {
                "supports_live_odds": True,
                "supports_props": True,
                "supports_futures": False,
                "api_based": True,
                "rate_limit_per_minute": 30
            }
        },
        "sportsradar": {
            "poll_interval_seconds": 30,  # High-frequency premium API
            "timeout_seconds": 30,
            "max_retries": 3,
            "capabilities": {
                "supports_live_odds": True,
                "supports_props": True,
                "supports_futures": True,
                "supports_statistics": True,
                "premium_api": True,
                "rate_limit_per_minute": 300
            }
        }
    }
    
    config = provider_configs.get(provider_name, provider_configs["stub"])
    
    return {
        "provider_name": provider_name,
        "sport": sport,
        "status": status,
        "is_enabled": is_enabled,
        "poll_interval_seconds": config["poll_interval_seconds"],
        "timeout_seconds": config["timeout_seconds"],
        "max_retries": config["max_retries"],
        "last_fetch_attempt": None,
        "last_successful_fetch": None,
        "last_error": None,
        "consecutive_errors": 0,
        "total_requests": 0,
        "successful_requests": 0,
        "failed_requests": 0,
        "average_response_time_ms": None,
        "total_props_fetched": 0,
        "unique_props_seen": 0,
        "last_prop_count": None,
        "capabilities": config["capabilities"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }


def backfill_provider_states(db_path: str, dry_run: bool = False) -> None:
    """
    Backfill provider_states table with default values
    
    Args:
        db_path: Path to SQLite database
        dry_run: If True, only show what would be inserted without making changes
    """
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found at {db_path}")
        return
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if provider_states table exists
        cursor.execute('SELECT name FROM sqlite_master WHERE type="table" AND name="provider_states"')
        if not cursor.fetchone():
            print("❌ provider_states table does not exist. Please run create_schema_tables.py first.")
            return
            
        # Get existing provider states to avoid duplicates
        cursor.execute('SELECT provider_name, sport FROM provider_states')
        existing = set((row[0], row[1]) for row in cursor.fetchall())
        
        providers_to_insert = []
        
        # Generate provider states for all known providers and sports
        for sport, providers in KNOWN_PROVIDERS.items():
            for provider_name in providers:
                key = (provider_name, sport)
                if key not in existing:
                    provider_state = get_default_provider_state(provider_name, sport)
                    providers_to_insert.append(provider_state)
                else:
                    print(f"ℹ️ Provider {provider_name} for {sport} already exists, skipping")
        
        if not providers_to_insert:
            print("✅ All providers already exist in provider_states table")
            return
            
        print(f"📝 Found {len(providers_to_insert)} providers to insert:")
        
        for provider in providers_to_insert:
            status_indicator = "🟢" if provider["is_enabled"] else "🔴"
            print(f"   {status_indicator} {provider['provider_name']} ({provider['sport']}) - {provider['status']}")
        
        if dry_run:
            print("\n🔍 DRY RUN: No changes made to database")
            return
            
        # Insert new provider states
        insert_sql = '''
        INSERT INTO provider_states (
            provider_name, sport, status, is_enabled, poll_interval_seconds,
            timeout_seconds, max_retries, last_fetch_attempt, last_successful_fetch,
            last_error, consecutive_errors, total_requests, successful_requests,
            failed_requests, average_response_time_ms, total_props_fetched,
            unique_props_seen, last_prop_count, capabilities, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        '''
        
        for provider in providers_to_insert:
            values = (
                provider["provider_name"],
                provider["sport"], 
                provider["status"],
                provider["is_enabled"],
                provider["poll_interval_seconds"],
                provider["timeout_seconds"],
                provider["max_retries"],
                provider["last_fetch_attempt"],
                provider["last_successful_fetch"],
                provider["last_error"],
                provider["consecutive_errors"],
                provider["total_requests"],
                provider["successful_requests"],
                provider["failed_requests"],
                provider["average_response_time_ms"],
                provider["total_props_fetched"],
                provider["unique_props_seen"],
                provider["last_prop_count"],
                str(provider["capabilities"]).replace("'", '"'),  # JSON format
                provider["created_at"],
                provider["updated_at"]
            )
            
            cursor.execute(insert_sql, values)
        
        conn.commit()
        print(f"✅ Successfully inserted {len(providers_to_insert)} provider states")
        
        # Show summary
        cursor.execute('SELECT sport, COUNT(*) FROM provider_states GROUP BY sport')
        sport_counts = cursor.fetchall()
        
        print("\n📊 Provider states summary:")
        for sport, count in sport_counts:
            cursor.execute('SELECT COUNT(*) FROM provider_states WHERE sport=? AND is_enabled=1', (sport,))
            enabled_count = cursor.fetchone()[0]
            print(f"   {sport}: {count} providers ({enabled_count} enabled)")
        
    except Exception as e:
        print(f"❌ Error during backfill: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Backfill provider_states table")
    parser.add_argument("--db-path", default="../a1betting.db", 
                       help="Path to SQLite database (default: ../a1betting.db)")
    parser.add_argument("--dry-run", action="store_true",
                       help="Show what would be inserted without making changes")
    
    args = parser.parse_args()
    
    print("🔄 Starting provider_states backfill...")
    backfill_provider_states(args.db_path, args.dry_run)
    print("✅ Backfill completed")


if __name__ == '__main__':
    main()