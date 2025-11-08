#!/usr/bin/env python3
"""
Check Database Tables
====================

Simple script to check what tables exist in the SQLite database.
"""

import sqlite3
import sys
from pathlib import Path

# Connect to database
db_path = Path(__file__).parent / "a1betting.db"
try:
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    
    print("🗃️  Existing Database Tables:")
    print("=" * 40)
    if tables:
        for table in tables:
            print(f"  ✅ {table[0]}")
    else:
        print("  📭 No tables found")
    
    # Check specifically for analytics tables
    analytics_tables = ['ev_opportunity_history', 'arbitrage_history']
    print(f"\n📊 Analytics Tables Status:")
    print("=" * 40)
    for table_name in analytics_tables:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
        exists = cursor.fetchone() is not None
        status = "✅ EXISTS" if exists else "❌ MISSING"
        print(f"  {table_name}: {status}")
    
    # Check alembic version
    try:
        cursor.execute("SELECT version_num FROM alembic_version")
        version = cursor.fetchone()
        if version:
            print(f"\n🔧 Current Alembic Version: {version[0]}")
        else:
            print("\n🔧 No Alembic version found")
    except sqlite3.OperationalError:
        print("\n🔧 Alembic version table doesn't exist")
    
    conn.close()
    
except Exception as e:
    print(f"❌ Error accessing database: {e}")
    sys.exit(1)