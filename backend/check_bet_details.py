import sqlite3
from datetime import datetime, timedelta

# Connect to the database
conn = sqlite3.connect('a1betting.db')
cursor = conn.cursor()

# Check bet details including user_id and placed_at
cursor.execute("SELECT id, user_id, stake, placed_at FROM bets")
bets = cursor.fetchall()

print("Bet details:")
for bet in bets:
    print(f"  ID: {bet[0]}, User ID: {bet[1]}, Stake: ${bet[2]}, Placed At: {bet[3]}")

# Check date range used in summary (last 30 days)
end_date = datetime.now()
start_date = end_date - timedelta(days=30)
print(f"\nSummary date range: {start_date} to {end_date}")

conn.close()