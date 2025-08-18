"""
Live Injury & Lineup Monitoring System - Section 4 Implementation

Advanced monitoring system for:
- Player injury tracking and impact assessment
- Real-time lineup changes and substitutions
- Starting pitcher confirmations and changes
- Automated prop valuation adjustments based on personnel changes
"""

import asyncio
import logging
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, Any, Optional, List, Set, Callable
import json

logger = logging.getLogger(__name__)


class InjuryType(Enum):
    """Types of player injuries"""
    MUSCLE_STRAIN = "muscle_strain"
    JOINT_INJURY = "joint_injury"  
    BONE_FRACTURE = "bone_fracture"
    CONCUSSION = "concussion"
    ILLNESS = "illness"
    REST_DAY = "rest_day"
    PERSONAL = "personal"
    UNKNOWN = "unknown"


class ImpactLevel(Enum):
    """Impact levels for injury/lineup changes"""
    MINIMAL = "minimal"      # Backup player, minimal prop impact
    MODERATE = "moderate"    # Role player, some prop adjustments needed
    SIGNIFICANT = "significant"  # Key player, major prop adjustments
    CRITICAL = "critical"    # Star player, extensive prop reevaluation


@dataclass
class InjuryReport:
    """Comprehensive injury report"""
    player_id: str
    player_name: str
    team: str
    position: str
    injury_type: InjuryType
    severity: str  # "Minor", "Moderate", "Severe"
    affected_body_part: str
    expected_return_date: Optional[str] = None
    days_estimated: Optional[int] = None
    impact_assessment: ImpactLevel = ImpactLevel.MODERATE
    
    # Performance impact predictions
    prop_adjustments: Dict[str, float] = field(default_factory=dict)
    replacement_player: Optional[str] = None
    team_adjustments: Dict[str, float] = field(default_factory=dict)
    
    # Metadata
    report_date: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    source: str = "internal"
    confidence_level: float = 0.8
    last_updated: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class LineupAnalysis:
    """Analysis of lineup changes and their impacts"""
    game_id: str
    team: str
    change_timestamp: datetime
    
    # Changes detected
    batting_order_changes: List[Dict[str, Any]] = field(default_factory=list)
    starting_pitcher_change: Optional[Dict[str, Any]] = None
    defensive_changes: List[Dict[str, Any]] = field(default_factory=list)
    
    # Impact assessment
    offensive_impact: float = 0.0  # -1.0 to +1.0 scale
    defensive_impact: float = 0.0
    pitching_impact: float = 0.0
    
    # Prop adjustments needed
    affected_props: List[str] = field(default_factory=list)
    adjustment_recommendations: Dict[str, Dict[str, float]] = field(default_factory=dict)


@dataclass  
class PlayerPerformanceProfile:
    """Player performance profile for impact assessment"""
    player_id: str
    player_name: str
    position: str
    team: str
    
    # Current season stats
    games_played: int = 0
    batting_avg: float = 0.250
    on_base_pct: float = 0.320
    slugging_pct: float = 0.400
    home_runs: int = 0
    rbi: int = 0
    stolen_bases: int = 0
    
    # Pitching stats (if applicable)
    era: float = 0.0
    whip: float = 0.0
    strikeouts: int = 0
    innings_pitched: float = 0.0
    
    # Usage and importance metrics
    lineup_position_avg: float = 5.0  # Average batting order position
    team_war_contribution: float = 0.0  # Wins Above Replacement
    injury_history: List[str] = field(default_factory=list)
    
    # Performance trends
    last_30_days_performance: Dict[str, float] = field(default_factory=dict)
    home_away_splits: Dict[str, Dict[str, float]] = field(default_factory=dict)


class LiveInjuryLineupMonitor:
    """
    Advanced monitoring system for injuries and lineup changes
    
    Features:
    - Real-time injury report processing
    - Lineup change detection and analysis
    - Automated impact assessment
    - Prop adjustment recommendations
    - Integration with valuation system
    """
    
    def __init__(self, real_time_data_service=None):
        self.name = "live_injury_lineup_monitor" 
        self.version = "1.0"
        
        # Dependencies
        self.data_service = real_time_data_service
        
        # Player database
        self.player_profiles: Dict[str, PlayerPerformanceProfile] = {}
        self.injury_reports: Dict[str, InjuryReport] = {}
        self.lineup_analyses: Dict[str, LineupAnalysis] = {}
        
        # Monitoring state
        self.monitoring_active = False
        self.monitored_teams: Set[str] = set()
        self.monitored_games: Set[str] = set()
        
        # Callbacks for injury/lineup changes
        self.injury_callbacks: List[Callable] = []
        self.lineup_callbacks: List[Callable] = []
        
        # Performance baselines for impact calculation
        self.position_baselines = {
            "C": {"batting_avg": 0.240, "ops": 0.700, "war": 1.5},
            "1B": {"batting_avg": 0.260, "ops": 0.780, "war": 2.0},
            "2B": {"batting_avg": 0.250, "ops": 0.720, "war": 2.5},
            "3B": {"batting_avg": 0.255, "ops": 0.750, "war": 2.8},
            "SS": {"batting_avg": 0.245, "ops": 0.710, "war": 3.0},
            "LF": {"batting_avg": 0.255, "ops": 0.760, "war": 2.2},
            "CF": {"batting_avg": 0.250, "ops": 0.740, "war": 2.8},
            "RF": {"batting_avg": 0.260, "ops": 0.770, "war": 2.5},
            "DH": {"batting_avg": 0.265, "ops": 0.800, "war": 1.8},
            "SP": {"era": 4.20, "whip": 1.30, "war": 3.0},
            "RP": {"era": 3.80, "whip": 1.25, "war": 1.0}
        }
        
        logger.info("Live Injury & Lineup Monitor initialized")
    
    async def initialize(self):
        """Initialize monitoring system"""
        if self.data_service:
            # Register for real-time data updates
            self.data_service.register_update_callback(self._process_game_update)
        
        # Load initial player profiles
        await self._load_player_profiles()
        
        logger.info("Live Injury & Lineup Monitor initialized")
    
    async def start_monitoring(self, teams: List[str] = None, games: List[str] = None):
        """Start monitoring teams/games for injury and lineup changes"""
        if teams:
            self.monitored_teams.update(teams)
        
        if games:
            self.monitored_games.update(games)
        
        if not self.monitoring_active:
            self.monitoring_active = True
            # Start monitoring tasks
            asyncio.create_task(self._injury_monitoring_loop())
            asyncio.create_task(self._lineup_monitoring_loop())
            
        logger.info(f"Started monitoring - Teams: {len(self.monitored_teams)}, Games: {len(self.monitored_games)}")
    
    async def stop_monitoring(self):
        """Stop all monitoring"""
        self.monitoring_active = False
        self.monitored_teams.clear()
        self.monitored_games.clear()
        logger.info("Stopped injury and lineup monitoring")
    
    async def process_injury_report(self, injury_data: Dict[str, Any]) -> InjuryReport:
        """Process incoming injury report and assess impact"""
        try:
            # Parse injury data
            injury_report = InjuryReport(
                player_id=injury_data.get("player_id", "unknown"),
                player_name=injury_data.get("player_name", "Unknown Player"),
                team=injury_data.get("team", "Unknown"),
                position=injury_data.get("position", "Unknown"),
                injury_type=self._parse_injury_type(injury_data.get("injury_type", "unknown")),
                severity=injury_data.get("severity", "Moderate"),
                affected_body_part=injury_data.get("body_part", "Unknown"),
                expected_return_date=injury_data.get("expected_return"),
                days_estimated=injury_data.get("days_estimated"),
                source=injury_data.get("source", "external")
            )
            
            # Assess impact
            await self._assess_injury_impact(injury_report)
            
            # Store report
            self.injury_reports[injury_report.player_id] = injury_report
            
            # Trigger callbacks
            await self._trigger_injury_callbacks(injury_report)
            
            logger.info(f"Processed injury report: {injury_report.player_name} - {injury_report.injury_type.value}")
            return injury_report
            
        except Exception as e:
            logger.error(f"Error processing injury report: {e}")
            raise
    
    async def analyze_lineup_change(self, game_id: str, lineup_data: Dict[str, Any]) -> LineupAnalysis:
        """Analyze lineup changes for a specific game"""
        try:
            # Get previous lineup if available
            previous_analysis = self.lineup_analyses.get(game_id)
            
            analysis = LineupAnalysis(
                game_id=game_id,
                team=lineup_data.get("team", "Unknown"),
                change_timestamp=datetime.now(timezone.utc)
            )
            
            # Detect batting order changes
            if "batting_order" in lineup_data:
                batting_changes = await self._detect_batting_order_changes(
                    game_id, lineup_data["batting_order"], previous_analysis
                )
                analysis.batting_order_changes = batting_changes
            
            # Detect pitcher changes
            if "starting_pitcher" in lineup_data:
                pitcher_change = await self._detect_pitcher_change(
                    game_id, lineup_data["starting_pitcher"], previous_analysis
                )
                if pitcher_change:
                    analysis.starting_pitcher_change = pitcher_change
            
            # Assess impact
            await self._assess_lineup_impact(analysis)
            
            # Generate prop adjustment recommendations
            await self._generate_prop_adjustments(analysis)
            
            # Store analysis
            self.lineup_analyses[game_id] = analysis
            
            # Trigger callbacks
            await self._trigger_lineup_callbacks(analysis)
            
            logger.info(f"Analyzed lineup change for game {game_id}: {len(analysis.batting_order_changes)} changes")
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing lineup change: {e}")
            raise
    
    async def get_player_injury_status(self, player_id: str) -> Optional[InjuryReport]:
        """Get current injury status for a player"""
        return self.injury_reports.get(player_id)
    
    async def get_active_injuries_by_team(self, team: str) -> List[InjuryReport]:
        """Get all active injuries for a team"""
        return [
            report for report in self.injury_reports.values()
            if report.team == team and self._is_injury_active(report)
        ]
    
    async def get_lineup_analysis(self, game_id: str) -> Optional[LineupAnalysis]:
        """Get lineup analysis for a specific game"""
        return self.lineup_analyses.get(game_id)
    
    def register_injury_callback(self, callback: Callable):
        """Register callback for injury updates"""
        self.injury_callbacks.append(callback)
        logger.info(f"Registered injury callback: {callback.__name__}")
    
    def register_lineup_callback(self, callback: Callable):
        """Register callback for lineup updates"""
        self.lineup_callbacks.append(callback)
        logger.info(f"Registered lineup callback: {callback.__name__}")
    
    async def _load_player_profiles(self):
        """Load player performance profiles"""
        # In production, this would load from database or external API
        # For now, create sample profiles
        
        sample_profiles = [
            PlayerPerformanceProfile(
                player_id="sample_player_1",
                player_name="Mike Trout",
                position="CF",
                team="Los Angeles Angels",
                games_played=140,
                batting_avg=0.305,
                on_base_pct=0.415,
                slugging_pct=0.585,
                home_runs=35,
                rbi=95,
                lineup_position_avg=3.0,
                team_war_contribution=6.8
            ),
            PlayerPerformanceProfile(
                player_id="sample_player_2",
                player_name="Jacob deGrom",
                position="SP",
                team="Texas Rangers",
                games_played=30,
                era=2.85,
                whip=1.15,
                strikeouts=180,
                innings_pitched=175.0,
                team_war_contribution=4.5
            )
        ]
        
        for profile in sample_profiles:
            self.player_profiles[profile.player_id] = profile
        
        logger.info(f"Loaded {len(sample_profiles)} player profiles")
    
    def _parse_injury_type(self, injury_str: str) -> InjuryType:
        """Parse injury type from string"""
        injury_lower = injury_str.lower()
        
        if any(term in injury_lower for term in ["strain", "pull", "muscle"]):
            return InjuryType.MUSCLE_STRAIN
        elif any(term in injury_lower for term in ["knee", "shoulder", "elbow", "joint"]):
            return InjuryType.JOINT_INJURY
        elif any(term in injury_lower for term in ["fracture", "break", "broken"]):
            return InjuryType.BONE_FRACTURE
        elif "concussion" in injury_lower:
            return InjuryType.CONCUSSION
        elif any(term in injury_lower for term in ["illness", "flu", "covid"]):
            return InjuryType.ILLNESS
        elif any(term in injury_lower for term in ["rest", "day off"]):
            return InjuryType.REST_DAY
        elif any(term in injury_lower for term in ["personal", "family"]):
            return InjuryType.PERSONAL
        else:
            return InjuryType.UNKNOWN
    
    async def _assess_injury_impact(self, injury_report: InjuryReport):
        """Assess the impact of an injury on team performance and props"""
        
        # Get player profile
        profile = self.player_profiles.get(injury_report.player_id)
        if not profile:
            # Create basic profile from injury report
            profile = PlayerPerformanceProfile(
                player_id=injury_report.player_id,
                player_name=injury_report.player_name,
                position=injury_report.position,
                team=injury_report.team
            )
        
        # Determine impact level based on multiple factors
        impact_score = 0.0
        
        # Position importance
        if injury_report.position in ["SP", "CP"]:  # Starting/Closing pitcher
            impact_score += 0.4
        elif injury_report.position in ["CF", "SS", "C"]:  # Key defensive positions
            impact_score += 0.3
        else:
            impact_score += 0.2
        
        # Player quality (WAR contribution)
        war = profile.team_war_contribution
        if war > 5.0:
            impact_score += 0.4  # Star player
        elif war > 3.0:
            impact_score += 0.3  # Above average
        elif war > 1.0:
            impact_score += 0.2  # Average
        else:
            impact_score += 0.1  # Below average
        
        # Injury severity
        if injury_report.severity.lower() == "severe":
            impact_score += 0.3
        elif injury_report.severity.lower() == "moderate":
            impact_score += 0.2
        else:
            impact_score += 0.1
        
        # Determine impact level
        if impact_score >= 0.8:
            injury_report.impact_assessment = ImpactLevel.CRITICAL
        elif impact_score >= 0.6:
            injury_report.impact_assessment = ImpactLevel.SIGNIFICANT
        elif impact_score >= 0.4:
            injury_report.impact_assessment = ImpactLevel.MODERATE
        else:
            injury_report.impact_assessment = ImpactLevel.MINIMAL
        
        # Calculate specific prop adjustments
        injury_report.prop_adjustments = await self._calculate_injury_prop_adjustments(
            injury_report, profile
        )
    
    async def _calculate_injury_prop_adjustments(
        self, 
        injury_report: InjuryReport, 
        profile: PlayerPerformanceProfile
    ) -> Dict[str, float]:
        """Calculate specific prop adjustments based on injury"""
        
        adjustments = {}
        impact_multiplier = self._get_impact_multiplier(injury_report.impact_assessment)
        
        if injury_report.position == "SP":  # Starting pitcher
            adjustments["strikeouts"] = -0.15 * impact_multiplier
            adjustments["innings_pitched"] = -0.20 * impact_multiplier
            adjustments["earned_runs"] = 0.25 * impact_multiplier
        else:  # Position player
            adjustments["hits"] = -0.10 * impact_multiplier
            adjustments["home_runs"] = -0.15 * impact_multiplier
            adjustments["rbi"] = -0.12 * impact_multiplier
            adjustments["runs"] = -0.10 * impact_multiplier
            adjustments["stolen_bases"] = -0.20 * impact_multiplier
        
        return adjustments
    
    def _get_impact_multiplier(self, impact_level: ImpactLevel) -> float:
        """Get multiplier based on impact level"""
        multipliers = {
            ImpactLevel.MINIMAL: 0.25,
            ImpactLevel.MODERATE: 0.50,
            ImpactLevel.SIGNIFICANT: 0.75,
            ImpactLevel.CRITICAL: 1.00
        }
        return multipliers.get(impact_level, 0.50)
    
    async def _detect_batting_order_changes(
        self, 
        game_id: str, 
        new_order: List[Dict[str, Any]], 
        previous_analysis: Optional[LineupAnalysis]
    ) -> List[Dict[str, Any]]:
        """Detect changes in batting order"""
        
        changes = []
        
        if not previous_analysis:
            # First lineup analysis for this game
            return [{"type": "INITIAL_LINEUP", "lineup": new_order}]
        
        # Compare with previous lineup
        # This is simplified - in production would have more sophisticated comparison
        if len(new_order) != len(previous_analysis.batting_order_changes):
            changes.append({
                "type": "LINEUP_SIZE_CHANGE",
                "previous_size": len(previous_analysis.batting_order_changes),
                "new_size": len(new_order)
            })
        
        return changes
    
    async def _detect_pitcher_change(
        self,
        game_id: str,
        new_pitcher: Dict[str, Any],
        previous_analysis: Optional[LineupAnalysis]
    ) -> Optional[Dict[str, Any]]:
        """Detect starting pitcher changes"""
        
        if not previous_analysis or not previous_analysis.starting_pitcher_change:
            return {
                "type": "INITIAL_PITCHER",
                "pitcher": new_pitcher
            }
        
        previous_pitcher = previous_analysis.starting_pitcher_change.get("pitcher", {})
        
        if new_pitcher.get("name") != previous_pitcher.get("name"):
            return {
                "type": "PITCHER_CHANGE",
                "previous_pitcher": previous_pitcher,
                "new_pitcher": new_pitcher,
                "reason": "Unknown"
            }
        
        return None
    
    async def _assess_lineup_impact(self, analysis: LineupAnalysis):
        """Assess the impact of lineup changes"""
        
        # Start with neutral impact
        offensive_impact = 0.0
        defensive_impact = 0.0
        pitching_impact = 0.0
        
        # Assess batting order changes
        for change in analysis.batting_order_changes:
            if change["type"] == "LINEUP_SIZE_CHANGE":
                # Significant lineup changes
                offensive_impact -= 0.1  # Generally negative
        
        # Assess pitcher changes
        if analysis.starting_pitcher_change:
            pitcher_change = analysis.starting_pitcher_change
            if pitcher_change["type"] == "PITCHER_CHANGE":
                # This would require pitcher quality comparison
                pitching_impact = 0.0  # Neutral without more data
        
        analysis.offensive_impact = offensive_impact
        analysis.defensive_impact = defensive_impact
        analysis.pitching_impact = pitching_impact
    
    async def _generate_prop_adjustments(self, analysis: LineupAnalysis):
        """Generate prop adjustment recommendations based on lineup analysis"""
        
        adjustments = {}
        
        # Based on offensive impact
        if analysis.offensive_impact != 0.0:
            team_props = ["team_runs", "team_hits", "team_total_bases"]
            for prop in team_props:
                adjustments[prop] = {"adjustment_factor": 1.0 + analysis.offensive_impact}
        
        # Based on pitching impact
        if analysis.pitching_impact != 0.0:
            pitching_props = ["earned_runs_allowed", "strikeouts_team", "walks_allowed"]
            for prop in pitching_props:
                adjustments[prop] = {"adjustment_factor": 1.0 - analysis.pitching_impact}
        
        analysis.adjustment_recommendations = adjustments
    
    def _is_injury_active(self, injury_report: InjuryReport) -> bool:
        """Check if an injury report is still active"""
        
        # Check if expected return date has passed
        if injury_report.expected_return_date:
            try:
                return_date = datetime.fromisoformat(injury_report.expected_return_date)
                if datetime.now(timezone.utc) > return_date:
                    return False
            except:
                pass
        
        # Check if report is too old (assume 30 days max for active status)
        days_since_report = (datetime.now(timezone.utc) - injury_report.report_date).days
        if days_since_report > 30:
            return False
        
        # Check if it's a rest day (only active for current day)
        if injury_report.injury_type == InjuryType.REST_DAY:
            return days_since_report == 0
        
        return True
    
    async def _injury_monitoring_loop(self):
        """Main loop for injury monitoring"""
        logger.info("Starting injury monitoring loop")
        
        while self.monitoring_active:
            try:
                # Check for new injury reports
                # In production, this would poll injury report APIs
                
                await asyncio.sleep(300)  # Check every 5 minutes
                
            except Exception as e:
                logger.error(f"Error in injury monitoring loop: {e}")
                await asyncio.sleep(600)  # Wait longer on error
    
    async def _lineup_monitoring_loop(self):
        """Main loop for lineup monitoring"""
        logger.info("Starting lineup monitoring loop")
        
        while self.monitoring_active:
            try:
                # Check for lineup changes in monitored games
                for game_id in list(self.monitored_games):
                    # This would integrate with real-time data service
                    # to detect lineup changes
                    pass
                
                await asyncio.sleep(60)  # Check every minute
                
            except Exception as e:
                logger.error(f"Error in lineup monitoring loop: {e}")
                await asyncio.sleep(120)  # Wait longer on error
    
    async def _process_game_update(self, game_id: str, game_data: Any, changes: List[str]):
        """Process game updates from real-time data service"""
        try:
            # Check if this is a game we're monitoring
            if game_id not in self.monitored_games:
                return
            
            # Look for lineup-related changes
            if "STATE_CHANGE" in changes or "INNING_CHANGE" in changes:
                # Potential lineup changes occurred
                # In production, would fetch detailed lineup data
                pass
                
        except Exception as e:
            logger.error(f"Error processing game update: {e}")
    
    async def _trigger_injury_callbacks(self, injury_report: InjuryReport):
        """Trigger injury update callbacks"""
        for callback in self.injury_callbacks:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(injury_report)
                else:
                    callback(injury_report)
            except Exception as e:
                logger.error(f"Error in injury callback: {e}")
    
    async def _trigger_lineup_callbacks(self, lineup_analysis: LineupAnalysis):
        """Trigger lineup update callbacks"""
        for callback in self.lineup_callbacks:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(lineup_analysis)
                else:
                    callback(lineup_analysis)
            except Exception as e:
                logger.error(f"Error in lineup callback: {e}")
    
    async def health_check(self) -> Dict[str, Any]:
        """Service health check"""
        try:
            return {
                "service": self.name,
                "version": self.version,
                "status": "healthy",
                "capabilities": {
                    "injury_monitoring": self.monitoring_active,
                    "lineup_monitoring": self.monitoring_active,
                    "impact_assessment": True,
                    "prop_adjustments": True,
                    "callback_system": True
                },
                "monitoring_stats": {
                    "monitored_teams": len(self.monitored_teams),
                    "monitored_games": len(self.monitored_games),
                    "active_injuries": len([
                        r for r in self.injury_reports.values() 
                        if self._is_injury_active(r)
                    ]),
                    "lineup_analyses": len(self.lineup_analyses),
                    "injury_callbacks": len(self.injury_callbacks),
                    "lineup_callbacks": len(self.lineup_callbacks)
                }
            }
            
        except Exception as e:
            logger.error(f"Live injury/lineup monitor health check failed: {e}")
            return {
                "service": self.name,
                "version": self.version,
                "status": "error",
                "error": str(e)
            }


# Global service instance  
live_injury_lineup_monitor = LiveInjuryLineupMonitor()