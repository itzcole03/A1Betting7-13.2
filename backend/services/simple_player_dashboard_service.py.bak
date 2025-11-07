"""
Simplified PlayerDashboardService - Backend service for comprehensive player analytics
Provides player data with mock implementations for testing
"""

import asyncio
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class PlayerStats:
    # Batting Stats
    hits: int = 0
    home_runs: int = 0
    rbis: int = 0
    batting_average: float = 0.0
    on_base_percentage: float = 0.0
    slugging_percentage: float = 0.0
    ops: float = 0.0
    strikeouts: int = 0
    walks: int = 0

    # Advanced Stats
    war: float = 0.0
    babip: float = 0.0
    wrc_plus: int = 0
    barrel_rate: float = 0.0
    hard_hit_rate: float = 0.0
    exit_velocity: float = 0.0
    launch_angle: float = 0.0

    # Counting Stats
    games_played: int = 0
    plate_appearances: int = 0
    at_bats: int = 0
    runs: int = 0
    doubles: int = 0
    triples: int = 0
    stolen_bases: int = 0


@dataclass
class GameLog:
    date: str
    opponent: str
    home: bool
    result: str  # 'W' or 'L'
    stats: PlayerStats
    game_score: Optional[float] = None
    weather: Optional[Dict[str, Any]] = None


@dataclass
class PlayerData:
    id: str
    name: str
    team: str
    position: str
    sport: str
    active: bool
    injury_status: Optional[str] = None

    # Current Season
    season_stats: Optional[PlayerStats] = None

    # Performance Data
    recent_games: List[GameLog] = field(default_factory=list)
    last_30_games: List[GameLog] = field(default_factory=list)
    season_games: List[GameLog] = field(default_factory=list)

    # Trends and Analysis
    performance_trends: Optional[Dict[str, Any]] = None

    # Advanced Metrics
    advanced_metrics: Optional[Dict[str, Any]] = None

    # Predictive Analytics
    projections: Optional[Dict[str, Any]] = None


class PlayerDashboardService:
    """Simplified service for player dashboard data and analytics"""

    def __init__(self):
        # Cache configuration
        self.cache: Dict[str, Any] = {}
        self.CACHE_TTL = 300  # 5 minutes

    async def get_player(self, player_id: str, sport: str = "MLB") -> PlayerData:
        """Get comprehensive player data for dashboard"""
        cache_key = f"player:{sport}:{player_id}:dashboard"

        # Check cache first
        if cache_key in self.cache:
            return self.cache[cache_key]

        # Simulate API delay
        await asyncio.sleep(0.1)

        # Generate mock player data
        if player_id == "aaron-judge":
            player_data = self._get_aaron_judge_mock_data()
        else:
            player_data = self._get_generic_mock_data(player_id, sport)

        # Cache the result
        self.cache[cache_key] = player_data
        return player_data

    async def search_players(
        self, query: str, sport: str = "MLB", limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Search for players by name or team"""
        cache_key = f"player:search:{sport}:{query}:{limit}"

        # Check cache first
        if cache_key in self.cache:
            return self.cache[cache_key]

        # Simulate API delay
        await asyncio.sleep(0.1)

        # Mock search results
        players = []
        if "judge" in query.lower():
            players.append(
                {
                    "id": "aaron-judge",
                    "name": "Aaron Judge",
                    "team": "NYY",
                    "position": "OF",
                    "sport": "MLB",
                    "active": True,
                    "injury_status": None,
                }
            )

        if "trout" in query.lower():
            players.append(
                {
                    "id": "mike-trout",
                    "name": "Mike Trout",
                    "team": "LAA",
                    "position": "OF",
                    "sport": "MLB",
                    "active": True,
                    "injury_status": "Day-to-Day",
                }
            )

        # Cache the results
        self.cache[cache_key] = players
        return players

    async def get_player_trends(
        self, player_id: str, period: str = "30d", sport: str = "MLB"
    ) -> List[Dict[str, Any]]:
        """Get player performance trends over specified period"""
        cache_key = f"player:trends:{sport}:{player_id}:{period}"

        # Check cache first
        if cache_key in self.cache:
            return self.cache[cache_key]

        # Simulate API delay
        await asyncio.sleep(0.1)

        # Mock trend data
        days = {"7d": 7, "30d": 30, "season": 162}.get(period, 30)
        trends = []

        for i in range(min(days, 15)):  # Max 15 data points for charts
            trends.append(
                {
                    "game": i + 1,
                    "date": f"2024-12-{20-i:02d}",
                    "opponent": ["BOS", "BAL", "TB", "TOR", "CLE"][i % 5],
                    "hits": max(0, 2 + (i % 4) - 1),
                    "home_runs": 1 if i % 7 == 0 else 0,
                    "rbis": max(0, 1 + (i % 3)),
                    "batting_average": round(0.250 + (i % 10) * 0.01, 3),
                }
            )

        # Cache the results
        self.cache[cache_key] = trends
        return trends

    async def get_matchup_analysis(
        self, player_id: str, opponent_team: str, sport: str = "MLB"
    ) -> Dict[str, Any]:
        """Get player performance analysis against specific opponent"""
        cache_key = f"player:matchup:{sport}:{player_id}:{opponent_team}"

        # Check cache first
        if cache_key in self.cache:
            return self.cache[cache_key]

        # Simulate API delay
        await asyncio.sleep(0.1)

        # Mock matchup analysis
        analysis = {
            "player_id": player_id,
            "opponent": opponent_team,
            "historical_performance": {
                "games_played": 12,
                "batting_average": 0.275,
                "home_runs": 3,
                "rbis": 8,
                "ops": 0.845,
            },
            "opponent_analysis": {
                "team_era": 4.25,
                "team_whip": 1.32,
                "defensive_efficiency": 0.695,
                "park_factors": {"hr_factor": 1.05, "hits_factor": 0.98},
            },
            "matchup_rating": 7.5,
            "key_insights": [
                "Strong historical performance against this opponent",
                "Favorable park factors for power hitting",
                "Opponent bullpen has struggled recently",
            ],
            "recommended_props": [],
        }

        # Cache the results
        self.cache[cache_key] = analysis
        return analysis

    async def get_player_props(
        self, player_id: str, game_id: Optional[str] = None, sport: str = "MLB"
    ) -> List[Dict[str, Any]]:
        """Get player prop predictions and recommendations"""
        cache_key = f"player:props:{sport}:{player_id}:{game_id or 'next'}"

        # Check cache first
        if cache_key in self.cache:
            return self.cache[cache_key]

        # Simulate API delay
        await asyncio.sleep(0.1)

        # Mock prop predictions
        props = [
            {
                "prop_type": "hits",
                "line": 1.5,
                "over_probability": 0.65,
                "under_probability": 0.35,
                "confidence": 0.75,
                "recommendation": "OVER",
            },
            {
                "prop_type": "home_runs",
                "line": 0.5,
                "over_probability": 0.45,
                "under_probability": 0.55,
                "confidence": 0.68,
                "recommendation": "UNDER",
            },
            {
                "prop_type": "rbis",
                "line": 1.5,
                "over_probability": 0.58,
                "under_probability": 0.42,
                "confidence": 0.72,
                "recommendation": "OVER",
            },
        ]

        # Cache the results
        self.cache[cache_key] = props
        return props

    def _get_aaron_judge_mock_data(self) -> PlayerData:
        """Get comprehensive mock data for Aaron Judge"""
        # Season stats
        season_stats = PlayerStats(
            hits=162,
            home_runs=58,
            rbis=144,
            batting_average=0.311,
            on_base_percentage=0.425,
            slugging_percentage=0.686,
            ops=1.111,
            strikeouts=175,
            walks=111,
            games_played=148,
            plate_appearances=696,
            at_bats=570,
            runs=131,
            doubles=28,
            triples=0,
            stolen_bases=16,
            war=11.5,
            babip=0.345,
            wrc_plus=207,
            barrel_rate=18.8,
            hard_hit_rate=56.8,
            exit_velocity=95.8,
            launch_angle=16.2,
        )

        # Recent games
        recent_games = []
        opponents = ["BOS", "BAL", "TB", "TOR", "CLE"]
        for i in range(10):
            game_stats = PlayerStats(
                hits=max(0, 2 + (i % 4) - 1),
                home_runs=1 if i % 4 == 0 else 0,
                rbis=max(0, 1 + (i % 3)),
                batting_average=round(0.280 + (i % 8) * 0.01, 3),
            )
            recent_games.append(
                GameLog(
                    date=f"2024-12-{20-i:02d}",
                    opponent=opponents[i % len(opponents)],
                    home=i % 2 == 0,
                    result="W" if i % 3 != 0 else "L",
                    stats=game_stats,
                    game_score=85.0 + i * 2,
                )
            )

        # Performance trends
        performance_trends = {
            "last_7_days": {"batting_average": 0.320, "home_runs": 2},
            "last_30_days": {"batting_average": 0.295, "home_runs": 8},
            "home_vs_away": {
                "home": {"batting_average": 0.325, "home_runs": 32},
                "away": {"batting_average": 0.298, "home_runs": 26},
            },
            "vs_lefties": {"batting_average": 0.285, "home_runs": 18},
            "vs_righties": {"batting_average": 0.325, "home_runs": 40},
        }

        # Advanced metrics
        advanced_metrics = {
            "consistency_score": 92.5,
            "clutch_performance": 88.7,
            "injury_risk": 12.3,
            "hot_streak": True,
            "cold_streak": False,
            "breakout_candidate": False,
        }

        # Projections
        projections = {
            "next_game": {"hits": 1.8, "home_runs": 0.4, "rbis": 1.3},
            "rest_of_season": {"hits": 25, "home_runs": 8, "rbis": 20},
            "confidence_intervals": {
                "low": {"hits": 1.2, "home_runs": 0.2, "rbis": 0.8},
                "high": {"hits": 2.4, "home_runs": 0.6, "rbis": 1.8},
            },
        }

        return PlayerData(
            id="aaron-judge",
            name="Aaron Judge",
            team="NYY",
            position="RF",
            sport="MLB",
            active=True,
            injury_status=None,
            season_stats=season_stats,
            recent_games=recent_games,
            last_30_games=recent_games[:30],
            performance_trends=performance_trends,
            advanced_metrics=advanced_metrics,
            projections=projections,
        )

    def _get_generic_mock_data(self, player_id: str, sport: str) -> PlayerData:
        """Get generic mock data for any player"""
        name = player_id.replace("-", " ").title()

        season_stats = PlayerStats(
            hits=120,
            home_runs=25,
            rbis=85,
            batting_average=0.275,
            on_base_percentage=0.340,
            slugging_percentage=0.485,
            ops=0.825,
            strikeouts=140,
            walks=65,
            games_played=130,
        )

        performance_trends = {
            "last_7_days": {"batting_average": 0.290, "home_runs": 1},
            "last_30_days": {"batting_average": 0.265, "home_runs": 4},
            "home_vs_away": {
                "home": {"batting_average": 0.285, "home_runs": 15},
                "away": {"batting_average": 0.265, "home_runs": 10},
            },
            "vs_lefties": {"batting_average": 0.255, "home_runs": 8},
            "vs_righties": {"batting_average": 0.285, "home_runs": 17},
        }

        advanced_metrics = {
            "consistency_score": 75.0,
            "clutch_performance": 68.5,
            "injury_risk": 18.7,
            "hot_streak": False,
            "cold_streak": False,
            "breakout_candidate": True,
        }

        projections = {
            "next_game": {"hits": 1.4, "home_runs": 0.2, "rbis": 0.9},
            "rest_of_season": {"hits": 18, "home_runs": 4, "rbis": 12},
            "confidence_intervals": {
                "low": {"hits": 1.0, "home_runs": 0.1, "rbis": 0.5},
                "high": {"hits": 1.8, "home_runs": 0.3, "rbis": 1.3},
            },
        }

        return PlayerData(
            id=player_id,
            name=name,
            team="LAA",
            position="OF",
            sport=sport,
            active=True,
            injury_status=None,
            season_stats=season_stats,
            recent_games=[],
            last_30_games=[],
            performance_trends=performance_trends,
            advanced_metrics=advanced_metrics,
            projections=projections,
        )


# Create singleton instance
player_dashboard_service = PlayerDashboardService()
