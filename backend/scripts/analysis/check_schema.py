#!/usr/bin/env python3
"""Check database schema"""

import sqlite3

def check_schema():
    conn = sqlite3.connect('a1betting.db')
    cursor = conn.cursor()
    
    try:
        # List all tables
        cursor.execute('SELECT name FROM sqlite_master WHERE type="table"')
        tables = [row[0] for row in cursor.fetchall()]
        
        print(f"📋 Found {len(tables)} tables in database:")
        for table in sorted(tables):
            print(f"   • {table}")
            
        # Check specifically for provider_states
        if 'provider_states' in tables:
            print("\n✅ provider_states table exists")
            cursor.execute('SELECT COUNT(*) FROM provider_states')
            count = cursor.fetchone()[0]
            print(f"   Rows: {count}")
        else:
            print("\n❌ provider_states table not found")
            
        # Check for portfolio_rationales 
        if 'portfolio_rationales' in tables:
            print("\n✅ portfolio_rationales table exists")
            cursor.execute('SELECT COUNT(*) FROM portfolio_rationales')
            count = cursor.fetchone()[0]
            print(f"   Rows: {count}")
        else:
            print("\n❌ portfolio_rationales table not found")
            
    finally:
        conn.close()

if __name__ == '__main__':
    check_schema()