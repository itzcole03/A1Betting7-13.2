"""
Enhanced ML Service Integration for Statcast-based Projections

This module integrates the new StatProjectionModels with the existing
enhanced_ml_service.py to provide comprehensive player projections using
advanced Statcast metrics alongside traditional betting predictions.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union

import numpy as np
import pandas as pd

from .advanced_feature_engine import AdvancedFeatureEngine

# Local imports
from .stat_projection_models import ModelConfig, ProjectionResult, StatProjectionModels
from .statcast_data_pipeline import StatcastDataPipeline

# Optional import for enhanced ML service integration
try:
    from ..enhanced_ml_service import BetAnalysisResponse, EnhancedMLService

    ENHANCED_ML_AVAILABLE = True
except ImportError:
    ENHANCED_ML_AVAILABLE = False

    # Mock classes for when enhanced_ml_service isn't available
    class MockBetAnalysisResponse:
        def __init__(
            self, recommendation="neutral", confidence=0.5, reasoning="", factors=None
        ):
            self.recommendation = recommendation
            self.confidence = confidence
            self.reasoning = reasoning
            self.factors = factors or []

    class MockEnhancedMLService:
        async def analyze_prop(self, prop):
            return MockBetAnalysisResponse()

    # Use mock classes
    BetAnalysisResponse = MockBetAnalysisResponse
    EnhancedMLService = MockEnhancedMLService

logger = logging.getLogger("statcast_ml_integration")


class StatcastMLIntegration:
    """
    Integration service that combines Statcast-based projections with
    existing betting analysis for comprehensive player performance predictions.
    """

    def __init__(self):
        # Initialize core components
        self.projection_models = StatProjectionModels()
        self.data_pipeline = StatcastDataPipeline()

        # Initialize enhanced ML service if available
        if ENHANCED_ML_AVAILABLE:
            self.enhanced_ml_service = EnhancedMLService()
        else:
            self.enhanced_ml_service = EnhancedMLService()  # Mock version

        # Cache for recent projections
        self.projection_cache: Dict[str, Dict[str, Any]] = {}
        self.cache_ttl = timedelta(hours=4)  # Cache projections for 4 hours

        # Mapping between projection stats and betting markets
        self.stat_to_market_mapping = {
            "home_runs": ["home_runs", "total_bases"],
            "hits": ["hits", "total_bases"],
            "runs": ["runs_scored"],
            "rbis": ["rbis"],
            "stolen_bases": ["stolen_bases"],
            "pitcher_strikeouts": ["pitcher_strikeouts"],
            "walks": ["walks"],
            "hitter_strikeouts": ["strikeouts"],
            "hits_allowed": ["hits_allowed"],
            "walks_allowed": ["walks_allowed"],
            "earned_runs_allowed": ["earned_runs"],
            "pitching_outs": ["innings_pitched"],
        }

        logger.info(
            "🔗 StatcastMLIntegration initialized with projection-betting market mapping"
        )

    async def initialize_models_async(self) -> None:
        """
        Asynchronous background initialization to prevent blocking startup
        """
        try:
            logger.info("🔄 Starting background Statcast model initialization")

            # Add timeout to prevent hanging
            async def timeout_wrapper():
                await asyncio.wait_for(
                    self.initialize_models(), timeout=300
                )  # 5 minute timeout

            await timeout_wrapper()
            logger.info("✅ Background Statcast model initialization completed")
        except asyncio.TimeoutError:
            logger.warning("⚠️ Statcast model initialization timed out after 5 minutes")
        except Exception as e:
            logger.error(f"❌ Background Statcast model initialization failed: {e}")

    async def initialize_models(self, training_data_path: Optional[str] = None) -> None:
        """
        Initialize and train projection models with historical Statcast data
        """
        logger.info("🚀 Initializing Statcast projection models")

        try:
            # Fetch recent Statcast data for training
            if training_data_path:
                training_data = pd.read_csv(training_data_path)
            else:
                training_data = await self.data_pipeline.fetch_historical_statcast_data(
                    start_date="2023-04-01", end_date="2024-10-31"
                )

            if training_data.empty:
                logger.warning(
                    "No training data available. Using mock data for initialization."
                )
                training_data = self._generate_mock_training_data()

            # Train models for each target statistic
            target_stats = [
                "home_runs",
                "hits",
                "runs",
                "rbis",
                "stolen_bases",
                "pitcher_strikeouts",
                "walks",
                "hitter_strikeouts",
                "hits_allowed",
                "walks_allowed",
                "earned_runs_allowed",
            ]

            trained_count = 0
            for stat in target_stats:
                try:
                    stat_data = self._prepare_stat_data(training_data, stat)
                    if len(stat_data) > 100:  # Minimum samples for training
                        await self.projection_models.train_models_for_stat(
                            stat_data, stat
                        )
                        trained_count += 1
                        logger.info(f"✅ Trained models for {stat}")
                    else:
                        logger.warning(
                            f"⚠️ Insufficient data for {stat}: {len(stat_data)} samples"
                        )
                except Exception as e:
                    logger.error(f"❌ Failed to train models for {stat}: {e}")

            logger.info(
                f"🎉 Model initialization complete: {trained_count}/{len(target_stats)} statistics trained"
            )

        except Exception as e:
            logger.error(f"❌ Model initialization failed: {e}")
            raise

    async def get_enhanced_player_analysis(
        self,
        player_name: str,
        player_id: Optional[str] = None,
        stat_type: str = "home_runs",
        games_to_project: int = 162,
    ) -> Dict[str, Any]:
        """
        Get comprehensive player analysis combining Statcast projections with betting insights
        """
        logger.info(f"📊 Generating enhanced analysis for {player_name} - {stat_type}")

        try:
            # Check cache first
            cache_key = f"{player_name}_{stat_type}_{games_to_project}"
            cached_result = self._get_cached_projection(cache_key)
            if cached_result:
                logger.info(f"📱 Using cached projection for {player_name}")
                return cached_result

            # Fetch current player data
            player_data = await self._fetch_current_player_data(player_name, player_id)

            if player_data.empty:
                logger.warning(f"No current data found for {player_name}")
                return self._generate_fallback_analysis(player_name, stat_type)

            # Generate Statcast-based projection
            statcast_projection = await self._get_statcast_projection(
                player_data, stat_type, games_to_project
            )

            # Get traditional betting analysis
            betting_analysis = await self._get_betting_analysis(
                player_name, stat_type, player_data
            )

            # Combine analyses
            enhanced_analysis = self._combine_analyses(
                statcast_projection, betting_analysis, player_data
            )

            # Cache the result
            self._cache_projection(cache_key, enhanced_analysis)

            logger.info(f"✅ Enhanced analysis complete for {player_name}")
            return enhanced_analysis

        except Exception as e:
            logger.error(f"❌ Enhanced analysis failed for {player_name}: {e}")
            return self._generate_fallback_analysis(player_name, stat_type)

    async def batch_analyze_players(
        self, player_list: List[Dict[str, str]], games_to_project: int = 162
    ) -> Dict[str, Dict[str, Any]]:
        """
        Batch analysis for multiple players and statistics
        """
        logger.info(f"📋 Batch analyzing {len(player_list)} players")

        results = {}

        # Process players in batches to avoid overwhelming the system
        batch_size = 10
        for i in range(0, len(player_list), batch_size):
            batch = player_list[i : i + batch_size]

            batch_tasks = []
            for player_info in batch:
                player_name = player_info.get("name", "")
                player_id = player_info.get("id")
                stat_type = player_info.get("stat_type", "home_runs")

                task = self.get_enhanced_player_analysis(
                    player_name, player_id, stat_type, games_to_project
                )
                batch_tasks.append((player_name, task))

            # Execute batch
            batch_results = await asyncio.gather(
                *[task for _, task in batch_tasks], return_exceptions=True
            )

            # Process results
            for (player_name, _), result in zip(batch_tasks, batch_results):
                if isinstance(result, Exception):
                    logger.error(f"Batch analysis failed for {player_name}: {result}")
                    results[player_name] = self._generate_fallback_analysis(
                        player_name, "home_runs"
                    )
                else:
                    results[player_name] = result

            # Brief pause between batches
            await asyncio.sleep(0.5)

        logger.info(f"✅ Batch analysis complete: {len(results)} players processed")
        return results

    async def get_projection_confidence_analysis(
        self, player_name: str, stat_type: str
    ) -> Dict[str, Any]:
        """
        Detailed confidence analysis for projections
        """
        logger.info(
            f"🎯 Generating confidence analysis for {player_name} - {stat_type}"
        )

        try:
            # Get current player data
            player_data = await self._fetch_current_player_data(player_name)

            if player_data.empty:
                return {"error": "No player data available"}

            # Get projection with confidence intervals
            projection = await self._get_statcast_projection(player_data, stat_type)

            if not projection:
                return {"error": "Unable to generate projection"}

            # Analyze confidence factors
            confidence_factors = self._analyze_confidence_factors(
                projection, player_data, stat_type
            )

            # Get model consensus
            model_consensus = self._get_model_consensus(projection, stat_type)

            # Historical accuracy
            historical_accuracy = await self._get_historical_accuracy(
                player_name, stat_type
            )

            confidence_analysis = {
                "player_name": player_name,
                "stat_type": stat_type,
                "projection": {
                    "value": projection.projected_value if projection else 0,
                    "confidence_score": (
                        projection.confidence_score if projection else 0
                    ),
                    "confidence_interval": (
                        projection.confidence_interval if projection else (0, 0)
                    ),
                },
                "confidence_factors": confidence_factors,
                "model_consensus": model_consensus,
                "historical_accuracy": historical_accuracy,
                "risk_assessment": self._assess_projection_risk(
                    projection, confidence_factors
                ),
                "recommendations": self._generate_confidence_recommendations(
                    projection, confidence_factors
                ),
            }

            return confidence_analysis

        except Exception as e:
            logger.error(f"❌ Confidence analysis failed for {player_name}: {e}")
            return {"error": str(e)}

    async def compare_projections_vs_betting_lines(
        self, betting_props: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Compare our projections against current betting lines to find value
        """
        logger.info(
            f"💰 Comparing projections vs betting lines for {len(betting_props)} props"
        )

        value_opportunities = []

        for prop in betting_props:
            try:
                player_name = prop.get("player_name", "")
                stat_type = prop.get("stat_type", "")
                betting_line = prop.get("line", 0)
                over_odds = prop.get("over_odds", -110)
                under_odds = prop.get("under_odds", -110)

                # Get our projection
                analysis = await self.get_enhanced_player_analysis(
                    player_name, stat_type=stat_type
                )

                if "statcast_projection" in analysis:
                    projection = analysis["statcast_projection"]
                    projected_value = projection.get("value", 0)
                    confidence = projection.get("confidence", 0)

                    # Calculate edge
                    edge_analysis = self._calculate_betting_edge(
                        projected_value, betting_line, confidence, over_odds, under_odds
                    )

                    if edge_analysis["has_edge"]:
                        value_opportunity = {
                            "player_name": player_name,
                            "stat_type": stat_type,
                            "projection": projected_value,
                            "betting_line": betting_line,
                            "confidence": confidence,
                            "edge_analysis": edge_analysis,
                            "recommendation": edge_analysis["recommendation"],
                            "prop_details": prop,
                        }
                        value_opportunities.append(value_opportunity)

            except Exception as e:
                logger.error(
                    f"❌ Failed to analyze prop for {prop.get('player_name', 'Unknown')}: {e}"
                )

        # Sort by edge strength
        value_opportunities.sort(
            key=lambda x: x["edge_analysis"]["edge_percentage"], reverse=True
        )

        logger.info(f"✅ Found {len(value_opportunities)} value opportunities")
        return value_opportunities

    # Private helper methods
    async def _fetch_current_player_data(
        self, player_name: str, player_id: Optional[str] = None
    ) -> pd.DataFrame:
        """Fetch current season data for a player"""
        try:
            # Try to get recent Statcast data
            end_date = datetime.now()
            start_date = end_date - timedelta(days=60)  # Last 60 days

            player_data = await self.data_pipeline.fetch_player_data(
                player_name, start_date, end_date
            )

            if player_data.empty and player_id:
                # Try with player ID
                player_data = await self.data_pipeline.fetch_player_data_by_id(
                    player_id, start_date, end_date
                )

            return player_data

        except Exception as e:
            logger.error(f"Failed to fetch data for {player_name}: {e}")
            return pd.DataFrame()

    async def _get_statcast_projection(
        self, player_data: pd.DataFrame, stat_type: str, games_to_project: int = 162
    ) -> Optional[ProjectionResult]:
        """Get Statcast-based projection for a player"""
        try:
            projections = await self.projection_models.predict_stat(
                player_data, stat_type, games_to_project
            )

            return projections[0] if projections else None

        except Exception as e:
            logger.error(f"Failed to generate Statcast projection for {stat_type}: {e}")
            return None

    async def _get_betting_analysis(
        self, player_name: str, stat_type: str, player_data: pd.DataFrame
    ) -> Optional[BetAnalysisResponse]:
        """Get traditional betting analysis"""
        try:
            # Create a mock prop for betting analysis
            mock_prop = {
                "player_name": player_name,
                "stat_type": stat_type,
                "line": 2.5,  # Default line
                "over_odds": -110,
                "under_odds": -110,
            }

            # Get betting analysis
            betting_analysis = await self.enhanced_ml_service.analyze_prop(mock_prop)
            return betting_analysis

        except Exception as e:
            logger.error(f"Failed to get betting analysis for {player_name}: {e}")
            return None

    def _combine_analyses(
        self,
        statcast_projection: Optional[ProjectionResult],
        betting_analysis: Optional[BetAnalysisResponse],
        player_data: pd.DataFrame,
    ) -> Dict[str, Any]:
        """Combine Statcast and betting analyses"""
        combined = {
            "timestamp": datetime.now().isoformat(),
            "analysis_type": "enhanced_statcast_betting",
            "data_quality": self._assess_data_quality(player_data),
        }

        # Statcast projection
        if statcast_projection:
            combined["statcast_projection"] = {
                "value": statcast_projection.projected_value,
                "confidence": statcast_projection.confidence_score,
                "confidence_interval": statcast_projection.confidence_interval,
                "contributing_factors": statcast_projection.contributing_factors,
                "model_consensus": statcast_projection.model_consensus,
                "games_projected": statcast_projection.games_projected,
            }

        # Betting analysis
        if betting_analysis:
            combined["betting_analysis"] = {
                "recommendation": betting_analysis.recommendation,
                "confidence": betting_analysis.confidence,
                "reasoning": betting_analysis.reasoning,
                "key_factors": betting_analysis.factors,
            }

        # Combined insights
        combined["combined_insights"] = self._generate_combined_insights(
            statcast_projection, betting_analysis
        )

        return combined

    def _prepare_stat_data(
        self, raw_data: pd.DataFrame, stat_type: str
    ) -> pd.DataFrame:
        """Prepare data for specific statistic training"""
        # Filter data based on stat type (batting vs pitching)
        if stat_type in [
            "pitcher_strikeouts",
            "hits_allowed",
            "walks_allowed",
            "earned_runs_allowed",
        ]:
            # Pitching stats
            stat_data = raw_data[raw_data.get("pitch_type", "").notna()].copy()
        else:
            # Batting stats
            stat_data = raw_data[raw_data.get("events", "").notna()].copy()

        # Add target variable if not present
        if stat_type not in stat_data.columns:
            stat_data[stat_type] = self._generate_target_variable(stat_data, stat_type)

        return stat_data

    def _generate_target_variable(
        self, data: pd.DataFrame, stat_type: str
    ) -> pd.Series:
        """Generate target variable from Statcast data"""
        if stat_type == "home_runs":
            return (data.get("events", "") == "home_run").astype(int)
        elif stat_type == "hits":
            hit_events = ["single", "double", "triple", "home_run"]
            return data.get("events", "").isin(hit_events).astype(int)
        elif stat_type == "stolen_bases":
            return (
                data.get("des", "").str.contains("steals", case=False, na=False)
            ).astype(int)
        else:
            # Default to random values for unsupported stats
            return np.random.poisson(5, len(data))

    def _generate_mock_training_data(self) -> pd.DataFrame:
        """Generate mock training data for testing"""
        logger.info("📝 Generating mock training data")

        np.random.seed(42)
        n_samples = 1000

        mock_data = pd.DataFrame(
            {
                "player_id": np.random.randint(1, 101, n_samples),
                "player_name": [f"Player_{i%100}" for i in range(n_samples)],
                "game_date": pd.date_range("2023-04-01", periods=n_samples, freq="D"),
                "launch_speed": np.random.normal(90, 10, n_samples),
                "launch_angle": np.random.normal(15, 20, n_samples),
                "events": np.random.choice(
                    ["single", "double", "home_run", "out"], n_samples
                ),
                "pitch_type": np.random.choice(["FF", "SL", "CH", "CU"], n_samples),
                "release_speed": np.random.normal(92, 5, n_samples),
                "spin_rate": np.random.normal(2200, 300, n_samples),
                "home_runs": np.random.poisson(2, n_samples),
                "hits": np.random.poisson(3, n_samples),
                "pitcher_strikeouts": np.random.poisson(8, n_samples),
            }
        )

        return mock_data

    def _get_cached_projection(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Get cached projection if still valid"""
        if cache_key in self.projection_cache:
            cached_data = self.projection_cache[cache_key]
            if datetime.now() - cached_data["timestamp"] < self.cache_ttl:
                return cached_data["data"]
            else:
                # Remove expired cache
                del self.projection_cache[cache_key]

        return None

    def _cache_projection(self, cache_key: str, data: Dict[str, Any]) -> None:
        """Cache projection result"""
        self.projection_cache[cache_key] = {"data": data, "timestamp": datetime.now()}

        # Clean old cache entries
        if len(self.projection_cache) > 100:
            oldest_key = min(
                self.projection_cache.keys(),
                key=lambda k: self.projection_cache[k]["timestamp"],
            )
            del self.projection_cache[oldest_key]

    def _generate_fallback_analysis(
        self, player_name: str, stat_type: str
    ) -> Dict[str, Any]:
        """Generate fallback analysis when data is unavailable"""
        return {
            "player_name": player_name,
            "stat_type": stat_type,
            "analysis_type": "fallback",
            "error": "Insufficient data for analysis",
            "fallback_projection": {
                "value": 0,
                "confidence": 0.1,
                "note": "No recent data available",
            },
            "timestamp": datetime.now().isoformat(),
        }

    def _assess_data_quality(self, data: pd.DataFrame) -> Dict[str, Any]:
        """Assess quality of input data"""
        if data.empty:
            return {"quality_score": 0, "issues": ["No data available"]}

        quality_score = 1.0
        issues = []

        # Check sample size
        if len(data) < 20:
            quality_score *= 0.7
            issues.append("Limited sample size")

        # Check missing values
        missing_pct = data.isnull().sum().sum() / (len(data) * len(data.columns))
        if missing_pct > 0.3:
            quality_score *= 0.8
            issues.append("High missing value rate")

        # Check recency
        if "game_date" in data.columns:
            latest_date = pd.to_datetime(data["game_date"]).max()
            days_old = (datetime.now() - latest_date).days
            if days_old > 30:
                quality_score *= 0.9
                issues.append("Data not recent")

        return {
            "quality_score": max(0.1, quality_score),
            "sample_size": len(data),
            "missing_value_rate": missing_pct,
            "issues": issues,
        }

    def _analyze_confidence_factors(
        self, projection: ProjectionResult, player_data: pd.DataFrame, stat_type: str
    ) -> Dict[str, Any]:
        """Analyze factors affecting projection confidence"""
        return {
            "sample_size_factor": min(1.0, len(player_data) / 50),
            "consistency_factor": 0.8,  # Placeholder
            "recent_performance_factor": 0.7,  # Placeholder
            "injury_risk_factor": 0.9,  # Placeholder
            "matchup_factor": 0.8,  # Placeholder
        }

    def _get_model_consensus(
        self, projection: ProjectionResult, stat_type: str
    ) -> Dict[str, Any]:
        """Get consensus metrics from multiple models"""
        if not projection or not projection.model_consensus:
            return {"consensus_strength": 0, "model_agreement": 0}

        predictions = list(projection.model_consensus.values())
        if len(predictions) < 2:
            return {"consensus_strength": 0.5, "model_agreement": 0.5}

        # Calculate agreement (inverse of standard deviation)
        std_dev = np.std(predictions)
        mean_pred = np.mean(predictions)

        agreement = 1.0 / (1.0 + std_dev / (mean_pred + 0.01))

        return {
            "consensus_strength": agreement,
            "model_agreement": agreement,
            "prediction_range": (min(predictions), max(predictions)),
            "model_count": len(predictions),
        }

    async def _get_historical_accuracy(
        self, player_name: str, stat_type: str
    ) -> Dict[str, Any]:
        """Get historical accuracy for this player/stat combination"""
        # Placeholder for historical accuracy tracking
        return {
            "accuracy_score": 0.75,
            "sample_size": 10,
            "avg_error": 1.2,
            "note": "Historical tracking not yet implemented",
        }

    def _assess_projection_risk(
        self, projection: Optional[ProjectionResult], confidence_factors: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Assess risk level of the projection"""
        if not projection:
            return {"risk_level": "high", "risk_score": 0.8}

        risk_score = 1.0 - projection.confidence_score

        # Adjust based on confidence factors
        for factor_value in confidence_factors.values():
            if isinstance(factor_value, (int, float)):
                risk_score *= 2.0 - factor_value  # Higher factor = lower risk

        risk_score = min(1.0, max(0.0, risk_score))

        if risk_score < 0.3:
            risk_level = "low"
        elif risk_score < 0.6:
            risk_level = "medium"
        else:
            risk_level = "high"

        return {
            "risk_level": risk_level,
            "risk_score": risk_score,
            "primary_risks": self._identify_primary_risks(confidence_factors),
        }

    def _identify_primary_risks(self, confidence_factors: Dict[str, Any]) -> List[str]:
        """Identify primary risk factors"""
        risks = []

        if confidence_factors.get("sample_size_factor", 1) < 0.5:
            risks.append("Limited sample size")

        if confidence_factors.get("consistency_factor", 1) < 0.6:
            risks.append("Inconsistent performance")

        if confidence_factors.get("injury_risk_factor", 1) < 0.8:
            risks.append("Injury risk")

        return risks

    def _generate_confidence_recommendations(
        self, projection: Optional[ProjectionResult], confidence_factors: Dict[str, Any]
    ) -> List[str]:
        """Generate recommendations based on confidence analysis"""
        recommendations = []

        if not projection:
            recommendations.append("Wait for more data before making decisions")
            return recommendations

        if projection.confidence_score > 0.8:
            recommendations.append(
                "High confidence projection - suitable for significant positions"
            )
        elif projection.confidence_score > 0.6:
            recommendations.append(
                "Moderate confidence - consider smaller position sizing"
            )
        else:
            recommendations.append("Low confidence - proceed with caution or avoid")

        if confidence_factors.get("sample_size_factor", 1) < 0.5:
            recommendations.append("Monitor for additional data points")

        return recommendations

    def _generate_combined_insights(
        self,
        statcast_projection: Optional[ProjectionResult],
        betting_analysis: Optional[BetAnalysisResponse],
    ) -> Dict[str, Any]:
        """Generate insights from combined analysis"""
        insights = {
            "agreement_score": 0.5,
            "conflicting_signals": [],
            "supporting_factors": [],
            "overall_recommendation": "neutral",
        }

        if statcast_projection and betting_analysis:
            # Compare confidence scores
            stat_confidence = statcast_projection.confidence_score
            bet_confidence = betting_analysis.confidence

            confidence_diff = abs(stat_confidence - bet_confidence)
            insights["agreement_score"] = 1.0 - confidence_diff

            if confidence_diff > 0.3:
                insights["conflicting_signals"].append(
                    "Confidence levels diverge significantly"
                )
            else:
                insights["supporting_factors"].append(
                    "Both analyses show similar confidence"
                )

        return insights

    def _calculate_betting_edge(
        self,
        projected_value: float,
        betting_line: float,
        confidence: float,
        over_odds: int,
        under_odds: int,
    ) -> Dict[str, Any]:
        """Calculate betting edge based on projection vs line"""
        # Convert odds to implied probability
        over_prob = self._odds_to_probability(over_odds)
        under_prob = self._odds_to_probability(under_odds)

        # Calculate our edge
        if projected_value > betting_line:
            # We favor the over
            edge = confidence * (projected_value - betting_line) / betting_line
            recommendation = "over" if edge > 0.05 else "no_bet"
            recommended_odds = over_odds
        else:
            # We favor the under
            edge = confidence * (betting_line - projected_value) / betting_line
            recommendation = "under" if edge > 0.05 else "no_bet"
            recommended_odds = under_odds

        return {
            "has_edge": edge > 0.05,
            "edge_percentage": edge * 100,
            "recommendation": recommendation,
            "recommended_odds": recommended_odds,
            "projection_vs_line": projected_value - betting_line,
            "confidence_adjusted_edge": edge * confidence,
        }

    def _odds_to_probability(self, odds: int) -> float:
        """Convert American odds to implied probability"""
        if odds > 0:
            return 100 / (odds + 100)
        else:
            return -odds / (-odds + 100)


# Example usage
if __name__ == "__main__":
    # Example integration usage
    integration = StatcastMLIntegration()

    # Initialize models (in production, this would use real data)
    asyncio.run(integration.initialize_models())

    # Example player analysis
    analysis = asyncio.run(
        integration.get_enhanced_player_analysis("Aaron Judge", stat_type="home_runs")
    )

    print(f"Enhanced analysis: {json.dumps(analysis, indent=2, default=str)}")
