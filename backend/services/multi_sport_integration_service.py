"""
Multi-Sport Data Integration Service

This service provides comprehensive data integration across NBA, NFL, NHL, and Soccer,
leveraging the Phase 2 ML pipeline and data infrastructure for unified analytics.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union, Tuple
import pandas as pd
import numpy as np
from dataclasses import dataclass, asdict
from enum import Enum
import json
import aiohttp
from concurrent.futures import ThreadPoolExecutor
import threading

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Sport(Enum):
    """Supported sports for multi-sport integration"""
    NBA = "nba"
    NFL = "nfl"
    NHL = "nhl"
    SOCCER = "soccer"
    MLB = "mlb"  # Already supported from Phase 2

class GameStatus(Enum):
    """Game status across all sports"""
    SCHEDULED = "scheduled"
    LIVE = "live"
    HALFTIME = "halftime"
    OVERTIME = "overtime"
    FINAL = "final"
    POSTPONED = "postponed"
    CANCELLED = "cancelled"

class PlayerPosition(Enum):
    """Unified player positions across sports"""
    # Basketball
    POINT_GUARD = "pg"
    SHOOTING_GUARD = "sg" 
    SMALL_FORWARD = "sf"
    POWER_FORWARD = "pf"
    CENTER = "c"
    
    # Football
    QUARTERBACK = "qb"
    RUNNING_BACK = "rb"
    WIDE_RECEIVER = "wr"
    TIGHT_END = "te"
    OFFENSIVE_LINE = "ol"
    DEFENSIVE_LINE = "dl"
    LINEBACKER = "lb"
    CORNERBACK = "cb"
    SAFETY = "s"
    KICKER = "k"
    
    # Hockey
    LEFT_WING = "lw"
    RIGHT_WING = "rw"
    CENTER_ICE = "c_ice"
    LEFT_DEFENSE = "ld"
    RIGHT_DEFENSE = "rd"
    GOALIE = "g"
    
    # Soccer
    GOALKEEPER = "gk"
    DEFENDER = "def"
    MIDFIELDER = "mid"
    FORWARD = "fwd"

@dataclass
class SportConfig:
    """Configuration for sport-specific data integration"""
    sport: Sport
    league_name: str
    season_format: str  # "regular", "playoffs", "tournaments"
    game_duration_minutes: int
    roster_size: int
    key_statistics: List[str]
    position_mappings: Dict[str, PlayerPosition]
    api_endpoints: Dict[str, str]
    data_refresh_interval: int
    prediction_models: List[str]

@dataclass
class UnifiedPlayer:
    """Unified player data structure across all sports"""
    player_id: str
    name: str
    sport: Sport
    team_id: str
    position: PlayerPosition
    jersey_number: int
    age: int
    height_cm: float
    weight_kg: float
    nationality: str
    salary: Optional[float]
    experience_years: int
    current_season_stats: Dict[str, float]
    career_stats: Dict[str, float]
    injury_status: str
    contract_details: Dict[str, Any]

@dataclass
class UnifiedTeam:
    """Unified team data structure across all sports"""
    team_id: str
    name: str
    city: str
    sport: Sport
    league: str
    conference: str
    division: str
    founded_year: int
    home_venue: str
    venue_capacity: int
    head_coach: str
    owner: str
    team_colors: List[str]
    current_season_record: Dict[str, int]
    playoff_appearances: int
    championships: int

@dataclass
class UnifiedGame:
    """Unified game data structure across all sports"""
    game_id: str
    sport: Sport
    season: str
    week: Optional[int]  # For NFL
    game_date: datetime
    home_team_id: str
    away_team_id: str
    venue: str
    status: GameStatus
    period: int
    time_remaining: str
    home_score: int
    away_score: int
    attendance: Optional[int]
    weather: Optional[Dict[str, Any]]
    broadcast_info: Dict[str, str]
    officials: List[str]
    
@dataclass
class UnifiedStatistics:
    """Unified statistics structure for cross-sport analysis"""
    player_id: str
    game_id: str
    sport: Sport
    minutes_played: float
    primary_stats: Dict[str, float]  # Sport-specific main stats
    advanced_stats: Dict[str, float]  # Advanced analytics
    efficiency_rating: float
    plus_minus: Optional[float]
    usage_rate: Optional[float]
    true_shooting_pct: Optional[float]
    win_shares: Optional[float]

class MultiSportIntegrationService:
    """
    Service for integrating data across multiple sports
    """
    
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.sport_configs = self._initialize_sport_configs()
        self.data_cache = {}
        self.cache_ttl = timedelta(minutes=5)
        self.executor = ThreadPoolExecutor(max_workers=20)
        self.real_time_feeds = {}
        
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()

    def _initialize_sport_configs(self) -> Dict[Sport, SportConfig]:
        """Initialize configurations for all supported sports"""
        
        configs = {}
        
        # NBA Configuration
        configs[Sport.NBA] = SportConfig(
            sport=Sport.NBA,
            league_name="National Basketball Association",
            season_format="regular_playoffs",
            game_duration_minutes=48,
            roster_size=15,
            key_statistics=[
                "points", "rebounds", "assists", "steals", "blocks", 
                "field_goals_made", "field_goals_attempted", "three_pointers_made",
                "three_pointers_attempted", "free_throws_made", "free_throws_attempted",
                "turnovers", "personal_fouls", "minutes"
            ],
            position_mappings={
                "PG": PlayerPosition.POINT_GUARD,
                "SG": PlayerPosition.SHOOTING_GUARD,
                "SF": PlayerPosition.SMALL_FORWARD,
                "PF": PlayerPosition.POWER_FORWARD,
                "C": PlayerPosition.CENTER
            },
            api_endpoints={
                "games": "https://api.nba.com/v1/games",
                "players": "https://api.nba.com/v1/players",
                "teams": "https://api.nba.com/v1/teams",
                "stats": "https://api.nba.com/v1/stats"
            },
            data_refresh_interval=30,  # seconds
            prediction_models=["nba_points", "nba_rebounds", "nba_assists", "nba_game_outcome"]
        )
        
        # NFL Configuration
        configs[Sport.NFL] = SportConfig(
            sport=Sport.NFL,
            league_name="National Football League",
            season_format="regular_playoffs",
            game_duration_minutes=60,
            roster_size=53,
            key_statistics=[
                "passing_yards", "passing_touchdowns", "interceptions", "rushing_yards",
                "rushing_touchdowns", "receptions", "receiving_yards", "receiving_touchdowns",
                "tackles", "sacks", "fumbles", "field_goals_made", "field_goals_attempted"
            ],
            position_mappings={
                "QB": PlayerPosition.QUARTERBACK,
                "RB": PlayerPosition.RUNNING_BACK,
                "WR": PlayerPosition.WIDE_RECEIVER,
                "TE": PlayerPosition.TIGHT_END,
                "K": PlayerPosition.KICKER
            },
            api_endpoints={
                "games": "https://api.nfl.com/v1/games",
                "players": "https://api.nfl.com/v1/players",
                "teams": "https://api.nfl.com/v1/teams",
                "stats": "https://api.nfl.com/v1/stats"
            },
            data_refresh_interval=60,  # seconds
            prediction_models=["nfl_passing_yards", "nfl_rushing_yards", "nfl_receiving_yards", "nfl_game_outcome"]
        )
        
        # NHL Configuration
        configs[Sport.NHL] = SportConfig(
            sport=Sport.NHL,
            league_name="National Hockey League",
            season_format="regular_playoffs",
            game_duration_minutes=60,
            roster_size=23,
            key_statistics=[
                "goals", "assists", "points", "shots", "hits", "blocked_shots",
                "penalty_minutes", "faceoff_wins", "faceoff_losses", "time_on_ice",
                "power_play_goals", "short_handed_goals", "saves", "goals_against"
            ],
            position_mappings={
                "LW": PlayerPosition.LEFT_WING,
                "RW": PlayerPosition.RIGHT_WING,
                "C": PlayerPosition.CENTER_ICE,
                "LD": PlayerPosition.LEFT_DEFENSE,
                "RD": PlayerPosition.RIGHT_DEFENSE,
                "G": PlayerPosition.GOALIE
            },
            api_endpoints={
                "games": "https://api.nhl.com/v1/games",
                "players": "https://api.nhl.com/v1/players",
                "teams": "https://api.nhl.com/v1/teams",
                "stats": "https://api.nhl.com/v1/stats"
            },
            data_refresh_interval=45,  # seconds
            prediction_models=["nhl_goals", "nhl_assists", "nhl_shots", "nhl_game_outcome"]
        )
        
        # Soccer Configuration
        configs[Sport.SOCCER] = SportConfig(
            sport=Sport.SOCCER,
            league_name="Major League Soccer",
            season_format="regular_playoffs",
            game_duration_minutes=90,
            roster_size=30,
            key_statistics=[
                "goals", "assists", "shots", "shots_on_target", "passes", "pass_accuracy",
                "crosses", "dribbles", "tackles", "interceptions", "clearances",
                "yellow_cards", "red_cards", "minutes_played", "saves", "goals_conceded"
            ],
            position_mappings={
                "GK": PlayerPosition.GOALKEEPER,
                "DEF": PlayerPosition.DEFENDER,
                "MID": PlayerPosition.MIDFIELDER,
                "FWD": PlayerPosition.FORWARD
            },
            api_endpoints={
                "games": "https://api.mlssoccer.com/v1/games",
                "players": "https://api.mlssoccer.com/v1/players",
                "teams": "https://api.mlssoccer.com/v1/teams",
                "stats": "https://api.mlssoccer.com/v1/stats"
            },
            data_refresh_interval=60,  # seconds
            prediction_models=["soccer_goals", "soccer_assists", "soccer_shots", "soccer_game_outcome"]
        )
        
        return configs

    async def get_unified_games_today(self, sports: List[Sport] = None) -> List[UnifiedGame]:
        """
        Get today's games across all specified sports in unified format
        
        Args:
            sports: List of sports to include (all if None)
            
        Returns:
            List of UnifiedGame objects
        """
        if sports is None:
            sports = list(Sport)
            
        all_games = []
        
        for sport in sports:
            try:
                sport_games = await self._fetch_sport_games(sport, datetime.now().date())
                all_games.extend(sport_games)
            except Exception as e:
                logger.error(f"Error fetching {sport.value} games: {str(e)}")
                continue
                
        # Sort by game time
        all_games.sort(key=lambda x: x.game_date)
        
        logger.info(f"Retrieved {len(all_games)} games across {len(sports)} sports")
        return all_games

    async def _fetch_sport_games(self, sport: Sport, date: datetime.date) -> List[UnifiedGame]:
        """Fetch games for a specific sport and convert to unified format"""
        
        cache_key = f"games_{sport.value}_{date}"
        
        # Check cache
        if cache_key in self.data_cache:
            cached_data, timestamp = self.data_cache[cache_key]
            if datetime.now() - timestamp < self.cache_ttl:
                return cached_data
        
        try:
            # Simulate API call - replace with actual sport API integration
            games = await self._simulate_sport_games(sport, date)
            
            # Cache the result
            self.data_cache[cache_key] = (games, datetime.now())
            
            return games
            
        except Exception as e:
            logger.error(f"Error fetching {sport.value} games: {str(e)}")
            return []

    async def _simulate_sport_games(self, sport: Sport, date: datetime.date) -> List[UnifiedGame]:
        """Simulate game data for testing - replace with actual API calls"""
        
        games = []
        config = self.sport_configs[sport]
        
        # Generate 2-8 games per sport per day
        num_games = np.random.randint(2, 9)
        
        for i in range(num_games):
            game_time = datetime.combine(date, datetime.min.time()) + timedelta(
                hours=np.random.randint(12, 23),
                minutes=np.random.choice([0, 15, 30, 45])
            )
            
            game = UnifiedGame(
                game_id=f"{sport.value}_game_{date}_{i+1}",
                sport=sport,
                season="2024-25",
                week=np.random.randint(1, 18) if sport == Sport.NFL else None,
                game_date=game_time,
                home_team_id=f"{sport.value}_team_{np.random.randint(1, 31)}",
                away_team_id=f"{sport.value}_team_{np.random.randint(1, 31)}",
                venue=f"{sport.value.upper()} Arena {i+1}",
                status=np.random.choice(list(GameStatus)),
                period=np.random.randint(1, 5),
                time_remaining="12:34",
                home_score=np.random.randint(0, 120) if sport == Sport.NBA else np.random.randint(0, 50),
                away_score=np.random.randint(0, 120) if sport == Sport.NBA else np.random.randint(0, 50),
                attendance=np.random.randint(15000, 25000),
                weather={"temperature": 72, "condition": "Clear"} if sport in [Sport.NFL, Sport.SOCCER] else None,
                broadcast_info={"tv": "ESPN", "radio": "Local Sports"},
                officials=["Ref 1", "Ref 2", "Ref 3"]
            )
            games.append(game)
            
        return games

    async def get_cross_sport_player_comparison(
        self,
        player_ids: List[str],
        comparison_metrics: List[str] = None
    ) -> Dict[str, Any]:
        """
        Compare players across different sports using normalized metrics
        
        Args:
            player_ids: List of player IDs from different sports
            comparison_metrics: Metrics to compare (normalized)
            
        Returns:
            Comparison analysis with normalized scores
        """
        if comparison_metrics is None:
            comparison_metrics = ["efficiency", "consistency", "clutch_performance", "durability"]
            
        players = []
        
        for player_id in player_ids:
            try:
                player_data = await self._fetch_unified_player(player_id)
                if player_data:
                    players.append(player_data)
            except Exception as e:
                logger.error(f"Error fetching player {player_id}: {str(e)}")
                continue
        
        if len(players) < 2:
            return {"error": "Need at least 2 players for comparison"}
        
        # Normalize metrics across sports
        normalized_scores = await self._normalize_cross_sport_metrics(players, comparison_metrics)
        
        # Generate comparison analysis
        comparison = {
            "players": [asdict(player) for player in players],
            "normalized_scores": normalized_scores,
            "rankings": self._rank_players(normalized_scores, comparison_metrics),
            "sport_advantages": self._analyze_sport_advantages(players, normalized_scores),
            "overall_assessment": self._generate_cross_sport_assessment(players, normalized_scores)
        }
        
        return comparison

    async def _fetch_unified_player(self, player_id: str) -> Optional[UnifiedPlayer]:
        """Fetch player data and convert to unified format"""
        
        # Extract sport from player_id format (assumed: sport_player_id)
        sport_code = player_id.split('_')[0]
        sport = Sport(sport_code)
        
        # Simulate player data - replace with actual API calls
        player = UnifiedPlayer(
            player_id=player_id,
            name=f"Player {player_id.split('_')[-1]}",
            sport=sport,
            team_id=f"{sport.value}_team_{np.random.randint(1, 31)}",
            position=list(self.sport_configs[sport].position_mappings.values())[0],
            jersey_number=np.random.randint(1, 100),
            age=np.random.randint(20, 40),
            height_cm=np.random.uniform(175, 220),
            weight_kg=np.random.uniform(70, 150),
            nationality="USA",
            salary=np.random.uniform(1000000, 50000000),
            experience_years=np.random.randint(1, 20),
            current_season_stats=self._generate_sport_stats(sport),
            career_stats=self._generate_sport_stats(sport, career=True),
            injury_status="healthy",
            contract_details={"years_remaining": 2, "guaranteed_money": 10000000}
        )
        
        return player

    def _generate_sport_stats(self, sport: Sport, career: bool = False) -> Dict[str, float]:
        """Generate realistic stats for each sport"""
        
        multiplier = np.random.uniform(0.8, 1.2) if career else 1.0
        
        if sport == Sport.NBA:
            return {
                "points": np.random.uniform(8, 35) * multiplier,
                "rebounds": np.random.uniform(2, 15) * multiplier,
                "assists": np.random.uniform(1, 12) * multiplier,
                "field_goal_percentage": np.random.uniform(0.35, 0.65),
                "three_point_percentage": np.random.uniform(0.25, 0.45),
                "free_throw_percentage": np.random.uniform(0.65, 0.95)
            }
        elif sport == Sport.NFL:
            return {
                "passing_yards": np.random.uniform(100, 5000) * multiplier,
                "passing_touchdowns": np.random.uniform(1, 50) * multiplier,
                "rushing_yards": np.random.uniform(50, 2000) * multiplier,
                "receiving_yards": np.random.uniform(200, 1800) * multiplier,
                "touchdowns": np.random.uniform(1, 25) * multiplier
            }
        elif sport == Sport.NHL:
            return {
                "goals": np.random.uniform(5, 60) * multiplier,
                "assists": np.random.uniform(10, 100) * multiplier,
                "points": np.random.uniform(15, 150) * multiplier,
                "plus_minus": np.random.uniform(-20, 50) * multiplier,
                "penalty_minutes": np.random.uniform(10, 200) * multiplier
            }
        elif sport == Sport.SOCCER:
            return {
                "goals": np.random.uniform(1, 30) * multiplier,
                "assists": np.random.uniform(1, 20) * multiplier,
                "shots": np.random.uniform(20, 150) * multiplier,
                "pass_accuracy": np.random.uniform(0.70, 0.95),
                "tackles": np.random.uniform(10, 100) * multiplier
            }
        else:
            return {}

    async def _normalize_cross_sport_metrics(
        self,
        players: List[UnifiedPlayer],
        metrics: List[str]
    ) -> Dict[str, Dict[str, float]]:
        """Normalize metrics across different sports for fair comparison"""
        
        normalized = {}
        
        for player in players:
            player_scores = {}
            
            for metric in metrics:
                if metric == "efficiency":
                    score = self._calculate_efficiency_score(player)
                elif metric == "consistency":
                    score = self._calculate_consistency_score(player)
                elif metric == "clutch_performance":
                    score = self._calculate_clutch_score(player)
                elif metric == "durability":
                    score = self._calculate_durability_score(player)
                else:
                    score = 0.5  # Default neutral score
                
                player_scores[metric] = round(score, 3)
            
            normalized[player.player_id] = player_scores
        
        return normalized

    def _calculate_efficiency_score(self, player: UnifiedPlayer) -> float:
        """Calculate normalized efficiency score across sports"""
        
        if player.sport == Sport.NBA:
            # NBA: Points + Rebounds + Assists per minute
            stats = player.current_season_stats
            efficiency = (stats.get("points", 0) + stats.get("rebounds", 0) + stats.get("assists", 0)) / 36
            return min(efficiency / 40, 1.0)  # Normalize to 0-1
            
        elif player.sport == Sport.NFL:
            # NFL: Total yards + TDs per game
            stats = player.current_season_stats
            total_yards = stats.get("passing_yards", 0) + stats.get("rushing_yards", 0) + stats.get("receiving_yards", 0)
            total_tds = stats.get("passing_touchdowns", 0) + stats.get("rushing_touchdowns", 0) + stats.get("receiving_touchdowns", 0)
            efficiency = (total_yards / 16) + (total_tds * 10)  # Per game basis
            return min(efficiency / 400, 1.0)
            
        elif player.sport == Sport.NHL:
            # NHL: Points per game
            stats = player.current_season_stats
            points_per_game = stats.get("points", 0) / 82
            return min(points_per_game / 2.0, 1.0)
            
        elif player.sport == Sport.SOCCER:
            # Soccer: Goals + Assists per game
            stats = player.current_season_stats
            contributions = stats.get("goals", 0) + stats.get("assists", 0)
            per_game = contributions / 34  # Typical season length
            return min(per_game / 1.5, 1.0)
            
        return 0.5

    def _calculate_consistency_score(self, player: UnifiedPlayer) -> float:
        """Calculate consistency score based on performance variance"""
        # Simplified consistency score - in real implementation, 
        # this would analyze game-by-game performance variance
        return np.random.uniform(0.6, 0.95)

    def _calculate_clutch_score(self, player: UnifiedPlayer) -> float:
        """Calculate clutch performance score"""
        # Simplified clutch score - would analyze performance in high-pressure situations
        return np.random.uniform(0.4, 0.9)

    def _calculate_durability_score(self, player: UnifiedPlayer) -> float:
        """Calculate durability score based on games played and injury history"""
        if player.injury_status == "healthy":
            base_score = 0.8
        else:
            base_score = 0.4
            
        # Factor in experience (longer career = more durable)
        experience_bonus = min(player.experience_years / 15, 0.2)
        
        return min(base_score + experience_bonus, 1.0)

    def _rank_players(
        self,
        normalized_scores: Dict[str, Dict[str, float]],
        metrics: List[str]
    ) -> Dict[str, int]:
        """Rank players based on overall normalized scores"""
        
        player_totals = {}
        
        for player_id, scores in normalized_scores.items():
            total_score = sum(scores[metric] for metric in metrics)
            player_totals[player_id] = total_score
        
        # Sort by total score descending
        sorted_players = sorted(player_totals.items(), key=lambda x: x[1], reverse=True)
        
        rankings = {}
        for rank, (player_id, score) in enumerate(sorted_players, 1):
            rankings[player_id] = rank
            
        return rankings

    def _analyze_sport_advantages(
        self,
        players: List[UnifiedPlayer],
        normalized_scores: Dict[str, Dict[str, float]]
    ) -> Dict[str, str]:
        """Analyze which sports have advantages in different areas"""
        
        sport_performance = {}
        
        for player in players:
            sport = player.sport.value
            if sport not in sport_performance:
                sport_performance[sport] = {"efficiency": [], "consistency": [], "clutch_performance": [], "durability": []}
            
            player_scores = normalized_scores[player.player_id]
            for metric, score in player_scores.items():
                if metric in sport_performance[sport]:
                    sport_performance[sport][metric].append(score)
        
        # Calculate average scores by sport
        sport_averages = {}
        for sport, metrics in sport_performance.items():
            sport_averages[sport] = {
                metric: np.mean(scores) for metric, scores in metrics.items() if scores
            }
        
        # Find best sport for each metric
        advantages = {}
        for metric in ["efficiency", "consistency", "clutch_performance", "durability"]:
            best_sport = max(sport_averages.keys(), 
                           key=lambda s: sport_averages[s].get(metric, 0))
            advantages[metric] = f"{best_sport.upper()} players excel in {metric}"
            
        return advantages

    def _generate_cross_sport_assessment(
        self,
        players: List[UnifiedPlayer],
        normalized_scores: Dict[str, Dict[str, float]]
    ) -> str:
        """Generate overall assessment of cross-sport comparison"""
        
        num_players = len(players)
        sports_involved = list(set(player.sport.value for player in players))
        
        # Find top performer
        player_totals = {
            pid: sum(scores.values()) for pid, scores in normalized_scores.items()
        }
        top_player_id = max(player_totals, key=player_totals.get)
        top_player = next(p for p in players if p.player_id == top_player_id)
        
        assessment = f"""
        Cross-Sport Analysis Summary:
        
        • Analyzed {num_players} elite athletes across {len(sports_involved)} sports
        • Top Overall Performer: {top_player.name} ({top_player.sport.value.upper()})
        • Sports Represented: {', '.join(sport.upper() for sport in sports_involved)}
        
        This comparison uses advanced normalization algorithms to fairly evaluate
        athletes across different sports, considering efficiency, consistency,
        clutch performance, and durability metrics.
        """
        
        return assessment.strip()

    async def get_live_multi_sport_feed(self) -> Dict[str, Any]:
        """Get live updates across all sports"""
        
        feed = {
            "timestamp": datetime.now().isoformat(),
            "sports_coverage": {},
            "trending_players": [],
            "live_games": [],
            "recent_scores": [],
            "breaking_news": []
        }
        
        for sport in Sport:
            try:
                sport_data = await self._get_sport_live_data(sport)
                feed["sports_coverage"][sport.value] = sport_data
            except Exception as e:
                logger.error(f"Error getting live data for {sport.value}: {str(e)}")
                continue
        
        return feed

    async def _get_sport_live_data(self, sport: Sport) -> Dict[str, Any]:
        """Get live data for a specific sport"""
        
        return {
            "active_games": np.random.randint(0, 8),
            "games_today": np.random.randint(4, 15),
            "trending_players": [
                f"{sport.value}_player_{i}" for i in range(1, 6)
            ],
            "recent_highlights": [
                f"Amazing play in {sport.value.upper()} game",
                f"Record-breaking performance in {sport.value.upper()}"
            ],
            "upcoming_games": np.random.randint(2, 10),
            "last_updated": datetime.now().isoformat()
        }

    async def get_cross_sport_betting_opportunities(
        self,
        min_confidence: float = 0.75
    ) -> List[Dict[str, Any]]:
        """Find betting opportunities across all sports"""
        
        opportunities = []
        
        for sport in Sport:
            try:
                sport_opportunities = await self._analyze_sport_betting_opportunities(
                    sport, min_confidence
                )
                opportunities.extend(sport_opportunities)
            except Exception as e:
                logger.error(f"Error analyzing {sport.value} opportunities: {str(e)}")
                continue
        
        # Sort by confidence descending
        opportunities.sort(key=lambda x: x["confidence"], reverse=True)
        
        return opportunities[:50]  # Return top 50 opportunities

    async def _analyze_sport_betting_opportunities(
        self,
        sport: Sport,
        min_confidence: float
    ) -> List[Dict[str, Any]]:
        """Analyze betting opportunities for a specific sport"""
        
        opportunities = []
        
        # Generate sample opportunities for testing
        for i in range(np.random.randint(5, 15)):
            confidence = np.random.uniform(min_confidence, 0.98)
            
            opportunity = {
                "id": f"{sport.value}_opp_{i+1}",
                "sport": sport.value,
                "type": np.random.choice(["player_prop", "game_total", "spread", "moneyline"]),
                "player": f"{sport.value}_player_{np.random.randint(1, 100)}" if "player" in "player_prop" else None,
                "market": self._get_sport_market(sport),
                "pick": np.random.choice(["over", "under", "yes", "no"]),
                "line": np.random.uniform(0.5, 50.5),
                "odds": np.random.randint(-200, 200),
                "confidence": round(confidence, 3),
                "expected_value": round(np.random.uniform(0.05, 0.25), 3),
                "analysis": f"Strong {sport.value.upper()} opportunity based on advanced analytics",
                "timestamp": datetime.now().isoformat()
            }
            
            opportunities.append(opportunity)
        
        return opportunities

    def _get_sport_market(self, sport: Sport) -> str:
        """Get typical betting market for each sport"""
        
        markets = {
            Sport.NBA: ["Points", "Rebounds", "Assists", "Three-Pointers"],
            Sport.NFL: ["Passing Yards", "Rushing Yards", "Receiving Yards", "Touchdowns"],
            Sport.NHL: ["Goals", "Assists", "Shots", "Saves"],
            Sport.SOCCER: ["Goals", "Assists", "Shots on Target", "Cards"],
            Sport.MLB: ["Hits", "RBIs", "Home Runs", "Strikeouts"]
        }
        
        return np.random.choice(markets.get(sport, ["Generic Prop"]))

# Usage example and testing
async def main():
    """Example usage of the Multi-Sport Integration Service"""
    
    async with MultiSportIntegrationService() as multi_sport_service:
        
        # Example 1: Get today's games across all sports
        print("=== Today's Games Across All Sports ===")
        todays_games = await multi_sport_service.get_unified_games_today()
        print(f"Total games today: {len(todays_games)}")
        
        for game in todays_games[:5]:  # Show first 5
            print(f"{game.sport.value.upper()}: {game.away_team_id} @ {game.home_team_id} - {game.game_date}")
        
        # Example 2: Cross-sport player comparison
        print("\n=== Cross-Sport Player Comparison ===")
        comparison = await multi_sport_service.get_cross_sport_player_comparison([
            "nba_player_1", "nfl_player_1", "nhl_player_1", "soccer_player_1"
        ])
        
        if "rankings" in comparison:
            print("Player Rankings:")
            for player_id, rank in comparison["rankings"].items():
                sport = player_id.split('_')[0].upper()
                print(f"{rank}. {sport} Player - {player_id}")
        
        # Example 3: Live multi-sport feed
        print("\n=== Live Multi-Sport Feed ===")
        live_feed = await multi_sport_service.get_live_multi_sport_feed()
        
        for sport, data in live_feed["sports_coverage"].items():
            print(f"{sport.upper()}: {data['active_games']} live games, {data['games_today']} total today")
        
        # Example 4: Cross-sport betting opportunities
        print("\n=== Cross-Sport Betting Opportunities ===")
        opportunities = await multi_sport_service.get_cross_sport_betting_opportunities(min_confidence=0.8)
        
        print(f"Found {len(opportunities)} high-confidence opportunities")
        for opp in opportunities[:5]:  # Show top 5
            print(f"{opp['sport'].upper()}: {opp['market']} {opp['pick']} {opp['line']} ({opp['confidence']:.1%} confidence)")

if __name__ == "__main__":
    asyncio.run(main())
