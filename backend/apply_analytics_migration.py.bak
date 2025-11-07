#!/usr/bin/env python3
"""
Apply Analytics Tables Migration
===============================

Directly applies the analytics tables to the database using SQLite.
"""

import sqlite3
import sys
from pathlib import Path

# Analytics tables SQL (extracted from migration)
ANALYTICS_TABLES_SQL = """
-- Create ev_opportunity_history table
CREATE TABLE IF NOT EXISTS ev_opportunity_history (
    id INTEGER NOT NULL,
    opp_hash VARCHAR(64) NOT NULL,
    sport VARCHAR(10) NOT NULL,
    player VARCHAR(100) NOT NULL,
    market VARCHAR(50) NOT NULL,
    ev_percent FLOAT NOT NULL,
    ev_tier VARCHAR(20) NOT NULL,
    detected_at DATETIME NOT NULL,
    line FLOAT,
    odds INTEGER,
    confidence FLOAT,
    bookmaker VARCHAR(50),
    team VARCHAR(50),
    opponent VARCHAR(50),
    PRIMARY KEY (id)
);

-- Create indexes for ev_opportunity_history
CREATE INDEX IF NOT EXISTS idx_ev_hist_sport_date ON ev_opportunity_history (sport, detected_at);
CREATE INDEX IF NOT EXISTS idx_ev_hist_tier_date ON ev_opportunity_history (ev_tier, detected_at);
CREATE INDEX IF NOT EXISTS idx_ev_hist_player_date ON ev_opportunity_history (player, detected_at);
CREATE INDEX IF NOT EXISTS idx_ev_hist_ev_pct ON ev_opportunity_history (ev_percent);
CREATE INDEX IF NOT EXISTS ix_ev_opportunity_history_opp_hash ON ev_opportunity_history (opp_hash);
CREATE INDEX IF NOT EXISTS ix_ev_opportunity_history_sport ON ev_opportunity_history (sport);
CREATE INDEX IF NOT EXISTS ix_ev_opportunity_history_player ON ev_opportunity_history (player);
CREATE INDEX IF NOT EXISTS ix_ev_opportunity_history_market ON ev_opportunity_history (market);
CREATE INDEX IF NOT EXISTS ix_ev_opportunity_history_ev_percent ON ev_opportunity_history (ev_percent);
CREATE INDEX IF NOT EXISTS ix_ev_opportunity_history_ev_tier ON ev_opportunity_history (ev_tier);
CREATE INDEX IF NOT EXISTS ix_ev_opportunity_history_detected_at ON ev_opportunity_history (detected_at);

-- Create arbitrage_history table
CREATE TABLE IF NOT EXISTS arbitrage_history (
    id INTEGER NOT NULL,
    arb_hash VARCHAR(64) NOT NULL,
    sport VARCHAR(10) NOT NULL,
    market VARCHAR(50) NOT NULL,
    profit_pct FLOAT NOT NULL,
    books_json TEXT NOT NULL,
    detected_at DATETIME NOT NULL,
    player VARCHAR(100),
    line FLOAT,
    total_stake_required FLOAT,
    num_bookmakers INTEGER NOT NULL DEFAULT 2,
    team VARCHAR(50),
    opponent VARCHAR(50),
    PRIMARY KEY (id)
);

-- Create indexes for arbitrage_history
CREATE INDEX IF NOT EXISTS idx_arb_hist_sport_date ON arbitrage_history (sport, detected_at);
CREATE INDEX IF NOT EXISTS idx_arb_hist_profit_date ON arbitrage_history (profit_pct, detected_at);
CREATE INDEX IF NOT EXISTS idx_arb_hist_player_date ON arbitrage_history (player, detected_at);
CREATE INDEX IF NOT EXISTS idx_arb_hist_profit_pct ON arbitrage_history (profit_pct);
CREATE INDEX IF NOT EXISTS ix_arbitrage_history_arb_hash ON arbitrage_history (arb_hash);
CREATE INDEX IF NOT EXISTS ix_arbitrage_history_sport ON arbitrage_history (sport);
CREATE INDEX IF NOT EXISTS ix_arbitrage_history_market ON arbitrage_history (market);
CREATE INDEX IF NOT EXISTS ix_arbitrage_history_profit_pct ON arbitrage_history (profit_pct);
CREATE INDEX IF NOT EXISTS ix_arbitrage_history_detected_at ON arbitrage_history (detected_at);
CREATE INDEX IF NOT EXISTS ix_arbitrage_history_player ON arbitrage_history (player);
"""

def apply_analytics_tables():
    """Apply analytics tables to the database."""
    db_path = Path(__file__).parent / "a1betting.db"
    
    print("🔧 Applying Analytics Tables Migration...")
    print("=" * 50)
    
    try:
        # Connect to database
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Execute the migration SQL
        cursor.executescript(ANALYTICS_TABLES_SQL)
        conn.commit()
        
        # Verify tables were created
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('ev_opportunity_history', 'arbitrage_history')")
        created_tables = cursor.fetchall()
        
        print("✅ Analytics tables created successfully:")
        for table in created_tables:
            print(f"   - {table[0]}")
        
        # Check table structures
        for table_name in ['ev_opportunity_history', 'arbitrage_history']:
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = cursor.fetchall()
            print(f"\n📋 {table_name} structure:")
            for col in columns:
                col_name, col_type = col[1], col[2]
                print(f"   - {col_name}: {col_type}")
        
        conn.close()
        print(f"\n🎉 Analytics tables migration completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error applying migration: {e}")
        return False

if __name__ == "__main__":
    success = apply_analytics_tables()
    sys.exit(0 if success else 1)