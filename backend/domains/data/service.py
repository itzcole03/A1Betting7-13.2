"""
Unified Data Service

Consolidates all data acquisition, processing, and validation capabilities
into a single, maintainable service that ensures high-quality, consistent data.
"""

import asyncio
import logging
import uuid
from datetime import datetime, timezone, date, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import json
from collections import defaultdict

import aiohttp
import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession

from .models import (
    DataRequest,
    DataResponse,
    DataValidationRequest,
    DataQualityRequest,
    DataQualityMetrics,
    ValidationResult,
    PlayerData,
    TeamData,
    GameData,
    OddsData,
    DataPipelineStatus,
    HealthResponse,
    Sport,
    DataSource,
    DataType,
    QualityStatus,
    ValidationStatus,
)

# Import existing services for gradual migration
try:
    from backend.services.unified_data_pipeline import UnifiedDataPipeline
    from backend.services.data_quality_monitor import DataQualityMonitor
    from backend.services.database_service import DatabaseService
    from backend.services.sportradar_service import SportRadarService
    from backend.services.baseball_savant_client import BaseballSavantClient
    LEGACY_SERVICES_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Legacy data services not available: {e}")
    LEGACY_SERVICES_AVAILABLE = False

logger = logging.getLogger(__name__)


class UnifiedDataService:
    """
    Unified service that consolidates all data capabilities.
    
    This service handles data acquisition, processing, validation, and quality
    monitoring from multiple sources while providing consistent interfaces.
    """
    
    def __init__(self):
        self.cache_dir = Path("backend/cache/data")
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Service state
        self.is_initialized = False
        self.sources_online = 0
        self.sources_total = 0
        self.service_start_time = datetime.now(timezone.utc)
        
        # Data sources registry
        self.data_sources = {}
        self.source_status = {}
        
        # Quality monitoring
        self.quality_metrics = {}
        self.cache_stats = {"hits": 0, "misses": 0}
        
        # Legacy service integration
        self.legacy_pipeline = None
        self.legacy_quality_monitor = None
        self.legacy_database = None
        self.legacy_sportradar = None
        self.legacy_baseball_savant = None
        
        # HTTP session for external APIs
        self.http_session = None
        
        if LEGACY_SERVICES_AVAILABLE:
            self._initialize_legacy_services()
    
    def _initialize_legacy_services(self):
        """Initialize legacy services for gradual migration"""
        try:
            self.legacy_pipeline = UnifiedDataPipeline()
            self.legacy_quality_monitor = DataQualityMonitor()
            self.legacy_database = DatabaseService()
            self.legacy_sportradar = SportRadarService()
            self.legacy_baseball_savant = BaseballSavantClient()
            logger.info("Legacy data services initialized")
        except Exception as e:
            logger.error(f"Failed to initialize legacy data services: {e}")
    
    async def initialize(self) -> bool:
        """Initialize the data service"""
        try:
            logger.info("Initializing Unified Data Service...")
            
            # Initialize HTTP session
            self.http_session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=30)
            )
            
            # Initialize data sources
            await self._initialize_data_sources()
            
            # Initialize quality monitoring
            await self._initialize_quality_monitoring()
            
            # Health check
            health = await self.health_check()
            
            self.is_initialized = True
            logger.info(f"Data service initialized. Sources online: {self.sources_online}/{self.sources_total}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize data service: {e}")
            return False
    
    async def cleanup(self):
        """Cleanup service resources"""
        try:
            if self.http_session:
                await self.http_session.close()
            logger.info("Data service cleaned up")
        except Exception as e:
            logger.error(f"Cleanup failed: {e}")
    
    async def _initialize_data_sources(self):
        """Initialize data source connections"""
        try:
            sources = [
                DataSource.SPORTRADAR,
                DataSource.BASEBALL_SAVANT,
                DataSource.ESPN,
                DataSource.BETMGM,
                DataSource.DRAFTKINGS,
                DataSource.PRIZEPICKS,
            ]
            
            self.sources_total = len(sources)
            
            for source in sources:
                try:
                    online = await self._test_data_source(source)
                    self.source_status[source] = "online" if online else "offline"
                    if online:
                        self.sources_online += 1
                    logger.info(f"Data source {source}: {'online' if online else 'offline'}")
                except Exception as e:
                    logger.warning(f"Failed to test data source {source}: {e}")
                    self.source_status[source] = "error"
                    
        except Exception as e:
            logger.error(f"Failed to initialize data sources: {e}")
    
    async def _test_data_source(self, source: DataSource) -> bool:
        """Test if a data source is online"""
        try:
            # Mock implementation - in reality would test actual API endpoints
            if source == DataSource.SPORTRADAR and self.legacy_sportradar:
                return True
            elif source == DataSource.BASEBALL_SAVANT and self.legacy_baseball_savant:
                return True
            else:
                # Mock other sources as online for demo
                return True
        except Exception:
            return False
    
    async def _initialize_quality_monitoring(self):
        """Initialize quality monitoring"""
        try:
            # Initialize quality metrics for each sport/data type combination
            for sport in Sport:
                for data_type in DataType:
                    key = f"{sport}_{data_type}"
                    self.quality_metrics[key] = {
                        "completeness": 0.9,
                        "accuracy": 0.85,
                        "consistency": 0.88,
                        "timeliness": 0.92,
                        "last_updated": datetime.now(timezone.utc)
                    }
            
            logger.info("Quality monitoring initialized")
        except Exception as e:
            logger.error(f"Failed to initialize quality monitoring: {e}")
    
    async def get_data(self, request: DataRequest) -> DataResponse:
        """
        Get data based on request parameters
        """
        try:
            request_id = str(uuid.uuid4())
            start_time = datetime.now()
            
            # Check cache first
            cached_data = await self._get_cached_data(request)
            cache_hit = cached_data is not None
            
            if cached_data:
                self.cache_stats["hits"] += 1
                return cached_data
            
            self.cache_stats["misses"] += 1
            
            # Fetch data from appropriate sources
            if request.data_type == DataType.GAME:
                data = await self._get_game_data(request)
            elif request.data_type == DataType.PLAYER:
                data = await self._get_player_data(request)
            elif request.data_type == DataType.TEAM:
                data = await self._get_team_data(request)
            elif request.data_type == DataType.ODDS:
                data = await self._get_odds_data(request)
            else:
                data = await self._get_generic_data(request)
            
            # Validate data
            validation_results = await self._validate_data(data, request)
            
            # Calculate quality score
            quality_score = await self._calculate_quality_score(request)
            
            # Calculate response time
            response_time = (datetime.now() - start_time).total_seconds() * 1000
            
            # Create response
            response = DataResponse(
                request_id=request_id,
                data_type=request.data_type,
                sport=request.sport,
                **data,
                total_records=self._count_records(data),
                sources_used=[request.source] if request.source else [DataSource.INTERNAL],
                cache_hit=cache_hit,
                quality_score=quality_score,
                validation_status=ValidationStatus.PASSED if validation_results else ValidationStatus.FAILED,
                validation_results=validation_results,
                response_time_ms=response_time,
                generated_at=datetime.now(timezone.utc),
                expires_at=datetime.now(timezone.utc) + timedelta(hours=1)
            )
            
            # Cache the response
            await self._cache_data(request, response)
            
            return response
            
        except Exception as e:
            logger.error(f"Get data failed: {e}")
            raise
    
    async def validate_data(self, request: DataValidationRequest) -> List[ValidationResult]:
        """
        Validate data quality
        """
        try:
            results = []
            
            # Mock validation results
            validation_rules = request.validation_rules or [
                "completeness_check",
                "accuracy_check", 
                "consistency_check",
                "timeliness_check"
            ]
            
            for rule in validation_rules:
                if rule == "completeness_check":
                    results.append(ValidationResult(
                        rule_name=rule,
                        status=ValidationStatus.PASSED,
                        message="Data completeness check passed",
                        details={"completeness_score": 0.95},
                        severity="info"
                    ))
                elif rule == "accuracy_check":
                    results.append(ValidationResult(
                        rule_name=rule,
                        status=ValidationStatus.PASSED,
                        message="Data accuracy check passed",
                        details={"accuracy_score": 0.88},
                        severity="info"
                    ))
                else:
                    results.append(ValidationResult(
                        rule_name=rule,
                        status=ValidationStatus.PASSED,
                        message=f"{rule} passed",
                        severity="info"
                    ))
            
            return results
            
        except Exception as e:
            logger.error(f"Data validation failed: {e}")
            return []
    
    async def get_quality_metrics(self, request: DataQualityRequest) -> DataQualityMetrics:
        """
        Get data quality metrics
        """
        try:
            key = f"{request.sport}_{request.data_type}"
            metrics = self.quality_metrics.get(key, {})
            
            completeness = metrics.get("completeness", 0.9)
            accuracy = metrics.get("accuracy", 0.85)
            consistency = metrics.get("consistency", 0.88)
            timeliness = metrics.get("timeliness", 0.92)
            
            overall_score = (completeness + accuracy + consistency + timeliness) / 4
            
            # Determine status based on overall score
            if overall_score >= 0.9:
                status = QualityStatus.EXCELLENT
            elif overall_score >= 0.8:
                status = QualityStatus.GOOD
            elif overall_score >= 0.7:
                status = QualityStatus.ACCEPTABLE
            elif overall_score >= 0.6:
                status = QualityStatus.POOR
            else:
                status = QualityStatus.CRITICAL
            
            return DataQualityMetrics(
                completeness=completeness,
                accuracy=accuracy,
                consistency=consistency,
                timeliness=timeliness,
                overall_score=overall_score,
                status=status,
                issues_count=0 if overall_score >= 0.8 else 1,
                last_updated=metrics.get("last_updated", datetime.now(timezone.utc))
            )
            
        except Exception as e:
            logger.error(f"Get quality metrics failed: {e}")
            raise
    
    async def health_check(self) -> HealthResponse:
        """
        Check data service health
        """
        try:
            uptime = (datetime.now(timezone.utc) - self.service_start_time).total_seconds()
            
            # Calculate cache hit rate
            total_requests = self.cache_stats["hits"] + self.cache_stats["misses"]
            hit_rate = self.cache_stats["hits"] / max(total_requests, 1)
            
            # Calculate average quality score
            quality_scores = [
                metrics.get("completeness", 0) * 0.25 +
                metrics.get("accuracy", 0) * 0.25 +
                metrics.get("consistency", 0) * 0.25 +
                metrics.get("timeliness", 0) * 0.25
                for metrics in self.quality_metrics.values()
            ]
            avg_quality = sum(quality_scores) / len(quality_scores) if quality_scores else 0.85
            
            return HealthResponse(
                status="healthy" if self.is_initialized else "initializing",
                sources_online=self.sources_online,
                sources_total=self.sources_total,
                cache_hit_rate=hit_rate,
                avg_response_time_ms=150.0,  # Mock response time
                quality_score=avg_quality,
                last_update=datetime.now(timezone.utc),
                uptime_seconds=uptime,
                source_status=self.source_status
            )
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return HealthResponse(
                status="unhealthy",
                sources_online=0,
                sources_total=0,
                cache_hit_rate=0.0,
                avg_response_time_ms=0.0,
                quality_score=0.0,
                uptime_seconds=0.0
            )
    
    # Internal data fetching methods
    async def _get_game_data(self, request: DataRequest) -> Dict[str, Any]:
        """Get game data"""
        # Mock game data
        games = []
        
        if request.sport == Sport.MLB:
            games.append(GameData(
                game_id="mlb_2024_game_1",
                sport=Sport.MLB,
                date=date.today(),
                time="19:00",
                home_team_id="NYY",
                away_team_id="BOS",
                home_team_name="New York Yankees",
                away_team_name="Boston Red Sox",
                venue="Yankee Stadium",
                city="New York",
                status="scheduled",
                moneyline={"home": -120, "away": +110},
                spread={"home": -1.5, "away": +1.5},
                total=8.5,
                source=DataSource.SPORTRADAR,
                last_updated=datetime.now(timezone.utc)
            ))
        
        return {"games": games}
    
    async def _get_player_data(self, request: DataRequest) -> Dict[str, Any]:
        """Get player data"""
        # Mock player data
        players = []
        
        if request.sport == Sport.MLB:
            players.append(PlayerData(
                player_id="judge_aaron",
                name="Aaron Judge",
                sport=Sport.MLB,
                team_id="NYY",
                position="RF",
                jersey_number=99,
                games_played=150,
                stats={
                    "avg": 0.291,
                    "hr": 58,
                    "rbi": 144,
                    "obp": 0.408,
                    "slg": 0.701
                },
                height="6'7\"",
                weight=282,
                age=32,
                injury_status="Healthy",
                active=True,
                source=DataSource.BASEBALL_SAVANT,
                last_updated=datetime.now(timezone.utc)
            ))
        
        return {"players": players}
    
    async def _get_team_data(self, request: DataRequest) -> Dict[str, Any]:
        """Get team data"""
        # Mock team data
        teams = []
        
        if request.sport == Sport.MLB:
            teams.append(TeamData(
                team_id="NYY",
                name="Yankees",
                city="New York",
                sport=Sport.MLB,
                conference="American League",
                division="East",
                wins=102,
                losses=60,
                win_percentage=0.630,
                stats={
                    "team_avg": 0.254,
                    "team_era": 3.72,
                    "runs_scored": 875,
                    "runs_allowed": 654
                },
                last_10_record="7-3",
                home_record="54-27",
                away_record="48-33",
                source=DataSource.SPORTRADAR,
                last_updated=datetime.now(timezone.utc)
            ))
        
        return {"teams": teams}
    
    async def _get_odds_data(self, request: DataRequest) -> Dict[str, Any]:
        """Get odds data"""
        # Mock odds data
        odds = []
        
        odds.append(OddsData(
            odds_id="odds_1",
            game_id="mlb_2024_game_1",
            sportsbook="BetMGM",
            market_type="moneyline",
            home_odds=-120,
            away_odds=+110,
            timestamp=datetime.now(timezone.utc),
            source=DataSource.BETMGM
        ))
        
        return {"odds": odds}
    
    async def _get_generic_data(self, request: DataRequest) -> Dict[str, Any]:
        """Get generic data"""
        return {
            "games": [],
            "players": [],
            "teams": [],
            "odds": []
        }
    
    async def _validate_data(self, data: Dict[str, Any], request: DataRequest) -> Optional[List[ValidationResult]]:
        """Validate fetched data"""
        # Simple validation - in reality would be comprehensive
        if not any(data.values()):
            return [ValidationResult(
                rule_name="data_exists",
                status=ValidationStatus.FAILED,
                message="No data found",
                severity="error"
            )]
        return None
    
    async def _calculate_quality_score(self, request: DataRequest) -> float:
        """Calculate data quality score"""
        key = f"{request.sport}_{request.data_type}"
        metrics = self.quality_metrics.get(key, {})
        
        return (
            metrics.get("completeness", 0.9) * 0.3 +
            metrics.get("accuracy", 0.85) * 0.3 +
            metrics.get("consistency", 0.88) * 0.2 +
            metrics.get("timeliness", 0.92) * 0.2
        )
    
    def _count_records(self, data: Dict[str, Any]) -> int:
        """Count total records in data"""
        total = 0
        for key, value in data.items():
            if isinstance(value, list):
                total += len(value)
        return total
    
    # Cache management
    async def _get_cached_data(self, request: DataRequest) -> Optional[DataResponse]:
        """Get cached data"""
        try:
            cache_key = self._generate_cache_key(request)
            cache_file = self.cache_dir / f"{cache_key}.json"
            
            if cache_file.exists():
                with open(cache_file, 'r') as f:
                    data = json.load(f)
                
                # Check if cache is still valid
                expires_at = datetime.fromisoformat(data.get('expires_at', ''))
                if expires_at > datetime.now(timezone.utc):
                    return DataResponse(**data)
                else:
                    # Remove expired cache
                    cache_file.unlink()
                    
        except Exception as e:
            logger.warning(f"Failed to get cached data: {e}")
        
        return None
    
    async def _cache_data(self, request: DataRequest, response: DataResponse):
        """Cache data response"""
        try:
            cache_key = self._generate_cache_key(request)
            cache_file = self.cache_dir / f"{cache_key}.json"
            
            with open(cache_file, 'w') as f:
                json.dump(response.dict(), f, default=str)
                
        except Exception as e:
            logger.warning(f"Failed to cache data: {e}")
    
    def _generate_cache_key(self, request: DataRequest) -> str:
        """Generate cache key for request"""
        key_parts = [
            request.sport,
            request.data_type,
            request.team_id or "",
            request.player_id or "",
            request.game_id or "",
            str(request.date_range) if request.date_range else "",
        ]
        return "_".join(filter(None, key_parts))
