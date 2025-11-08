"""WNBA player data."""

        # WNBA Players - Stars + Generated (100+ total)
wnba_stars = [
("A'ja Wilson", "LVA", "F", 26.8, 11.2, 2.4),
("Breanna Stewart", "NY", "F", 23.1, 9.8, 3.7),
("Diana Taurasi", "PHX", "G", 18.2, 3.8, 5.1),
("Candace Parker", "LV", "F", 13.2, 8.6, 4.2),
("Skylar Diggins-Smith", "SEA", "G", 16.9, 3.2, 6.2),
]

wnba_teams = [
"LVA",
"NY",
"PHX",
"SEA",
"CON",
"CHI",
"ATL",
"IND",
"MIN",
"WAS",
"DAL",
"LV",
]
wnba_positions = ["G", "F", "C"]

for star_name, team, pos, ppg, rpg, apg in wnba_stars:
players.append(
{
"id": f"wnba_player_{player_id:03d}",
"name": star_name,
"team": team,
"position": pos,
"sport": "WNBA",
"current_stats": {
"ppg": ppg,
"rpg": rpg,
"apg": apg,
"games_played": random.randint(18, 28),
"last_5_games": [random.randint(8, 35) for _ in range(5)],
},
"injury_status": "healthy",
"matchup_difficulty": random.choice(["easy", "medium", "hard"]),
}
)
player_id += 1

        # Generate additional WNBA players
for i in range(95):
female_first_names = [
"Ashley",
"Jessica",
"Sarah",
"Amanda",
"Jennifer",
"Nicole",
"Michelle",
"Stephanie",
"Lisa",
"Angela",
"Tiffany",
"Crystal",
"Brittany",
"Samantha",
"Kimberly",
]
name = f"{random.choice(female_first_names)} {random.choice(last_names)}"
team = random.choice(wnba_teams)
pos = random.choice(wnba_positions)

players.append(
{
"id": f"wnba_player_{player_id:03d}",
"name": name,
"team": team,
"position": pos,
"sport": "WNBA",
"current_stats": {
"ppg": round(random.uniform(5.0, 25.0), 1),
"rpg": round(random.uniform(2.0, 12.0), 1),
"apg": round(random.uniform(1.0, 8.0), 1),
"games_played": random.randint(15, 30),
"last_5_games": [random.randint(3, 30) for _ in range(5)],
},
"injury_status": random.choice(
["healthy"] * 8 + ["questionable", "day-to-day"]
),
"matchup_difficulty": random.choice(["easy", "medium", "hard"]),
}
)
player_id += 1

