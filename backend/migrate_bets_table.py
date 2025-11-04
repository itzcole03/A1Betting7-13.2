import sqlite3

# Connect to the database
conn = sqlite3.connect('a1betting.db')
cursor = conn.cursor()

# Add missing columns to bets table
missing_columns = [
    "stake FLOAT",
    "result VARCHAR",
    "pnl FLOAT", 
    "ev_percent FLOAT",
    "kelly_fraction_used FLOAT",
    "fair_odds FLOAT",
    "closing_odds FLOAT",
    "clv_percent FLOAT",
    "bankroll_at_time FLOAT",
    "bet_size_percent FLOAT",
    "sportsbook VARCHAR",
    "market VARCHAR", 
    "player_name VARCHAR",
    "confidence_score FLOAT",
    "notes TEXT"
]

print("Adding missing columns to bets table...")
for column in missing_columns:
    try:
        cursor.execute(f"ALTER TABLE bets ADD COLUMN {column}")
        print(f"  ✓ Added: {column}")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print(f"  - Already exists: {column}")
        else:
            print(f"  ✗ Error adding {column}: {e}")

conn.commit()
conn.close()
print("Migration complete!")