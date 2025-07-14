#!/usr/bin/env python3
"""Complete Integration Validation Script
Validates that all enhanced mathematical services are properly integrated
"""

import asyncio
import json
import logging
import sys
import time
import traceback
from datetime import datetime
from typing import Any, Dict, List

import numpy as np

# Import all enhanced services for validation
try:
    from enhanced_data_pipeline import enhanced_data_pipeline
    from enhanced_feature_engineering import enhanced_feature_engineering
    from enhanced_model_service import EnhancedMathematicalModelService
    from enhanced_prediction_engine import enhanced_prediction_engine
    from enhanced_revolutionary_engine import enhanced_revolutionary_engine
    from enhanced_risk_management import enhanced_risk_management
except ImportError as e:
    print(f"❌ Import Error: {e}")
    print("Make sure all enhanced modules are properly installed")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class IntegrationValidator:
    """Comprehensive integration validation"""

    def __init__(self):
        self.test_results = {}
        self.test_data = self._generate_test_data()

    def _generate_test_data(self) -> Dict[str, Any]:
        """Generate comprehensive test data"""
        return {
            "features": {
                "player_performance": 78.5,
                "team_strength": 82.1,
                "matchup_difficulty": 68.3,
                "historical_performance": 77.8,
                "injury_impact": 15.2,
                "weather_effect": 5.0,
                "venue_advantage": 12.5,
                "rest_factor": 85.0,
                "momentum": 71.2,
                "public_sentiment": 63.7,
            },
            "historical_data": {
                "performance_history": [75.0, 78.5, 82.1, 79.3, 80.8],
                "team_history": [80.0, 85.2, 83.7, 84.1, 82.9],
                "matchup_history": [70.0, 68.3, 72.1, 69.8, 71.5],
            },
            "market_data": {
                "returns": [0.01, -0.02, 0.015, -0.008, 0.012, 0.003, -0.01],
                "volatility": [0.15, 0.18, 0.12, 0.20, 0.16, 0.14, 0.17],
            },
            "portfolio": {
                "position_1": 0.4,
                "position_2": 0.35,
                "position_3": 0.25,
            },
        }

    async def validate_enhanced_revolutionary_engine(self) -> Dict[str, Any]:
        """Validate Enhanced Revolutionary Engine"""
        logger.info("🚀 Validating Enhanced Revolutionary Engine...")

        try:
            start_time = time.time()

            # Test enhanced prediction
            prediction = enhanced_revolutionary_engine.generate_enhanced_prediction(
                self.test_data["features"]
            )

            processing_time = time.time() - start_time

            # Validate prediction structure
            required_fields = [
                "base_prediction",
                "neuromorphic_enhancement",
                "mamba_temporal_refinement",
                "causal_adjustment",
                "topological_smoothing",
                "geometric_manifold_projection",
                "final_prediction",
                "convergence_rate",
                "stability_margin",
            ]

            validation_results = {}
            for field in required_fields:
                if hasattr(prediction, field):
                    value = getattr(prediction, field)
                    validation_results[field] = {
                        "present": True,
                        "type": type(value).__name__,
                        "value": (
                            float(value)
                            if isinstance(value, (int, float))
                            else str(value)
                        ),
                        "valid": not (
                            np.isnan(value)
                            if isinstance(value, (int, float))
                            else False
                        ),
                    }
                else:
                    validation_results[field] = {"present": False, "valid": False}

            # Mathematical validation
            mathematical_checks = {
                "prediction_finite": np.isfinite(prediction.final_prediction),
                "convergence_valid": 0 <= prediction.convergence_rate <= 1,
                "stability_positive": prediction.stability_margin >= 0,
                "enhancement_reasonable": abs(prediction.neuromorphic_enhancement)
                < 100,
                "processing_time_reasonable": processing_time < 30.0,
            }

            success = all(
                validation_results[field]["valid"]
                for field in required_fields
                if validation_results[field]["present"]
            )
            success = success and all(mathematical_checks.values())

            return {
                "status": "success" if success else "partial",
                "processing_time": processing_time,
                "prediction_value": prediction.final_prediction,
                "convergence_rate": prediction.convergence_rate,
                "validation_results": validation_results,
                "mathematical_checks": mathematical_checks,
                "components_active": {
                    "neuromorphic": abs(prediction.neuromorphic_enhancement) > 0.001,
                    "mamba": abs(prediction.mamba_temporal_refinement) > 0.001,
                    "causal": abs(prediction.causal_adjustment) > 0.001,
                    "topological": abs(prediction.topological_smoothing) > 0.001,
                    "riemannian": abs(prediction.geometric_manifold_projection) > 0.001,
                },
            }

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Enhanced Revolutionary Engine validation failed: {e}")
            return {
                "status": "failed",
                "error": str(e),
                "traceback": traceback.format_exc(),
            }

    async def validate_enhanced_prediction_engine(self) -> Dict[str, Any]:
        """Validate Enhanced Prediction Engine"""
        logger.info("🧠 Validating Enhanced Prediction Engine...")

        try:
            start_time = time.time()

            # Test Bayesian prediction
            bayesian_result = enhanced_prediction_engine.generate_bayesian_prediction(
                self.test_data["features"]
            )

            # Test Gaussian Process
            gp_result = enhanced_prediction_engine.generate_gaussian_process_prediction(
                self.test_data["features"]
            )

            # Test Information Theoretic
            info_result = (
                enhanced_prediction_engine.generate_information_theoretic_prediction(
                    self.test_data["features"]
                )
            )

            processing_time = time.time() - start_time

            # Validate results
            validations = {
                "bayesian": {
                    "prediction_valid": np.isfinite(bayesian_result.prediction),
                    "uncertainty_valid": np.isfinite(
                        bayesian_result.epistemic_uncertainty
                    ),
                    "confidence_valid": 0 <= bayesian_result.confidence <= 1,
                },
                "gaussian_process": {
                    "prediction_valid": np.isfinite(gp_result.prediction),
                    "variance_positive": gp_result.prediction_variance >= 0,
                    "uncertainty_valid": np.isfinite(gp_result.epistemic_uncertainty),
                },
                "information_theoretic": {
                    "prediction_valid": np.isfinite(info_result.prediction),
                    "entropy_positive": info_result.entropy >= 0,
                    "mutual_info_valid": np.isfinite(info_result.mutual_information),
                },
            }

            success = all(all(checks.values()) for checks in validations.values())

            return {
                "status": "success" if success else "partial",
                "processing_time": processing_time,
                "predictions": {
                    "bayesian": bayesian_result.prediction,
                    "gaussian_process": gp_result.prediction,
                    "information_theoretic": info_result.prediction,
                },
                "validations": validations,
                "mathematical_properties": {
                    "bayesian_uncertainty": bayesian_result.epistemic_uncertainty,
                    "gp_variance": gp_result.prediction_variance,
                    "information_entropy": info_result.entropy,
                },
            }

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Enhanced Prediction Engine validation failed: {e}")
            return {
                "status": "failed",
                "error": str(e),
                "traceback": traceback.format_exc(),
            }

    async def validate_enhanced_feature_engineering(self) -> Dict[str, Any]:
        """Validate Enhanced Feature Engineering"""
        logger.info("🔧 Validating Enhanced Feature Engineering...")

        try:
            start_time = time.time()

            # Test wavelet transforms
            wavelet_features = enhanced_feature_engineering.engineer_wavelet_features(
                self.test_data["historical_data"]
            )

            # Test manifold learning
            manifold_features = enhanced_feature_engineering.engineer_manifold_features(
                self.test_data["historical_data"], target_dim=5
            )

            # Test information theory features
            info_features = (
                enhanced_feature_engineering.engineer_information_theory_features(
                    self.test_data["historical_data"]
                )
            )

            processing_time = time.time() - start_time

            # Validate feature engineering results
            validations = {
                "wavelet_features": {
                    "features_generated": len(wavelet_features.get("features", [])) > 0,
                    "coefficients_valid": all(
                        np.isfinite(c) for c in wavelet_features.get("coefficients", [])
                    ),
                    "scales_positive": all(
                        s > 0 for s in wavelet_features.get("scales", [1])
                    ),
                },
                "manifold_features": {
                    "dimensionality_reduced": manifold_features.get(
                        "reduced_dimension", 0
                    )
                    <= manifold_features.get("original_dimension", float("inf")),
                    "embedding_valid": len(manifold_features.get("embedding", [])) > 0,
                    "variance_explained": 0
                    <= manifold_features.get("explained_variance", 0)
                    <= 1,
                },
                "info_features": {
                    "mutual_info_computed": "mutual_information" in info_features,
                    "entropy_positive": info_features.get("entropy", -1) >= 0,
                    "transfer_entropy_valid": "transfer_entropy" in info_features,
                },
            }

            success = all(all(checks.values()) for checks in validations.values())

            return {
                "status": "success" if success else "partial",
                "processing_time": processing_time,
                "feature_counts": {
                    "wavelet": len(wavelet_features.get("features", [])),
                    "manifold": len(manifold_features.get("embedding", [])),
                    "information_theory": len(info_features.get("features", [])),
                },
                "validations": validations,
                "feature_quality": {
                    "wavelet_energy": sum(wavelet_features.get("energy", [0])),
                    "manifold_variance_explained": manifold_features.get(
                        "explained_variance", 0
                    ),
                    "information_entropy": info_features.get("entropy", 0),
                },
            }

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Enhanced Feature Engineering validation failed: {e}")
            return {
                "status": "failed",
                "error": str(e),
                "traceback": traceback.format_exc(),
            }

    async def validate_enhanced_risk_management(self) -> Dict[str, Any]:
        """Validate Enhanced Risk Management"""
        logger.info("📊 Validating Enhanced Risk Management...")

        try:
            start_time = time.time()

            # Test extreme value analysis
            extreme_value_result = (
                enhanced_risk_management.calculate_extreme_value_risk(
                    self.test_data["portfolio"], self.test_data["market_data"]
                )
            )

            # Test copula modeling
            copula_result = enhanced_risk_management.model_copula_dependencies(
                self.test_data["market_data"]
            )

            # Test stochastic process modeling
            stochastic_result = enhanced_risk_management.model_stochastic_processes(
                self.test_data["market_data"]["returns"]
            )

            processing_time = time.time() - start_time

            # Validate risk management results
            validations = {
                "extreme_value": {
                    "var_computed": "value_at_risk" in extreme_value_result,
                    "var_reasonable": 0
                    <= extreme_value_result.get("value_at_risk", -1)
                    <= 1,
                    "expected_shortfall_computed": "expected_shortfall"
                    in extreme_value_result,
                    "tail_index_valid": extreme_value_result.get("tail_index", 0) > 0,
                },
                "copula": {
                    "dependence_structure_identified": "copula_type" in copula_result,
                    "parameters_estimated": "parameters" in copula_result,
                    "goodness_of_fit_computed": "goodness_of_fit" in copula_result,
                },
                "stochastic_processes": {
                    "drift_estimated": "drift" in stochastic_result,
                    "volatility_estimated": "volatility" in stochastic_result,
                    "mean_reversion_tested": "mean_reversion_speed"
                    in stochastic_result,
                },
            }

            success = all(all(checks.values()) for checks in validations.values())

            return {
                "status": "success" if success else "partial",
                "processing_time": processing_time,
                "risk_metrics": {
                    "value_at_risk": extreme_value_result.get("value_at_risk", 0),
                    "expected_shortfall": extreme_value_result.get(
                        "expected_shortfall", 0
                    ),
                    "tail_index": extreme_value_result.get("tail_index", 0),
                },
                "validations": validations,
                "model_quality": {
                    "extreme_value_confidence": extreme_value_result.get(
                        "confidence", 0
                    ),
                    "copula_goodness_of_fit": copula_result.get("goodness_of_fit", 0),
                    "stochastic_likelihood": stochastic_result.get("log_likelihood", 0),
                },
            }

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Enhanced Risk Management validation failed: {e}")
            return {
                "status": "failed",
                "error": str(e),
                "traceback": traceback.format_exc(),
            }

    async def validate_enhanced_data_pipeline(self) -> Dict[str, Any]:
        """Validate Enhanced Data Pipeline"""
        logger.info("🔄 Validating Enhanced Data Pipeline...")

        try:
            start_time = time.time()

            # Create test data matrix
            test_matrix = np.array(
                [
                    list(self.test_data["features"].values()),
                    [
                        v + np.random.normal(0, 0.1)
                        for v in self.test_data["features"].values()
                    ],
                    [
                        v + np.random.normal(0, 0.15)
                        for v in self.test_data["features"].values()
                    ],
                ]
            )

            # Test anomaly detection
            anomaly_result = enhanced_data_pipeline.detect_anomalies_multivariate(
                test_matrix
            )

            # Test signal processing
            signal_data = np.array(
                self.test_data["historical_data"]["performance_history"]
            )
            signal_result = enhanced_data_pipeline.advanced_signal_processing(
                signal_data
            )

            # Test missing data imputation
            incomplete_data = test_matrix.copy()
            incomplete_data[0, 1] = np.nan
            incomplete_data[1, 3] = np.nan
            imputation_result = enhanced_data_pipeline.impute_missing_data_advanced(
                incomplete_data
            )

            processing_time = time.time() - start_time

            # Validate data pipeline results
            validations = {
                "anomaly_detection": {
                    "anomalies_detected": "anomalies" in anomaly_result,
                    "scores_computed": "anomaly_scores" in anomaly_result,
                    "threshold_set": "threshold" in anomaly_result,
                },
                "signal_processing": {
                    "components_extracted": "components" in signal_result,
                    "frequencies_analyzed": "frequencies" in signal_result,
                    "trend_decomposed": "trend" in signal_result,
                },
                "missing_data_imputation": {
                    "data_imputed": not np.isnan(
                        imputation_result.get("imputed_data", np.array([np.nan]))
                    ).any(),
                    "uncertainty_quantified": "imputation_uncertainty"
                    in imputation_result,
                    "method_documented": "imputation_method" in imputation_result,
                },
            }

            success = all(all(checks.values()) for checks in validations.values())

            return {
                "status": "success" if success else "partial",
                "processing_time": processing_time,
                "pipeline_results": {
                    "anomalies_detected": len(anomaly_result.get("anomalies", [])),
                    "signal_components": len(signal_result.get("components", [])),
                    "missing_values_imputed": np.isnan(test_matrix).sum()
                    - np.isnan(
                        imputation_result.get("imputed_data", test_matrix)
                    ).sum(),
                },
                "validations": validations,
                "data_quality": {
                    "anomaly_threshold": anomaly_result.get("threshold", 0),
                    "signal_noise_ratio": signal_result.get("snr", 0),
                    "imputation_confidence": imputation_result.get("confidence", 0),
                },
            }

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Enhanced Data Pipeline validation failed: {e}")
            return {
                "status": "failed",
                "error": str(e),
                "traceback": traceback.format_exc(),
            }

    async def validate_enhanced_model_service(self) -> Dict[str, Any]:
        """Validate Enhanced Model Service"""
        logger.info("🎯 Validating Enhanced Model Service...")

        try:
            start_time = time.time()

            # Initialize model service
            model_service = EnhancedMathematicalModelService()

            # Test unified prediction
            unified_result = await model_service.generate_unified_prediction(
                event_id="test_integration",
                sport="basketball",
                features=self.test_data["features"],
                include_all_enhancements=True,
            )

            # Test model status
            status_result = await model_service.get_comprehensive_model_status()

            # Test performance metrics
            performance_result = await model_service.get_performance_metrics(
                start_time=datetime.now(), metric_type="all"
            )

            processing_time = time.time() - start_time

            # Validate model service results
            validations = {
                "unified_prediction": {
                    "prediction_generated": "predictions" in unified_result,
                    "confidence_computed": "unified_confidence" in unified_result,
                    "components_included": "enhanced_revolutionary" in unified_result,
                    "analysis_performed": "mathematical_analysis" in unified_result,
                },
                "model_status": {
                    "models_tracked": "models" in status_result,
                    "health_monitored": "system_health" in status_result,
                    "foundations_documented": "mathematical_foundations"
                    in status_result,
                },
                "performance_metrics": {
                    "metrics_collected": len(performance_result) > 0,
                    "accuracy_tracked": "avg_accuracy" in performance_result,
                    "response_time_monitored": "avg_response_time"
                    in performance_result,
                },
            }

            success = all(all(checks.values()) for checks in validations.values())

            return {
                "status": "success" if success else "partial",
                "processing_time": processing_time,
                "service_results": {
                    "unified_confidence": unified_result.get("unified_confidence", 0),
                    "models_active": len(status_result.get("models", {})),
                    "system_health": status_result.get("system_health", {}).get(
                        "status", "unknown"
                    ),
                },
                "validations": validations,
                "service_quality": {
                    "prediction_quality": unified_result.get(
                        "processing_summary", {}
                    ).get("rigor_score", 0),
                    "system_performance": performance_result.get("avg_accuracy", 0),
                    "service_reliability": status_result.get("system_health", {}).get(
                        "error_rate", 1.0
                    ),
                },
            }

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Enhanced Model Service validation failed: {e}")
            return {
                "status": "failed",
                "error": str(e),
                "traceback": traceback.format_exc(),
            }

    async def run_complete_validation(self) -> Dict[str, Any]:
        """Run complete integration validation"""
        logger.info("🚀 Starting Complete Integration Validation...")

        overall_start_time = time.time()

        # Run all validations
        validation_tasks = [
            (
                "enhanced_revolutionary_engine",
                self.validate_enhanced_revolutionary_engine(),
            ),
            ("enhanced_prediction_engine", self.validate_enhanced_prediction_engine()),
            (
                "enhanced_feature_engineering",
                self.validate_enhanced_feature_engineering(),
            ),
            ("enhanced_risk_management", self.validate_enhanced_risk_management()),
            ("enhanced_data_pipeline", self.validate_enhanced_data_pipeline()),
            ("enhanced_model_service", self.validate_enhanced_model_service()),
        ]

        results = {}
        for name, task in validation_tasks:
            try:
                logger.info("Running validation: {name}")
                results[name] = await task
                status = results[name]["status"]
                logger.info("✅ {name}: {status}")
            except Exception as e:  # pylint: disable=broad-exception-caught
                logger.error("❌ {name}: failed with {e}")
                results[name] = {"status": "failed", "error": str(e)}

        overall_processing_time = time.time() - overall_start_time

        # Calculate overall success metrics
        successful_services = len(
            [r for r in results.values() if r["status"] == "success"]
        )
        total_services = len(results)
        success_rate = successful_services / total_services if total_services > 0 else 0

        # Generate integration report
        integration_report = {
            "validation_timestamp": datetime.now().isoformat(),
            "overall_success_rate": success_rate,
            "successful_services": successful_services,
            "total_services": total_services,
            "overall_processing_time": overall_processing_time,
            "service_results": results,
            "integration_quality": {
                "mathematical_rigor": self._calculate_mathematical_rigor(results),
                "performance_quality": self._calculate_performance_quality(results),
                "system_reliability": self._calculate_system_reliability(results),
                "feature_completeness": self._calculate_feature_completeness(results),
            },
            "recommendations": self._generate_recommendations(results),
        }

        return integration_report

    def _calculate_mathematical_rigor(self, results: Dict[str, Any]) -> float:
        """Calculate overall mathematical rigor score"""
        rigor_scores = []

        # Revolutionary engine rigor
        if (
            "enhanced_revolutionary_engine" in results
            and results["enhanced_revolutionary_engine"]["status"] == "success"
        ):
            rev_result = results["enhanced_revolutionary_engine"]
            components_active = sum(rev_result.get("components_active", {}).values())
            rigor_scores.append(min(components_active / 5.0, 1.0))

        # Prediction engine rigor
        if (
            "enhanced_prediction_engine" in results
            and results["enhanced_prediction_engine"]["status"] == "success"
        ):
            pred_result = results["enhanced_prediction_engine"]
            valid_predictions = sum(
                1 for p in pred_result.get("predictions", {}).values() if np.isfinite(p)
            )
            rigor_scores.append(min(valid_predictions / 3.0, 1.0))

        # Feature engineering rigor
        if (
            "enhanced_feature_engineering" in results
            and results["enhanced_feature_engineering"]["status"] == "success"
        ):
            feat_result = results["enhanced_feature_engineering"]
            feature_quality = feat_result.get("feature_quality", {})
            rigor_scores.append(min(len(feature_quality) / 3.0, 1.0))

        return sum(rigor_scores) / len(rigor_scores) if rigor_scores else 0.0

    def _calculate_performance_quality(self, results: Dict[str, Any]) -> float:
        """Calculate overall performance quality score"""
        performance_scores = []

        for service_name, result in results.items():
            if result["status"] == "success":
                processing_time = result.get("processing_time", float("inf"))
                # Score based on reasonable processing time (< 10 seconds is excellent)
                time_score = max(0, 1.0 - (processing_time / 10.0))
                performance_scores.append(time_score)

        return (
            sum(performance_scores) / len(performance_scores)
            if performance_scores
            else 0.0
        )

    def _calculate_system_reliability(self, results: Dict[str, Any]) -> float:
        """Calculate overall system reliability score"""
        successful_services = len(
            [r for r in results.values() if r["status"] == "success"]
        )
        total_services = len(results)
        return successful_services / total_services if total_services > 0 else 0.0

    def _calculate_feature_completeness(self, results: Dict[str, Any]) -> float:
        """Calculate feature completeness score"""
        expected_features = {
            "enhanced_revolutionary_engine": [
                "neuromorphic",
                "mamba",
                "causal",
                "topological",
                "riemannian",
            ],
            "enhanced_prediction_engine": [
                "bayesian",
                "gaussian_process",
                "information_theoretic",
            ],
            "enhanced_feature_engineering": [
                "wavelet",
                "manifold",
                "information_theory",
            ],
            "enhanced_risk_management": [
                "extreme_value",
                "copula",
                "stochastic_processes",
            ],
            "enhanced_data_pipeline": [
                "anomaly_detection",
                "signal_processing",
                "missing_data_imputation",
            ],
            "enhanced_model_service": [
                "unified_prediction",
                "model_status",
                "performance_metrics",
            ],
        }

        completeness_scores = []

        for service_name, expected_components in expected_features.items():
            if service_name in results and results[service_name]["status"] == "success":
                result = results[service_name]

                if service_name == "enhanced_revolutionary_engine":
                    active_components = sum(
                        result.get("components_active", {}).values()
                    )
                    completeness_scores.append(
                        active_components / len(expected_components)
                    )

                elif service_name == "enhanced_prediction_engine":
                    valid_predictions = len(
                        [
                            p
                            for p in result.get("predictions", {}).values()
                            if np.isfinite(p)
                        ]
                    )
                    completeness_scores.append(
                        valid_predictions / len(expected_components)
                    )

                else:
                    # For other services, check if all expected validations passed
                    validations = result.get("validations", {})
                    passed_validations = sum(
                        1
                        for component in expected_components
                        if component in validations
                        and all(validations[component].values())
                    )
                    completeness_scores.append(
                        passed_validations / len(expected_components)
                    )

        return (
            sum(completeness_scores) / len(completeness_scores)
            if completeness_scores
            else 0.0
        )

    def _generate_recommendations(self, results: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on validation results"""
        recommendations = []

        failed_services = [
            name for name, result in results.items() if result["status"] == "failed"
        ]
        if failed_services:
            recommendations.append(
                f"❌ Fix failed services: {', '.join(failed_services)}"
            )

        partial_services = [
            name for name, result in results.items() if result["status"] == "partial"
        ]
        if partial_services:
            recommendations.append(
                f"⚠️ Improve partial services: {', '.join(partial_services)}"
            )

        # Performance recommendations
        slow_services = [
            name
            for name, result in results.items()
            if result.get("processing_time", 0) > 5.0
        ]
        if slow_services:
            recommendations.append(
                f"🐌 Optimize performance for: {', '.join(slow_services)}"
            )

        # Mathematical rigor recommendations
        mathematical_rigor = self._calculate_mathematical_rigor(results)
        if mathematical_rigor < 0.8:
            recommendations.append(
                "📊 Improve mathematical rigor by enabling more advanced components"
            )

        # Feature completeness recommendations
        feature_completeness = self._calculate_feature_completeness(results)
        if feature_completeness < 0.9:
            recommendations.append("🔧 Complete missing feature implementations")

        if not recommendations:
            recommendations.append("✅ All systems operating at optimal performance!")

        return recommendations


async def main():
    """Main validation function"""
    print("🚀 A1Betting Complete Integration Validation")
    print("=" * 60)

    validator = IntegrationValidator()

    try:
        # Run complete validation
        report = await validator.run_complete_validation()

        # Print results
        print("\n📊 VALIDATION RESULTS")
        print("=" * 60)
        print(f"Overall Success Rate: {report['overall_success_rate']*100:.1f}%")
        print(
            f"Successful Services: {report['successful_services']}/{report['total_services']}"
        )
        print(f"Total Processing Time: {report['overall_processing_time']:.2f}s")

        print("\n🎯 INTEGRATION QUALITY METRICS")
        print("=" * 40)
        quality = report["integration_quality"]
        print(f"Mathematical Rigor: {quality['mathematical_rigor']*100:.1f}%")
        print(f"Performance Quality: {quality['performance_quality']*100:.1f}%")
        print(f"System Reliability: {quality['system_reliability']*100:.1f}%")
        print(f"Feature Completeness: {quality['feature_completeness']*100:.1f}%")

        print("\n📋 RECOMMENDATIONS")
        print("=" * 30)
        for rec in report["recommendations"]:
            print(f"  {rec}")

        print("\n📄 DETAILED SERVICE RESULTS")
        print("=" * 40)
        for service_name, result in report["service_results"].items():
            status_emoji = (
                "✅"
                if result["status"] == "success"
                else "⚠️" if result["status"] == "partial" else "❌"
            )
            print(f"{status_emoji} {service_name}: {result['status']}")
            if result["status"] != "failed":
                processing_time = result.get("processing_time", 0)
                print(f"    Processing Time: {processing_time:.2f}s")

        # Save report to file
        report_filename = f"integration_validation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_filename, "w") as f:
            json.dump(report, f, indent=2, default=str)

        print(f"\n💾 Full report saved to: {report_filename}")

        # Return appropriate exit code
        if report["overall_success_rate"] >= 0.8:
            print("\n🎉 Integration validation PASSED!")
            return 0
        else:
            print("\n💥 Integration validation FAILED!")
            return 1

    except Exception as e:  # pylint: disable=broad-exception-caught
        print(f"\n💥 Validation failed with error: {e}")
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
