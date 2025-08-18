"""
Section 3 Integration Service - MLB Valuation Integration

Orchestrates the integration of all Section 3 MLB valuation components:
- MLB Valuation Engine
- Binary Prop Handler  
- Payout Normalizer
- Market Context Engine

Provides unified interface for comprehensive MLB prop valuation.
"""

import logging
import asyncio
from dataclasses import dataclass
from typing import Dict, Any, Optional, List
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class MLBValuationRequest:
    """Request for comprehensive MLB valuation"""
    prop_type: str
    line: float
    player_data: Dict[str, Any]
    market_odds: Dict[str, Any]  # Market odds structure
    game_context: Optional[Dict[str, Any]] = None
    ballpark: Optional[str] = None
    weather_data: Optional[Dict[str, Any]] = None
    matchup_data: Optional[Dict[str, Any]] = None
    team_data: Optional[Dict[str, Any]] = None


@dataclass
class MLBValuationResult:
    """Comprehensive MLB valuation result"""
    prop_type: str
    line: float
    
    # Core valuation results
    valuation_analysis: Dict[str, Any]
    binary_prop_analysis: Optional[Dict[str, Any]]
    payout_analysis: Dict[str, Any]
    context_analysis: Dict[str, Any]
    
    # Final recommendation
    recommendation: Dict[str, Any]
    confidence: float
    expected_value: float
    
    # Metadata
    processing_time_ms: float
    components_used: List[str]
    timestamp: str


class MLBValuationIntegrator:
    """
    Integration service for Section 3 MLB valuation components
    
    Coordinates:
    1. Market context analysis
    2. Binary prop evaluation (if applicable)
    3. Core valuation engine processing
    4. Payout normalization
    5. Final recommendation synthesis
    """
    
    def __init__(self):
        self.name = "mlb_valuation_integrator"
        self.version = "1.0"
        
        # Import components
        self._initialize_components()
        
        # Binary prop types that get special handling
        self.binary_prop_types = {
            "hits", "home_runs", "rbi", "runs", "stolen_bases", 
            "walks", "doubles", "triples", "strikeouts_batter", "hit_by_pitch"
        }
        
        logger.info("MLB Valuation Integrator initialized")
    
    def _initialize_components(self):
        """Initialize all valuation components"""
        try:
            from .mlb_valuation_engine import mlb_valuation_engine
            from .mlb_binary_prop_handler import mlb_binary_prop_handler
            from .mlb_payout_normalizer import mlb_payout_normalizer
            from .mlb_market_context_engine import mlb_market_context_engine
            
            self.valuation_engine = mlb_valuation_engine
            self.binary_handler = mlb_binary_prop_handler
            self.payout_normalizer = mlb_payout_normalizer
            self.context_engine = mlb_market_context_engine
            
            logger.info("All MLB valuation components loaded successfully")
            
        except ImportError as e:
            logger.error(f"Failed to load MLB valuation components: {e}")
            raise
    
    async def evaluate_comprehensive(
        self,
        request: MLBValuationRequest
    ) -> MLBValuationResult:
        """
        Perform comprehensive MLB prop valuation
        
        Args:
            request: Complete valuation request
            
        Returns:
            MLBValuationResult: Comprehensive valuation analysis
        """
        start_time = datetime.now()
        components_used = []
        
        try:
            logger.debug(f"Starting comprehensive valuation for {request.prop_type}")
            
            # Step 1: Analyze market context
            context_analysis = await self._analyze_market_context(request)
            components_used.append("market_context_engine")
            
            # Step 2: Handle binary props specially if applicable
            binary_analysis = None
            if self._is_binary_prop(request.prop_type):
                binary_analysis = await self._handle_binary_prop(request, context_analysis)
                components_used.append("binary_prop_handler")
            
            # Step 3: Core valuation analysis
            valuation_analysis = await self._perform_core_valuation(
                request, context_analysis, binary_analysis
            )
            components_used.append("valuation_engine")
            
            # Step 4: Normalize payouts and calculate true odds
            payout_analysis = await self._normalize_payouts(
                request, valuation_analysis, context_analysis
            )
            components_used.append("payout_normalizer")
            
            # Step 5: Synthesize final recommendation
            final_recommendation = self._synthesize_recommendation(
                valuation_analysis, binary_analysis, payout_analysis, context_analysis
            )
            
            # Calculate processing time
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            
            return MLBValuationResult(
                prop_type=request.prop_type,
                line=request.line,
                valuation_analysis=valuation_analysis,
                binary_prop_analysis=binary_analysis,
                payout_analysis=payout_analysis,
                context_analysis=context_analysis,
                recommendation=final_recommendation["recommendation"],
                confidence=final_recommendation["confidence"],
                expected_value=final_recommendation["expected_value"],
                processing_time_ms=processing_time,
                components_used=components_used,
                timestamp=datetime.now().isoformat()
            )
            
        except Exception as e:
            logger.error(f"Error in comprehensive valuation: {e}")
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            
            # Return error result
            return MLBValuationResult(
                prop_type=request.prop_type,
                line=request.line,
                valuation_analysis={"error": str(e)},
                binary_prop_analysis=None,
                payout_analysis={"error": str(e)},
                context_analysis={"error": str(e)},
                recommendation={"action": "NO_BET", "reason": "Analysis failed"},
                confidence=0.0,
                expected_value=0.0,
                processing_time_ms=processing_time,
                components_used=components_used,
                timestamp=datetime.now().isoformat()
            )
    
    async def _analyze_market_context(
        self, 
        request: MLBValuationRequest
    ) -> Dict[str, Any]:
        """Analyze comprehensive market context"""
        
        if not all([request.ballpark, request.weather_data, request.matchup_data]):
            logger.debug("Limited context data available")
            return {
                "context_available": False,
                "adjustments": {"composite_factor": 1.0},
                "ballpark_effects": None,
                "weather_effects": None
            }
        
        try:
            # Build full game context
            game_context = await self.context_engine.analyze_game_context(
                ballpark=request.ballpark,
                weather_data=request.weather_data,
                game_time=datetime.now(),
                matchup_data=request.matchup_data,
                team_data=request.team_data or {},
                series_info=request.game_context or {}
            )
            
            # Calculate contextual adjustments for this prop
            adjustments = self.context_engine.calculate_contextual_adjustments(
                game_context=game_context,
                prop_type=request.prop_type,
                player_position="batter"  # Default to batter, could be inferred
            )
            
            return {
                "context_available": True,
                "game_context": game_context,
                "adjustments": adjustments,
                "ballpark_effects": {
                    "name": game_context.ballpark.name,
                    "offensive_factor": game_context.ballpark.offensive_factor,
                    "home_run_factor": game_context.ballpark.home_run_factor
                },
                "weather_effects": game_context.weather["impact_analysis"],
                "matchup_effects": {
                    "platoon_advantage": game_context.matchup_context.platoon_advantage,
                    "pitcher_handedness": game_context.matchup_context.pitcher_handedness,
                    "batter_handedness": game_context.matchup_context.batter_handedness
                }
            }
            
        except Exception as e:
            logger.error(f"Context analysis failed: {e}")
            return {
                "context_available": False,
                "error": str(e),
                "adjustments": {"composite_factor": 1.0}
            }
    
    def _is_binary_prop(self, prop_type: str) -> bool:
        """Check if prop type should use binary handling"""
        return prop_type.lower() in self.binary_prop_types
    
    async def _handle_binary_prop(
        self,
        request: MLBValuationRequest,
        context_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle binary prop evaluation"""
        
        try:
            # Extract game context for binary handler
            game_context = None
            if context_analysis.get("context_available"):
                game_context = {
                    "pitcher_handedness": context_analysis.get("matchup_effects", {}).get("pitcher_handedness", "R"),
                    "batter_handedness": context_analysis.get("matchup_effects", {}).get("batter_handedness", "R"),
                    "ballpark": request.ballpark,
                    "weather_conditions": str(context_analysis.get("weather_effects", {})),
                    "home_away": "home"  # Would need to be determined from team data
                }
            
            # Evaluate binary prop
            binary_result = await self.binary_handler.evaluate_binary_prop(
                prop_type=request.prop_type,
                line=request.line,
                player_data=request.player_data,
                game_context=game_context
            )
            
            return {
                "binary_result": binary_result,
                "probability_over": binary_result.probability_over,
                "probability_under": binary_result.probability_under,
                "confidence": binary_result.confidence,
                "expected_value": binary_result.expected_value,
                "binomial_params": binary_result.binomial_params,
                "edge_analysis": binary_result.edge_analysis
            }
            
        except Exception as e:
            logger.error(f"Binary prop handling failed: {e}")
            return {
                "binary_result": None,
                "error": str(e),
                "probability_over": 0.5,
                "probability_under": 0.5,
                "confidence": 0.0
            }
    
    async def _perform_core_valuation(
        self,
        request: MLBValuationRequest,
        context_analysis: Dict[str, Any],
        binary_analysis: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Perform core valuation analysis"""
        
        try:
            # Build prediction data structure
            prediction = self._build_prediction_data(
                request.player_data, binary_analysis, context_analysis
            )
            
            # Build payout structure
            payout_structure = self._build_payout_structure(request.market_odds)
            
            # Build market context
            market_context = self._build_market_context(context_analysis)
            
            # Evaluate prop value
            valuation_result = await self.valuation_engine.evaluate_prop_value(
                prediction=prediction,
                market_line=request.line,
                payout_structure=payout_structure,
                prop_type=request.prop_type,
                market_context=market_context
            )
            
            return valuation_result
            
        except Exception as e:
            logger.error(f"Core valuation failed: {e}")
            return {
                "error": str(e),
                "base_edge": 0.0,
                "confidence": 0.0,
                "expected_value": 0.0
            }
    
    def _build_prediction_data(
        self,
        player_data: Dict[str, Any],
        binary_analysis: Optional[Dict[str, Any]],
        context_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Build prediction data structure for valuation engine"""
        
        if binary_analysis:
            # Use binary prop analysis
            return {
                "mean": binary_analysis.get("binomial_params", {}).get("n", 4) * 
                        binary_analysis.get("binomial_params", {}).get("p", 0.25),
                "variance": binary_analysis.get("binomial_params", {}).get("n", 4) * 
                           binary_analysis.get("binomial_params", {}).get("p", 0.25) * 
                           (1 - binary_analysis.get("binomial_params", {}).get("p", 0.25)),
                "distribution_family": "BINOMIAL",
                "binomial_params": binary_analysis.get("binomial_params", {}),
                "confidence": binary_analysis.get("confidence", 0.0)
            }
        else:
            # Use basic player data
            projected_value = player_data.get("projected_value", 2.0)
            
            # Apply context adjustments
            context_factor = context_analysis.get("adjustments", {}).get("composite_factor", 1.0)
            adjusted_value = projected_value * context_factor
            
            return {
                "mean": adjusted_value,
                "variance": adjusted_value * 0.3,  # Assume 30% coefficient of variation
                "distribution_family": "NORMAL",
                "confidence": 0.65  # Default confidence
            }
    
    def _build_payout_structure(self, market_odds: Dict[str, Any]):
        """Build payout structure for valuation engine"""
        from .mlb_payout_normalizer import PayoutStructure
        
        # Extract odds (assuming American format)
        over_odds = market_odds.get("over", -110)
        under_odds = market_odds.get("under", -110)
        line = market_odds.get("line", 1.5)
        
        # Calculate vig
        over_decimal = self._american_to_decimal(over_odds)
        under_decimal = self._american_to_decimal(under_odds)
        over_implied = 1 / over_decimal
        under_implied = 1 / under_decimal
        vig = (over_implied + under_implied) - 1.0
        
        return PayoutStructure(
            over_odds=over_odds,
            under_odds=under_odds,
            line=line,
            vig_percentage=vig
        )
    
    def _build_market_context(self, context_analysis: Dict[str, Any]):
        """Build market context for valuation engine"""
        if not context_analysis.get("context_available"):
            return None
        
        from .mlb_valuation_engine import MLBMarketContext
        
        matchup_effects = context_analysis.get("matchup_effects", {})
        ballpark_effects = context_analysis.get("ballpark_effects", {})
        
        return MLBMarketContext(
            ballpark=ballpark_effects.get("name"),
            weather_conditions=str(context_analysis.get("weather_effects", {})),
            pitcher_handedness=matchup_effects.get("pitcher_handedness"),
            batter_handedness=matchup_effects.get("batter_handedness"),
            home_away="home"  # Would be determined from team data
        )
    
    async def _normalize_payouts(
        self,
        request: MLBValuationRequest,
        valuation_analysis: Dict[str, Any],
        context_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Normalize payouts and calculate true odds"""
        
        try:
            from .mlb_payout_normalizer import MarketOdds, OddsQuote, OddsFormat, MarketType
            
            # Build market odds structure
            quotes = [
                OddsQuote(
                    odds=request.market_odds.get("over", -110),
                    format=OddsFormat.AMERICAN,
                    side="over",
                    line=request.line
                ),
                OddsQuote(
                    odds=request.market_odds.get("under", -110),
                    format=OddsFormat.AMERICAN,
                    side="under",
                    line=request.line
                )
            ]
            
            market_odds = MarketOdds(
                quotes=quotes,
                market_type=MarketType.PLAYER_PROP,
                prop_type=request.prop_type,
                player=request.player_data.get("player_name")
            )
            
            # Normalize market
            normalized_market = await self.payout_normalizer.normalize_market(
                market_odds,
                context=context_analysis if context_analysis.get("context_available") else None
            )
            
            # Analyze market value with our predictions
            our_predictions = {
                "over": valuation_analysis.get("probability_over", 0.5),
                "under": valuation_analysis.get("probability_under", 0.5)
            }
            
            value_analysis = self.payout_normalizer.analyze_market_value(
                normalized_market,
                our_predictions
            )
            
            return {
                "normalized_market": normalized_market,
                "value_analysis": value_analysis,
                "vig_percentage": normalized_market.vig_percentage,
                "fair_odds": normalized_market.fair_odds,
                "best_bet": value_analysis["best_bet"],
                "max_expected_value": value_analysis["max_expected_value"]
            }
            
        except Exception as e:
            logger.error(f"Payout normalization failed: {e}")
            return {
                "error": str(e),
                "vig_percentage": 0.05,
                "best_bet": "over",
                "max_expected_value": 0.0
            }
    
    def _american_to_decimal(self, american_odds: float) -> float:
        """Convert American odds to decimal"""
        if american_odds > 0:
            return (american_odds / 100) + 1
        else:
            return (100 / abs(american_odds)) + 1
    
    def _synthesize_recommendation(
        self,
        valuation_analysis: Dict[str, Any],
        binary_analysis: Optional[Dict[str, Any]],
        payout_analysis: Dict[str, Any],
        context_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Synthesize final betting recommendation"""
        
        try:
            # Extract key metrics
            confidence = valuation_analysis.get("confidence", 0.0)
            expected_value = payout_analysis.get("max_expected_value", 0.0)
            best_bet_side = payout_analysis.get("best_bet", "over")
            vig_percentage = payout_analysis.get("vig_percentage", 0.05)
            
            # Enhance confidence with binary analysis if available
            if binary_analysis and binary_analysis.get("confidence"):
                # Weight binary analysis confidence higher for binary props
                binary_confidence = binary_analysis["confidence"]
                confidence = (confidence + binary_confidence * 1.2) / 2.2
            
            # Apply context confidence adjustments
            if context_analysis.get("context_available"):
                context_factor = context_analysis.get("adjustments", {}).get("composite_factor", 1.0)
                if abs(context_factor - 1.0) > 0.05:  # Significant context impact
                    confidence *= 1.05  # Boost confidence when context is meaningful
            
            # Determine recommendation
            min_confidence = 0.65  # 65% minimum confidence threshold
            min_ev = 0.02          # 2% minimum expected value
            max_vig = 0.08         # 8% maximum acceptable vig
            
            if (confidence >= min_confidence and 
                expected_value >= min_ev and 
                vig_percentage <= max_vig):
                
                recommendation = {
                    "action": "BET",
                    "side": best_bet_side,
                    "confidence_tier": "HIGH" if confidence > 0.75 else ("MEDIUM" if confidence > 0.65 else "LOW"),
                    "stake_percentage": min(expected_value * 2, 0.05),  # Cap at 5% of bankroll
                    "reasoning": self._build_reasoning(
                        valuation_analysis, binary_analysis, payout_analysis, context_analysis
                    )
                }
            else:
                recommendation = {
                    "action": "NO_BET",
                    "reason": self._build_no_bet_reason(
                        confidence, expected_value, vig_percentage, min_confidence, min_ev, max_vig
                    ),
                    "confidence_tier": "INSUFFICIENT",
                    "stake_percentage": 0.0
                }
            
            return {
                "recommendation": recommendation,
                "confidence": confidence,
                "expected_value": expected_value,
                "analysis_summary": {
                    "valuation_edge": valuation_analysis.get("edge_percentage", 0),
                    "payout_efficiency": 1 - vig_percentage,
                    "context_impact": context_analysis.get("adjustments", {}).get("composite_factor", 1.0),
                    "binary_analysis_used": binary_analysis is not None
                }
            }
            
        except Exception as e:
            logger.error(f"Recommendation synthesis failed: {e}")
            return {
                "recommendation": {
                    "action": "NO_BET",
                    "reason": f"Analysis failed: {e}",
                    "confidence_tier": "ERROR"
                },
                "confidence": 0.0,
                "expected_value": 0.0
            }
    
    def _build_reasoning(
        self,
        valuation_analysis: Dict[str, Any],
        binary_analysis: Optional[Dict[str, Any]],
        payout_analysis: Dict[str, Any],
        context_analysis: Dict[str, Any]
    ) -> str:
        """Build reasoning text for bet recommendation"""
        
        reasons = []
        
        # Valuation edge
        edge = valuation_analysis.get("edge_percentage", 0)
        if edge > 0:
            reasons.append(f"Positive edge of {edge:.1f}%")
        
        # Expected value
        ev = payout_analysis.get("max_expected_value", 0)
        if ev > 0:
            reasons.append(f"Expected value of {ev*100:.1f}%")
        
        # Context factors
        if context_analysis.get("context_available"):
            context_factor = context_analysis.get("adjustments", {}).get("composite_factor", 1.0)
            if context_factor > 1.02:
                reasons.append("Favorable game context")
            elif context_factor < 0.98:
                reasons.append("Context slightly unfavorable but edge remains")
        
        # Binary analysis
        if binary_analysis:
            confidence = binary_analysis.get("confidence", 0)
            if confidence > 0.7:
                reasons.append("Strong binomial probability analysis")
        
        # Market efficiency
        vig = payout_analysis.get("vig_percentage", 0.05)
        if vig < 0.04:
            reasons.append("Efficient market with low vig")
        
        return "; ".join(reasons) if reasons else "Standard analysis meets betting criteria"
    
    def _build_no_bet_reason(
        self, confidence: float, ev: float, vig: float,
        min_confidence: float, min_ev: float, max_vig: float
    ) -> str:
        """Build reason for no bet recommendation"""
        
        reasons = []
        
        if confidence < min_confidence:
            reasons.append(f"Confidence {confidence:.1%} below {min_confidence:.1%} threshold")
        
        if ev < min_ev:
            reasons.append(f"Expected value {ev:.1%} below {min_ev:.1%} threshold")
        
        if vig > max_vig:
            reasons.append(f"Market vig {vig:.1%} above {max_vig:.1%} threshold")
        
        return "; ".join(reasons) if reasons else "Analysis does not meet betting criteria"
    
    async def health_check(self) -> Dict[str, Any]:
        """Health check for integration service"""
        try:
            # Check all components
            component_health = {}
            
            # Valuation engine
            component_health["valuation_engine"] = await self.valuation_engine.health_check()
            
            # Binary handler
            component_health["binary_handler"] = await self.binary_handler.health_check()
            
            # Payout normalizer
            component_health["payout_normalizer"] = await self.payout_normalizer.health_check()
            
            # Context engine
            component_health["context_engine"] = await self.context_engine.health_check()
            
            # Check if all components are healthy
            all_healthy = all(
                comp.get("status") == "healthy" 
                for comp in component_health.values()
            )
            
            return {
                "service": self.name,
                "version": self.version,
                "status": "healthy" if all_healthy else "degraded",
                "component_health": component_health,
                "integration_capabilities": {
                    "comprehensive_valuation": all_healthy,
                    "binary_prop_handling": component_health["binary_handler"]["status"] == "healthy",
                    "context_analysis": component_health["context_engine"]["status"] == "healthy",
                    "payout_normalization": component_health["payout_normalizer"]["status"] == "healthy"
                }
            }
            
        except Exception as e:
            logger.error(f"Integration service health check failed: {e}")
            return {
                "service": self.name,
                "version": self.version,
                "status": "error",
                "error": str(e)
            }


# Global service instance
mlb_valuation_integrator = MLBValuationIntegrator()