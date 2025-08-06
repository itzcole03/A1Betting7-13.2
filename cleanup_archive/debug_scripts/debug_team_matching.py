#!/usr/bin/env python3
"""
Debug team matching logic for Athletics @ Nationals
"""


# Simulate the frontend team matching logic
def normalize_team_name(team_name):
    """Python version of frontend normalizeTeamName function"""
    name = team_name.lower().strip()

    team_mappings = {
        # American League East
        "blue jays": ["tor", "toronto", "jays", "toronto blue jays"],
        "orioles": ["bal", "baltimore", "baltimore orioles"],
        "red sox": ["bos", "boston", "sox", "boston red sox"],
        "rays": ["tb", "tampa bay", "tampa bay rays", "tampa"],
        "yankees": ["nyy", "new york yankees", "ny yankees", "yankees"],
        # American League Central
        "white sox": ["cws", "chicago", "chicago white sox", "chw"],
        "guardians": ["cle", "cleveland", "cleveland guardians"],
        "tigers": ["det", "detroit", "detroit tigers"],
        "royals": ["kc", "kansas city", "kansas city royals"],
        "twins": ["min", "minnesota", "minnesota twins"],
        # American League West
        "astros": ["hou", "houston", "houston astros"],
        "angels": ["laa", "los angeles angels", "anaheim", "la angels"],
        "athletics": ["oak", "oakland", "oakland athletics", "as"],
        "mariners": ["sea", "seattle", "seattle mariners"],
        "rangers": ["tex", "texas", "texas rangers"],
        # National League East
        "braves": ["atl", "atlanta", "atlanta braves"],
        "marlins": ["mia", "miami", "miami marlins", "florida"],
        "mets": ["nym", "new york mets", "ny mets"],
        "phillies": ["phi", "philadelphia", "philadelphia phillies"],
        "nationals": ["wsh", "washington", "washington nationals"],
        # National League Central
        "cubs": ["chc", "chicago cubs", "chicago", "chi cubs"],
        "reds": ["cin", "cincinnati", "cincinnati reds"],
        "brewers": ["mil", "milwaukee", "milwaukee brewers"],
        "pirates": ["pit", "pittsburgh", "pittsburgh pirates"],
        "cardinals": ["stl", "st louis", "st. louis", "st louis cardinals"],
        # National League West
        "diamondbacks": ["ari", "arizona", "arizona diamondbacks", "dbacks"],
        "rockies": ["col", "colorado", "colorado rockies"],
        "dodgers": ["lad", "los angeles dodgers", "la dodgers"],
        "padres": ["sd", "san diego", "san diego padres"],
        "giants": ["sf", "san francisco", "san francisco giants"],
    }

    # Find canonical team name by checking all variants
    for canonical, variants in team_mappings.items():
        if name in variants or canonical in name:
            return canonical
    return name


def extract_teams_from_event(event_name):
    """Python version of frontend extractTeamsFromEvent function"""
    normalized = event_name.lower()
    away, home = "", ""

    if " @ " in normalized:
        away, home = normalized.split(" @ ")
    elif " vs " in normalized:
        away, home = normalized.split(" vs ")

    away = away.strip()
    home = home.strip()

    return {"away": normalize_team_name(away), "home": normalize_team_name(home)}


# Test the team matching logic
print("🔍 Testing team matching logic for Athletics @ Nationals")
print()

# Frontend selected game (what user sees)
frontend_game = "Athletics @ Nationals"
print(f"Frontend selected game: '{frontend_game}'")
frontend_teams = extract_teams_from_event(frontend_game)
print(f"Frontend teams: {frontend_teams}")
print()

# Backend prop data (actual data)
backend_game = "Athletics vs Washington Nationals"
print(f"Backend prop game: '{backend_game}'")
backend_teams = extract_teams_from_event(backend_game)
print(f"Backend teams: {backend_teams}")
print()

# Test team name normalization
print("Team name normalization tests:")
print(f"'athletics' -> '{normalize_team_name('athletics')}'")
print(f"'nationals' -> '{normalize_team_name('nationals')}'")
print(f"'washington nationals' -> '{normalize_team_name('washington nationals')}'")
print(f"'washington' -> '{normalize_team_name('washington')}'")
print()

# Test if teams match
teams_match = (
    frontend_teams["away"] == backend_teams["away"]
    and frontend_teams["home"] == backend_teams["home"]
) or (
    frontend_teams["away"] == backend_teams["home"]
    and frontend_teams["home"] == backend_teams["away"]
)

print(f"Teams match: {teams_match}")
if not teams_match:
    print("❌ Team matching will fail!")
    print("Issue: Frontend and backend team names don't normalize to the same values")
else:
    print("✅ Team matching should work")
