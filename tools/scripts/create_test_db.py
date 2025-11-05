"""
Create a local SQLite database for testing backfill and insert one test row.
"""
import sqlite3
from pathlib import Path

p = Path(__file__).parent / 'test_backfill_local.db'
conn = sqlite3.connect(p)
cur = conn.cursor()
cur.execute('''
CREATE TABLE IF NOT EXISTS best_line_aggregates (
    id INTEGER PRIMARY KEY,
    prop_id TEXT,
    best_over_bookmaker_id INTEGER,
    best_under_bookmaker_id INTEGER,
    best_over_odds INTEGER,
    best_under_odds INTEGER
)
''')
# Insert a test row if not exists
cur.execute("SELECT COUNT(1) FROM best_line_aggregates WHERE prop_id = ?", ('test-prop-1',))
if cur.fetchone()[0] == 0:
    cur.execute('INSERT INTO best_line_aggregates (prop_id,best_over_odds,best_under_odds) VALUES (?,?,?)', ('test-prop-1', 120, -110))
    conn.commit()

# Dump rows
cur.execute('SELECT id, prop_id, best_over_odds, best_under_odds FROM best_line_aggregates')
rows = cur.fetchall()
print('DB:', p)
for r in rows:
    print(r)

conn.close()
