"""
Enterprise Data Validation Orchestrator

Modern async data validation system for cross-checking multiple sports data sources
using industry best practices including Pandera schemas, consensus algorithms,
and real-time anomaly detection.

Features:
- Multi-source data cross-validation
- Schema-based validation using Pandera
- Statistical anomaly detection
- Consensus algorithms for conflicting data
- Real-time data quality metrics
- Automated alerting and fallback mechanisms
"""

import asyncio
import logging
import statistics
import time
import weakref
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, AsyncGenerator, Dict, List, Optional, Tuple, Union

# Modern validation frameworks
try:
    import pandera as pa
    from pandera import Check, Column, DataFrameSchema

    PANDERA_AVAILABLE = True
except ImportError:
    PANDERA_AVAILABLE = False

    # Fallback classes for when Pandera is not available
    class DataFrameSchema:
        pass

    class Column:
        pass

    class Check:
        pass


try:
    import pandas as pd

    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False

import hashlib
import json
from collections import Counter, defaultdict

# Core imports
import aiohttp

logger = logging.getLogger("data_validation")


class ValidationStatus(Enum):
    """Data validation status enumeration"""

    VALID = "valid"
    INVALID = "invalid"
    SUSPICIOUS = "suspicious"
    MISSING = "missing"
    CONFLICTED = "conflicted"


class DataSource(Enum):
    """Supported data sources enumeration"""

    MLB_STATS_API = "mlb_stats_api"
    BASEBALL_SAVANT = "baseball_savant"
    STATSAPI = "statsapi"
    EXTERNAL_API = "external_api"


@dataclass
class ValidationResult:
    """Data validation result with detailed metrics"""

    status: ValidationStatus
    source: DataSource
    data: Any
    confidence_score: float
    validation_time: float
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            "status": self.status.value,
            "source": self.source.value,
            "confidence_score": self.confidence_score,
            "validation_time": self.validation_time,
            "errors": self.errors,
            "warnings": self.warnings,
            "metadata": self.metadata,
            "data_available": self.data is not None,
        }


@dataclass
class CrossValidationReport:
    """Comprehensive cross-validation report"""

    primary_source: DataSource
    comparison_sources: List[DataSource]
    validation_results: List[ValidationResult]
    consensus_data: Any
    confidence_score: float
    conflicts: List[Dict[str, Any]] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)
    generated_at: datetime = field(default_factory=datetime.now)

    def get_quality_score(self) -> float:
        """Calculate overall data quality score (0-1)"""
        if not self.validation_results:
            return 0.0

        valid_results = [
            r for r in self.validation_results if r.status == ValidationStatus.VALID
        ]
        return len(valid_results) / len(self.validation_results)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            "primary_source": self.primary_source.value,
            "comparison_sources": [s.value for s in self.comparison_sources],
            "validation_results": [r.to_dict() for r in self.validation_results],
            "confidence_score": self.confidence_score,
            "quality_score": self.get_quality_score(),
            "conflicts": self.conflicts,
            "recommendations": self.recommendations,
            "generated_at": self.generated_at.isoformat(),
            "consensus_available": self.consensus_data is not None,
        }


class MLBDataSchemas:
    """Pandera schemas for MLB data validation"""

    @staticmethod
    def get_player_stats_schema() -> Optional[DataFrameSchema]:
        """Schema for player statistics validation"""
        if not PANDERA_AVAILABLE:
            return None

        return DataFrameSchema(
            {
                "player_id": Column(int, checks=[Check.greater_than(0)]),
                "player_name": Column(
                    str, checks=[Check.str_length(min_value=2, max_value=50)]
                ),
                "team": Column(
                    str, checks=[Check.str_length(min_value=2, max_value=5)]
                ),
                "games_played": Column(int, checks=[Check.in_range(0, 162)]),
                "hits": Column(int, checks=[Check.greater_than_or_equal_to(0)]),
                "home_runs": Column(
                    int, checks=[Check.in_range(0, 75)]
                ),  # Reasonable max
                "rbis": Column(int, checks=[Check.in_range(0, 200)]),
                "runs": Column(int, checks=[Check.in_range(0, 200)]),
                "avg": Column(float, checks=[Check.in_range(0.0, 1.0)]),
                "obp": Column(float, checks=[Check.in_range(0.0, 1.0)]),
                "slg": Column(
                    float, checks=[Check.in_range(0.0, 5.0)]
                ),  # Theoretical max ~4.0
            }
        )

    @staticmethod
    def get_game_data_schema() -> Optional[DataFrameSchema]:
        """Schema for game data validation"""
        if not PANDERA_AVAILABLE:
            return None

        return DataFrameSchema(
            {
                "game_id": Column(int, checks=[Check.greater_than(0)]),
                "home_team": Column(
                    str, checks=[Check.str_length(min_value=2, max_value=5)]
                ),
                "away_team": Column(
                    str, checks=[Check.str_length(min_value=2, max_value=5)]
                ),
                "home_score": Column(
                    int, checks=[Check.in_range(0, 50)]
                ),  # Reasonable game score max
                "away_score": Column(int, checks=[Check.in_range(0, 50)]),
                "inning": Column(
                    int, checks=[Check.in_range(1, 20)]
                ),  # Extra innings possible
                "game_state": Column(
                    str, checks=[Check.isin(["pregame", "live", "final", "postponed"])]
                ),
            }
        )


class StatisticalValidator:
    """Statistical validation for detecting anomalies and outliers"""

    def __init__(self):
        self.historical_baselines = {}
        self.outlier_threshold = 3.0  # Standard deviations

    def add_historical_baseline(self, stat_type: str, values: List[float]):
        """Add historical baseline for statistical validation"""
        if values:
            self.historical_baselines[stat_type] = {
                "mean": statistics.mean(values),
                "stdev": statistics.stdev(values) if len(values) > 1 else 0.0,
                "median": statistics.median(values),
                "min": min(values),
                "max": max(values),
                "sample_size": len(values),
            }

    def is_statistical_outlier(self, stat_type: str, value: float) -> Tuple[bool, str]:
        """Check if a value is a statistical outlier"""
        if stat_type not in self.historical_baselines:
            return False, "No baseline data available"

        baseline = self.historical_baselines[stat_type]

        if baseline["stdev"] == 0:
            return value != baseline["mean"], f"Value differs from constant baseline"

        z_score = abs(value - baseline["mean"]) / baseline["stdev"]

        if z_score > self.outlier_threshold:
            return True, f"Z-score: {z_score:.2f} (threshold: {self.outlier_threshold})"

        return False, f"Within normal range (Z-score: {z_score:.2f})"

    def validate_against_range(self, stat_type: str, value: float) -> Tuple[bool, str]:
        """Validate value against historical min/max range"""
        if stat_type not in self.historical_baselines:
            return True, "No baseline for range validation"

        baseline = self.historical_baselines[stat_type]

        # Allow some tolerance beyond historical range
        tolerance = 0.1 * (baseline["max"] - baseline["min"])
        extended_min = baseline["min"] - tolerance
        extended_max = baseline["max"] + tolerance

        if extended_min <= value <= extended_max:
            return True, "Within extended historical range"
        else:
            return False, f"Outside range [{extended_min:.2f}, {extended_max:.2f}]"


class ConsensusAlgorithm:
    """Consensus algorithms for resolving conflicting data from multiple sources"""

    @staticmethod
    def majority_vote(values: List[Any]) -> Any:
        """Return the most common value"""
        if not values:
            return None
        return Counter(values).most_common(1)[0][0]

    @staticmethod
    def weighted_average(values_weights: List[Tuple[float, float]]) -> Optional[float]:
        """Calculate weighted average for numeric values"""
        if not values_weights:
            return None

        try:
            total_weight = sum(weight for _, weight in values_weights)
            if total_weight == 0:
                return None

            weighted_sum = sum(value * weight for value, weight in values_weights)
            return weighted_sum / total_weight
        except (TypeError, ValueError):
            return None

    @staticmethod
    def confidence_based_selection(
        data_confidence_pairs: List[Tuple[Any, float]],
    ) -> Any:
        """Select data with highest confidence score"""
        if not data_confidence_pairs:
            return None
        return max(data_confidence_pairs, key=lambda x: x[1])[0]

    @staticmethod
    def median_consensus(values: List[float]) -> Optional[float]:
        """Return median value for numeric data"""
        if not values:
            return None
        try:
            return statistics.median(values)
        except (TypeError, ValueError):
            return None


class DataValidationOrchestrator:
    """
    Enterprise-grade data validation orchestrator with modern async patterns

    Features:
    - Multi-source data cross-validation
    - Schema validation using Pandera
    - Statistical anomaly detection
    - Consensus algorithms for conflict resolution
    - Real-time validation metrics
    - Automated alerting and fallback mechanisms
    """

    def __init__(self):
        self.statistical_validator = StatisticalValidator()
        self.consensus_algorithm = ConsensusAlgorithm()
        self.validation_history = defaultdict(list)
        self.data_quality_metrics = {
            "total_validations": 0,
            "successful_validations": 0,
            "failed_validations": 0,
            "consensus_conflicts": 0,
            "anomalies_detected": 0,
            "source_reliability": defaultdict(lambda: {"success": 0, "total": 0}),
        }

        # Initialize schemas
        self.schemas = MLBDataSchemas()

        # Validation cache for performance
        self._validation_cache = weakref.WeakValueDictionary()

        logger.info(
            "🔍 DataValidationOrchestrator initialized with enterprise patterns"
        )

    async def validate_player_data(
        self, data_sources: Dict[DataSource, Dict[str, Any]], player_id: int
    ) -> CrossValidationReport:
        """
        Cross-validate player data from multiple sources

        Args:
            data_sources: Dictionary mapping DataSource to player data
            player_id: Player ID for validation context

        Returns:
            CrossValidationReport with validation results and consensus
        """
        start_time = time.time()

        # Generate cache key
        cache_key = self._generate_cache_key("player", player_id, data_sources.keys())
        if cache_key in self._validation_cache:
            logger.debug(f"Using cached validation for player {player_id}")
            return self._validation_cache[cache_key]

        validation_results = []
        primary_source = None

        # Validate each data source
        for source, data in data_sources.items():
            if primary_source is None:
                primary_source = source

            result = await self._validate_single_source(source, data, "player")
            validation_results.append(result)

            # Update metrics
            self.data_quality_metrics["total_validations"] += 1
            self.data_quality_metrics["source_reliability"][source]["total"] += 1

            if result.status == ValidationStatus.VALID:
                self.data_quality_metrics["successful_validations"] += 1
                self.data_quality_metrics["source_reliability"][source]["success"] += 1
            else:
                self.data_quality_metrics["failed_validations"] += 1

        # Perform cross-validation and consensus
        consensus_data, conflicts = await self._perform_cross_validation(
            data_sources, "player"
        )

        # Calculate overall confidence
        confidence_score = self._calculate_confidence_score(validation_results)

        # Generate recommendations
        recommendations = self._generate_recommendations(validation_results, conflicts)

        # Create comprehensive report
        report = CrossValidationReport(
            primary_source=primary_source,
            comparison_sources=list(data_sources.keys()),
            validation_results=validation_results,
            consensus_data=consensus_data,
            confidence_score=confidence_score,
            conflicts=conflicts,
            recommendations=recommendations,
        )

        # Cache the result
        self._validation_cache[cache_key] = report

        validation_time = time.time() - start_time
        logger.info(
            f"✅ Player {player_id} validation completed in {validation_time:.3f}s "
            f"(confidence: {confidence_score:.2f})"
        )

        return report

    async def validate_game_data(
        self, data_sources: Dict[DataSource, Dict[str, Any]], game_id: int
    ) -> CrossValidationReport:
        """Cross-validate game data from multiple sources"""
        return await self._validate_data_generic(data_sources, "game", game_id)

    async def _validate_data_generic(
        self,
        data_sources: Dict[DataSource, Dict[str, Any]],
        data_type: str,
        entity_id: int,
    ) -> CrossValidationReport:
        """Generic data validation method for different data types"""
        start_time = time.time()

        validation_results = []
        primary_source = list(data_sources.keys())[0] if data_sources else None

        # Validate each source
        async def validate_source(source, data):
            return await self._validate_single_source(source, data, data_type)

        # Use asyncio.gather for concurrent validation
        tasks = [validate_source(source, data) for source, data in data_sources.items()]
        validation_results = await asyncio.gather(*tasks, return_exceptions=True)

        # Filter out exceptions
        validation_results = [
            r for r in validation_results if isinstance(r, ValidationResult)
        ]

        # Perform cross-validation
        consensus_data, conflicts = await self._perform_cross_validation(
            data_sources, data_type
        )

        confidence_score = self._calculate_confidence_score(validation_results)
        recommendations = self._generate_recommendations(validation_results, conflicts)

        report = CrossValidationReport(
            primary_source=primary_source,
            comparison_sources=list(data_sources.keys()),
            validation_results=validation_results,
            consensus_data=consensus_data,
            confidence_score=confidence_score,
            conflicts=conflicts,
            recommendations=recommendations,
        )

        validation_time = time.time() - start_time
        logger.info(
            f"✅ {data_type.title()} {entity_id} validation completed in {validation_time:.3f}s"
        )

        return report

    async def _validate_single_source(
        self, source: DataSource, data: Dict[str, Any], data_type: str
    ) -> ValidationResult:
        """Validate data from a single source"""
        start_time = time.time()
        errors = []
        warnings = []
        metadata = {}

        try:
            # Schema validation
            if PANDERA_AVAILABLE and PANDAS_AVAILABLE:
                schema_result = await self._validate_schema(data, data_type)
                if not schema_result["valid"]:
                    errors.extend(schema_result["errors"])
                metadata["schema_validation"] = schema_result

            # Statistical validation
            stats_result = await self._validate_statistics(data, data_type)
            if stats_result["anomalies"]:
                warnings.extend(stats_result["anomalies"])
            metadata["statistical_validation"] = stats_result

            # Data completeness validation
            completeness_result = self._validate_completeness(data)
            metadata["completeness"] = completeness_result

            # Determine overall status
            if errors:
                status = ValidationStatus.INVALID
                confidence = 0.0
            elif warnings:
                status = ValidationStatus.SUSPICIOUS
                confidence = 0.7
            else:
                status = ValidationStatus.VALID
                confidence = min(1.0, completeness_result["score"])

        except Exception as e:
            logger.error(f"Validation error for {source}: {e}")
            errors.append(f"Validation exception: {str(e)}")
            status = ValidationStatus.INVALID
            confidence = 0.0

        validation_time = time.time() - start_time

        return ValidationResult(
            status=status,
            source=source,
            data=data,
            confidence_score=confidence,
            validation_time=validation_time,
            errors=errors,
            warnings=warnings,
            metadata=metadata,
        )

    async def _validate_schema(
        self, data: Dict[str, Any], data_type: str
    ) -> Dict[str, Any]:
        """Validate data against Pandera schema"""
        if not PANDERA_AVAILABLE:
            return {"valid": True, "errors": [], "note": "Pandera not available"}

        try:
            # Convert to DataFrame for schema validation
            if isinstance(data, dict):
                # Handle single record
                df = pd.DataFrame([data])
            elif isinstance(data, list):
                # Handle multiple records
                df = pd.DataFrame(data)
            else:
                return {
                    "valid": False,
                    "errors": ["Invalid data format for schema validation"],
                }

            # Get appropriate schema
            if data_type == "player":
                schema = self.schemas.get_player_stats_schema()
            elif data_type == "game":
                schema = self.schemas.get_game_data_schema()
            else:
                return {
                    "valid": True,
                    "errors": [],
                    "note": f"No schema for {data_type}",
                }

            if schema is None:
                return {"valid": True, "errors": [], "note": "Schema not available"}

            # Validate against schema
            validated_df = schema.validate(df, lazy=True)
            return {"valid": True, "errors": [], "validated_records": len(validated_df)}

        except pa.errors.SchemaErrors as e:
            errors = [
                f"Schema error: {str(error)}"
                for error in e.failure_cases["failure_case"]
            ]
            return {"valid": False, "errors": errors}
        except Exception as e:
            return {
                "valid": False,
                "errors": [f"Schema validation exception: {str(e)}"],
            }

    async def _validate_statistics(
        self, data: Dict[str, Any], data_type: str
    ) -> Dict[str, Any]:
        """Validate data using statistical methods"""
        anomalies = []
        metadata = {}

        try:
            # Extract numeric values for statistical validation
            numeric_fields = self._extract_numeric_fields(data, data_type)

            for field, value in numeric_fields.items():
                # Check for statistical outliers
                is_outlier, reason = self.statistical_validator.is_statistical_outlier(
                    field, value
                )
                if is_outlier:
                    anomalies.append(f"{field}: {reason}")

                # Check against historical range
                in_range, range_reason = (
                    self.statistical_validator.validate_against_range(field, value)
                )
                if not in_range:
                    anomalies.append(f"{field}: {range_reason}")

                metadata[field] = {
                    "value": value,
                    "is_outlier": is_outlier,
                    "in_range": in_range,
                }

        except Exception as e:
            anomalies.append(f"Statistical validation error: {str(e)}")

        return {
            "anomalies": anomalies,
            "metadata": metadata,
            "total_checks": len(metadata),
        }

    def _validate_completeness(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate data completeness"""
        if not data:
            return {"score": 0.0, "missing_fields": [], "total_fields": 0}

        total_fields = len(data)
        missing_fields = []

        for key, value in data.items():
            if (
                value is None
                or value == ""
                or (isinstance(value, (int, float)) and value == 0)
            ):
                missing_fields.append(key)

        completeness_score = (
            (total_fields - len(missing_fields)) / total_fields
            if total_fields > 0
            else 0.0
        )

        return {
            "score": completeness_score,
            "missing_fields": missing_fields,
            "total_fields": total_fields,
            "complete_fields": total_fields - len(missing_fields),
        }

    def _extract_numeric_fields(
        self, data: Dict[str, Any], data_type: str
    ) -> Dict[str, float]:
        """Extract numeric fields for statistical validation"""
        numeric_fields = {}

        if data_type == "player":
            numeric_keys = [
                "games_played",
                "hits",
                "home_runs",
                "rbis",
                "runs",
                "avg",
                "obp",
                "slg",
            ]
        elif data_type == "game":
            numeric_keys = ["home_score", "away_score", "inning"]
        else:
            # Generic: find all numeric fields
            numeric_keys = [k for k, v in data.items() if isinstance(v, (int, float))]

        for key in numeric_keys:
            if key in data and isinstance(data[key], (int, float)):
                numeric_fields[key] = float(data[key])

        return numeric_fields

    async def _perform_cross_validation(
        self, data_sources: Dict[DataSource, Dict[str, Any]], data_type: str
    ) -> Tuple[Optional[Dict[str, Any]], List[Dict[str, Any]]]:
        """Perform cross-validation between multiple data sources"""
        if len(data_sources) < 2:
            # Single source - no cross-validation possible
            single_data = next(iter(data_sources.values())) if data_sources else None
            return single_data, []

        conflicts = []
        consensus_data = {}

        # Get all field names across sources
        all_fields = set()
        for data in data_sources.values():
            if isinstance(data, dict):
                all_fields.update(data.keys())

        # Compare each field across sources
        for field in all_fields:
            field_values = []
            field_sources = []

            for source, data in data_sources.items():
                if field in data:
                    field_values.append(data[field])
                    field_sources.append(source)

            if len(field_values) <= 1:
                # No conflict possible
                consensus_data[field] = field_values[0] if field_values else None
                continue

            # Check for conflicts
            unique_values = list(set(field_values))

            if len(unique_values) == 1:
                # All sources agree
                consensus_data[field] = unique_values[0]
            else:
                # Conflict detected
                conflict = {
                    "field": field,
                    "values": list(zip(field_sources, field_values)),
                    "resolution_method": None,
                    "consensus_value": None,
                }

                # Resolve conflict using consensus algorithm
                if all(isinstance(v, (int, float)) for v in field_values):
                    # Numeric conflict - use median
                    consensus_value = self.consensus_algorithm.median_consensus(
                        field_values
                    )
                    conflict["resolution_method"] = "median"
                else:
                    # Non-numeric conflict - use majority vote
                    consensus_value = self.consensus_algorithm.majority_vote(
                        field_values
                    )
                    conflict["resolution_method"] = "majority_vote"

                conflict["consensus_value"] = consensus_value
                consensus_data[field] = consensus_value
                conflicts.append(conflict)

                # Update metrics
                self.data_quality_metrics["consensus_conflicts"] += 1

        return consensus_data, conflicts

    def _calculate_confidence_score(
        self, validation_results: List[ValidationResult]
    ) -> float:
        """Calculate overall confidence score from validation results"""
        if not validation_results:
            return 0.0

        # Weight by validation success and individual confidence
        total_weight = 0.0
        weighted_confidence = 0.0

        for result in validation_results:
            # Higher weight for valid results
            weight = 1.0 if result.status == ValidationStatus.VALID else 0.5
            total_weight += weight
            weighted_confidence += result.confidence_score * weight

        return weighted_confidence / total_weight if total_weight > 0 else 0.0

    def _generate_recommendations(
        self,
        validation_results: List[ValidationResult],
        conflicts: List[Dict[str, Any]],
    ) -> List[str]:
        """Generate actionable recommendations based on validation results"""
        recommendations = []

        # Check for invalid sources
        invalid_sources = [
            r.source for r in validation_results if r.status == ValidationStatus.INVALID
        ]
        if invalid_sources:
            recommendations.append(
                f"Consider excluding data from sources: {[s.value for s in invalid_sources]}"
            )

        # Check for suspicious sources
        suspicious_sources = [
            r.source
            for r in validation_results
            if r.status == ValidationStatus.SUSPICIOUS
        ]
        if suspicious_sources:
            recommendations.append(
                f"Review data quality from sources: {[s.value for s in suspicious_sources]}"
            )

        # Recommendations based on conflicts
        if conflicts:
            high_conflict_fields = [
                c["field"] for c in conflicts if len(c["values"]) > 2
            ]
            if high_conflict_fields:
                recommendations.append(
                    f"High conflict detected in fields: {high_conflict_fields}. Consider manual review."
                )

        # General recommendations
        if len(validation_results) < 2:
            recommendations.append(
                "Consider adding additional data sources for cross-validation"
            )

        return recommendations

    def _generate_cache_key(self, data_type: str, entity_id: int, sources: Any) -> str:
        """Generate cache key for validation results"""
        sources_str = "_".join(sorted([s.value for s in sources]))
        return f"{data_type}_{entity_id}_{sources_str}"

    def get_data_quality_metrics(self) -> Dict[str, Any]:
        """Get comprehensive data quality metrics"""
        metrics = dict(self.data_quality_metrics)

        # Calculate derived metrics
        total = metrics["total_validations"]
        if total > 0:
            metrics["success_rate"] = metrics["successful_validations"] / total
            metrics["failure_rate"] = metrics["failed_validations"] / total
        else:
            metrics["success_rate"] = 0.0
            metrics["failure_rate"] = 0.0

        # Source reliability scores
        source_scores = {}
        for source, stats in metrics["source_reliability"].items():
            if stats["total"] > 0:
                source_scores[source] = stats["success"] / stats["total"]
            else:
                source_scores[source] = 0.0

        metrics["source_reliability_scores"] = source_scores
        metrics["generated_at"] = datetime.now().isoformat()

        return metrics

    async def cleanup(self):
        """Clean up resources"""
        self._validation_cache.clear()
        logger.info("🧹 DataValidationOrchestrator cleanup completed")


# Global validation orchestrator instance
data_validation_orchestrator = DataValidationOrchestrator()
