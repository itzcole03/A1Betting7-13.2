"""
MLB Team Constants and Taxonomy

Provides MLB-specific team codes, full names, divisions, and metadata 
for standardized team normalization and identification.
"""

from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum


class MLBLeague(Enum):
    """MLB League designation"""
    AMERICAN = "AL"
    NATIONAL = "NL"


class MLBDivision(Enum):
    """MLB Division designation"""
    AL_EAST = "AL_EAST"
    AL_CENTRAL = "AL_CENTRAL"
    AL_WEST = "AL_WEST"
    NL_EAST = "NL_EAST"
    NL_CENTRAL = "NL_CENTRAL"
    NL_WEST = "NL_WEST"


@dataclass
class MLBTeam:
    """MLB team data structure"""
    code: str
    name: str
    full_name: str
    city: str
    league: MLBLeague
    division: MLBDivision
    abbreviations: List[str]  # Common abbreviations/aliases
    stadium: str
    timezone: str
    primary_color: str
    secondary_color: str


# Complete MLB team registry
MLB_TEAMS: Dict[str, MLBTeam] = {
    # American League East
    "NYY": MLBTeam(
        code="NYY", name="Yankees", full_name="New York Yankees",
        city="New York", league=MLBLeague.AMERICAN, division=MLBDivision.AL_EAST,
        abbreviations=["NYY", "NY", "New York Yankees"],
        stadium="Yankee Stadium", timezone="America/New_York",
        primary_color="#132448", secondary_color="#C4CED4"
    ),
    "BOS": MLBTeam(
        code="BOS", name="Red Sox", full_name="Boston Red Sox",
        city="Boston", league=MLBLeague.AMERICAN, division=MLBDivision.AL_EAST,
        abbreviations=["BOS", "Boston Red Sox", "Boston"],
        stadium="Fenway Park", timezone="America/New_York",
        primary_color="#BD3039", secondary_color="#0C2340"
    ),
    "TOR": MLBTeam(
        code="TOR", name="Blue Jays", full_name="Toronto Blue Jays",
        city="Toronto", league=MLBLeague.AMERICAN, division=MLBDivision.AL_EAST,
        abbreviations=["TOR", "Toronto Blue Jays", "Toronto"],
        stadium="Rogers Centre", timezone="America/Toronto",
        primary_color="#134A8E", secondary_color="#1D2D5C"
    ),
    "TB": MLBTeam(
        code="TB", name="Rays", full_name="Tampa Bay Rays",
        city="Tampa Bay", league=MLBLeague.AMERICAN, division=MLBDivision.AL_EAST,
        abbreviations=["TB", "TAM", "Tampa Bay Rays", "Tampa Bay"],
        stadium="Tropicana Field", timezone="America/New_York",
        primary_color="#092C5C", secondary_color="#8FBCE6"
    ),
    "BAL": MLBTeam(
        code="BAL", name="Orioles", full_name="Baltimore Orioles",
        city="Baltimore", league=MLBLeague.AMERICAN, division=MLBDivision.AL_EAST,
        abbreviations=["BAL", "Baltimore Orioles", "Baltimore"],
        stadium="Oriole Park at Camden Yards", timezone="America/New_York",
        primary_color="#DF4601", secondary_color="#000000"
    ),
    
    # American League Central
    "CLE": MLBTeam(
        code="CLE", name="Guardians", full_name="Cleveland Guardians",
        city="Cleveland", league=MLBLeague.AMERICAN, division=MLBDivision.AL_CENTRAL,
        abbreviations=["CLE", "Cleveland Guardians", "Cleveland"],
        stadium="Progressive Field", timezone="America/New_York",
        primary_color="#E31937", secondary_color="#0C2340"
    ),
    "MIN": MLBTeam(
        code="MIN", name="Twins", full_name="Minnesota Twins",
        city="Minneapolis", league=MLBLeague.AMERICAN, division=MLBDivision.AL_CENTRAL,
        abbreviations=["MIN", "Minnesota Twins", "Minnesota"],
        stadium="Target Field", timezone="America/Chicago",
        primary_color="#002B5C", secondary_color="#D31145"
    ),
    "CWS": MLBTeam(
        code="CWS", name="White Sox", full_name="Chicago White Sox",
        city="Chicago", league=MLBLeague.AMERICAN, division=MLBDivision.AL_CENTRAL,
        abbreviations=["CWS", "CHW", "Chicago White Sox", "White Sox"],
        stadium="Guaranteed Rate Field", timezone="America/Chicago",
        primary_color="#27251F", secondary_color="#C4CED4"
    ),
    "DET": MLBTeam(
        code="DET", name="Tigers", full_name="Detroit Tigers",
        city="Detroit", league=MLBLeague.AMERICAN, division=MLBDivision.AL_CENTRAL,
        abbreviations=["DET", "Detroit Tigers", "Detroit"],
        stadium="Comerica Park", timezone="America/Detroit",
        primary_color="#0C2340", secondary_color="#FA4616"
    ),
    "KC": MLBTeam(
        code="KC", name="Royals", full_name="Kansas City Royals",
        city="Kansas City", league=MLBLeague.AMERICAN, division=MLBDivision.AL_CENTRAL,
        abbreviations=["KC", "KCR", "Kansas City Royals", "Kansas City"],
        stadium="Kauffman Stadium", timezone="America/Chicago",
        primary_color="#004687", secondary_color="#BD9B60"
    ),
    
    # American League West
    "HOU": MLBTeam(
        code="HOU", name="Astros", full_name="Houston Astros",
        city="Houston", league=MLBLeague.AMERICAN, division=MLBDivision.AL_WEST,
        abbreviations=["HOU", "Houston Astros", "Houston"],
        stadium="Minute Maid Park", timezone="America/Chicago",
        primary_color="#002D62", secondary_color="#EB6E1F"
    ),
    "LAA": MLBTeam(
        code="LAA", name="Angels", full_name="Los Angeles Angels",
        city="Los Angeles", league=MLBLeague.AMERICAN, division=MLBDivision.AL_WEST,
        abbreviations=["LAA", "ANA", "Los Angeles Angels", "Angels"],
        stadium="Angel Stadium", timezone="America/Los_Angeles",
        primary_color="#BA0021", secondary_color="#003263"
    ),
    "TEX": MLBTeam(
        code="TEX", name="Rangers", full_name="Texas Rangers",
        city="Arlington", league=MLBLeague.AMERICAN, division=MLBDivision.AL_WEST,
        abbreviations=["TEX", "Texas Rangers", "Texas"],
        stadium="Globe Life Field", timezone="America/Chicago",
        primary_color="#003278", secondary_color="#C0111F"
    ),
    "SEA": MLBTeam(
        code="SEA", name="Mariners", full_name="Seattle Mariners",
        city="Seattle", league=MLBLeague.AMERICAN, division=MLBDivision.AL_WEST,
        abbreviations=["SEA", "Seattle Mariners", "Seattle"],
        stadium="T-Mobile Park", timezone="America/Los_Angeles",
        primary_color="#0C2C56", secondary_color="#005C5C"
    ),
    "OAK": MLBTeam(
        code="OAK", name="Athletics", full_name="Oakland Athletics",
        city="Oakland", league=MLBLeague.AMERICAN, division=MLBDivision.AL_WEST,
        abbreviations=["OAK", "Oakland Athletics", "Oakland", "A's"],
        stadium="RingCentral Coliseum", timezone="America/Los_Angeles",
        primary_color="#003831", secondary_color="#EFB21E"
    ),
    
    # National League East
    "ATL": MLBTeam(
        code="ATL", name="Braves", full_name="Atlanta Braves",
        city="Atlanta", league=MLBLeague.NATIONAL, division=MLBDivision.NL_EAST,
        abbreviations=["ATL", "Atlanta Braves", "Atlanta"],
        stadium="Truist Park", timezone="America/New_York",
        primary_color="#CE1141", secondary_color="#13274F"
    ),
    "NYM": MLBTeam(
        code="NYM", name="Mets", full_name="New York Mets",
        city="New York", league=MLBLeague.NATIONAL, division=MLBDivision.NL_EAST,
        abbreviations=["NYM", "New York Mets", "Mets"],
        stadium="Citi Field", timezone="America/New_York",
        primary_color="#002D72", secondary_color="#FF5910"
    ),
    "PHI": MLBTeam(
        code="PHI", name="Phillies", full_name="Philadelphia Phillies",
        city="Philadelphia", league=MLBLeague.NATIONAL, division=MLBDivision.NL_EAST,
        abbreviations=["PHI", "Philadelphia Phillies", "Philadelphia"],
        stadium="Citizens Bank Park", timezone="America/New_York",
        primary_color="#E81828", secondary_color="#002D72"
    ),
    "MIA": MLBTeam(
        code="MIA", name="Marlins", full_name="Miami Marlins",
        city="Miami", league=MLBLeague.NATIONAL, division=MLBDivision.NL_EAST,
        abbreviations=["MIA", "Miami Marlins", "Miami"],
        stadium="loanDepot park", timezone="America/New_York",
        primary_color="#00A3E0", secondary_color="#EF3340"
    ),
    "WSH": MLBTeam(
        code="WSH", name="Nationals", full_name="Washington Nationals",
        city="Washington", league=MLBLeague.NATIONAL, division=MLBDivision.NL_EAST,
        abbreviations=["WSH", "WAS", "Washington Nationals", "Washington"],
        stadium="Nationals Park", timezone="America/New_York",
        primary_color="#AB0003", secondary_color="#14225A"
    ),
    
    # National League Central
    "MIL": MLBTeam(
        code="MIL", name="Brewers", full_name="Milwaukee Brewers",
        city="Milwaukee", league=MLBLeague.NATIONAL, division=MLBDivision.NL_CENTRAL,
        abbreviations=["MIL", "Milwaukee Brewers", "Milwaukee"],
        stadium="American Family Field", timezone="America/Chicago",
        primary_color="#FFC52F", secondary_color="#12284B"
    ),
    "STL": MLBTeam(
        code="STL", name="Cardinals", full_name="St. Louis Cardinals",
        city="St. Louis", league=MLBLeague.NATIONAL, division=MLBDivision.NL_CENTRAL,
        abbreviations=["STL", "St. Louis Cardinals", "St. Louis"],
        stadium="Busch Stadium", timezone="America/Chicago",
        primary_color="#C41E3A", secondary_color="#FEDB00"
    ),
    "CHC": MLBTeam(
        code="CHC", name="Cubs", full_name="Chicago Cubs",
        city="Chicago", league=MLBLeague.NATIONAL, division=MLBDivision.NL_CENTRAL,
        abbreviations=["CHC", "Chicago Cubs", "Cubs"],
        stadium="Wrigley Field", timezone="America/Chicago",
        primary_color="#0E3386", secondary_color="#CC3433"
    ),
    "CIN": MLBTeam(
        code="CIN", name="Reds", full_name="Cincinnati Reds",
        city="Cincinnati", league=MLBLeague.NATIONAL, division=MLBDivision.NL_CENTRAL,
        abbreviations=["CIN", "Cincinnati Reds", "Cincinnati"],
        stadium="Great American Ball Park", timezone="America/New_York",
        primary_color="#C6011F", secondary_color="#000000"
    ),
    "PIT": MLBTeam(
        code="PIT", name="Pirates", full_name="Pittsburgh Pirates",
        city="Pittsburgh", league=MLBLeague.NATIONAL, division=MLBDivision.NL_CENTRAL,
        abbreviations=["PIT", "Pittsburgh Pirates", "Pittsburgh"],
        stadium="PNC Park", timezone="America/New_York",
        primary_color="#FDB827", secondary_color="#27251F"
    ),
    
    # National League West
    "LAD": MLBTeam(
        code="LAD", name="Dodgers", full_name="Los Angeles Dodgers",
        city="Los Angeles", league=MLBLeague.NATIONAL, division=MLBDivision.NL_WEST,
        abbreviations=["LAD", "Los Angeles Dodgers", "Dodgers"],
        stadium="Dodger Stadium", timezone="America/Los_Angeles",
        primary_color="#005A9C", secondary_color="#EF3E42"
    ),
    "SD": MLBTeam(
        code="SD", name="Padres", full_name="San Diego Padres",
        city="San Diego", league=MLBLeague.NATIONAL, division=MLBDivision.NL_WEST,
        abbreviations=["SD", "SDP", "San Diego Padres", "San Diego"],
        stadium="Petco Park", timezone="America/Los_Angeles",
        primary_color="#2F241D", secondary_color="#FFC425"
    ),
    "SF": MLBTeam(
        code="SF", name="Giants", full_name="San Francisco Giants",
        city="San Francisco", league=MLBLeague.NATIONAL, division=MLBDivision.NL_WEST,
        abbreviations=["SF", "SFG", "San Francisco Giants", "San Francisco"],
        stadium="Oracle Park", timezone="America/Los_Angeles",
        primary_color="#FD5A1E", secondary_color="#27251F"
    ),
    "ARI": MLBTeam(
        code="ARI", name="Diamondbacks", full_name="Arizona Diamondbacks",
        city="Phoenix", league=MLBLeague.NATIONAL, division=MLBDivision.NL_WEST,
        abbreviations=["ARI", "Arizona Diamondbacks", "Arizona"],
        stadium="Chase Field", timezone="America/Phoenix",
        primary_color="#A71930", secondary_color="#E3D4AD"
    ),
    "COL": MLBTeam(
        code="COL", name="Rockies", full_name="Colorado Rockies",
        city="Denver", league=MLBLeague.NATIONAL, division=MLBDivision.NL_WEST,
        abbreviations=["COL", "Colorado Rockies", "Colorado"],
        stadium="Coors Field", timezone="America/Denver",
        primary_color="#33006F", secondary_color="#C4CED4"
    ),
}


# Utility functions for team lookups
def get_mlb_team(team_code: str) -> Optional[MLBTeam]:
    """Get MLB team by code"""
    return MLB_TEAMS.get(team_code.upper())


def find_mlb_team_by_name(team_name: str) -> Optional[MLBTeam]:
    """Find MLB team by name or abbreviation"""
    team_name_upper = team_name.upper()
    
    # Direct lookup by code
    if team_name_upper in MLB_TEAMS:
        return MLB_TEAMS[team_name_upper]
    
    # Search by name variations
    for team in MLB_TEAMS.values():
        if (team_name_upper in [abbr.upper() for abbr in team.abbreviations] or
            team_name_upper in team.full_name.upper() or
            team_name_upper in team.name.upper() or
            team_name_upper in team.city.upper()):
            return team
    
    return None


def get_teams_by_league(league: MLBLeague) -> List[MLBTeam]:
    """Get all teams in a specific league"""
    return [team for team in MLB_TEAMS.values() if team.league == league]


def get_teams_by_division(division: MLBDivision) -> List[MLBTeam]:
    """Get all teams in a specific division"""
    return [team for team in MLB_TEAMS.values() if team.division == division]


def normalize_mlb_team_code(team_identifier: str) -> Optional[str]:
    """Normalize team identifier to standard code"""
    team = find_mlb_team_by_name(team_identifier)
    return team.code if team else None


def get_all_mlb_team_codes() -> List[str]:
    """Get list of all MLB team codes"""
    return list(MLB_TEAMS.keys())


def validate_mlb_team_code(team_code: str) -> bool:
    """Validate if team code is a valid MLB team"""
    return team_code.upper() in MLB_TEAMS


# Player name alias mappings (common variations)
PLAYER_NAME_ALIASES: Dict[str, List[str]] = {
    "J.T. Realmuto": ["JT Realmuto", "J. T. Realmuto", "Jacob Realmuto"],
    "Ronald Acuña Jr.": ["Ronald Acuna Jr", "Ronald Acuña", "Ronald Acuna"],
    "Vladimir Guerrero Jr.": ["Vladimir Guerrero", "Vlad Guerrero Jr", "Vlad Jr"],
    "Bo Bichette": ["Bo Bichette", "Bichette"],
    "Cody Bellinger": ["Cody Bellinger", "Bellinger"],
    "Pete Alonso": ["Pete Alonso", "Peter Alonso", "Alonso"],
}


def normalize_player_name(player_name: str) -> str:
    """Normalize player name accounting for common variations"""
    # Check if this name is in our aliases
    for canonical_name, aliases in PLAYER_NAME_ALIASES.items():
        if player_name in aliases or player_name == canonical_name:
            return canonical_name
    
    # Return as-is if no mapping found
    return player_name


def get_player_name_variations(canonical_name: str) -> List[str]:
    """Get all known variations of a player name"""
    if canonical_name in PLAYER_NAME_ALIASES:
        return PLAYER_NAME_ALIASES[canonical_name] + [canonical_name]
    return [canonical_name]


# Export all public interfaces
__all__ = [
    'MLBLeague', 'MLBDivision', 'MLBTeam', 'MLB_TEAMS',
    'get_mlb_team', 'find_mlb_team_by_name', 'get_teams_by_league', 'get_teams_by_division',
    'normalize_mlb_team_code', 'get_all_mlb_team_codes', 'validate_mlb_team_code',
    'PLAYER_NAME_ALIASES', 'normalize_player_name', 'get_player_name_variations'
]