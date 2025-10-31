"""
AI Recommendations Engine - Advanced betting recommendations with ML scoring
Builds upon existing Ollama LLM and modern ML infrastructure for personalized betting insights
"""

import asyncio
import json
import logging
import uuid
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum
import math

# Import existing services
from .ollama_service import get_ollama_service
from .modern_ml_service import modern_ml_service
from .odds_aggregation_service import get_odds_service
from .unified_data_fetcher import unified_data_fetcher
from .intelligent_cache_service import intelligent_cache_service

logger = logging.getLogger(__name__)

class RiskLevel(Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    EXTREME = "EXTREME"

class RecommendationType(Enum):
    VALUE_BET = "value_bet"
    ARBITRAGE = "arbitrage"
    TREND_PLAY = "trend_play"
    CONTRARIAN = "contrarian"
    MODEL_EDGE = "model_edge"
    LIVE_OPPORTUNITY = "live_opportunity"

@dataclass
class SmartRecommendation:
    """AI-powered betting recommendation with detailed analysis"""
    id: str
    prop_id: str
    player_name: str
    stat_type: str
    line: float
    recommended_side: str
    ai_score: float  # 0-100 AI confidence score
    confidence_interval: Tuple[float, float]  # (lower, upper) bounds
    reasoning: str
    risk_level: RiskLevel
    expected_value: float
    recommendation_type: RecommendationType
    sportsbook: str
    odds: int
    implied_probability: float
    fair_probability: float
    edge_percentage: float
    
    # Advanced analytics
    market_efficiency: float
    historical_accuracy: float
    situational_factors: Dict[str, Any]
    correlation_risk: float
    kelly_fraction: float
    
    # Metadata
    created_at: datetime
    expires_at: datetime
    model_version: str
    data_sources: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to API response format"""
        return {
            **asdict(self),
            'risk_level': self.risk_level.value,
            'recommendation_type': self.recommendation_type.value,
            'created_at': self.created_at.isoformat(),
            'expires_at': self.expires_at.isoformat(),
            'confidence_interval': list(self.confidence_interval)
        }

@dataclass
class UserProfile:
    """User betting profile for personalization"""
    user_id: str
    risk_tolerance: float  # 0-1 scale
    bankroll_size: float
    preferred_sports: List[str]
    bet_types_preference: Dict[str, float]
    historical_performance: Dict[str, float]
    kelly_multiplier: float = 0.25  # Conservative Kelly fraction
    max_bet_percentage: float = 0.05  # Max 5% of bankroll per bet

class AIRecommendationsService:
    """Advanced AI-powered betting recommendations service"""
    
    def __init__(self):
        self.ollama_service = get_ollama_service()
        self.odds_service = get_odds_service()
        self.cache_ttl = 300  # 5 minutes
        self.recommendation_cache: Dict[str, List[SmartRecommendation]] = {}
        
        # ML model weights for scoring
        self.scoring_weights = {
            'edge_percentage': 0.30,
            'model_confidence': 0.25,
            'market_efficiency': 0.15,
            'historical_accuracy': 0.15,
            'situational_factors': 0.10,
            'data_quality': 0.05
        }
        
        # Risk thresholds
        self.risk_thresholds = {
            RiskLevel.LOW: (0, 2.0),      # 0-2% edge
            RiskLevel.MEDIUM: (2.0, 5.0), # 2-5% edge
            RiskLevel.HIGH: (5.0, 10.0),  # 5-10% edge
            RiskLevel.EXTREME: (10.0, float('inf'))  # 10%+ edge
        }
    
    async def generate_recommendations(
        self,
        user_profile: UserProfile,
        sport: str = "MLB",
        max_recommendations: int = 10,
        min_edge: float = 1.0
    ) -> List[SmartRecommendation]:
        """Generate personalized AI betting recommendations"""
        
        try:
            # Check cache first
            cache_key = f"ai_recommendations_{user_profile.user_id}_{sport}_{min_edge}"
            cached_recommendations = await self._get_cached_recommendations(cache_key)
            if cached_recommendations:
                logger.info(f"Returning {len(cached_recommendations)} cached recommendations")
                return cached_recommendations[:max_recommendations]
            
            logger.info(f"Generating AI recommendations for user {user_profile.user_id}, sport: {sport}")
            
            # Get current opportunities from existing services
            best_lines = await self.odds_service.find_best_lines(sport)
            arbitrage_opportunities = await self.odds_service.find_arbitrage_opportunities(sport)
            
            recommendations = []
            
            # Process each opportunity through AI analysis
            for line in best_lines:
                try:
                    recommendation = await self._analyze_prop_opportunity(
                        line, user_profile, sport
                    )
                    
                    if recommendation and recommendation.edge_percentage >= min_edge:
                        recommendations.append(recommendation)
                        
                except Exception as e:
                    logger.warning(f"Failed to analyze prop {line.player_name}: {e}")
                    continue
            
            # Add arbitrage opportunities
            for arb in arbitrage_opportunities:
                try:
                    arb_recommendation = await self._create_arbitrage_recommendation(
                        arb, user_profile
                    )
                    if arb_recommendation:
                        recommendations.append(arb_recommendation)
                except Exception as e:
                    logger.warning(f"Failed to process arbitrage opportunity: {e}")
                    continue
            
            # Sort by AI score and filter
            recommendations.sort(key=lambda r: r.ai_score, reverse=True)
            top_recommendations = recommendations[:max_recommendations]
            
            # Cache results
            await self._cache_recommendations(cache_key, top_recommendations)
            
            logger.info(f"Generated {len(top_recommendations)} AI recommendations")
            return top_recommendations
            
        except Exception as e:
            logger.error(f"Failed to generate AI recommendations: {e}")
            return []
    
    async def _analyze_prop_opportunity(
        self,
        line: Any,  # CanonicalLine from odds service
        user_profile: UserProfile,
        sport: str
    ) -> Optional[SmartRecommendation]:
        """Analyze a prop opportunity using AI and ML models"""
        
        try:
            # Get historical data for analysis
            player_data = await unified_data_fetcher.fetch_player_stats(
                line.player_name, sport
            )
            
            if not player_data:
                return None
            
            # Use modern ML service for prediction
            ml_result = await modern_ml_service.predict({
                'player_name': line.player_name,
                'stat_type': line.stat_type,
                'line': line.best_over_line,
                'recent_games': player_data.get('recent_games', []),
                'sport': sport
            })
            
            # Calculate fair probability using ML prediction
            fair_probability = ml_result.get('probability', 0.5)
            model_confidence = ml_result.get('confidence', 0.7)
            
            # Analyze both sides of the prop
            over_analysis = await self._analyze_prop_side(
                line, 'over', fair_probability, model_confidence, user_profile
            )
            under_analysis = await self._analyze_prop_side(
                line, 'under', 1 - fair_probability, model_confidence, user_profile
            )
            
            # Return the better recommendation
            if over_analysis and under_analysis:
                return over_analysis if over_analysis.ai_score > under_analysis.ai_score else under_analysis
            elif over_analysis:
                return over_analysis
            elif under_analysis:
                return under_analysis
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to analyze prop opportunity: {e}")
            return None
    
    async def _analyze_prop_side(
        self,
        line: Any,
        side: str,
        fair_probability: float,
        model_confidence: float,
        user_profile: UserProfile
    ) -> Optional[SmartRecommendation]:
        """Analyze a specific side of a prop bet"""
        
        try:
            # Get market odds and probability
            market_odds = line.best_over_price if side == 'over' else line.best_under_price
            sportsbook = line.best_over_book if side == 'over' else line.best_under_book
            prop_line = line.best_over_line if side == 'over' else line.best_under_line
            
            if market_odds == 0:
                return None
            
            # Calculate implied probability from odds
            implied_probability = self._american_to_probability(market_odds)
            
            # Calculate edge
            edge_percentage = ((fair_probability - implied_probability) / implied_probability) * 100
            
            # Skip if no edge
            if edge_percentage <= 0:
                return None
            
            # Calculate expected value
            if market_odds > 0:
                profit = market_odds / 100
            else:
                profit = 100 / abs(market_odds)
            
            expected_value = (fair_probability * profit) - ((1 - fair_probability) * 1)
            
            # Get AI reasoning using Ollama
            reasoning = await self._generate_ai_reasoning(
                line.player_name, line.stat_type, side, prop_line, edge_percentage
            )
            
            # Calculate situational factors
            situational_factors = await self._analyze_situational_factors(line)
            
            # Calculate AI score
            ai_score = self._calculate_ai_score(
                edge_percentage, model_confidence, implied_probability, situational_factors
            )
            
            # Determine risk level
            risk_level = self._determine_risk_level(edge_percentage, model_confidence)
            
            # Calculate Kelly fraction
            kelly_fraction = self._calculate_kelly_fraction(
                fair_probability, implied_probability, user_profile.kelly_multiplier
            )
            
            # Create recommendation
            recommendation = SmartRecommendation(
                id=str(uuid.uuid4()),
                prop_id=f"{line.player_name}_{line.stat_type}_{side}",
                player_name=line.player_name,
                stat_type=line.stat_type,
                line=prop_line,
                recommended_side=side,
                ai_score=ai_score,
                confidence_interval=(
                    fair_probability - (0.1 * (1 - model_confidence)),
                    fair_probability + (0.1 * (1 - model_confidence))
                ),
                reasoning=reasoning,
                risk_level=risk_level,
                expected_value=expected_value,
                recommendation_type=self._classify_recommendation_type(edge_percentage, situational_factors),
                sportsbook=sportsbook,
                odds=market_odds,
                implied_probability=implied_probability,
                fair_probability=fair_probability,
                edge_percentage=edge_percentage,
                market_efficiency=self._calculate_market_efficiency(line),
                historical_accuracy=model_confidence,
                situational_factors=situational_factors,
                correlation_risk=0.1,  # Default low correlation risk
                kelly_fraction=kelly_fraction,
                created_at=datetime.now(),
                expires_at=datetime.now() + timedelta(hours=2),
                model_version="v2.1.0",
                data_sources=["modern_ml", "odds_aggregation", "ollama_ai"]
            )
            
            return recommendation
            
        except Exception as e:
            logger.error(f"Failed to analyze prop side: {e}")
            return None
    
    async def _generate_ai_reasoning(
        self,
        player_name: str,
        stat_type: str,
        side: str,
        line: float,
        edge_percentage: float
    ) -> str:
        """Generate AI reasoning using Ollama LLM"""
        
        try:
            prompt = f"""
            Analyze this sports betting opportunity and provide concise reasoning:
            
            Player: {player_name}
            Stat: {stat_type}
            Line: {line} ({side})
            Calculated Edge: {edge_percentage:.1f}%
            
            Provide a brief analysis (2-3 sentences) covering:
            1. Why this represents value
            2. Key factors supporting the recommendation
            3. Main risk considerations
            
            Keep it concise and actionable for a bettor.
            """
            
            # Use existing Ollama service
            reasoning = await self.ollama_service.ollama_chat_stream(
                messages=[{"role": "user", "content": prompt}],
                stream=False
            )
            
            if reasoning and len(reasoning) > 50:
                return reasoning[:300] + "..." if len(reasoning) > 300 else reasoning
            else:
                # Fallback reasoning
                return f"AI model identifies {edge_percentage:.1f}% edge on {player_name} {stat_type} {side} {line}. Strong value opportunity based on statistical analysis."
                
        except Exception as e:
            logger.warning(f"Failed to generate AI reasoning: {e}")
            return f"Statistical model indicates {edge_percentage:.1f}% edge on this prop based on historical data and current market conditions."
    
    async def _analyze_situational_factors(self, line: Any) -> Dict[str, Any]:
        """Analyze situational factors affecting the prop"""
        
        factors = {
            'venue_impact': 0.0,
            'weather_impact': 0.0,
            'rest_days': 0,
            'opponent_strength': 0.5,
            'recent_form': 0.5,
            'injury_concerns': False,
            'matchup_advantage': 0.0
        }
        
        try:
            # This would integrate with real data sources
            # For now, return mock factors with some randomness
            import random
            factors.update({
                'venue_impact': random.uniform(-0.1, 0.1),
                'opponent_strength': random.uniform(0.3, 0.7),
                'recent_form': random.uniform(0.4, 0.8),
                'matchup_advantage': random.uniform(-0.05, 0.15)
            })
            
        except Exception as e:
            logger.warning(f"Failed to analyze situational factors: {e}")
        
        return factors
    
    def _calculate_ai_score(
        self,
        edge_percentage: float,
        model_confidence: float,
        implied_probability: float,
        situational_factors: Dict[str, Any]
    ) -> float:
        """Calculate overall AI score (0-100)"""
        
        # Normalize edge percentage to 0-1 scale (cap at 20% edge)
        edge_score = min(edge_percentage / 20.0, 1.0)
        
        # Model confidence is already 0-1
        confidence_score = model_confidence
        
        # Market efficiency (closer to 0.5 = more efficient market)
        efficiency_penalty = abs(implied_probability - 0.5) * 0.5
        market_score = 1.0 - efficiency_penalty
        
        # Situational factors bonus
        situational_score = (
            situational_factors.get('recent_form', 0.5) +
            situational_factors.get('matchup_advantage', 0.0) +
            (1.0 if not situational_factors.get('injury_concerns', False) else 0.5)
        ) / 3.0
        
        # Weighted combination
        ai_score = (
            edge_score * self.scoring_weights['edge_percentage'] +
            confidence_score * self.scoring_weights['model_confidence'] +
            market_score * self.scoring_weights['market_efficiency'] +
            situational_score * self.scoring_weights['situational_factors'] +
            model_confidence * self.scoring_weights['historical_accuracy'] +
            0.9 * self.scoring_weights['data_quality']  # High data quality score
        ) * 100
        
        return max(0, min(100, ai_score))
    
    def _determine_risk_level(self, edge_percentage: float, confidence: float) -> RiskLevel:
        """Determine risk level based on edge and confidence"""
        
        # Adjust edge based on confidence
        adjusted_edge = edge_percentage * confidence
        
        for risk_level, (min_edge, max_edge) in self.risk_thresholds.items():
            if min_edge <= adjusted_edge < max_edge:
                return risk_level
        
        return RiskLevel.EXTREME
    
    def _classify_recommendation_type(
        self,
        edge_percentage: float,
        situational_factors: Dict[str, Any]
    ) -> RecommendationType:
        """Classify the type of recommendation"""
        
        if edge_percentage > 8.0:
            return RecommendationType.MODEL_EDGE
        elif edge_percentage > 5.0:
            return RecommendationType.VALUE_BET
        elif situational_factors.get('recent_form', 0.5) > 0.7:
            return RecommendationType.TREND_PLAY
        elif situational_factors.get('recent_form', 0.5) < 0.3:
            return RecommendationType.CONTRARIAN
        else:
            return RecommendationType.VALUE_BET
    
    def _calculate_kelly_fraction(
        self,
        fair_probability: float,
        implied_probability: float,
        kelly_multiplier: float
    ) -> float:
        """Calculate Kelly Criterion bet sizing"""
        
        try:
            # Kelly formula: f = (bp - q) / b
            # where b = odds, p = win probability, q = lose probability
            odds_decimal = 1 / implied_probability
            b = odds_decimal - 1  # net odds
            p = fair_probability
            q = 1 - fair_probability
            
            kelly_fraction = (b * p - q) / b
            
            # Apply safety multiplier and cap
            safe_kelly = kelly_fraction * kelly_multiplier
            return max(0, min(0.05, safe_kelly))  # Cap at 5%
            
        except Exception:
            return 0.01  # Default 1% bet size
    
    def _calculate_market_efficiency(self, line: Any) -> float:
        """Calculate market efficiency score"""
        
        try:
            # Calculate spread between books
            if not line.books or len(line.books) < 2:
                return 0.5
            
            over_odds = [book.over_price for book in line.books if book.over_price != 0]
            under_odds = [book.under_price for book in line.books if book.under_price != 0]
            
            if not over_odds or not under_odds:
                return 0.5
            
            over_spread = max(over_odds) - min(over_odds)
            under_spread = max(under_odds) - min(under_odds)
            avg_spread = (over_spread + under_spread) / 2
            
            # Higher spread = lower efficiency
            efficiency = max(0.0, min(1.0, 1.0 - (avg_spread / 100)))
            return efficiency
            
        except Exception:
            return 0.5
    
    def _american_to_probability(self, american_odds: int) -> float:
        """Convert American odds to implied probability"""
        if american_odds > 0:
            return 100 / (american_odds + 100)
        else:
            return abs(american_odds) / (abs(american_odds) + 100)
    
    async def _create_arbitrage_recommendation(
        self,
        arbitrage_opportunity: Any,
        user_profile: UserProfile
    ) -> Optional[SmartRecommendation]:
        """Create recommendation for arbitrage opportunity"""
        
        try:
            # Extract arbitrage details
            profit_percentage = arbitrage_opportunity.get('profit_percentage', 0)
            
            if profit_percentage <= 0:
                return None
            
            recommendation = SmartRecommendation(
                id=str(uuid.uuid4()),
                prop_id=f"arb_{arbitrage_opportunity.get('id', 'unknown')}",
                player_name=arbitrage_opportunity.get('player_name', 'Multiple'),
                stat_type=arbitrage_opportunity.get('stat_type', 'arbitrage'),
                line=arbitrage_opportunity.get('line', 0),
                recommended_side='arbitrage',
                ai_score=90 + profit_percentage,  # High score for guaranteed profit
                confidence_interval=(profit_percentage, profit_percentage),
                reasoning=f"Guaranteed {profit_percentage:.2f}% profit through arbitrage betting across multiple sportsbooks.",
                risk_level=RiskLevel.LOW,
                expected_value=profit_percentage / 100,
                recommendation_type=RecommendationType.ARBITRAGE,
                sportsbook="Multiple",
                odds=0,
                implied_probability=0.5,
                fair_probability=0.5,
                edge_percentage=profit_percentage,
                market_efficiency=0.0,  # Low efficiency enables arbitrage
                historical_accuracy=1.0,  # Arbitrage is guaranteed
                situational_factors={'arbitrage': True},
                correlation_risk=0.0,  # No correlation risk in arbitrage
                kelly_fraction=min(0.05, profit_percentage / 100),
                created_at=datetime.now(),
                expires_at=datetime.now() + timedelta(minutes=15),  # Arbitrage expires quickly
                model_version="arbitrage_v1.0",
                data_sources=["odds_aggregation"]
            )
            
            return recommendation
            
        except Exception as e:
            logger.error(f"Failed to create arbitrage recommendation: {e}")
            return None
    
    async def _get_cached_recommendations(self, cache_key: str) -> Optional[List[SmartRecommendation]]:
        """Get cached recommendations"""
        try:
            cached_data = await intelligent_cache_service.get_cached_data(cache_key)
            if cached_data:
                return [SmartRecommendation(**rec) for rec in cached_data]
        except Exception as e:
            logger.warning(f"Failed to get cached recommendations: {e}")
        return None
    
    async def _cache_recommendations(self, cache_key: str, recommendations: List[SmartRecommendation]):
        """Cache recommendations"""
        try:
            cache_data = [rec.to_dict() for rec in recommendations]
            await intelligent_cache_service.cache_data(cache_key, cache_data, ttl=self.cache_ttl)
        except Exception as e:
            logger.warning(f"Failed to cache recommendations: {e}")
    
    async def get_user_alert_preferences(self, user_id: str) -> Dict[str, Any]:
        """Get user's alert preferences"""
        # This would integrate with user preferences storage
        return {
            'min_edge_threshold': 2.0,
            'preferred_sports': ['MLB'],
            'max_risk_level': 'MEDIUM',
            'alert_types': ['value_bet', 'arbitrage'],
            'notification_methods': ['email', 'push']
        }
    
    async def send_recommendation_alert(
        self,
        user_id: str,
        recommendation: SmartRecommendation
    ) -> bool:
        """Send alert for high-value recommendation"""
        try:
            # This would integrate with notification system
            logger.info(f"Alert: High-value recommendation for user {user_id}: {recommendation.player_name} {recommendation.stat_type}")
            return True
        except Exception as e:
            logger.error(f"Failed to send alert: {e}")
            return False


# Global service instance
ai_recommendations_service = AIRecommendationsService()

def get_ai_recommendations_service() -> AIRecommendationsService:
    """Get AI recommendations service instance for dependency injection"""
    return ai_recommendations_service
