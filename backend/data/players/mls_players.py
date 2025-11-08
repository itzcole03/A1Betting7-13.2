"""MLS player data."""

        # MLS Players - Stars + Generated (200+ total)
mls_stars = [
("Carlos Vela", "LAFC", "F", 0.6, 3.2, 0.4),
("Lorenzo Insigne", "TOR", "M", 0.4, 2.8, 0.6),
("Sebastian Giovinco", "TOR", "M", 0.5, 2.5, 0.5),
("Zlatan Ibrahimovic", "LA", "F", 0.7, 3.5, 0.3),
("Diego Valeri", "POR", "M", 0.3, 2.1, 0.7),
]

mls_teams = [
"LAFC",
"LAG",
"SEA",
"POR",
"COL",
"RSL",
"MIN",
"SKC",
"HOU",
"DAL",
"AUS",
"NSH",
"ATL",
"CHA",
"MIA",
"ORL",
"TOR",
"MTL",
"NE",
"NYC",
"NYRB",
"PHI",
"DC",
"CHI",
"CIN",
"CLB",
"DET",
]
mls_positions = ["GK", "D", "M", "F"]

for star_name, team, pos, gpg, spg, apg in mls_stars:
players.append(
{
"id": f"mls_player_{player_id:03d}",
"name": star_name,
"team": team,
"position": pos,
"sport": "MLS",
"current_stats": {
"goals_per_game": gpg,
"shots_per_game": spg,
"assists_per_game": apg,
"games_played": random.randint(15, 25),
"last_5_games": [random.randint(0, 5) for _ in range(5)],
},
"injury_status": "healthy",
"matchup_difficulty": random.choice(["easy", "medium", "hard"]),
}
)
player_id += 1

        # Generate additional MLS players
for i in range(195):
name = f"{random.choice(first_names)} {random.choice(last_names)}"
team = random.choice(mls_teams)
pos = random.choice(mls_positions)

players.append(
{
"id": f"mls_player_{player_id:03d}",
"name": name,
"team": team,
"position": pos,
"sport": "MLS",
"current_stats": {
"goals_per_game": round(random.uniform(0.0, 0.8), 2),
"shots_per_game": round(random.uniform(0.5, 4.0), 1),
"assists_per_game": round(random.uniform(0.0, 1.0), 2),
"games_played": random.randint(12, 28),
"last_5_games": [random.randint(0, 5) for _ in range(5)],
},
"injury_status": random.choice(
["healthy"] * 8 + ["questionable", "day-to-day"]
),
"matchup_difficulty": random.choice(["easy", "medium", "hard"]),
}
)
player_id += 1

return players

