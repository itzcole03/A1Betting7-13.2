#!/usr/bin/env python3
"""Check database tables"""

import sqlite3

# Connect to database
conn = sqlite3.connect('a1betting.db')
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [row[0] for row in cursor.fetchall()]

print("Existing tables:")
for table in sorted(tables):
    print(f"  - {table}")

# Check if clv_history exists
if 'clv_history' in tables:
    print("\n✅ clv_history table exists")
    cursor.execute("PRAGMA table_info(clv_history)")
    columns = cursor.fetchall()
    print("Columns:")
    for col in columns:
        print(f"  - {col[1]} ({col[2]})")
else:
    print("\n❌ clv_history table NOT found")

conn.close()