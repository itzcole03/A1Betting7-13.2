"""
NHL Data Models for A1Betting Backend

Pydantic models for NHL data structures using the official NHL API endpoints
(api-web.nhle.com and api.nhle.com/stats/rest).
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, ConfigDict, Field


class GameType(Enum):
    """NHL Game Types"""

    PRESEASON = 1
    REGULAR_SEASON = 2
    PLAYOFFS = 3
    ALL_STAR = 4


class Position(str, Enum):
    """NHL Player Positions"""

    CENTER = "C"
    LEFT_WING = "LW"
    RIGHT_WING = "RW"
    DEFENSEMAN = "D"
    GOALIE = "G"


class ConferenceType(str, Enum):
    """NHL Conferences"""

    EASTERN = "Eastern"
    WESTERN = "Western"


class DivisionType(str, Enum):
    """NHL Divisions"""

    ATLANTIC = "Atlantic"
    METROPOLITAN = "Metropolitan"
    CENTRAL = "Central"
    PACIFIC = "Pacific"


class NHLTeam(BaseModel):
    """NHL Team information"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    fullName: Optional[str] = None
    displayName: Optional[str] = None
    shortName: Optional[str] = None
    abbreviation: Optional[str] = None
    teamName: Optional[str] = None
    locationName: Optional[str] = None
    firstYearOfPlay: Optional[str] = None

    # Visual/branding
    primaryColor: Optional[str] = None
    secondaryColor: Optional[str] = None
    logoUrl: Optional[str] = None
    officialSiteUrl: Optional[str] = None

    # Conference and division
    conference: Optional[ConferenceType] = None
    division: Optional[DivisionType] = None

    # Venue information
    venue: Optional[Dict[str, Any]] = None

    # Active status
    active: bool = True


class NHLPlayer(BaseModel):
    """NHL Player information"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    fullName: str
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    primaryNumber: Optional[str] = None
    jerseyNumber: Optional[str] = None

    # Demographics
    birthDate: Optional[str] = None
    birthCity: Optional[str] = None
    birthStateProvince: Optional[str] = None
    birthCountry: Optional[str] = None
    nationality: Optional[str] = None
    age: Optional[int] = None

    # Physical attributes
    height: Optional[str] = None
    weight: Optional[int] = None

    # Position and role
    primaryPosition: Optional[Position] = None
    positionCode: Optional[str] = None
    shootsCatches: Optional[str] = None  # L/R for shoots (skaters) or catches (goalies)

    # Career info
    active: bool = True
    rookie: Optional[bool] = None
    currentTeam: Optional[NHLTeam] = None

    # Headshot and media
    headshot: Optional[str] = None

    # Career stats summary
    seasons: Optional[List[Dict[str, Any]]] = None


class NHLPlayerStats(BaseModel):
    """NHL Player Statistics"""

    model_config = ConfigDict(from_attributes=True)

    playerId: int
    season: str
    gameType: GameType

    # Basic stats (for all players)
    gamesPlayed: int = 0
    timeOnIce: Optional[str] = None
    timeOnIcePerGame: Optional[str] = None

    # Skater stats
    goals: Optional[int] = None
    assists: Optional[int] = None
    points: Optional[int] = None
    shots: Optional[int] = None
    hits: Optional[int] = None
    powerPlayGoals: Optional[int] = None
    powerPlayAssists: Optional[int] = None
    powerPlayPoints: Optional[int] = None
    shortHandedGoals: Optional[int] = None
    shortHandedAssists: Optional[int] = None
    shortHandedPoints: Optional[int] = None
    pim: Optional[int] = None  # Penalty minutes
    faceOffPct: Optional[float] = None
    shootingPct: Optional[float] = None
    gameWinningGoals: Optional[int] = None
    overTimeGoals: Optional[int] = None
    plusMinus: Optional[int] = None

    # Goalie stats
    wins: Optional[int] = None
    losses: Optional[int] = None
    ot: Optional[int] = None  # Overtime/shootout losses
    shotsAgainst: Optional[int] = None
    saves: Optional[int] = None
    goalsAgainst: Optional[int] = None
    savePercentage: Optional[float] = None
    goalAgainstAverage: Optional[float] = None
    shutouts: Optional[int] = None


class NHLTeamStats(BaseModel):
    """NHL Team Statistics"""

    model_config = ConfigDict(from_attributes=True)

    teamId: int
    season: str
    gameType: GameType

    # Record
    gamesPlayed: int = 0
    wins: int = 0
    losses: int = 0
    ot: int = 0  # Overtime/shootout losses
    points: int = 0
    pointPctg: Optional[float] = None

    # Goals
    goalsPerGame: Optional[float] = None
    goalsAgainstPerGame: Optional[float] = None
    evGGARatio: Optional[float] = None

    # Power play and penalty kill
    powerPlayPercentage: Optional[float] = None
    powerPlayGoals: Optional[int] = None
    powerPlayGoalsAgainst: Optional[int] = None
    powerPlayOpportunities: Optional[int] = None
    penaltyKillPercentage: Optional[float] = None

    # Shots
    shotsPerGame: Optional[float] = None
    shotsAllowed: Optional[float] = None

    # Face-offs
    faceOffWinPercentage: Optional[float] = None

    # Other stats
    shootingPctg: Optional[float] = None
    savePctg: Optional[float] = None


class NHLGameStatus(BaseModel):
    """NHL Game Status information"""

    model_config = ConfigDict(from_attributes=True)

    abstractGameState: str
    codedGameState: str
    detailedState: str
    statusCode: str
    startTimeTBD: bool = False


class NHLPeriodInfo(BaseModel):
    """NHL Period information"""

    model_config = ConfigDict(from_attributes=True)

    periodType: str
    number: int
    ordinalNum: str
    startTime: Optional[datetime] = None
    endTime: Optional[datetime] = None
    homeScore: Optional[int] = None
    awayScore: Optional[int] = None


class NHLLinescore(BaseModel):
    """NHL Game Linescore"""

    model_config = ConfigDict(from_attributes=True)

    currentPeriod: Optional[int] = None
    currentPeriodOrdinal: Optional[str] = None
    currentPeriodTimeRemaining: Optional[str] = None
    hasShootout: bool = False
    intermissionInfo: Optional[Dict[str, Any]] = None
    periods: List[NHLPeriodInfo] = []
    powerPlayInfo: Optional[Dict[str, Any]] = None
    teams: Optional[Dict[str, Any]] = None


class NHLGame(BaseModel):
    """NHL Game information"""

    model_config = ConfigDict(from_attributes=True)

    gamePk: int = Field(alias="id")
    link: Optional[str] = None
    gameType: GameType
    season: str
    gameDate: datetime

    # Game details
    status: Optional[NHLGameStatus] = None
    linescore: Optional[NHLLinescore] = None

    # Teams
    teams: Dict[str, Any]  # Contains away/home team info
    homeTeam: Optional[NHLTeam] = None
    awayTeam: Optional[NHLTeam] = None

    # Venue
    venue: Optional[Dict[str, Any]] = None

    # Content and media
    content: Optional[Dict[str, Any]] = None

    # Decisions (winning/losing goalies, etc.)
    decisions: Optional[Dict[str, Any]] = None


class NHLScheduleDate(BaseModel):
    """NHL Schedule for a specific date"""

    model_config = ConfigDict(from_attributes=True)

    date: str
    totalItems: int
    totalEvents: int
    totalGames: int
    totalMatches: int
    games: List[NHLGame]
    events: List[Dict[str, Any]] = []


class NHLSchedule(BaseModel):
    """NHL Schedule container"""

    model_config = ConfigDict(from_attributes=True)

    copyright: Optional[str] = None
    totalItems: int
    totalEvents: int
    totalGames: int
    totalMatches: int
    metaData: Optional[Dict[str, Any]] = None
    wait: Optional[int] = None
    dates: List[NHLScheduleDate]


class NHLStanding(BaseModel):
    """NHL Team Standing information"""

    model_config = ConfigDict(from_attributes=True)

    team: NHLTeam
    leagueRecord: Dict[str, int]  # wins, losses, ot
    goalsAgainst: int
    goalsScored: int
    points: int
    divisionRank: str
    conferenceRank: str
    leagueRank: str
    wildCardRank: str
    row: int  # Regulation + overtime wins
    gamesPlayed: int
    streak: Optional[Dict[str, Any]] = None
    pointsPercentage: Optional[float] = None
    ppDivisionRank: Optional[str] = None
    ppConferenceRank: Optional[str] = None
    ppLeagueRank: Optional[str] = None
    lastUpdated: Optional[datetime] = None


class NHLDivisionStandings(BaseModel):
    """NHL Division Standings"""

    model_config = ConfigDict(from_attributes=True)

    division: Dict[str, Any]
    teamRecords: List[NHLStanding]


class NHLConferenceStandings(BaseModel):
    """NHL Conference Standings"""

    model_config = ConfigDict(from_attributes=True)

    conference: Dict[str, Any]
    teamRecords: List[NHLStanding]


class NHLLeagueStandings(BaseModel):
    """NHL League Standings container"""

    model_config = ConfigDict(from_attributes=True)

    copyright: Optional[str] = None
    records: List[Union[NHLDivisionStandings, NHLConferenceStandings]]


class NHLRoster(BaseModel):
    """NHL Team Roster"""

    model_config = ConfigDict(from_attributes=True)

    copyright: Optional[str] = None
    roster: List[Dict[str, Any]]  # Contains person and jerseyNumber
    link: Optional[str] = None


class NHLOdds(BaseModel):
    """NHL Betting Odds"""

    model_config = ConfigDict(from_attributes=True)

    provider: str
    gameId: int

    # Moneyline odds
    homeMoneyline: Optional[float] = None
    awayMoneyline: Optional[float] = None

    # Spread/Puck line
    homeSpread: Optional[float] = None
    awaySpread: Optional[float] = None
    homeSpreadOdds: Optional[float] = None
    awaySpreadOdds: Optional[float] = None

    # Total (Over/Under)
    total: Optional[float] = None
    overOdds: Optional[float] = None
    underOdds: Optional[float] = None

    # Additional markets
    period1Total: Optional[float] = None
    period1OverOdds: Optional[float] = None
    period1UnderOdds: Optional[float] = None

    # Metadata
    lastUpdated: Optional[datetime] = None


class NHLGameOdds(BaseModel):
    """NHL Game with Odds"""

    model_config = ConfigDict(from_attributes=True)

    game: NHLGame
    odds: List[NHLOdds]


class NHLOddsComparison(BaseModel):
    """NHL Odds Comparison"""

    model_config = ConfigDict(from_attributes=True)

    gameId: int
    gameName: str
    gameDate: datetime
    homeTeam: str
    awayTeam: str

    # Best odds found
    bestHomeMoneyline: Optional[Dict[str, Any]] = None
    bestAwayMoneyline: Optional[Dict[str, Any]] = None
    bestOverOdds: Optional[Dict[str, Any]] = None
    bestUnderOdds: Optional[Dict[str, Any]] = None

    # All provider odds
    oddsProviders: List[NHLOdds] = []

    # Arbitrage opportunities
    arbitrageOpportunities: List[Dict[str, Any]] = []


class NHLAnalytics(BaseModel):
    """NHL Advanced Analytics"""

    model_config = ConfigDict(from_attributes=True)

    gameId: Optional[int] = None
    teamId: Optional[int] = None
    playerId: Optional[int] = None

    # Expected goals (team/player)
    expectedGoals: Optional[float] = None
    expectedGoalsAgainst: Optional[float] = None

    # Corsi and Fenwick
    corsiFor: Optional[int] = None
    corsiAgainst: Optional[int] = None
    corsiPercentage: Optional[float] = None
    fenwickFor: Optional[int] = None
    fenwickAgainst: Optional[int] = None
    fenwickPercentage: Optional[float] = None

    # High-danger chances
    highDangerScoringChances: Optional[int] = None
    highDangerGoals: Optional[int] = None

    # Zone time
    offensiveZoneTime: Optional[float] = None
    defensiveZoneTime: Optional[float] = None
    neutralZoneTime: Optional[float] = None

    # Heat maps and positioning
    heatMapData: Optional[Dict[str, Any]] = None


class NHLBetAnalysis(BaseModel):
    """NHL Betting Analysis"""

    model_config = ConfigDict(from_attributes=True)

    gameId: int
    analysisType: str  # "game", "player_prop", "team_prop"

    # ML prediction
    predictionConfidence: float = Field(ge=0, le=100)
    recommendedBet: Optional[str] = None

    # Value assessment
    expectedValue: Optional[float] = None
    kellyBetSize: Optional[float] = None

    # Supporting factors
    keyFactors: List[str] = []
    homeAdvantage: Optional[float] = None
    injuryImpact: Optional[str] = None
    recentForm: Optional[Dict[str, Any]] = None
    headToHead: Optional[Dict[str, Any]] = None

    # Advanced metrics
    analytics: Optional[NHLAnalytics] = None

    # Risk assessment
    riskLevel: str = Field(default="medium")  # low, medium, high
    confidence: str = Field(default="medium")  # low, medium, high

    # Metadata
    generatedAt: datetime = Field(default_factory=datetime.utcnow)
    model_version: str = "1.0"


class NHLScoreboard(BaseModel):
    """NHL Scoreboard"""

    model_config = ConfigDict(from_attributes=True)

    date: str
    totalGames: int
    games: List[NHLGame]


class NHLHealthCheck(BaseModel):
    """NHL Service Health Check"""

    model_config = ConfigDict(from_attributes=True)

    status: str
    api_status: str
    message: str
    last_updated: str
    total_teams: Optional[int] = None
    endpoints_tested: List[str] = []
    response_time_ms: Optional[float] = None


class NHLDraft(BaseModel):
    """NHL Draft Information"""

    model_config = ConfigDict(from_attributes=True)

    draftYear: int
    round: int
    pickInRound: int
    overallPick: int
    team: NHLTeam
    prospect: Dict[str, Any]  # Prospect information


class NHLPlayoffSeries(BaseModel):
    """NHL Playoff Series"""

    model_config = ConfigDict(from_attributes=True)

    seriesCode: str
    round: int
    matchupTeams: List[NHLTeam]
    currentGame: Optional[int] = None
    gamesInSeries: int = 7
    wins: Dict[str, int]  # Team ID to wins
    status: str


class NHLGameSummary(BaseModel):
    """NHL Game Summary for API responses"""

    model_config = ConfigDict(from_attributes=True)

    game: NHLGame
    teamStats: Optional[Dict[str, NHLTeamStats]] = None
    playerStats: Optional[List[NHLPlayerStats]] = None
    odds: Optional[List[NHLOdds]] = None
    analytics: Optional[NHLAnalytics] = None
    betAnalysis: Optional[NHLBetAnalysis] = None
