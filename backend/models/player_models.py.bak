from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class PlayerSeasonStats(BaseModel):
    hits: Optional[int]
    home_runs: Optional[int]
    rbis: Optional[int]
    batting_average: Optional[float]
    on_base_percentage: Optional[float]
    slugging_percentage: Optional[float]
    ops: Optional[float]
    strikeouts: Optional[int]
    walks: Optional[int]
    games_played: Optional[int]
    plate_appearances: Optional[int]
    at_bats: Optional[int]
    runs: Optional[int]
    doubles: Optional[int]
    triples: Optional[int]
    stolen_bases: Optional[int]
    war: Optional[float]
    babip: Optional[float]
    wrc_plus: Optional[float]
    barrel_rate: Optional[float]
    hard_hit_rate: Optional[float]
    exit_velocity: Optional[float]
    launch_angle: Optional[float]


class PlayerRecentGame(BaseModel):
    date: str
    opponent: str
    home: bool
    result: str
    stats: Dict[str, Any]
    game_score: Optional[float]
    weather: Optional[Dict[str, Any]]


class PlayerPropHistoryItem(BaseModel):
    date: str
    prop_type: str
    line: float
    actual: float
    outcome: str
    odds: Optional[float]
    sportsbook: Optional[str]


class PlayerPerformanceTrends(BaseModel):
    last_7_days: Dict[str, Any]
    last_30_days: Dict[str, Any]
    home_vs_away: Dict[str, Any]
    vs_lefties: Dict[str, Any]
    vs_righties: Dict[str, Any]


class PlayerPerformanceGame(BaseModel):
    """Individual game performance vs line data"""
    date: str
    stat_value: float
    line_at_time: float
    result_over: bool
    opponent: Optional[str] = None
    home: Optional[bool] = None
    confidence: Optional[float] = None


class PlayerPerformanceStats(BaseModel):
    """Aggregated performance statistics"""
    rolling_avg: float
    hit_rate: float  # Percentage of times player went over the line
    std_dev: float
    total_games: int
    over_count: int
    under_count: int
    avg_line: float
    avg_actual: float


class PlayerPerformanceResponse(BaseModel):
    """Response model for player performance API"""
    success: bool
    data: Dict[str, Any]
    error: Optional[Dict[str, str]] = None


class PlayerPerformanceData(BaseModel):
    """Player performance data structure"""
    player: str
    sport: str
    market: str
    window: int
    recent_games: List[PlayerPerformanceGame]
    stats: PlayerPerformanceStats
    timestamp: str


class PlayerDashboardResponse(BaseModel):
    id: str
    name: str
    team: str
    position: str
    sport: str
    active: bool
    injury_status: Optional[str]
    season_stats: PlayerSeasonStats
    recent_games: List[PlayerRecentGame]
    prop_history: List[PlayerPropHistoryItem]
    performance_trends: PlayerPerformanceTrends
