import sqlite3

# Connect to the database
conn = sqlite3.connect('a1betting.db')
cursor = conn.cursor()

# Check if bet was recorded
cursor.execute("SELECT id, stake, odds, bet_type, selection, sportsbook, market, status FROM bets")
bets = cursor.fetchall()

print("Recorded bets:")
for bet in bets:
    print(f"  ID: {bet[0]}, Stake: ${bet[1]}, Odds: {bet[2]}, Type: {bet[3]}, Selection: {bet[4]}, Book: {bet[5]}, Market: {bet[6]}, Status: {bet[7]}")

conn.close()