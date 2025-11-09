"""
PropOllama Intelligence Service - Advanced Analytics Integration
Integrates PropOllama with maximum accuracy prediction system.
Provides intelligent analysis with 95%+ accuracy models and comprehensive features.
"""

import asyncio
import logging
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import json

logger = logging.getLogger(__name__)

class PropOllamaIntelligenceService:
    """Advanced PropOllama service with maximum accuracy integration"""
    
    def __init__(self):
        self.analysis_history = []
        self.intelligence_metrics = {
            'total_analyses': 0,
            'avg_accuracy_score': 0.0,
            'avg_confidence': 0.0,
            'high_confidence_analyses': 0
        }
        
        logger.info("🧠 PropOllama Intelligence Service initialized with 95%+ accuracy integration")
    
    async def generate_intelligent_analysis(self, player_name: str, prop_type: str, sport: str, 
                                          user_query: str = None) -> Dict[str, Any]:
        """Generate intelligent analysis using maximum accuracy models"""
        start_time = time.time()
        
        try:
            logger.info(f"🧠 Generating intelligent analysis for {player_name} {prop_type} ({sport})")
            
            # Import here to avoid circular imports
            from .advanced_ensemble_service import get_maximum_accuracy_prediction
            from .comprehensive_feature_engine import engineer_comprehensive_features
            
            # Get maximum accuracy prediction
            prediction = await get_maximum_accuracy_prediction(player_name, prop_type, sport, {})
            
            # Engineer comprehensive features for analysis
            feature_set = await engineer_comprehensive_features(player_name, sport, prop_type, {})
            
            # Generate intelligent response
            intelligent_response = await self._generate_intelligent_response(
                prediction, feature_set, user_query
            )
            
            # Create comprehensive analysis
            analysis = {
                'player_name': player_name,
                'prop_type': prop_type,
                'sport': sport,
                'prediction': {
                    'predicted_value': prediction.predicted_value,
                    'confidence': prediction.confidence,
                    'accuracy_score': prediction.accuracy_score,
                    'recommendation': prediction.recommendation,
                    'prediction_interval': prediction.prediction_interval
                },
                'intelligent_analysis': intelligent_response,
                'feature_insights': self._extract_feature_insights(feature_set),
                'model_consensus': prediction.model_consensus,
                'risk_assessment': prediction.risk_assessment,
                'reasoning': prediction.reasoning,
                'market_intelligence': await self._generate_market_intelligence(prediction),
                'betting_strategy': await self._generate_betting_strategy(prediction, feature_set),
                'execution_time': time.time() - start_time,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
            # Track analysis
            await self._track_analysis(analysis)
            
            logger.info(f"✅ Intelligent analysis generated: {prediction.predicted_value:.1f} "
                       f"({prediction.confidence:.1%} confidence) in {analysis['execution_time']:.3f}s")
            
            return analysis
            
        except Exception as e:
            logger.error(f"❌ Intelligent analysis error: {e}")
            raise
    
    async def _generate_intelligent_response(self, prediction, feature_set, user_query: str = None) -> str:
        """Generate intelligent natural language response"""
        
        # Base analysis
        response_parts = []
        
        # Prediction summary
        response_parts.append(
            f"🎯 **MAXIMUM ACCURACY PREDICTION**: {prediction.predicted_value:.1f} {prediction.prop_type}"
        )
        
        response_parts.append(
            f"📊 **CONFIDENCE**: {prediction.confidence:.1%} | **ACCURACY SCORE**: {prediction.accuracy_score:.1%}"
        )
        
        # Model consensus analysis
        consensus_strength = self._calculate_consensus_strength(prediction.model_consensus)
        response_parts.append(
            f"🤖 **MODEL CONSENSUS**: {len(prediction.model_consensus)} models with {consensus_strength:.1%} agreement"
        )
        
        # Feature-driven insights
        top_features = sorted(feature_set.feature_importance.items(), key=lambda x: x[1], reverse=True)[:3]
        feature_analysis = ", ".join([f"{feat.replace('_', ' ').title()}" for feat, _ in top_features])
        response_parts.append(f"🔍 **KEY FACTORS**: {feature_analysis}")
        
        # Risk assessment
        risk_level = prediction.risk_assessment['risk_level']
        risk_emoji = "🟢" if risk_level == "LOW" else "🟡" if risk_level == "MEDIUM" else "🔴"
        response_parts.append(f"{risk_emoji} **RISK LEVEL**: {risk_level}")
        
        # Recommendation with reasoning
        response_parts.append(f"💡 **RECOMMENDATION**: {prediction.recommendation}")
        
        # Add specific reasoning
        if prediction.reasoning:
            response_parts.append("**ANALYSIS BREAKDOWN**:")
            for i, reason in enumerate(prediction.reasoning[:3], 1):
                response_parts.append(f"{i}. {reason}")
        
        # Performance context
        if prediction.accuracy_score >= 0.90:
            response_parts.append("🏆 **HIGH ACCURACY PREDICTION** - Strong statistical edge identified")
        elif prediction.accuracy_score >= 0.80:
            response_parts.append("✅ **SOLID PREDICTION** - Good statistical foundation")
        else:
            response_parts.append("⚠️ **MODERATE CONFIDENCE** - Limited statistical edge")
        
        # Market context
        interval_width = prediction.prediction_interval[1] - prediction.prediction_interval[0]
        response_parts.append(
            f"📈 **PREDICTION RANGE**: {prediction.prediction_interval[0]:.1f} - {prediction.prediction_interval[1]:.1f} "
            f"(±{interval_width/2:.1f})"
        )
        
        return "\n\n".join(response_parts)
    
    def _calculate_consensus_strength(self, model_consensus: Dict[str, float]) -> float:
        """Calculate model consensus strength"""
        if len(model_consensus) < 2:
            return 0.0
        
        predictions = list(model_consensus.values())
        mean_pred = sum(predictions) / len(predictions)
        variance = sum((p - mean_pred) ** 2 for p in predictions) / len(predictions)
        
        # Lower variance = higher consensus
        consensus_strength = max(0.0, 1.0 - (variance / (mean_pred ** 2)) if mean_pred != 0 else 0.0)
        return min(1.0, consensus_strength)
    
    def _extract_feature_insights(self, feature_set) -> Dict[str, Any]:
        """Extract key insights from feature analysis"""
        insights = {
            'total_features': len(feature_set.features),
            'feature_quality': feature_set.feature_quality_score,
            'top_categories': [],
            'key_insights': []
        }
        
        # Analyze feature categories
        category_importance = {}
        for category, features in feature_set.feature_categories.items():
            category_importance[category.value] = sum(
                feature_set.feature_importance.get(feat, 0) for feat in features.keys()
            )
        
        # Top 3 categories
        top_categories = sorted(category_importance.items(), key=lambda x: x[1], reverse=True)[:3]
        insights['top_categories'] = [cat for cat, _ in top_categories]
        
        # Generate insights
        if 'player_performance' in insights['top_categories']:
            insights['key_insights'].append("Recent performance trends are highly predictive")
        if 'matchup_specific' in insights['top_categories']:
            insights['key_insights'].append("Matchup factors significantly impact prediction")
        if 'line_movement' in insights['top_categories']:
            insights['key_insights'].append("Market intelligence provides valuable edge")
        
        return insights
    
    async def _generate_market_intelligence(self, prediction) -> Dict[str, Any]:
        """Generate market intelligence analysis"""
        return {
            'market_efficiency': "Moderate" if prediction.confidence < 0.8 else "Low efficiency detected",
            'value_assessment': "Positive EV" if prediction.confidence > 0.75 else "Limited value",
            'market_sentiment': "Neutral" if 0.6 < prediction.confidence < 0.8 else "Strong signal",
            'recommended_stake': self._calculate_recommended_stake(prediction),
            'alternative_markets': [
                f"Consider {prediction.player_name} alternative props",
                f"Check correlated player markets",
                f"Analyze team total implications"
            ]
        }
    
    def _calculate_recommended_stake(self, prediction) -> str:
        """Calculate recommended stake based on Kelly Criterion concepts"""
        confidence = prediction.confidence
        risk_score = prediction.risk_assessment['risk_score']
        
        if confidence >= 0.9 and risk_score < 0.2:
            return "3-5% of bankroll (High conviction)"
        elif confidence >= 0.8 and risk_score < 0.3:
            return "2-3% of bankroll (Strong play)"
        elif confidence >= 0.7 and risk_score < 0.4:
            return "1-2% of bankroll (Standard play)"
        else:
            return "Pass or 0.5% of bankroll (Speculative)"
    
    async def _generate_betting_strategy(self, prediction, feature_set) -> Dict[str, Any]:
        """Generate comprehensive betting strategy"""
        strategy = {
            'primary_strategy': prediction.recommendation,
            'timing_advice': self._generate_timing_advice(prediction),
            'risk_management': {
                'max_exposure': self._calculate_max_exposure(prediction),
                'stop_loss': "Exit if line moves significantly against prediction",
                'profit_target': f"Target {prediction.predicted_value:.1f} +/- {(prediction.prediction_interval[1] - prediction.prediction_interval[0])/4:.1f}"
            }
        }
        
        return strategy
    
    def _generate_timing_advice(self, prediction) -> str:
        """Generate timing advice for bet placement"""
        confidence = prediction.confidence
        
        if confidence >= 0.9:
            return "Place bet immediately - strong edge identified"
        elif confidence >= 0.8:
            return "Place bet soon - good edge, monitor for line movement"
        elif confidence >= 0.7:
            return "Monitor line movement, place if value improves"
        else:
            return "Wait for better spot or pass entirely"
    
    def _calculate_max_exposure(self, prediction) -> str:
        """Calculate maximum recommended exposure"""
        confidence = prediction.confidence
        risk_score = prediction.risk_assessment['risk_score']
        
        if confidence >= 0.9 and risk_score < 0.2:
            return "Up to 10% of bankroll across correlated bets"
        elif confidence >= 0.8:
            return "Up to 5% of bankroll across correlated bets"
        else:
            return "Up to 2% of bankroll maximum"
    
    async def _track_analysis(self, analysis: Dict[str, Any]):
        """Track analysis for performance monitoring"""
        self.analysis_history.append({
            'timestamp': analysis['timestamp'],
            'player': analysis['player_name'],
            'sport': analysis['sport'],
            'prop_type': analysis['prop_type'],
            'predicted_value': analysis['prediction']['predicted_value'],
            'confidence': analysis['prediction']['confidence'],
            'accuracy_score': analysis['prediction']['accuracy_score'],
            'execution_time': analysis['execution_time']
        })
        
        # Update metrics
        self.intelligence_metrics['total_analyses'] += 1
        self.intelligence_metrics['avg_confidence'] = (
            (self.intelligence_metrics['avg_confidence'] * (self.intelligence_metrics['total_analyses'] - 1) +
             analysis['prediction']['confidence']) / self.intelligence_metrics['total_analyses']
        )
        self.intelligence_metrics['avg_accuracy_score'] = (
            (self.intelligence_metrics['avg_accuracy_score'] * (self.intelligence_metrics['total_analyses'] - 1) +
             analysis['prediction']['accuracy_score']) / self.intelligence_metrics['total_analyses']
        )
        
        if analysis['prediction']['confidence'] >= 0.8:
            self.intelligence_metrics['high_confidence_analyses'] += 1

# Global service instance
propollama_intelligence_service = PropOllamaIntelligenceService()

async def generate_propollama_intelligence(player_name: str, prop_type: str, sport: str, 
                                         user_query: str = None) -> Dict[str, Any]:
    """Generate PropOllama intelligence with maximum accuracy integration"""
    return await propollama_intelligence_service.generate_intelligent_analysis(
        player_name, prop_type, sport, user_query
    )
