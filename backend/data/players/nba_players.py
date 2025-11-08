"""NBA player data."""

        # NBA Players - Stars + Generated (200+ total)
nba_stars = [
("LeBron James", "LAL", "SF", 28.5, 8.2, 6.8),
("Stephen Curry", "GSW", "PG", 31.2, 5.1, 6.2),
("Kevin Durant", "PHX", "SF", 29.8, 6.7, 5.3),
("Giannis Antetokounmpo", "MIL", "PF", 32.1, 11.8, 6.1),
("Jayson Tatum", "BOS", "SF", 27.9, 8.4, 4.7),
("Luka Doncic", "DAL", "PG", 30.5, 8.9, 8.2),
("Joel Embiid", "PHI", "C", 33.2, 10.8, 4.3),
("Nikola Jokic", "DEN", "C", 26.4, 12.3, 9.1),
("Jimmy Butler", "MIA", "SF", 22.8, 6.1, 5.4),
("Damian Lillard", "MIL", "PG", 28.7, 4.5, 7.1),
]

nba_teams = [
"LAL",
"GSW",
"BOS",
"MIA",
"PHX",
"MIL",
"DAL",
"DEN",
"PHI",
"BKN",
"CLE",
"ATL",
"TOR",
"CHI",
"NYK",
"MIN",
"NOP",
"SAC",
"LAC",
"MEM",
"OKC",
"IND",
"WAS",
"ORL",
"CHA",
"SAS",
"UTA",
"POR",
"DET",
"HOU",
]
nba_positions = ["PG", "SG", "SF", "PF", "C"]

for star_name, team, pos, ppg, rpg, apg in nba_stars:
players.append(
{
"id": f"nba_player_{player_id:03d}",
"name": star_name,
"team": team,
"position": pos,
"sport": "NBA",
"current_stats": {
"ppg": ppg,
"rpg": rpg,
"apg": apg,
"games_played": random.randint(60, 75),
"last_5_games": [random.randint(15, 45) for _ in range(5)],
},
"injury_status": "healthy",
"matchup_difficulty": random.choice(["easy", "medium", "hard"]),
}
)
player_id += 1

        # Generate additional NBA players
for i in range(190):
name = f"{random.choice(first_names)} {random.choice(last_names)}"
team = random.choice(nba_teams)
pos = random.choice(nba_positions)

players.append(
{
"id": f"nba_player_{player_id:03d}",
"name": name,
"team": team,
"position": pos,
"sport": "NBA",
"current_stats": {
"ppg": round(random.uniform(8.0, 35.0), 1),
"rpg": round(random.uniform(2.0, 15.0), 1),
"apg": round(random.uniform(1.0, 12.0), 1),
"games_played": random.randint(50, 80),
"last_5_games": [random.randint(8, 40) for _ in range(5)],
},
"injury_status": random.choice(
["healthy"] * 7 + ["questionable", "day-to-day", "out"]
),
"matchup_difficulty": random.choice(["easy", "medium", "hard"]),
}
)
player_id += 1

