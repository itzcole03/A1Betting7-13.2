import sqlite3

try:
    conn = sqlite3.connect('a1betting.db')
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    print("Tables in a1betting.db:", tables)
    
    if 'bankroll_snapshots' in tables:
        print("✓ bankroll_snapshots table exists")
    else:
        print("✗ bankroll_snapshots table missing")
        
    conn.close()
except Exception as e:
    print(f"Error: {e}")