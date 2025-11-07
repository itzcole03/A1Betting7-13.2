#!/usr/bin/env python3
"""Verify provider_states backfill results"""

import sqlite3

def verify_provider_states():
    conn = sqlite3.connect('a1betting.db')
    cursor = conn.cursor()
    
    try:
        # Get summary by sport
        print("📊 Provider States Summary:")
        cursor.execute('''
            SELECT sport, 
                   COUNT(*) as total_providers,
                   SUM(CASE WHEN is_enabled = 1 THEN 1 ELSE 0 END) as enabled_count,
                   SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active_count
            FROM provider_states 
            GROUP BY sport 
            ORDER BY sport
        ''')
        
        for sport, total, enabled, active in cursor.fetchall():
            print(f"   {sport}: {total} total, {enabled} enabled, {active} active")
        
        print("\n🔍 Sample Provider Data:")
        cursor.execute('''
            SELECT provider_name, sport, status, is_enabled, poll_interval_seconds, timeout_seconds
            FROM provider_states 
            WHERE sport = 'NBA'
            ORDER BY provider_name
        ''')
        
        for row in cursor.fetchall():
            name, sport, status, enabled, poll_interval, timeout = row
            enabled_icon = "🟢" if enabled else "🔴"
            print(f"   {enabled_icon} {name} ({sport}) - {status} | Poll: {poll_interval}s, Timeout: {timeout}s")
            
        print("\n🎯 Enabled Providers by Sport:")
        cursor.execute('''
            SELECT sport, provider_name, capabilities 
            FROM provider_states 
            WHERE is_enabled = 1
            ORDER BY sport, provider_name
        ''')
        
        current_sport = None
        for sport, provider, capabilities in cursor.fetchall():
            if sport != current_sport:
                print(f"\n   {sport}:")
                current_sport = sport
            print(f"     • {provider}")
            
    finally:
        conn.close()

if __name__ == '__main__':
    verify_provider_states()