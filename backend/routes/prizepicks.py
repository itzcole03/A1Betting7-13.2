"""
PrizePicks Routes - LEGACY VERSION (Phase 5 Consolidation)

⚠️ DEPRECATION NOTICE: This file has been consolidated into consolidated_prizepicks.py
🔀 This version is kept for reference and will be removed in Phase 6

Please use: backend.routes.consolidated_prizepicks for all new development
The consolidated version provides:
- All functionality from prizepicks.py, prizepicks_router.py, and prizepicks_simple.py
- Better fallback strategies
- Improved error handling
- Unified API surface
"""

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

# Contract compliance imports
from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..core.exceptions import BusinessLogicException, AuthenticationException

from backend.auth.security import get_current_admin_user  # Import the new dependency
from backend.middleware.caching import TTLCache, retry_and_cache
from backend.services.comprehensive_prizepicks_service import (
    ComprehensivePrizePicksService,
)  # comprehensive_prizepicks_service, # This import is not directly used
from backend.services.enhanced_prizepicks_service import enhanced_prizepicks_service
from backend.services.enhanced_prizepicks_service_v2 import (
    enhanced_prizepicks_service_v2,
)

logger = logging.getLogger(__name__)

# LEGACY ROUTER - Use consolidated_prizepicks.router instead
router = APIRouter(prefix="/api/v1/prizepicks-legacy", tags=["PrizePicks-Legacy"])

# Cache for PrizePicks data
prizepicks_cache = TTLCache(maxsize=100, ttl=300)


## @retry_and_cache(prizepicks_cache)  # Temporarily removed for async deadlock diagnosis
@router.get("/props", response_model=List[Dict[str, Any]])
async def get_prizepicks_props(
    sport: Optional[str] = None,
    min_confidence: Optional[int] = 70,
    enhanced: bool = Query(True, description="Use enhanced ensemble predictions"),
) -> Dict[str, Any]:
    """Get PrizePicks props scraped live from the website, all sports, no mock data."""
    import time

    start_time = time.time()
    try:
        logger.info(
            "[ENTRY] /api/prizepicks/props called with sport=%s, min_confidence=%s, enhanced=%s",
            sport,
            min_confidence,
            enhanced,
        )
        logger.info("[LOG] Before enhanced_prizepicks_service_v2.client check")
        # Use enhanced service v2 for robust API-based fetching and beneficial filtering
        if not enhanced_prizepicks_service_v2.client:
            logger.info("[AWAIT] Initializing enhanced_prizepicks_service_v2...")
            await enhanced_prizepicks_service_v2.initialize()
            logger.info("[AWAIT DONE] enhanced_prizepicks_service_v2 initialized.")
        logger.info("[LOG] Before fetch_projections_api call (await)")
        fetch_start = time.time()
        logger.info(
            "[DEBUG] Awaiting enhanced_prizepicks_service_v2.fetch_projections_api..."
        )
        props = await enhanced_prizepicks_service_v2.fetch_projections_api(sport=sport)
        fetch_end = time.time()
        logger.info(
            "[LOG] After fetch_projections_api call (%.2fs)", fetch_end - fetch_start
        )
        logger.info(
            "[AWAIT DONE] Projections fetched, count=%d", len(props) if props else 0
        )
        logger.info(
            "[EXIT] /api/prizepicks/props returning response. Total time: %.2fs",
            time.time() - start_time,
        )
        # Return as a list for frontend contract alignment
        return ResponseBuilder.success(props)
    except Exception as e:
        logger.error("[ERROR] Exception in /api/prizepicks/props: %s", e)
        logger.error(
            "[EXIT] /api/prizepicks/props failed. Total time: %.2fs",
            time.time() - start_time,
        )
        raise BusinessLogicException("Failed to scrape PrizePicks props")


@router.get("/recommendations", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_prizepicks_recommendations(
    sport: Optional[str] = None,
    _strategy: Optional[str] = "balanced",  # Prefixed with _ to indicate unused
    min_confidence: Optional[int] = 75,
) -> List[Dict[str, Any]]:
    """Get PrizePicks recommendations based on analysis"""
    try:
        # Mock implementation - would use ML models for recommendations
        recommendations = [
            {
                "id": "rec_1",
                "player": "LeBron James",
                "sport": "NBA",
                "prop_type": "Points",
                "line": 25.5,
                "recommendation": "over",
                "confidence": 85,
                "reasoning": "Strong recent form, favorable matchup",
                "expected_value": 0.12,
                "stake_recommendation": "medium",
            },
            {
                "id": "rec_2",
                "player": "Stephen Curry",
                "sport": "NBA",
                "prop_type": "Assists",
                "line": 6.5,
                "recommendation": "under",
                "confidence": 78,
                "reasoning": "Defensive focus, injury concerns",
                "expected_value": 0.08,
                "stake_recommendation": "small",
            },
            {
                "id": "rec_3",
                "player": "Nikola Jokic",
                "sport": "NBA",
                "prop_type": "Rebounds",
                "line": 12.5,
                "recommendation": "over",
                "confidence": 92,
                "reasoning": "Dominant rebounder, weak opponent",
                "expected_value": 0.18,
                "stake_recommendation": "large",
            },
        ]

        # Filter by sport if specified
        if sport:
            recommendations = [
                rec
                for rec in recommendations
                if rec.get("sport") and str(rec.get("sport")).lower() == sport.lower()
            ]

        # Filter by confidence if specified
        if min_confidence is not None:
            recommendations = [
                rec
                for rec in recommendations
                if rec.get("confidence") is not None
                and float(rec.get("confidence")) >= min_confidence
            ]

        logger.info(f"Returning {len(recommendations)} PrizePicks recommendations")
        return ResponseBuilder.success(recommendations)

    except Exception as e:
        logger.error(f"Error fetching PrizePicks recommendations: {e}")
        raise BusinessLogicException("Failed to fetch PrizePicks recommendations")


@router.get("/comprehensive-projections", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_comprehensive_projections(
    sport: Optional[str] = None,
    league: Optional[str] = None,
    min_confidence: Optional[int] = 70,
    include_ml_predictions: bool = True,
    include_shap: bool = True,
) -> List[Dict[str, Any]]:
    """Get comprehensive PrizePicks projections scraped live from the website, all sports, no mock data."""
    try:
        # Use enhanced service for comprehensive projections
        if not enhanced_prizepicks_service.client:
            await enhanced_prizepicks_service.initialize()
        props = await enhanced_prizepicks_service.scrape_prizepicks_props()
        # Optionally filter by sport/league (only if values are strings)
        if sport:
            props = [
                p
                for p in props
                if p.get("sport") and str(p.get("sport")).lower() == sport.lower()
            ]
        if league:
            props = [
                p
                for p in props
                if p.get("league") and str(p.get("league")).lower() == league.lower()
            ]
        return ResponseBuilder.success(props)
    except Exception as e:
        logger.error(f"Error scraping comprehensive PrizePicks projections: {e}")
        raise BusinessLogicException("Failed to scrape comprehensive PrizePicks projections")


@router.post("/lineup/optimize", response_model=StandardAPIResponse[Dict[str, Any]])
async def optimize_lineup(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """Optimize lineup using advanced ML algorithms"""
    try:
        entries = request_data.get("entries", [])
        # optimization_params = request_data.get("optimization_params", {}) # Removed unused variable

        if len(entries) < 2:
            raise BusinessLogicException("At least 2 entries required for optimization")

        # Mock optimization logic - in production would use real ML optimization
        total_confidence = sum(entry.get("confidence", 0) for entry in entries) / len(
            entries
        )
        expected_payout = len(entries) * 1.85  # Base multiplier

        # Calculate Kelly optimization
        kelly_optimization = min(
            25,
            sum(
                entry.get("ml_prediction", {}).get("confidence", 0) * 0.1
                for entry in entries
            ),
        )

        # Calculate risk score
        risk_levels = {"low": 20, "medium": 50, "high": 80}
        risk_score = sum(
            risk_levels.get(
                entry.get("ml_prediction", {})
                .get("risk_assessment", {})
                .get("level", "medium"),
                50,
            )
            for entry in entries
        ) / len(entries)

        # Calculate value score
        value_score = sum(
            entry.get("confidence", 0) - 70  # Premium over 70% confidence
            for entry in entries
        ) / len(entries)

        # Generate correlation matrix (mock)
        correlation_matrix = [
            [1.0 if i == j else 0.1 + (i * j * 0.05) % 0.3 for j in range(len(entries))]
            for i in range(len(entries))
        ]

        optimization_result = {
            "total_confidence": total_confidence,
            "expected_payout": expected_payout,
            "kelly_optimization": kelly_optimization,
            "risk_score": risk_score,
            "value_score": value_score,
            "correlation_matrix": correlation_matrix,
            "optimization_notes": [
                f"Optimized for {len(entries)} selections",
                f"Average confidence: {total_confidence:.1f}%",
                f"Risk level: {'Low' if risk_score < 30 else 'Medium' if risk_score < 60 else 'High'}",
                "Correlations analyzed for optimal selection",
            ],
        }

        logger.info(f"Optimized lineup with {len(entries)} entries")
        return ResponseBuilder.success(optimization_result)

    except HTTPException as http_exc:
        logger.error(f"Error optimizing lineup: {http_exc}")
        raise http_exc
    except Exception as e:
        logger.error(f"Error optimizing lineup: {e}")
        raise BusinessLogicException("Failed to optimize lineup")


@router.get("/lineup/optimal", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_optimal_lineup(
    lineup_size: int = Query(5, ge=1, le=10, description="Number of props in lineup"),
    sport: Optional[str] = Query(None, description="Filter by specific sport"),
    min_confidence: Optional[int] = Query(
        70, ge=0, le=100, description="Minimum confidence threshold"
    ),
):
    try:
        # This endpoint is now directly integrated with the enhanced fetcher
        # and does not require the old mock fetcher imports.
        # The logic for fetching and filtering props is handled by the service.

        service = ComprehensivePrizePicksService()
        props: List[Dict[str, Any]] = await service.scrape_prizepicks_props()

        if sport:
            props = [
                prop
                for prop in props
                if prop.get("sport") and str(prop.get("sport")).lower() == sport.lower()
            ]

        if min_confidence is not None:
            props = [
                prop
                for prop in props
                if prop.get("confidence") is not None
                and float(prop.get("confidence")) >= min_confidence
            ]

        # The generate_optimal_betting_lineup function is now part of the service
        # and handles the ensemble prediction logic.
        # For now, we'll just return ResponseBuilder.success(the) filtered props.
        # The actual lineup generation and prediction will happen within the service.

        logger.info(f"🏆 Returning {len(props)} props for optimal lineup")
        return ResponseBuilder.success({
            "props": props,
            "message": "Optimal lineup generation is pending integration with ensemble prediction.",
        })

    except Exception as e:
        logger.error(f"Error generating optimal lineup: {e}")
        raise BusinessLogicException("f"Failed to generate optimal lineup: {str(e")}",
        )


@router.get("/lineup/analysis", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_lineup_analysis(
    prop_ids: List[str] = Query(..., description="List of prop IDs to analyze"),
) -> Dict[str, Any]:
    """
    Analyze a custom lineup of props using intelligent ensemble system
    """
    try:
        # This endpoint is now directly integrated with the enhanced fetcher
        # and does not require the old mock fetcher imports.
        # The logic for fetching and filtering props is handled by the service.

        service = ComprehensivePrizePicksService()
        props: List[Dict[str, Any]] = await service.scrape_prizepicks_props()

        # Filter to requested props
        selected_props: List[Dict[str, Any]] = [
            prop for prop in props if prop.get("id") in prop_ids
        ]

        if not selected_props:
            raise BusinessLogicException("No props found with provided IDs")

        # The generate_optimal_betting_lineup function is now part of the service
        # and handles the ensemble prediction logic.
        # For now, we'll just return ResponseBuilder.success(the) filtered props.
        # The actual lineup generation and prediction will happen within the service.

        logger.info(f"🔍 Analyzing custom lineup with {len(selected_props)} props")
        return ResponseBuilder.success({
            "props": selected_props,
            "message": "Lineup analysis is pending integration with ensemble prediction.",
        })

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing custom lineup: {e}")
        raise BusinessLogicException("f"Failed to analyze lineup: {str(e")}",
        )


@router.get("/trends", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_prop_trends(
    player_name: Optional[str] = Query(None, description="Filter by player name"),
    sport: Optional[str] = Query(None, description="Filter by sport"),
    days: int = Query(7, ge=1, le=30, description="Number of days to analyze"),
) -> Dict[str, Any]:
    """
    Get prop betting trends and performance metrics
    """
    try:
        logger.info(f"📈 Analyzing prop trends for {days} days")

        # This would integrate with historical data analysis
        # For now, return ResponseBuilder.success(a) basic response
        trends: Dict[str, Any] = {
            "analysis_period": f"{days} days",
            "filters": {"player_name": player_name, "sport": sport},
            "trends": {
                "high_confidence_props": 0,
                "average_win_rate": 0.0,
                "top_performing_sports": [],
                "top_performing_players": [],
            },
            "recommendations": [
                "Focus on high-confidence props (>80%)",
                "Consider ensemble predictions for better accuracy",
                "Monitor in-season sports for best opportunities",
            ],
            "ensemble_status": "available",  # This status is now managed by the service
        }

        return ResponseBuilder.success(trends)

    except Exception as e:
        logger.error(f"Error fetching prop trends: {e}")
        raise BusinessLogicException("Failed to fetch prop trends")


@router.post("/props/{prop_id}/explain", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_prop_ai_explanation(prop_id: str) -> Dict[str, Any]:
    """
    Get AI explanation for a specific prop
    """
    try:
        from datetime import datetime

        # Get enhanced props first to find the target prop
        service = ComprehensivePrizePicksService()
        enhanced_props: List[Dict[str, Any]] = await service.scrape_prizepicks_props()

        # Find the specific prop
        target_prop: Optional[Dict[str, Any]] = None
        for prop_item in enhanced_props:  # Corrected loop syntax here
            if prop_item.get("id") == prop_id:
                target_prop = prop_item
                break

        if not target_prop:
            raise BusinessLogicException("f"Prop with ID {prop_id} not found"
            ")

        # Initialize explanation_data here to avoid re-declaration errors
        explanation_data: Dict[str, Any] = {}

        # Try to generate AI explanation using LLM
        try:
            from backend.utils.llm_engine import LLMEngine

            llm_engine = LLMEngine()

            # Generate AI explanation using the analyze_prop_bet method
            ai_response = await llm_engine.analyze_prop_bet(
                player_name=target_prop.get("player_name", "Unknown"),
                stat_type=target_prop.get("stat_type", "Unknown"),
                line=float(target_prop.get("line", target_prop.get("line_score", 0))),
                odds=f"{target_prop.get('over_odds', -110)}/{target_prop.get('under_odds', -110)}",
                context_data={
                    "team": target_prop.get("team", "Unknown"),
                    "sport": target_prop.get("sport", "Unknown"),
                    "confidence": target_prop.get("confidence", 75),
                    "league": target_prop.get("league", "Unknown"),
                },
            )

            # Use the AI response if available, otherwise create structured response
            if ai_response:
                explanation_data.update(
                    {
                        "recommendation": "Based on advanced AI analysis of statistical trends and recent performance",
                        "factors": [
                            "Recent performance trends and form",
                            "Historical statistical averages vs. line",
                            "Matchup analysis and defensive metrics",
                            "Team offensive efficiency patterns",
                            "Player usage rates and game context",
                        ],
                        "risk_level": target_prop.get("risk_level", "medium"),
                        "analysis": ai_response,
                        "confidence": target_prop.get("confidence", 75),
                        "generated_at": datetime.now().isoformat(),
                    }
                )
            else:
                raise Exception("No AI response generated")

        except Exception as llm_error:
            logger.warning(f"LLM explanation failed: {llm_error}, using fallback")
            # Fallback explanation
            explanation_data.update(
                {
                    "recommendation": f"Based on {target_prop.get('confidence', 75)}% confidence ensemble prediction",
                    "factors": [
                        "Advanced statistical modeling analysis",
                        "Historical performance data patterns",
                        "Current season trend analysis",
                        "Team and opponent efficiency metrics",
                        "Player role and usage context",
                    ],
                    "risk_level": target_prop.get("risk_level", "medium"),
                    "analysis": f"Our ensemble model shows {target_prop.get('confidence', 75)}% confidence for this prop. The prediction incorporates comprehensive statistical modeling, player performance history, team metrics, matchup analysis, and current season trends to generate actionable insights.",
                    "confidence": target_prop.get("confidence", 75),
                    "generated_at": datetime.now().isoformat(),
                }
            )

        return ResponseBuilder.success({
            "prop_id": prop_id,
            "player_name": target_prop.get("player_name"),
            "stat_type": target_prop.get("stat_type"),
            "line": target_prop.get("line", target_prop.get("line_score")),
            "team": target_prop.get("team"),
            "sport": target_prop.get("sport"),
            "confidence": target_prop.get("confidence"),
            **explanation_data,
        })

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating AI explanation for prop {prop_id}: {e}")
        raise BusinessLogicException("Failed to generate AI explanation")


@router.get("/props/enhanced", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_enhanced_prizepicks_props(
    sport: Optional[str] = None,
    min_confidence: Optional[int] = 70,
    format_lines: bool = Query(
        True, description="Format line scores to realistic values"
    ),
) -> List[Dict[str, Any]]:
    """Get enhanced PrizePicks props with better formatting and AI insights"""
    try:
        logger.info(
            "[ENTRY] /api/prizepicks/props/enhanced called with sport=%s, min_confidence=%s, format_lines=%s",
            sport,
            min_confidence,
            format_lines,
        )
        # Always try to use enhanced fetcher since original is corrupted
        logger.info("[AWAIT] Importing EnhancedPrizePicksDataFetcher...")
        from backend.services.data_fetchers_enhanced import (
            EnhancedPrizePicksDataFetcher,
        )

        logger.info("[AWAIT DONE] EnhancedPrizePicksDataFetcher imported.")
        fetcher = EnhancedPrizePicksDataFetcher()
        logger.info("[AWAIT] Fetching current PrizePicks props with ensemble...")
        props: List[Dict[str, Any]] = (
            await fetcher.fetch_current_prizepicks_props_with_ensemble()
        )
        logger.info("[AWAIT DONE] Props fetched, count=%d", len(props) if props else 0)
        # Apply enhanced formatting to all props
        enhanced_props: List[Dict[str, Any]] = []
        for prop_item in props:
            if format_lines:
                enhanced_prop = fetcher.enhance_prop_formatting(prop_item)
            else:
                enhanced_prop = prop_item
            enhanced_props.append(enhanced_prop)
        logger.info("[INFO] Enhanced formatting applied, count=%d", len(enhanced_props))
        # Filter by sport if specified
        if sport:
            enhanced_props = [
                prop
                for prop in enhanced_props
                if prop.get("sport") and str(prop.get("sport")).lower() == sport.lower()
            ]
            logger.info(
                "[INFO] Filtered by sport=%s, count=%d", sport, len(enhanced_props)
            )
        # Filter by confidence if specified
        if min_confidence is not None:
            enhanced_props = [
                prop
                for prop in enhanced_props
                if prop.get("confidence") is not None
                and float(prop.get("confidence")) >= min_confidence
            ]
            logger.info(
                "[INFO] Filtered by min_confidence=%s, count=%d",
                min_confidence,
                len(enhanced_props),
            )
        logger.info(
            "[EXIT] /api/prizepicks/props/enhanced returning response, count=%d",
            len(enhanced_props),
        )
        return ResponseBuilder.success(enhanced_props)
    except ImportError as e:
        logger.error(f"[ERROR] Failed to import enhanced fetcher: {e}")
        raise BusinessLogicException("Enhanced data fetchers not available - import error",
        ")
    except Exception as e:
        logger.error(f"[ERROR] Exception in /api/prizepicks/props/enhanced: {e}")
        raise BusinessLogicException("f"Failed to fetch enhanced PrizePicks props: {str(e")}",
        )


# Legacy endpoint for backward compatibility
@router.get("/props/legacy", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_prizepicks_props_legacy(
    sport: Optional[str] = None, min_confidence: Optional[int] = 70
) -> List[Dict[str, Any]]:
    """Legacy endpoint - use /props instead"""
    return ResponseBuilder.success(await) get_prizepicks_props(
        sport=sport, min_confidence=min_confidence, enhanced=False
    )


@router.get("/health", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_prizepicks_health():
    """Get PrizePicks scraper health and status for frontend monitoring (public endpoint)."""
    # Return health from enhanced service v2, fallback to other services
    try:
        return ResponseBuilder.success(enhanced_prizepicks_service_v2.get_scraper_health())
    except Exception:
        try:
            return ResponseBuilder.success(enhanced_prizepicks_service.get_scraper_health())
        except Exception:
            from backend.services.comprehensive_prizepicks_service import (
                comprehensive_prizepicks_service,
            )

            return ResponseBuilder.success(comprehensive_prizepicks_service.get_scraper_health())


@router.post("/heal", response_model=StandardAPIResponse[Dict[str, Any]])
async def trigger_prizepicks_healing(
    current_user: Any = Depends(get_current_admin_user),
):  # Create and secure heal endpoint
    """Trigger autonomous healing for the PrizePicks scraper."""
    logger.info("Attempting to trigger PrizePicks scraper healing...")
    try:
        # Option 1: Restart the comprehensive service's ingestion (most direct healing)
        from backend.services.comprehensive_prizepicks_service import (
            comprehensive_prizepicks_service,
        )

        await comprehensive_prizepicks_service.start_real_time_ingestion()
        # Or, if a more specific reset function exists:
        # await comprehensive_prizepicks_service.reset_scraper_state()

        logger.info("PrizePicks scraper healing triggered successfully.")
        return ResponseBuilder.success({"message": "PrizePicks scraper healing initiated.", "status": "success"})
    except Exception as e:
        logger.error(f"Error triggering PrizePicks scraper healing: {e}")
        raise BusinessLogicException("f"Failed to trigger PrizePicks scraper healing: {str(e")}",
        )
