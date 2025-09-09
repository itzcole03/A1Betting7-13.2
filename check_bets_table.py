import sqlite3

# Connect to the database
conn = sqlite3.connect('a1betting.db')
cursor = conn.cursor()

# Check what columns exist in the bets table
cursor.execute("PRAGMA table_info(bets)")
columns = cursor.fetchall()

print("Bets table columns:")
for col in columns:
    print(f"  {col[1]} - {col[2]} (nullable: {col[3] == 0})")

conn.close()