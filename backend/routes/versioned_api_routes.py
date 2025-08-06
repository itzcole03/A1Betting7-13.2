"""
API Versioning System for A1Betting Platform
Implements comprehensive versioning strategy with backward compatibility
"""

from datetime import date, datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from backend.models.comprehensive_api_models import (
    APIResponse,
    ComprehensiveAnalysis,
    DataResponse,
    ErrorResponse,
    Game,
    ListResponse,
    MLPrediction,
    Player,
    PropAnalysisRequest,
    PropBet,
    Team,
)


class APIVersionInfo(BaseModel):
    """API version information model"""

    version: str
    release_date: date
    status: str  # "current", "deprecated", "sunset"
    sunset_date: Optional[date] = None
    migration_guide_url: Optional[str] = None
    changelog_url: Optional[str] = None


class VersionedAPIRouter(APIRouter):
    """Enhanced APIRouter with versioning support"""

    def __init__(self, version: str, *args, **kwargs):
        self.api_version = version
        prefix = kwargs.get("prefix", "")
        kwargs["prefix"] = f"/api/{version}{prefix}"

        # Add version-specific tags
        tags = kwargs.get("tags", [])
        if tags:
            kwargs["tags"] = [f"{tag} (v{version})" for tag in tags]

        super().__init__(*args, **kwargs)


# =============================================================================
# VERSION 1 API ROUTES
# =============================================================================

# V1 Router for backward compatibility
v1_router = VersionedAPIRouter(version="v1", tags=["v1"], deprecated=True)


@v1_router.get("/health", response_model=APIResponse)
async def v1_health_check():
    """V1 Health check endpoint (deprecated)"""
    return APIResponse(
        success=True,
        message="API v1 is operational but deprecated. Please migrate to v2.",
        timestamp=datetime.utcnow(),
    )


@v1_router.get("/games", response_model=ListResponse)
async def v1_get_games(sport: Optional[str] = None):
    """V1 Get games endpoint (deprecated)"""
    # Simplified response for v1 compatibility
    mock_games = [
        {
            "id": "game_123",
            "home_team": "NYY",
            "away_team": "BOS",
            "date": "2024-12-20",
            "status": "scheduled",
        }
    ]

    return ListResponse(
        success=True,
        message="Games retrieved (v1 deprecated format)",
        data=mock_games,
        total_count=len(mock_games),
        timestamp=datetime.utcnow(),
    )


@v1_router.get("/props", response_model=ListResponse)
async def v1_get_props(game_id: Optional[str] = None):
    """V1 Get props endpoint (deprecated)"""
    # Simplified response for v1 compatibility
    mock_props = [
        {
            "id": "prop_456",
            "description": "Player Points Over/Under",
            "line": 25.5,
            "odds": {"over": -110, "under": -110},
        }
    ]

    return ListResponse(
        success=True,
        message="Props retrieved (v1 deprecated format)",
        data=mock_props,
        total_count=len(mock_props),
        timestamp=datetime.utcnow(),
    )


# =============================================================================
# VERSION 2 API ROUTES (Current)
# =============================================================================

# V2 Router with enhanced features
v2_router = VersionedAPIRouter(version="v2", tags=["v2"])


@v2_router.get("/health", response_model=APIResponse)
async def v2_health_check():
    """V2 Enhanced health check with detailed system status"""
    return APIResponse(
        success=True,
        message="API v2 operational with full feature support",
        timestamp=datetime.utcnow(),
        request_id="health_check_v2",
    )


@v2_router.get("/games", response_model=DataResponse)
async def v2_get_games(
    sport: Optional[str] = None,
    game_date: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 25,
    offset: int = 0,
):
    """V2 Enhanced games endpoint with full Game model"""
    # Mock enhanced game data
    enhanced_games = [
        Game(
            game_id="mlb_2024_12_20_nyy_bos",
            sport="MLB",
            home_team="NYY",
            away_team="BOS",
            home_team_id="team_nyy",
            away_team_id="team_bos",
            game_date=date(2024, 12, 20),
            status="scheduled",
            venue="Yankee Stadium",
            moneyline_home=-125,
            moneyline_away=+105,
            total=8.5,
        ).model_dump()
    ]

    return DataResponse(
        success=True,
        message="Enhanced games retrieved with full metadata",
        data={
            "games": enhanced_games,
            "pagination": {
                "limit": limit,
                "offset": offset,
                "total": len(enhanced_games),
            },
            "filters_applied": {"sport": sport, "date": game_date, "status": status},
        },
        timestamp=datetime.utcnow(),
    )


@v2_router.get("/games/{game_id}/props", response_model=DataResponse)
async def v2_get_game_props(
    game_id: str,
    prop_type: Optional[str] = None,
    player_id: Optional[str] = None,
    min_confidence: Optional[float] = 0.0,
    include_analysis: bool = False,
):
    """V2 Enhanced props endpoint with ML predictions and analysis"""

    # Mock enhanced prop data
    enhanced_props = [
        PropBet(
            prop_id=f"prop_{game_id}_judge_hr",
            player_id="aaron_judge",
            team_id="nyy",
            game_id=game_id,
            prop_type="home_runs",
            description="Aaron Judge Total Home Runs",
            line=0.5,
            over_odds=-110,
            under_odds=-110,
            source="prizepicks",
            sport="MLB",
            confidence_score=0.87,
            recommendation="over",
            expected_value=0.23,
        ).model_dump()
    ]

    response_data = {
        "props": enhanced_props,
        "metadata": {
            "game_id": game_id,
            "total_props": len(enhanced_props),
            "filters": {
                "prop_type": prop_type,
                "player_id": player_id,
                "min_confidence": min_confidence,
            },
            "analysis_included": include_analysis,
        },
    }

    # Add analysis data if requested
    if include_analysis:
        response_data["analysis"] = [
            MLPrediction(
                prediction_id=f"pred_{game_id}_judge",
                prop_id=f"prop_{game_id}_judge_hr",
                predicted_value=0.73,
                confidence=0.87,
                recommendation="over",
                model_name="XGBoost_v2.1",
                model_version="2024.12.01",
                features_used=["recent_form", "matchup_history", "ballpark_factors"],
                expected_value=0.23,
                kelly_criterion=0.05,
                risk_level="medium",
            ).model_dump()
        ]

    return DataResponse(
        success=True,
        message="Enhanced props retrieved with ML predictions",
        data=response_data,
        timestamp=datetime.utcnow(),
    )


@v2_router.post("/analysis/comprehensive", response_model=DataResponse)
async def v2_comprehensive_analysis(request: PropAnalysisRequest):
    """V2 Comprehensive prop analysis endpoint"""

    # Mock comprehensive analysis response
    analysis_results = []

    for prop_id in request.prop_ids:
        analysis = ComprehensiveAnalysis(
            analysis_id=f"analysis_{prop_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            prop_id=prop_id,
            analysis_type=request.analysis_type,
            summary=f"Comprehensive analysis for {prop_id} indicates strong over potential",
            detailed_breakdown="Multi-factor analysis combining historical performance, matchup data, and advanced metrics",
            key_factors=[
                "Player recent form trending upward",
                "Favorable matchup against opposing pitcher",
                "Ballpark factors support higher scoring",
                "Weather conditions optimal",
            ],
            historical_performance={
                "last_10_games": {"avg": 1.2, "over_rate": 0.7},
                "vs_opponent": {"avg": 1.4, "over_rate": 0.75},
                "home_vs_away": {"home_avg": 1.3, "away_avg": 1.1},
            },
            matchup_analysis={
                "pitcher_era": 4.25,
                "pitcher_hr_rate": 1.3,
                "ballpark_factor": 1.15,
            },
            processing_time_ms=1250,
            data_sources_used=["prizepicks", "baseball_savant", "internal"],
        ).model_dump()

        analysis_results.append(analysis)

    return DataResponse(
        success=True,
        message=f"Comprehensive analysis completed for {len(request.prop_ids)} props",
        data={
            "analyses": analysis_results,
            "processing_summary": {
                "total_props": len(request.prop_ids),
                "avg_processing_time_ms": 1250,
                "analysis_type": request.analysis_type,
                "shap_included": request.include_ml_prediction,
            },
        },
        timestamp=datetime.utcnow(),
    )


# =============================================================================
# API VERSION MANAGEMENT
# =============================================================================


class APIVersionManager:
    """Manages API versions and compatibility"""

    VERSIONS = {
        "v1": APIVersionInfo(
            version="v1",
            release_date=date(2024, 10, 1),
            status="deprecated",
            sunset_date=date(2025, 6, 1),
            migration_guide_url="https://docs.a1betting.com/migration-v1-v2",
            changelog_url="https://docs.a1betting.com/changelog#v1",
        ),
        "v2": APIVersionInfo(
            version="v2",
            release_date=date(2024, 12, 20),
            status="current",
            changelog_url="https://docs.a1betting.com/changelog#v2",
        ),
    }

    @classmethod
    def get_version_info(cls, version: str) -> Optional[APIVersionInfo]:
        """Get information for specific API version"""
        return cls.VERSIONS.get(version)

    @classmethod
    def get_current_version(cls) -> str:
        """Get current API version"""
        return "v2"

    @classmethod
    def is_version_deprecated(cls, version: str) -> bool:
        """Check if version is deprecated"""
        info = cls.get_version_info(version)
        return info and info.status == "deprecated"

    @classmethod
    def is_version_supported(cls, version: str) -> bool:
        """Check if version is still supported"""
        info = cls.get_version_info(version)
        if not info:
            return False

        if info.sunset_date and datetime.now().date() > info.sunset_date:
            return False

        return info.status in ["current", "deprecated"]


# Version info endpoint
version_router = APIRouter(prefix="/api", tags=["API Version"])


@version_router.get("/version", response_model=DataResponse)
async def get_version_info():
    """Get API version information"""
    return DataResponse(
        success=True,
        message="API version information",
        data={
            "current_version": APIVersionManager.get_current_version(),
            "supported_versions": list(APIVersionManager.VERSIONS.keys()),
            "versions": {
                version: info.model_dump()
                for version, info in APIVersionManager.VERSIONS.items()
            },
        },
        timestamp=datetime.utcnow(),
    )


@version_router.get("/version/{version}", response_model=DataResponse)
async def get_specific_version_info(version: str):
    """Get specific version information"""
    info = APIVersionManager.get_version_info(version)

    if not info:
        raise HTTPException(status_code=404, detail=f"API version {version} not found")

    return DataResponse(
        success=True,
        message=f"Information for API version {version}",
        data=info.model_dump(),
        timestamp=datetime.utcnow(),
    )


# =============================================================================
# VERSION MIDDLEWARE
# =============================================================================


class APIVersionMiddleware:
    """Middleware for API version handling"""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            request = Request(scope, receive)

            # Extract version from path
            path_parts = request.url.path.split("/")
            if len(path_parts) >= 3 and path_parts[1] == "api":
                version = path_parts[2]

                # Exclude version info endpoints from version checking
                if version == "version":
                    await self.app(scope, receive, send)
                    return

                # Check if version is supported
                if not APIVersionManager.is_version_supported(version):
                    response = JSONResponse(
                        status_code=410,
                        content={
                            "success": False,
                            "message": f"API version {version} is no longer supported",
                            "error_code": "VERSION_NOT_SUPPORTED",
                            "current_version": APIVersionManager.get_current_version(),
                            "migration_guide": "https://docs.a1betting.com/migration",
                        },
                    )
                    await response(scope, receive, send)
                    return

                # Add deprecation warning for deprecated versions
                if APIVersionManager.is_version_deprecated(version):
                    # Add custom header for deprecated versions
                    scope["headers"] = list(scope.get("headers", [])) + [
                        (
                            b"x-api-deprecation-warning",
                            f"API version {version} is deprecated. Please migrate to v2.".encode(),
                        )
                    ]

        await self.app(scope, receive, send)


# Export routers and utilities
__all__ = [
    "v1_router",
    "v2_router",
    "version_router",
    "VersionedAPIRouter",
    "APIVersionManager",
    "APIVersionMiddleware",
    "APIVersionInfo",
]
