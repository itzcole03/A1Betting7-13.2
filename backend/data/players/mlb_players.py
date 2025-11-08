"""MLB player data."""

        # MLB Players - Top stars + Generated players (300+ total)
mlb_stars = [
("Mike Trout", "LAA", "OF", 0.283, 1.8, 1.2, 0.15),
("Aaron Judge", "NYY", "OF", 0.295, 1.9, 1.8, 0.25),
("Shohei Ohtani", "LAD", "DH", 0.304, 2.1, 1.6, 0.22),
("Mookie Betts", "LAD", "OF", 0.289, 1.7, 1.4, 0.18),
("Ronald Acuna Jr.", "ATL", "OF", 0.312, 2.0, 1.5, 0.20),
("Juan Soto", "WSH", "OF", 0.301, 1.8, 1.7, 0.19),
("Vladimir Guerrero Jr.", "TOR", "1B", 0.286, 1.9, 1.6, 0.17),
("Fernando Tatis Jr.", "SD", "SS", 0.294, 1.8, 1.5, 0.21),
("Bryce Harper", "PHI", "OF", 0.285, 1.7, 1.8, 0.16),
("Freddie Freeman", "LAD", "1B", 0.298, 1.9, 1.5, 0.12),
]

        # Generate MLB players
mlb_teams = [
"NYY",
"LAD",
"HOU",
"ATL",
"TOR",
"SD",
"PHI",
"BOS",
"TB",
"CHC",
"STL",
"MIL",
"MIN",
"CWS",
"CLE",
"DET",
"KC",
"LAA",
"OAK",
"SEA",
"TEX",
"ARI",
"COL",
"MIA",
"NYM",
"WSH",
"CIN",
"PIT",
"SF",
"BAL",
]
mlb_positions = ["C", "1B", "2B", "3B", "SS", "OF", "DH", "P"]

player_id = 1
for star_name, team, pos, avg, hits, rbi, hr in mlb_stars:
players.append(
{
"id": f"mlb_player_{player_id:03d}",
"name": star_name,
"team": team,
"position": pos,
"sport": "MLB",
"current_stats": {
"avg": avg,
"hits_per_game": hits,
"rbi_per_game": rbi,
"hr_per_game": hr,
"games_played": random.randint(40, 50),
"last_5_games": [random.randint(0, 4) for _ in range(5)],
},
"injury_status": "healthy",
"matchup_difficulty": random.choice(["easy", "medium", "hard"]),
}
)
player_id += 1

        # Generate additional MLB players
for i in range(290):
first_names = [
"Alex",
"Chris",
"Ryan",
"Matt",
"David",
"Mike",
"Jake",
"Tyler",
"Kevin",
"Brandon",
"Josh",
"Nick",
"Andrew",
"Jason",
"Daniel",
"Anthony",
"Marcus",
"Carlos",
"Luis",
"Jose",
]
last_names = [
"Johnson",
"Williams",
"Brown",
"Jones",
"Garcia",
"Miller",
"Davis",
"Rodriguez",
"Martinez",
"Hernandez",
"Lopez",
"Gonzalez",
"Wilson",
"Anderson",
"Taylor",
"Thomas",
"Jackson",
"White",
"Harris",
"Martin",
]

name = f"{random.choice(first_names)} {random.choice(last_names)}"
team = random.choice(mlb_teams)
pos = random.choice(mlb_positions)

players.append(
{
"id": f"mlb_player_{player_id:03d}",
"name": name,
"team": team,
"position": pos,
"sport": "MLB",
"current_stats": {
"avg": round(random.uniform(0.220, 0.320), 3),
"hits_per_game": round(random.uniform(0.8, 2.2), 1),
"rbi_per_game": round(random.uniform(0.5, 2.0), 1),
"hr_per_game": round(random.uniform(0.02, 0.25), 2),
"games_played": random.randint(35, 55),
"last_5_games": [random.randint(0, 4) for _ in range(5)],
},
"injury_status": random.choice(
["healthy"] * 8 + ["questionable", "day-to-day"]
),
"matchup_difficulty": random.choice(["easy", "medium", "hard"]),
}
)
player_id += 1

