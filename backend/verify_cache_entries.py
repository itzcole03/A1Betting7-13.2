#!/usr/bin/env python3
"""Verify cache warming results"""

import sqlite3
import json

def verify_cache_entries():
    conn = sqlite3.connect('a1betting.db')
    cursor = conn.cursor()
    
    try:
        print("🔍 Cache Entry Verification:")
        
        # Get cache entries by type
        cursor.execute('''
            SELECT rationale_type, COUNT(*) as count
            FROM portfolio_rationales 
            WHERE rationale_type LIKE 'CACHE_%'
            GROUP BY rationale_type
            ORDER BY count DESC
        ''')
        
        cache_types = cursor.fetchall()
        print(f"\n📊 Cache entries by type:")
        total_entries = 0
        for cache_type, count in cache_types:
            print(f"   • {cache_type}: {count} entries")
            total_entries += count
        
        print(f"\n📋 Total cache entries: {total_entries}")
        
        # Show sample correlation cache entries
        print("\n🔗 Sample correlation cache entries:")
        cursor.execute('''
            SELECT request_id, portfolio_data, confidence, expires_at
            FROM portfolio_rationales 
            WHERE rationale_type = 'CACHE_CORRELATION'
            ORDER BY confidence DESC
            LIMIT 5
        ''')
        
        for request_id, data, confidence, expires in cursor.fetchall():
            data_obj = json.loads(data)
            sport = data_obj.get('sport', 'Unknown')
            prop_type = data_obj.get('prop_type', 'Unknown')
            strength = data_obj.get('correlation_strength', 0)
            print(f"   • {request_id}: {sport} {prop_type} (strength: {strength}, confidence: {confidence})")
        
        # Show sample factor cache entries
        print("\n🧮 Sample factor model cache entries:")
        cursor.execute('''
            SELECT request_id, portfolio_data, confidence, expires_at
            FROM portfolio_rationales 
            WHERE rationale_type = 'CACHE_FACTOR'
            ORDER BY confidence DESC
            LIMIT 4
        ''')
        
        for request_id, data, confidence, expires in cursor.fetchall():
            data_obj = json.loads(data)
            sport = data_obj.get('sport', 'Unknown')
            model_version = data_obj.get('model_version', 'Unknown')
            factors = data_obj.get('factors', [])
            print(f"   • {request_id}: {sport} {model_version} (factors: {len(factors)}, confidence: {confidence})")
        
        # Show sample player cache entries
        print("\n👤 Sample player performance cache entries:")
        cursor.execute('''
            SELECT request_id, portfolio_data, confidence, expires_at
            FROM portfolio_rationales 
            WHERE rationale_type = 'CACHE_PLAYER'
            ORDER BY confidence DESC
            LIMIT 6
        ''')
        
        for request_id, data, confidence, expires in cursor.fetchall():
            data_obj = json.loads(data)
            sport = data_obj.get('sport', 'Unknown')
            player_name = data_obj.get('player_name', 'Unknown')
            team = data_obj.get('team', 'Unknown')
            prop_coverage = data_obj.get('prop_coverage', 0)
            print(f"   • {request_id}: {sport} {player_name} ({team}) - {prop_coverage} props (confidence: {confidence})")
        
        # Check cache expiration times
        print("\n⏰ Cache expiration analysis:")
        cursor.execute('''
            SELECT rationale_type,
                   COUNT(*) as total,
                   COUNT(CASE WHEN datetime(expires_at) > datetime('now') THEN 1 END) as not_expired,
                   MIN(datetime(expires_at, 'localtime')) as earliest_expiry,
                   MAX(datetime(expires_at, 'localtime')) as latest_expiry
            FROM portfolio_rationales 
            WHERE rationale_type LIKE 'CACHE_%'
            GROUP BY rationale_type
        ''')
        
        for cache_type, total, not_expired, earliest, latest in cursor.fetchall():
            expired = total - not_expired
            print(f"   • {cache_type}: {not_expired}/{total} active, expires {earliest} - {latest}")
            
    finally:
        conn.close()

if __name__ == '__main__':
    verify_cache_entries()