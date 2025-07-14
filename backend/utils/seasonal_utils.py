"""
Seasonal Sports Filtering Utilities

Centralized logic for determining which sports are in season for any given month.
This ensures consistent seasonal filtering across all backend endpoints.
"""


def get_in_season_sports(month: int) -> list[str]:
    """
    Determine which sports are in season for the given month.

    Args:
        month (int): Month number (1-12)

    Returns:
        list[str]: List of sports that are in season for the given month
    """
    sport_seasons = {
        "MLB": [4, 5, 6, 7, 8, 9, 10],  # April-October
        "NFL": [9, 10, 11, 12, 1, 2],  # September-February
        "NBA": [10, 11, 12, 1, 2, 3, 4, 5, 6],  # October-June
        "NHL": [10, 11, 12, 1, 2, 3, 4, 5, 6],  # October-June
        "WNBA": [5, 6, 7, 8, 9, 10],  # May-October
        "MLS": [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],  # February-November
        "SOCCER": [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],  # February-November (alias for MLS)
        "PGA": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],  # Year-round
        "TENNIS": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],  # Year-round
        "MMA": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],  # Year-round
        "UFC": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],  # Year-round
        "BOXING": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],  # Year-round
        "NASCAR": [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],  # February-November
        "KBO": [3, 4, 5, 6, 7, 8, 9, 10],  # March-October (Korean Baseball)
        "CS2": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],  # Year-round (esports)
        "ESPORTS": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],  # Year-round
        "GOLF": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],  # Year-round (alias for PGA)
        "NCAAF": [8, 9, 10, 11, 12, 1],  # August-January (College Football)
        "NCAAB": [11, 12, 1, 2, 3, 4],  # November-April (College Basketball)
    }

    in_season = []
    for sport, months in sport_seasons.items():
        if month in months:
            in_season.append(sport)

    return in_season


def filter_props_by_season(props: list, month: int) -> list:
    """
    Filter a list of props to only include those from in-season sports.

    Args:
        props (list): List of prop dictionaries
        month (int): Current month (1-12)

    Returns:
        list: Filtered list containing only in-season props
    """
    in_season_sports = get_in_season_sports(month)
    filtered_props = []

    for prop in props:
        sport = prop.get("sport", prop.get("league", "Unknown")).upper()

        # Check if this sport is in season
        if any(season_sport.upper() in sport for season_sport in in_season_sports):
            filtered_props.append(prop)

    return filtered_props


def is_sport_in_season(sport: str, month: int) -> bool:
    """
    Check if a specific sport is in season for the given month.

    Args:
        sport (str): Sport name (case-insensitive)
        month (int): Month number (1-12)

    Returns:
        bool: True if sport is in season, False otherwise
    """
    in_season_sports = get_in_season_sports(month)
    sport_upper = sport.upper()

    return any(season_sport.upper() in sport_upper for season_sport in in_season_sports)


def get_seasonal_summary(month: int) -> dict:
    """
    Get a summary of seasonal information for the given month.

    Args:
        month (int): Month number (1-12)

    Returns:
        dict: Summary containing in-season sports, off-season sports, and month info
    """
    all_sports = {
        "MLB",
        "NFL",
        "NBA",
        "NHL",
        "WNBA",
        "MLS",
        "PGA",
        "TENNIS",
        "MMA",
        "UFC",
        "BOXING",
        "NASCAR",
        "KBO",
        "CS2",
        "NCAAF",
        "NCAAB",
    }

    in_season = set(get_in_season_sports(month))
    off_season = all_sports - in_season

    return {
        "month": month,
        "in_season_sports": sorted(list(in_season)),
        "off_season_sports": sorted(list(off_season)),
        "total_in_season": len(in_season),
        "total_off_season": len(off_season),
    }
