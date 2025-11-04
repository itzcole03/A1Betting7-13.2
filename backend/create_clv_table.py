#!/usr/bin/env python3
"""Create CLV history table"""

import sqlite3

# SQL to create clv_history table based on the SQLModel definition
CREATE_CLV_TABLE = """
CREATE TABLE IF NOT EXISTS clv_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    opportunity_hash TEXT NOT NULL,
    player TEXT,
    sport TEXT,
    market TEXT,
    clv_percent REAL NOT NULL,
    closing_line REAL NOT NULL,
    closing_odds INTEGER NOT NULL,
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processing_ms INTEGER,
    source_version TEXT DEFAULT 'v1',
    initial_line REAL,
    initial_odds INTEGER,
    batch_id TEXT
);
"""

# Create indexes for performance
CREATE_INDEXES = [
    "CREATE INDEX IF NOT EXISTS idx_clv_opportunity_hash ON clv_history(opportunity_hash);",
    "CREATE INDEX IF NOT EXISTS idx_clv_player ON clv_history(player);",
    "CREATE INDEX IF NOT EXISTS idx_clv_sport ON clv_history(sport);",
    "CREATE INDEX IF NOT EXISTS idx_clv_market ON clv_history(market);",
    "CREATE INDEX IF NOT EXISTS idx_clv_computed_at ON clv_history(computed_at);",
    "CREATE INDEX IF NOT EXISTS idx_clv_batch_id ON clv_history(batch_id);"
]

def create_clv_table():
    """Create CLV history table and indexes"""
    conn = sqlite3.connect('a1betting.db')
    cursor = conn.cursor()
    
    try:
        # Create table
        cursor.execute(CREATE_CLV_TABLE)
        print("✅ CLV history table created")
        
        # Create indexes
        for index_sql in CREATE_INDEXES:
            cursor.execute(index_sql)
        print("✅ CLV history indexes created")
        
        conn.commit()
        
        # Verify table creation
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='clv_history'")
        if cursor.fetchone():
            print("✅ CLV history table verified")
        else:
            print("❌ CLV history table verification failed")
            
    except sqlite3.Error as e:
        print(f"❌ Error creating CLV table: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    create_clv_table()