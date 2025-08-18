#!/usr/bin/env python3
"""Check existing correlation clusters and cache data"""

import sqlite3

def check_correlation_data():
    conn = sqlite3.connect('a1betting.db')
    cursor = conn.cursor()
    
    try:
        print("📊 Correlation Data Analysis:")
        
        # Check correlation_clusters table
        cursor.execute('SELECT name FROM sqlite_master WHERE type="table" AND name="correlation_clusters"')
        if cursor.fetchone():
            cursor.execute('SELECT COUNT(*) FROM correlation_clusters')
            cluster_count = cursor.fetchone()[0]
            print(f"   🔗 correlation_clusters: {cluster_count} entries")
            
            if cluster_count > 0:
                cursor.execute('''
                    SELECT sport, COUNT(*) as count, 
                           AVG(correlation_strength) as avg_strength
                    FROM correlation_clusters 
                    GROUP BY sport 
                    ORDER BY count DESC
                ''')
                print("   📈 Clusters by sport:")
                for sport, count, avg_strength in cursor.fetchall():
                    print(f"     • {sport}: {count} clusters (avg strength: {avg_strength:.3f})")
                
                cursor.execute('''
                    SELECT cluster_key, sport, correlation_strength, 
                           json_array_length(prop_ids) as prop_count
                    FROM correlation_clusters 
                    ORDER BY correlation_strength DESC 
                    LIMIT 5
                ''')
                print("\n   🎯 Top 5 strongest clusters:")
                for cluster_key, sport, strength, prop_count in cursor.fetchall():
                    print(f"     • {cluster_key} ({sport}): {strength:.3f} strength, {prop_count} props")
        else:
            print("   ❌ correlation_clusters table not found")
        
        # Check correlation_cache_entries table
        cursor.execute('SELECT name FROM sqlite_master WHERE type="table" AND name="correlation_cache_entries"')
        if cursor.fetchone():
            cursor.execute('SELECT COUNT(*) FROM correlation_cache_entries')
            cache_count = cursor.fetchone()[0]
            print(f"\n   💾 correlation_cache_entries: {cache_count} entries")
            
            if cache_count > 0:
                cursor.execute('''
                    SELECT entry_type, COUNT(*) as count
                    FROM correlation_cache_entries 
                    GROUP BY entry_type
                ''')
                print("   📋 Cache entries by type:")
                for entry_type, count in cursor.fetchall():
                    print(f"     • {entry_type}: {count} entries")
                
                cursor.execute('''
                    SELECT cache_key, entry_type, 
                           datetime(created_at, 'localtime') as created,
                           datetime(expires_at, 'localtime') as expires
                    FROM correlation_cache_entries 
                    ORDER BY created_at DESC 
                    LIMIT 5
                ''')
                print("\n   🕒 Recent cache entries:")
                for cache_key, entry_type, created, expires in cursor.fetchall():
                    print(f"     • {cache_key} ({entry_type}) - {created} → {expires}")
        else:
            print("   ❌ correlation_cache_entries table not found")
        
        # Check related tables for data to warm
        cursor.execute('SELECT name FROM sqlite_master WHERE type="table" AND name="edges"')
        if cursor.fetchone():
            cursor.execute('SELECT COUNT(*) FROM edges')
            edges_count = cursor.fetchone()[0]
            print(f"\n   🔗 edges: {edges_count} entries")
            
            if edges_count > 0:
                cursor.execute('''
                    SELECT sport, COUNT(DISTINCT player_prop_id) as unique_props
                    FROM edges 
                    GROUP BY sport 
                    ORDER BY unique_props DESC
                ''')
                print("   📊 Props by sport:")
                for sport, prop_count in cursor.fetchall():
                    print(f"     • {sport}: {prop_count} unique props")
        
        # Check factor models
        cursor.execute('SELECT name FROM sqlite_master WHERE type="table" AND name="correlation_factor_models"')
        if cursor.fetchone():
            cursor.execute('SELECT COUNT(*) FROM correlation_factor_models')
            factor_count = cursor.fetchone()[0]
            print(f"\n   🧮 correlation_factor_models: {factor_count} entries")
            
            if factor_count > 0:
                cursor.execute('''
                    SELECT sport, COUNT(*) as models,
                           AVG(factor_count) as avg_factors
                    FROM correlation_factor_models 
                    GROUP BY sport
                ''')
                print("   📈 Factor models by sport:")
                for sport, models, avg_factors in cursor.fetchall():
                    print(f"     • {sport}: {models} models ({avg_factors:.1f} avg factors)")
                    
    finally:
        conn.close()

if __name__ == '__main__':
    check_correlation_data()