"""
Data Validation Pipeline for A1Betting Platform.

This module provides comprehensive validation for sports betting data without failing operations.
Instead, it annotates opportunities with validation warnings for metrics and monitoring.
"""

from dataclasses import dataclass
from typing import List, Dict, Any, Optional, Union
from datetime import datetime, timedelta
from enum import Enum
import logging
from collections import defaultdict
import asyncio

logger = logging.getLogger("propollama.validation")


class ValidationWarningType(Enum):
    """Types of validation warnings."""
    ODDS_INCOMPLETE = "odds_incomplete"
    ODDS_INVALID_FORMAT = "odds_invalid_format"
    EV_INVALID_FAIR_ODDS = "ev_invalid_fair_odds"
    EV_INVALID_MARKET_ODDS = "ev_invalid_market_odds"
    ARBITRAGE_PROBABILITY_VIOLATION = "arbitrage_probability_violation"
    ARBITRAGE_MISSING_SIDES = "arbitrage_missing_sides"
    NUMERICAL_BOUNDS_VIOLATION = "numerical_bounds_violation"


@dataclass
class ValidationWarning:
    """Represents a validation warning for an opportunity."""
    type: ValidationWarningType
    message: str
    field: str
    value: Any
    timestamp: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses."""
        return {
            "type": self.type.value,
            "message": self.message,
            "field": self.field,
            "value": str(self.value) if self.value is not None else None,
            "timestamp": self.timestamp.isoformat()
        }


@dataclass
class ValidationSummary:
    """Summary of validation warnings over a time period."""
    total_validated: int
    total_warnings: int
    warning_counts: Dict[str, int]
    time_window_minutes: int
    generated_at: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses."""
        return {
            "total_validated": self.total_validated,
            "total_warnings": self.total_warnings,
            "warning_counts": self.warning_counts,
            "time_window_minutes": self.time_window_minutes,
            "generated_at": self.generated_at.isoformat(),
            "warning_rate": round(self.total_warnings / max(self.total_validated, 1) * 100, 2)
        }


class ValidationMetrics:
    """Collects and manages validation metrics."""
    
    def __init__(self):
        self._warnings: List[ValidationWarning] = []
        self._lock = asyncio.Lock()
    
    async def record_warning(self, warning: ValidationWarning) -> None:
        """Record a validation warning."""
        async with self._lock:
            self._warnings.append(warning)
            # Keep only last 24 hours to prevent memory growth
            cutoff = datetime.now() - timedelta(hours=24)
            self._warnings = [w for w in self._warnings if w.timestamp > cutoff]
    
    async def get_summary(self, minutes: int = 15) -> ValidationSummary:
        """Get validation summary for the specified time window."""
        async with self._lock:
            cutoff = datetime.now() - timedelta(minutes=minutes)
            recent_warnings = [w for w in self._warnings if w.timestamp > cutoff]
            
            warning_counts = defaultdict(int)
            for warning in recent_warnings:
                warning_counts[warning.type.value] += 1
            
            # Estimate total validated items (this would be enhanced with actual tracking)
            total_validated = max(len(recent_warnings) * 10, 1)  # Rough estimate
            
            return ValidationSummary(
                total_validated=total_validated,
                total_warnings=len(recent_warnings),
                warning_counts=dict(warning_counts),
                time_window_minutes=minutes,
                generated_at=datetime.now()
            )


class DataValidator:
    """Main data validation class for A1Betting platform."""
    
    def __init__(self, metrics: Optional[ValidationMetrics] = None):
        """Initialize validator with optional metrics collector."""
        self.metrics = metrics or ValidationMetrics()
        self.logger = logging.getLogger("propollama.validation.DataValidator")
    
    async def validate_opportunity(self, opportunity: Dict[str, Any]) -> List[ValidationWarning]:
        """
        Validate a betting opportunity and return list of warnings.
        
        Args:
            opportunity: Opportunity data dictionary
            
        Returns:
            List of validation warnings (empty if no issues)
        """
        warnings = []
        
        # Validate odds completeness and format
        warnings.extend(await self._validate_odds_completeness(opportunity))
        warnings.extend(await self._validate_odds_format(opportunity))
        
        # Validate EV inputs
        warnings.extend(await self._validate_ev_inputs(opportunity))
        
        # Validate arbitrage integrity
        warnings.extend(await self._validate_arbitrage_integrity(opportunity))
        
        # Validate numerical bounds
        warnings.extend(await self._validate_numerical_bounds(opportunity))
        
        # Record warnings in metrics
        for warning in warnings:
            await self.metrics.record_warning(warning)
        
        return warnings
    
    async def _validate_odds_completeness(self, opportunity: Dict[str, Any]) -> List[ValidationWarning]:
        """Validate that odds data is complete."""
        warnings = []
        
        # Check for missing bookmaker
        if not opportunity.get("bestBookmaker") and not opportunity.get("bookmaker"):
            warnings.append(ValidationWarning(
                type=ValidationWarningType.ODDS_INCOMPLETE,
                message="Missing bookmaker information",
                field="bestBookmaker",
                value=None,
                timestamp=datetime.now()
            ))
        
        # Check for missing line data
        line_fields = ["line", "overLine", "underLine"]
        missing_lines = [field for field in line_fields if field in opportunity and opportunity[field] is None]
        
        if missing_lines:
            warnings.append(ValidationWarning(
                type=ValidationWarningType.ODDS_INCOMPLETE,
                message=f"Missing line data: {', '.join(missing_lines)}",
                field="line_data",
                value=missing_lines,
                timestamp=datetime.now()
            ))
        
        # Check for missing odds data
        odds_fields = ["odds", "overOdds", "underOdds"]
        missing_odds = [field for field in odds_fields if field in opportunity and opportunity[field] is None]
        
        if missing_odds:
            warnings.append(ValidationWarning(
                type=ValidationWarningType.ODDS_INCOMPLETE,
                message=f"Missing odds data: {', '.join(missing_odds)}",
                field="odds_data",
                value=missing_odds,
                timestamp=datetime.now()
            ))
        
        return warnings
    
    async def _validate_odds_format(self, opportunity: Dict[str, Any]) -> List[ValidationWarning]:
        """Validate odds format and data types."""
        warnings = []
        
        # Validate line is numeric
        for line_field in ["line", "overLine", "underLine"]:
            if line_field in opportunity and opportunity[line_field] is not None:
                try:
                    float(opportunity[line_field])
                except (ValueError, TypeError):
                    warnings.append(ValidationWarning(
                        type=ValidationWarningType.ODDS_INVALID_FORMAT,
                        message=f"Line field '{line_field}' must be numeric",
                        field=line_field,
                        value=opportunity[line_field],
                        timestamp=datetime.now()
                    ))
        
        # Validate odds are integers (American format)
        for odds_field in ["odds", "overOdds", "underOdds"]:
            if odds_field in opportunity and opportunity[odds_field] is not None:
                try:
                    int(opportunity[odds_field])
                except (ValueError, TypeError):
                    warnings.append(ValidationWarning(
                        type=ValidationWarningType.ODDS_INVALID_FORMAT,
                        message=f"Odds field '{odds_field}' must be integer (American format)",
                        field=odds_field,
                        value=opportunity[odds_field],
                        timestamp=datetime.now()
                    ))
        
        return warnings
    
    async def _validate_ev_inputs(self, opportunity: Dict[str, Any]) -> List[ValidationWarning]:
        """Validate Expected Value calculation inputs."""
        warnings = []
        
        # Check fair odds validity
        fair_odds = opportunity.get("fairOdds")
        if fair_odds is not None:
            try:
                fair_odds_float = float(fair_odds)
                if fair_odds_float <= 0:
                    warnings.append(ValidationWarning(
                        type=ValidationWarningType.EV_INVALID_FAIR_ODDS,
                        message="Fair odds must be greater than 0",
                        field="fairOdds",
                        value=fair_odds,
                        timestamp=datetime.now()
                    ))
            except (ValueError, TypeError):
                warnings.append(ValidationWarning(
                    type=ValidationWarningType.EV_INVALID_FAIR_ODDS,
                    message="Fair odds must be numeric",
                    field="fairOdds",
                    value=fair_odds,
                    timestamp=datetime.now()
                ))
        
        # Check market odds sanity
        for odds_field in ["odds", "overOdds", "underOdds"]:
            if odds_field in opportunity and opportunity[odds_field] is not None:
                try:
                    odds_value = int(opportunity[odds_field])
                    # American odds sanity check: should be between -10000 and +10000
                    if not (-10000 <= odds_value <= 10000):
                        warnings.append(ValidationWarning(
                            type=ValidationWarningType.EV_INVALID_MARKET_ODDS,
                            message=f"Market odds out of reasonable range: {odds_value}",
                            field=odds_field,
                            value=odds_value,
                            timestamp=datetime.now()
                        ))
                except (ValueError, TypeError):
                    # Already handled in format validation
                    pass
        
        return warnings
    
    async def _validate_arbitrage_integrity(self, opportunity: Dict[str, Any]) -> List[ValidationWarning]:
        """Validate arbitrage opportunity integrity."""
        warnings = []
        
        # Check if this is marked as arbitrage opportunity
        has_arbitrage = opportunity.get("hasArbitrage", False)
        if not has_arbitrage:
            return warnings
        
        # Check for both sides of the bet
        over_odds = opportunity.get("overOdds")
        under_odds = opportunity.get("underOdds")
        
        if over_odds is None or under_odds is None:
            warnings.append(ValidationWarning(
                type=ValidationWarningType.ARBITRAGE_MISSING_SIDES,
                message="Arbitrage opportunity missing over/under odds",
                field="arbitrage_sides",
                value={"overOdds": over_odds, "underOdds": under_odds},
                timestamp=datetime.now()
            ))
            return warnings
        
        try:
            # Convert American odds to implied probabilities
            over_odds_int = int(over_odds)
            under_odds_int = int(under_odds)
            
            # Calculate implied probabilities
            over_prob = self._american_odds_to_probability(over_odds_int)
            under_prob = self._american_odds_to_probability(under_odds_int)
            
            # Check probability sum (should be < 1.0 for true arbitrage)
            prob_sum = over_prob + under_prob
            
            # Allow some tolerance for real-world arbitrage (0.85 to 1.15)
            if not (0.85 <= prob_sum <= 1.15):
                warnings.append(ValidationWarning(
                    type=ValidationWarningType.ARBITRAGE_PROBABILITY_VIOLATION,
                    message=f"Arbitrage probability sum out of range: {prob_sum:.4f}",
                    field="probability_sum",
                    value=prob_sum,
                    timestamp=datetime.now()
                ))
        
        except (ValueError, TypeError, ZeroDivisionError) as e:
            warnings.append(ValidationWarning(
                type=ValidationWarningType.ARBITRAGE_PROBABILITY_VIOLATION,
                message=f"Error calculating arbitrage probabilities: {str(e)}",
                field="arbitrage_calculation",
                value={"overOdds": over_odds, "underOdds": under_odds},
                timestamp=datetime.now()
            ))
        
        return warnings
    
    async def _validate_numerical_bounds(self, opportunity: Dict[str, Any]) -> List[ValidationWarning]:
        """Validate numerical fields are within reasonable bounds."""
        warnings = []
        
        # Validate confidence score
        confidence = opportunity.get("confidence")
        if confidence is not None:
            try:
                conf_float = float(confidence)
                if not (0 <= conf_float <= 100):
                    warnings.append(ValidationWarning(
                        type=ValidationWarningType.NUMERICAL_BOUNDS_VIOLATION,
                        message=f"Confidence score out of range [0, 100]: {conf_float}",
                        field="confidence",
                        value=conf_float,
                        timestamp=datetime.now()
                    ))
            except (ValueError, TypeError):
                warnings.append(ValidationWarning(
                    type=ValidationWarningType.NUMERICAL_BOUNDS_VIOLATION,
                    message="Confidence score must be numeric",
                    field="confidence",
                    value=confidence,
                    timestamp=datetime.now()
                ))
        
        # Validate edge percentage
        edge = opportunity.get("edge")
        if edge is not None:
            try:
                edge_float = float(edge)
                if not (-100 <= edge_float <= 500):  # Allow negative edge and up to 500%
                    warnings.append(ValidationWarning(
                        type=ValidationWarningType.NUMERICAL_BOUNDS_VIOLATION,
                        message=f"Edge percentage out of reasonable range: {edge_float}%",
                        field="edge",
                        value=edge_float,
                        timestamp=datetime.now()
                    ))
            except (ValueError, TypeError):
                warnings.append(ValidationWarning(
                    type=ValidationWarningType.NUMERICAL_BOUNDS_VIOLATION,
                    message="Edge must be numeric",
                    field="edge",
                    value=edge,
                    timestamp=datetime.now()
                ))
        
        return warnings
    
    def _american_odds_to_probability(self, odds: int) -> float:
        """Convert American odds to implied probability."""
        if odds > 0:
            return 100 / (odds + 100)
        else:
            return abs(odds) / (abs(odds) + 100)


# Global metrics instance for the application
_global_metrics = ValidationMetrics()


def get_validation_metrics() -> ValidationMetrics:
    """Get the global validation metrics instance."""
    return _global_metrics