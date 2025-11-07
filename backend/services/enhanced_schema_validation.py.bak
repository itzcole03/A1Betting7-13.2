"""
Enhanced Schema Validation Service for Odds Aggregation

Comprehensive validation system with categorized warnings and error handling.
Builds on existing OddsNormalizer infrastructure to provide detailed validation
with actionable feedback for data quality monitoring.

Features:
- Multi-level validation (critical, warning, info)
- Categorized warnings with detailed context
- Provider-specific validation rules  
- Historical validation tracking
- Automatic data sanitization
- Integration with provider resilience system
"""

import logging
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Tuple, Union

# Import from backend.api_integration with proper relative import
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.api_integration import AggregatedOdds, OddsNormalizer


class ValidationLevel(Enum):
    """Validation severity levels"""
    CRITICAL = "critical"    # Data unusable, reject
    WARNING = "warning"      # Data usable but concerning  
    INFO = "info"           # Data fine but noteworthy
    SUCCESS = "success"     # Data passed all validations


class ValidationCategory(Enum):
    """Categories of validation issues"""
    SCHEMA_STRUCTURE = "schema_structure"       # Missing/invalid fields
    DATA_RANGE = "data_range"                   # Values out of expected range
    DATA_CONSISTENCY = "data_consistency"       # Internal consistency issues
    PROVIDER_SPECIFIC = "provider_specific"     # Provider-specific issues
    TEMPORAL_VALIDATION = "temporal_validation" # Time-based validation issues
    BUSINESS_LOGIC = "business_logic"           # Business rule violations
    DATA_FRESHNESS = "data_freshness"           # Stale or outdated data


@dataclass
class ValidationWarning:
    """Represents a validation warning or error"""
    level: ValidationLevel
    category: ValidationCategory
    field: str
    message: str
    actual_value: Any
    expected_value: Optional[Any] = None
    provider: Optional[str] = None
    suggestion: Optional[str] = None
    timestamp: float = field(default_factory=lambda: time.time())
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "level": self.level.value,
            "category": self.category.value,
            "field": self.field,
            "message": self.message,
            "actual_value": self.actual_value,
            "expected_value": self.expected_value,
            "provider": self.provider,
            "suggestion": self.suggestion,
            "timestamp": self.timestamp
        }


@dataclass
class ValidationResult:
    """Complete validation result with warnings and processed data"""
    is_valid: bool
    processed_data: Optional[AggregatedOdds]
    warnings: List[ValidationWarning]
    validation_summary: Dict[str, Any]
    provider: str
    timestamp: float = field(default_factory=lambda: time.time())
    
    @property
    def has_critical_errors(self) -> bool:
        return any(w.level == ValidationLevel.CRITICAL for w in self.warnings)
    
    @property
    def has_warnings(self) -> bool:
        return any(w.level == ValidationLevel.WARNING for w in self.warnings)
    
    @property
    def warning_count_by_level(self) -> Dict[str, int]:
        counts = defaultdict(int)
        for warning in self.warnings:
            counts[warning.level.value] += 1
        return dict(counts)
    
    @property
    def warning_count_by_category(self) -> Dict[str, int]:
        counts = defaultdict(int)
        for warning in self.warnings:
            counts[warning.category.value] += 1
        return dict(counts)


@dataclass
class ProviderValidationStats:
    """Historical validation statistics for a provider"""
    provider_name: str
    total_validations: int = 0
    successful_validations: int = 0
    critical_errors: int = 0
    warnings: int = 0
    last_validation: Optional[float] = None
    average_validation_time_ms: float = 0.0
    common_issues: Dict[str, int] = field(default_factory=dict)
    data_quality_score: float = 1.0  # 0-1 score based on validation history
    
    def update_stats(self, result: ValidationResult, validation_time_ms: float):
        """Update statistics with new validation result"""
        self.total_validations += 1
        self.last_validation = result.timestamp
        
        # Update timing
        if self.total_validations == 1:
            self.average_validation_time_ms = validation_time_ms
        else:
            # Running average
            self.average_validation_time_ms = (
                (self.average_validation_time_ms * (self.total_validations - 1) + validation_time_ms) 
                / self.total_validations
            )
        
        # Count result types
        if result.has_critical_errors:
            self.critical_errors += 1
        elif result.has_warnings:
            self.warnings += 1
        else:
            self.successful_validations += 1
        
        # Track common issues
        for warning in result.warnings:
            issue_key = f"{warning.category.value}:{warning.field}"
            self.common_issues[issue_key] = self.common_issues.get(issue_key, 0) + 1
        
        # Update data quality score (weighted average)
        success_rate = self.successful_validations / self.total_validations
        critical_rate = self.critical_errors / self.total_validations
        warning_rate = self.warnings / self.total_validations
        
        self.data_quality_score = (
            success_rate * 1.0 +      # Perfect score for success
            warning_rate * 0.7 +      # Moderate score for warnings
            critical_rate * 0.0       # Zero score for critical errors
        )


class EnhancedSchemaValidator:
    """
    Enhanced schema validation service with comprehensive validation rules
    and integration with provider resilience tracking.
    """
    
    def __init__(self):
        self.logger = logging.getLogger("enhanced_schema_validator")
        self.normalizer = OddsNormalizer()
        
        # Validation statistics tracking
        self.provider_stats: Dict[str, ProviderValidationStats] = {}
        
        # Validation rules configuration
        self.validation_config = {
            # American odds validation ranges
            "odds_range": {
                "min_favorite": -10000,  # Strongest possible favorite
                "max_underdog": 10000,   # Longest possible odds
                "typical_min": -500,     # Typical favorite range
                "typical_max": 500       # Typical underdog range
            },
            
            # Line validation ranges (sport-agnostic)
            "line_range": {
                "min_line": -100.0,     # Minimum reasonable line
                "max_line": 100.0,      # Maximum reasonable line
                "precision": 0.5        # Expected precision (0.5 increments)
            },
            
            # Temporal validation
            "temporal": {
                "max_age_hours": 24,        # Maximum age for odds data
                "future_tolerance_hours": 48  # How far in future events can be
            },
            
            # Provider-specific rules
            "provider_rules": {
                "SportRadar": {
                    "confidence_min": 0.8,
                    "expected_precision": 0.5,
                    "required_fields": ["sportsbook", "line", "odds", "last_seen"]
                },
                "TheOdds": {
                    "confidence_min": 0.7,
                    "expected_precision": 0.5,
                    "required_fields": ["sportsbook", "line", "odds", "last_seen"]
                },
                "Internal": {
                    "confidence_min": 0.5,
                    "expected_precision": 1.0,
                    "required_fields": ["sportsbook", "line", "odds"]
                }
            }
        }
        
        # Recent validation history for trend analysis
        self.recent_validations: deque = deque(maxlen=1000)
    
    def validate_aggregated_odds(
        self, 
        raw_data: Dict[str, Any], 
        provider: str,
        context: Optional[Dict[str, Any]] = None
    ) -> ValidationResult:
        """
        Comprehensive validation of aggregated odds data with detailed warnings.
        
        Args:
            raw_data: Raw odds data from provider
            provider: Provider name (SportRadar, TheOdds, etc.)
            context: Additional context for validation
        
        Returns:
            ValidationResult with processed data and warnings
        """
        start_time = time.time()
        warnings = []
        
        try:
            # Initialize provider stats if needed
            if provider not in self.provider_stats:
                self.provider_stats[provider] = ProviderValidationStats(provider_name=provider)
            
            # Schema structure validation
            schema_warnings = self._validate_schema_structure(raw_data, provider)
            warnings.extend(schema_warnings)
            
            # Early exit if critical schema errors
            if any(w.level == ValidationLevel.CRITICAL for w in schema_warnings):
                result = ValidationResult(
                    is_valid=False,
                    processed_data=None,
                    warnings=warnings,
                    validation_summary=self._generate_validation_summary(warnings),
                    provider=provider
                )
                self._update_stats_and_history(result, time.time() - start_time)
                return result
            
            # Normalize data using existing normalizer
            try:
                normalized_list = self.normalizer.normalize_odds_data(raw_data, provider.lower())
                if not normalized_list:
                    warnings.append(ValidationWarning(
                        level=ValidationLevel.CRITICAL,
                        category=ValidationCategory.SCHEMA_STRUCTURE,
                        field="data",
                        message="Normalization produced no valid odds",
                        actual_value=raw_data,
                        provider=provider,
                        suggestion="Check raw data format and normalization logic"
                    ))
                    result = ValidationResult(
                        is_valid=False,
                        processed_data=None,
                        warnings=warnings,
                        validation_summary=self._generate_validation_summary(warnings),
                        provider=provider
                    )
                    self._update_stats_and_history(result, time.time() - start_time)
                    return result
                
                # Use first normalized odds for validation (in production, might validate all)
                processed_odds = normalized_list[0]
                
            except Exception as e:
                warnings.append(ValidationWarning(
                    level=ValidationLevel.CRITICAL,
                    category=ValidationCategory.SCHEMA_STRUCTURE,
                    field="normalization",
                    message=f"Normalization failed: {str(e)}",
                    actual_value=raw_data,
                    provider=provider,
                    suggestion="Review raw data format for provider compatibility"
                ))
                result = ValidationResult(
                    is_valid=False,
                    processed_data=None,
                    warnings=warnings,
                    validation_summary=self._generate_validation_summary(warnings),
                    provider=provider
                )
                self._update_stats_and_history(result, time.time() - start_time)
                return result
            
            # Data range validation
            range_warnings = self._validate_data_ranges(processed_odds, provider)
            warnings.extend(range_warnings)
            
            # Data consistency validation
            consistency_warnings = self._validate_data_consistency(processed_odds, provider)
            warnings.extend(consistency_warnings)
            
            # Provider-specific validation
            provider_warnings = self._validate_provider_specific(processed_odds, provider)
            warnings.extend(provider_warnings)
            
            # Temporal validation
            temporal_warnings = self._validate_temporal_data(processed_odds, provider)
            warnings.extend(temporal_warnings)
            
            # Business logic validation
            business_warnings = self._validate_business_logic(processed_odds, provider, context)
            warnings.extend(business_warnings)
            
            # Data sanitization if needed
            sanitized_odds = self._sanitize_data(processed_odds, warnings)
            
            # Determine overall validation result
            has_critical = any(w.level == ValidationLevel.CRITICAL for w in warnings)
            
            result = ValidationResult(
                is_valid=not has_critical,
                processed_data=sanitized_odds if not has_critical else None,
                warnings=warnings,
                validation_summary=self._generate_validation_summary(warnings),
                provider=provider
            )
            
            # Update statistics and history
            validation_time_ms = (time.time() - start_time) * 1000
            self._update_stats_and_history(result, validation_time_ms)
            
            return result
            
        except Exception as e:
            self.logger.error(f"Unexpected validation error for {provider}: {e}")
            warnings.append(ValidationWarning(
                level=ValidationLevel.CRITICAL,
                category=ValidationCategory.SCHEMA_STRUCTURE,
                field="validation",
                message=f"Validation system error: {str(e)}",
                actual_value=raw_data,
                provider=provider,
                suggestion="Contact system administrator"
            ))
            result = ValidationResult(
                is_valid=False,
                processed_data=None,
                warnings=warnings,
                validation_summary=self._generate_validation_summary(warnings),
                provider=provider
            )
            self._update_stats_and_history(result, (time.time() - start_time) * 1000)
            return result
    
    def _validate_schema_structure(self, raw_data: Dict[str, Any], provider: str) -> List[ValidationWarning]:
        """Validate basic schema structure and required fields"""
        warnings = []
        
        # Check if data is dict
        if not isinstance(raw_data, dict):
            warnings.append(ValidationWarning(
                level=ValidationLevel.CRITICAL,
                category=ValidationCategory.SCHEMA_STRUCTURE,
                field="data_type",
                message="Raw data must be a dictionary",
                actual_value=type(raw_data).__name__,
                expected_value="dict",
                provider=provider,
                suggestion="Ensure provider returns dictionary format"
            ))
            return warnings
        
        # Get provider-specific required fields
        provider_rules = self.validation_config["provider_rules"].get(provider, {})
        required_fields = provider_rules.get("required_fields", ["sportsbook", "line", "odds"])
        
        # Check for missing fields in the structure that will be needed for normalization
        common_missing_fields = []
        
        # For SportRadar format
        if provider == "SportRadar":
            if "markets" not in raw_data:
                common_missing_fields.append("markets")
        
        # For TheOdds format  
        elif provider == "TheOdds":
            if "bookmakers" not in raw_data:
                common_missing_fields.append("bookmakers")
        
        # For Internal format
        elif provider == "Internal":
            for field in ["line", "odds"]:
                if field not in raw_data:
                    common_missing_fields.append(field)
        
        for field in common_missing_fields:
            warnings.append(ValidationWarning(
                level=ValidationLevel.WARNING,
                category=ValidationCategory.SCHEMA_STRUCTURE,
                field=field,
                message=f"Expected field '{field}' missing from {provider} data",
                actual_value=None,
                expected_value="present",
                provider=provider,
                suggestion=f"Verify {provider} API response format"
            ))
        
        # Check for empty data structures
        if provider == "SportRadar" and "markets" in raw_data:
            markets = raw_data["markets"]
            if not isinstance(markets, list) or len(markets) == 0:
                warnings.append(ValidationWarning(
                    level=ValidationLevel.WARNING,
                    category=ValidationCategory.SCHEMA_STRUCTURE,
                    field="markets",
                    message="Markets array is empty",
                    actual_value=len(markets) if isinstance(markets, list) else "not_list",
                    expected_value="> 0",
                    provider=provider,
                    suggestion="Check if there are available markets for this request"
                ))
        
        return warnings
    
    def _validate_data_ranges(self, odds: AggregatedOdds, provider: str) -> List[ValidationWarning]:
        """Validate data values are within expected ranges"""
        warnings = []
        config = self.validation_config
        
        # Validate odds range
        if odds.odds < config["odds_range"]["min_favorite"] or odds.odds > config["odds_range"]["max_underdog"]:
            warnings.append(ValidationWarning(
                level=ValidationLevel.CRITICAL,
                category=ValidationCategory.DATA_RANGE,
                field="odds",
                message=f"Odds {odds.odds} outside valid range",
                actual_value=odds.odds,
                expected_value=f"{config['odds_range']['min_favorite']} to {config['odds_range']['max_underdog']}",
                provider=provider,
                suggestion="Verify odds format and check for data corruption"
            ))
        
        # Check for unusual odds (warning level)
        elif odds.odds < config["odds_range"]["typical_min"] or odds.odds > config["odds_range"]["typical_max"]:
            warnings.append(ValidationWarning(
                level=ValidationLevel.WARNING,
                category=ValidationCategory.DATA_RANGE,
                field="odds",
                message=f"Odds {odds.odds} outside typical range",
                actual_value=odds.odds,
                expected_value=f"{config['odds_range']['typical_min']} to {config['odds_range']['typical_max']}",
                provider=provider,
                suggestion="Verify this is not an error - very long or short odds"
            ))
        
        # Validate line range
        if odds.line < config["line_range"]["min_line"] or odds.line > config["line_range"]["max_line"]:
            warnings.append(ValidationWarning(
                level=ValidationLevel.WARNING,
                category=ValidationCategory.DATA_RANGE,
                field="line",
                message=f"Line {odds.line} outside expected range",
                actual_value=odds.line,
                expected_value=f"{config['line_range']['min_line']} to {config['line_range']['max_line']}",
                provider=provider,
                suggestion="Verify line represents a reasonable betting proposition"
            ))
        
        # Check line precision
        expected_precision = config["line_range"]["precision"]
        if abs(odds.line % expected_precision) > 0.001:  # Account for float precision
            warnings.append(ValidationWarning(
                level=ValidationLevel.INFO,
                category=ValidationCategory.DATA_RANGE,
                field="line",
                message=f"Line {odds.line} not in expected increments of {expected_precision}",
                actual_value=odds.line,
                expected_value=f"Multiple of {expected_precision}",
                provider=provider,
                suggestion="Some providers use non-standard line increments"
            ))
        
        # Validate confidence range
        if odds.confidence < 0.0 or odds.confidence > 1.0:
            warnings.append(ValidationWarning(
                level=ValidationLevel.WARNING,
                category=ValidationCategory.DATA_RANGE,
                field="confidence",
                message=f"Confidence {odds.confidence} outside 0-1 range",
                actual_value=odds.confidence,
                expected_value="0.0 to 1.0",
                provider=provider,
                suggestion="Confidence should be a probability between 0 and 1"
            ))
        
        return warnings
    
    def _validate_data_consistency(self, odds: AggregatedOdds, provider: str) -> List[ValidationWarning]:
        """Validate internal data consistency"""
        warnings = []
        
        # Check for zero values that might indicate missing data
        if odds.odds == 0:
            warnings.append(ValidationWarning(
                level=ValidationLevel.WARNING,
                category=ValidationCategory.DATA_CONSISTENCY,
                field="odds",
                message="Odds value is zero",
                actual_value=0,
                expected_value="non-zero",
                provider=provider,
                suggestion="Zero odds typically indicate missing or invalid data"
            ))
        
        if odds.line == 0.0 and odds.market_type == "playerprops":
            warnings.append(ValidationWarning(
                level=ValidationLevel.INFO,
                category=ValidationCategory.DATA_CONSISTENCY,
                field="line",
                message="Line is zero for player prop market",
                actual_value=0.0,
                expected_value="> 0",
                provider=provider,
                suggestion="Zero lines may be valid for some markets but unusual for player props"
            ))
        
        # Validate sportsbook name consistency
        normalized_book = self.normalizer.normalize_sportsbook_name(odds.sportsbook)
        if normalized_book != odds.sportsbook:
            warnings.append(ValidationWarning(
                level=ValidationLevel.INFO,
                category=ValidationCategory.DATA_CONSISTENCY,
                field="sportsbook",
                message=f"Sportsbook name standardized from '{odds.sportsbook}' to '{normalized_book}'",
                actual_value=odds.sportsbook,
                expected_value=normalized_book,
                provider=provider,
                suggestion="Use normalized sportsbook names for consistency"
            ))
        
        return warnings
    
    def _validate_provider_specific(self, odds: AggregatedOdds, provider: str) -> List[ValidationWarning]:
        """Validate provider-specific rules"""
        warnings = []
        
        provider_rules = self.validation_config["provider_rules"].get(provider, {})
        
        # Check minimum confidence for provider
        min_confidence = provider_rules.get("confidence_min", 0.5)
        if odds.confidence < min_confidence:
            warnings.append(ValidationWarning(
                level=ValidationLevel.INFO,
                category=ValidationCategory.PROVIDER_SPECIFIC,
                field="confidence",
                message=f"Confidence {odds.confidence} below {provider} typical minimum",
                actual_value=odds.confidence,
                expected_value=f">= {min_confidence}",
                provider=provider,
                suggestion=f"{provider} data typically has higher confidence scores"
            ))
        
        # Check expected precision for provider
        expected_precision = provider_rules.get("expected_precision", 0.5)
        if abs(odds.line % expected_precision) > 0.001:
            warnings.append(ValidationWarning(
                level=ValidationLevel.INFO,
                category=ValidationCategory.PROVIDER_SPECIFIC,
                field="line",
                message=f"Line precision unusual for {provider}",
                actual_value=odds.line,
                expected_value=f"Multiple of {expected_precision}",
                provider=provider,
                suggestion=f"{provider} typically uses {expected_precision} increments"
            ))
        
        return warnings
    
    def _validate_temporal_data(self, odds: AggregatedOdds, provider: str) -> List[ValidationWarning]:
        """Validate temporal aspects of the data"""
        warnings = []
        config = self.validation_config["temporal"]
        now = datetime.now(timezone.utc)
        
        # Calculate age of data
        data_age = now - odds.last_seen
        max_age = timedelta(hours=config["max_age_hours"])
        
        if data_age > max_age:
            warnings.append(ValidationWarning(
                level=ValidationLevel.WARNING,
                category=ValidationCategory.DATA_FRESHNESS,
                field="last_seen",
                message=f"Data is {data_age.total_seconds() / 3600:.1f} hours old",
                actual_value=data_age.total_seconds() / 3600,
                expected_value=f"< {config['max_age_hours']} hours",
                provider=provider,
                suggestion="Consider refreshing odds data from provider"
            ))
        
        # Check for future timestamps (data corruption indicator)
        if odds.last_seen > now + timedelta(minutes=5):  # Allow 5 min tolerance
            warnings.append(ValidationWarning(
                level=ValidationLevel.WARNING,
                category=ValidationCategory.TEMPORAL_VALIDATION,
                field="last_seen",
                message="Timestamp is in the future",
                actual_value=odds.last_seen.isoformat(),
                expected_value="<= current time",
                provider=provider,
                suggestion="Check provider system clock and timestamp handling"
            ))
        
        return warnings
    
    def _validate_business_logic(
        self, 
        odds: AggregatedOdds, 
        provider: str, 
        context: Optional[Dict[str, Any]] = None
    ) -> List[ValidationWarning]:
        """Validate business logic rules"""
        warnings = []
        
        # Check for impossible odds combinations (future enhancement with market data)
        # For now, basic business logic validation
        
        # Check market type consistency
        valid_market_types = ["playerprops", "spreads", "totals", "moneyline"]
        if odds.market_type not in valid_market_types:
            warnings.append(ValidationWarning(
                level=ValidationLevel.INFO,
                category=ValidationCategory.BUSINESS_LOGIC,
                field="market_type",
                message=f"Unusual market type: {odds.market_type}",
                actual_value=odds.market_type,
                expected_value=f"One of: {valid_market_types}",
                provider=provider,
                suggestion="Verify market type is correctly classified"
            ))
        
        # Context-based validation if provided
        if context:
            sport = context.get("sport")
            if sport == "MLB" and odds.market_type == "playerprops":
                # MLB-specific validation
                if odds.line > 10 and "hits" in context.get("stat_type", "").lower():
                    warnings.append(ValidationWarning(
                        level=ValidationLevel.WARNING,
                        category=ValidationCategory.BUSINESS_LOGIC,
                        field="line",
                        message=f"Very high hits line for MLB: {odds.line}",
                        actual_value=odds.line,
                        expected_value="< 10 for hits",
                        provider=provider,
                        suggestion="Verify this line is not an error"
                    ))
        
        return warnings
    
    def _sanitize_data(self, odds: AggregatedOdds, warnings: List[ValidationWarning]) -> AggregatedOdds:
        """Apply automatic data sanitization based on warnings"""
        sanitized = odds
        
        # Normalize sportsbook name if warned about
        for warning in warnings:
            if (warning.category == ValidationCategory.DATA_CONSISTENCY and 
                warning.field == "sportsbook" and warning.expected_value):
                sanitized.sportsbook = warning.expected_value
                break
        
        # Clamp confidence to valid range
        if sanitized.confidence < 0.0:
            sanitized.confidence = 0.0
        elif sanitized.confidence > 1.0:
            sanitized.confidence = 1.0
        
        return sanitized
    
    def _generate_validation_summary(self, warnings: List[ValidationWarning]) -> Dict[str, Any]:
        """Generate validation summary statistics"""
        if not warnings:
            return {
                "status": "success",
                "total_warnings": 0,
                "by_level": {},
                "by_category": {},
                "recommendation": "Data passed all validations"
            }
        
        by_level = defaultdict(int)
        by_category = defaultdict(int)
        
        for warning in warnings:
            by_level[warning.level.value] += 1
            by_category[warning.category.value] += 1
        
        # Determine overall status
        if any(w.level == ValidationLevel.CRITICAL for w in warnings):
            status = "critical_errors"
            recommendation = "Data cannot be used safely - critical errors found"
        elif any(w.level == ValidationLevel.WARNING for w in warnings):
            status = "warnings"
            recommendation = "Data usable but monitor quality - warnings present"
        else:
            status = "info_only"
            recommendation = "Data quality good - only informational notices"
        
        return {
            "status": status,
            "total_warnings": len(warnings),
            "by_level": dict(by_level),
            "by_category": dict(by_category),
            "recommendation": recommendation
        }
    
    def _update_stats_and_history(self, result: ValidationResult, validation_time_ms: float):
        """Update provider statistics and validation history"""
        # Update provider stats
        provider_stats = self.provider_stats[result.provider]
        provider_stats.update_stats(result, validation_time_ms)
        
        # Add to recent history
        self.recent_validations.append({
            "timestamp": result.timestamp,
            "provider": result.provider,
            "is_valid": result.is_valid,
            "warning_count": len(result.warnings),
            "has_critical": result.has_critical_errors,
            "validation_time_ms": validation_time_ms
        })
        
        # Log validation result
        log_level = logging.ERROR if result.has_critical_errors else (
            logging.WARNING if result.has_warnings else logging.INFO
        )
        
        self.logger.log(log_level, f"Validation completed for {result.provider}", extra={
            "provider": result.provider,
            "is_valid": result.is_valid,
            "warning_count": len(result.warnings),
            "critical_errors": result.has_critical_errors,
            "validation_time_ms": validation_time_ms,
            "data_quality_score": provider_stats.data_quality_score
        })
    
    def get_provider_statistics(self, provider: Optional[str] = None) -> Dict[str, Any]:
        """Get validation statistics for provider(s)"""
        if provider:
            if provider not in self.provider_stats:
                return {"error": f"No statistics available for provider: {provider}"}
            
            stats = self.provider_stats[provider]
            return {
                "provider": provider,
                "total_validations": stats.total_validations,
                "success_rate": stats.successful_validations / max(stats.total_validations, 1),
                "critical_error_rate": stats.critical_errors / max(stats.total_validations, 1),
                "warning_rate": stats.warnings / max(stats.total_validations, 1),
                "average_validation_time_ms": stats.average_validation_time_ms,
                "data_quality_score": stats.data_quality_score,
                "last_validation": stats.last_validation,
                "common_issues": dict(sorted(stats.common_issues.items(), 
                                           key=lambda x: x[1], reverse=True)[:10])
            }
        else:
            # Return summary for all providers
            return {
                "all_providers": {
                    name: {
                        "total_validations": stats.total_validations,
                        "data_quality_score": stats.data_quality_score,
                        "success_rate": stats.successful_validations / max(stats.total_validations, 1),
                        "last_validation": stats.last_validation
                    }
                    for name, stats in self.provider_stats.items()
                },
                "system_summary": {
                    "total_providers": len(self.provider_stats),
                    "total_validations": sum(s.total_validations for s in self.provider_stats.values()),
                    "average_quality_score": sum(s.data_quality_score for s in self.provider_stats.values()) / max(len(self.provider_stats), 1),
                    "recent_validations": len(self.recent_validations)
                }
            }
    
    def get_validation_trends(self, hours_back: int = 24) -> Dict[str, Any]:
        """Get validation trends over time"""
        cutoff_time = time.time() - (hours_back * 3600)
        recent = [v for v in self.recent_validations if v["timestamp"] >= cutoff_time]
        
        if not recent:
            return {"message": f"No validations in the last {hours_back} hours"}
        
        # Calculate trends
        total_validations = len(recent)
        successful = sum(1 for v in recent if v["is_valid"])
        with_warnings = sum(1 for v in recent if v["warning_count"] > 0 and v["is_valid"])
        critical_errors = sum(1 for v in recent if not v["is_valid"])
        
        avg_validation_time = sum(v["validation_time_ms"] for v in recent) / total_validations
        
        # Provider breakdown
        provider_breakdown = defaultdict(lambda: {"total": 0, "successful": 0, "errors": 0})
        for v in recent:
            provider_breakdown[v["provider"]]["total"] += 1
            if v["is_valid"]:
                provider_breakdown[v["provider"]]["successful"] += 1
            else:
                provider_breakdown[v["provider"]]["errors"] += 1
        
        return {
            "time_period_hours": hours_back,
            "total_validations": total_validations,
            "success_rate": successful / total_validations,
            "warning_rate": with_warnings / total_validations,
            "error_rate": critical_errors / total_validations,
            "average_validation_time_ms": avg_validation_time,
            "provider_breakdown": dict(provider_breakdown),
            "trend_status": "healthy" if successful / total_validations > 0.9 else (
                "concerning" if successful / total_validations > 0.7 else "critical"
            )
        }


# Global validator instance
enhanced_schema_validator = EnhancedSchemaValidator()

def get_enhanced_schema_validator() -> EnhancedSchemaValidator:
    """Get the global enhanced schema validator instance"""
    return enhanced_schema_validator