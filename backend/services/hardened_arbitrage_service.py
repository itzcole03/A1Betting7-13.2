"""
Hardened Arbitrage Detection Service

Comprehensive arbitrage detection with advanced validation, anomaly detection,
and configurable thresholds. Implements triangle consistency checks, implied
probability validation, and sophisticated alerting mechanisms.
"""

import asyncio
import hashlib
import logging
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Tuple, Union
import json

import numpy as np
from pydantic import BaseModel, Field

from backend.services.unified_logging import unified_logging
from backend.services.unified_cache_service import unified_cache_service

logger = unified_logging.get_logger("hardened_arbitrage")


class DetectionReason(str, Enum):
    """Reasons for arbitrage detection"""
    IMPLIED_PROBABILITY_GAP = "implied_probability_gap"
    CROSS_MARKET_INEFFICIENCY = "cross_market_inefficiency"
    TWO_WAY_ARBITRAGE = "two_way_arbitrage"
    THREE_WAY_ARBITRAGE = "three_way_arbitrage"
    TRIANGLE_ARBITRAGE = "triangle_arbitrage"
    TEMPORAL_ARBITRAGE = "temporal_arbitrage"
    STATISTICAL_ARBITRAGE = "statistical_arbitrage"


class AnomalyType(str, Enum):
    """Types of arbitrage anomalies"""
    SUSPICIOUS_PROFIT_MARGIN = "suspicious_profit_margin"  # Profit too high to be realistic
    ODDS_OUTLIER = "odds_outlier"  # Odds significantly different from market consensus
    STALE_ODDS_DETECTED = "stale_odds_detected"  # One book's odds haven't updated recently
    UNUSUAL_BOOK_COMBINATION = "unusual_book_combination"  # Unlikely sportsbook pairing
    RAPID_ODDS_MOVEMENT = "rapid_odds_movement"  # Odds changing too quickly
    VOLUME_ANOMALY = "volume_anomaly"  # Unusual betting volume patterns


@dataclass
class ArbitrageConfig:
    """Configuration for arbitrage detection"""
    min_profit_pct: float = 1.0  # Minimum profit percentage threshold
    max_profit_pct: float = 25.0  # Maximum realistic profit percentage
    max_stake_per_opportunity: float = 10000.0  # Maximum stake per arbitrage
    alert_volume_threshold: int = 10  # Alert if > X opportunities in window
    alert_time_window_minutes: int = 5  # Time window for volume alerting
    enable_anomaly_detection: bool = True
    enable_triangle_validation: bool = True
    enable_cross_market_validation: bool = True
    stale_odds_threshold_seconds: int = 300  # 5 minutes
    min_books_for_validation: int = 3
    
    # Anomaly detection thresholds
    suspicious_profit_threshold: float = 15.0  # > 15% profit is suspicious
    odds_outlier_z_score_threshold: float = 3.0
    volume_spike_threshold: float = 5.0  # 5x normal volume


@dataclass
class OddsSnapshot:
    """Snapshot of odds data for a specific market"""
    book_id: str
    event_id: str
    market_type: str
    outcome: str
    odds: float
    line: Optional[float]
    max_stake: Optional[float]
    timestamp: datetime
    market_volume: Optional[float] = None
    source_quality: float = 1.0


@dataclass
class ValidationResult:
    """Result of arbitrage validation"""
    is_valid: bool
    confidence_score: float
    anomaly_flags: List[AnomalyType] = field(default_factory=list)
    validation_notes: List[str] = field(default_factory=list)
    implied_probability_sum: Optional[float] = None
    triangle_consistency_score: Optional[float] = None


@dataclass
class HardenedArbitrageOpportunity:
    """Enhanced arbitrage opportunity with validation and metadata"""
    id: str
    detection_reason: DetectionReason
    books_involved: List[str]
    event_id: str
    market_type: str
    
    # Financial metrics
    guaranteed_profit_pct: float
    total_stake_required: float
    stake_distribution: Dict[str, float]
    expected_return: float
    
    # Validation results
    validation_result: ValidationResult
    
    # Enhanced metadata (required fields first)
    normalized_odds_snapshot_hash: str
    confidence_score: float
    execution_risk_score: float
    time_sensitivity_score: float
    
    # Odds data (required fields)
    odds_snapshots: List[OddsSnapshot]
    implied_probabilities: Dict[str, float]
    
    # Timestamps (required fields)
    detection_timestamp: datetime
    
    # Optional fields with defaults (must come after required fields)
    anomaly: bool = False
    anomaly_types: List[AnomalyType] = field(default_factory=list)
    market_consensus: Optional[Dict[str, Any]] = None
    expiry_timestamp: Optional[datetime] = None
    
    # Additional context
    market_conditions: Dict[str, Any] = field(default_factory=dict)
    execution_notes: List[str] = field(default_factory=list)


class ArbitrageMetrics:
    """Metrics tracking for arbitrage detection"""
    
    def __init__(self):
        self.counters = {
            "arbitrage_opportunities_total": 0,
            "arbitrage_anomalies_total": 0,
            "arbitrage_threshold_adjustments_total": 0,
            "validation_failures_total": 0,
            "triangle_consistency_checks_total": 0,
            "cross_market_validations_total": 0,
            "stale_odds_detected_total": 0,
            "suspicious_profits_flagged_total": 0,
        }
        
        # Time-windowed tracking
        self.opportunity_history = deque(maxlen=1000)
        self.alert_history = deque(maxlen=500)
        
    def increment_counter(self, counter_name: str, increment: int = 1):
        """Increment a metric counter"""
        if counter_name in self.counters:
            self.counters[counter_name] += increment
            
    def record_opportunity(self, opportunity: HardenedArbitrageOpportunity):
        """Record an arbitrage opportunity for metrics"""
        self.opportunity_history.append({
            "timestamp": opportunity.detection_timestamp,
            "profit_pct": opportunity.guaranteed_profit_pct,
            "anomaly": opportunity.anomaly,
            "books_count": len(opportunity.books_involved)
        })
        
    def get_metrics_snapshot(self) -> Dict[str, Any]:
        """Get current metrics snapshot"""
        return {
            "counters": self.counters.copy(),
            "recent_opportunities": len(self.opportunity_history),
            "recent_alerts": len(self.alert_history),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


class HardenedArbitrageValidator:
    """Advanced validation logic for arbitrage opportunities"""
    
    def __init__(self, config: ArbitrageConfig):
        self.config = config
        
    async def validate_arbitrage_opportunity(
        self, 
        odds_snapshots: List[OddsSnapshot],
        profit_pct: float
    ) -> ValidationResult:
        """
        Comprehensive validation of arbitrage opportunity
        
        Performs multiple validation checks:
        1. Implied probability coverage validation
        2. Triangle consistency checks (3+ books)
        3. Anomaly detection
        4. Cross-market consistency
        """
        
        validation_result = ValidationResult(
            is_valid=True,
            confidence_score=1.0,
            anomaly_flags=[],
            validation_notes=[]
        )
        
        try:
            # 1. Implied Probability Validation
            await self._validate_implied_probabilities(odds_snapshots, validation_result)
            
            # 2. Triangle Consistency Check (if enabled and sufficient books)
            if (self.config.enable_triangle_validation and 
                len(odds_snapshots) >= self.config.min_books_for_validation):
                await self._validate_triangle_consistency(odds_snapshots, validation_result)
                
            # 3. Anomaly Detection
            if self.config.enable_anomaly_detection:
                await self._detect_anomalies(odds_snapshots, profit_pct, validation_result)
                
            # 4. Stale Odds Detection
            await self._detect_stale_odds(odds_snapshots, validation_result)
            
            # 5. Overall validation decision
            self._finalize_validation(validation_result)
            
            return validation_result
            
        except Exception as e:
            logger.error(f"Arbitrage validation failed: {e}")
            validation_result.is_valid = False
            validation_result.confidence_score = 0.0
            validation_result.validation_notes.append(f"Validation error: {str(e)}")
            return validation_result
    
    async def _validate_implied_probabilities(
        self, 
        odds_snapshots: List[OddsSnapshot], 
        result: ValidationResult
    ):
        """
        Validate that implied probability set coverage < 1 only when legitimate
        """
        try:
            # Group odds by outcome
            outcomes = defaultdict(list)
            for snapshot in odds_snapshots:
                outcomes[snapshot.outcome].append(snapshot)
            
            if len(outcomes) < 2:
                result.validation_notes.append("Insufficient outcomes for arbitrage")
                result.confidence_score *= 0.5
                return
            
            # Calculate best odds for each outcome
            best_odds_by_outcome = {}
            for outcome, snapshots in outcomes.items():
                best_odds = max(s.odds for s in snapshots)
                best_odds_by_outcome[outcome] = best_odds
            
            # Calculate total implied probability
            total_implied_prob = sum(1/odds for odds in best_odds_by_outcome.values())
            result.implied_probability_sum = total_implied_prob
            
            # Validate arbitrage existence
            if total_implied_prob >= 1.0:
                result.is_valid = False
                result.validation_notes.append(
                    f"No arbitrage: total implied probability {total_implied_prob:.4f} >= 1.0"
                )
                return
            
            # Check for suspicious arbitrage margins
            arbitrage_margin = 1.0 - total_implied_prob
            arbitrage_margin_pct = arbitrage_margin * 100
            
            if arbitrage_margin_pct > self.config.suspicious_profit_threshold:
                result.anomaly_flags.append(AnomalyType.SUSPICIOUS_PROFIT_MARGIN)
                result.validation_notes.append(
                    f"Suspicious arbitrage margin: {arbitrage_margin_pct:.2f}%"
                )
                result.confidence_score *= 0.3  # High suspicion
            
            # Validate that probability coverage makes sense
            # For legitimate arbitrage, the gap should be reasonable
            min_expected_gap = 0.005  # 0.5% minimum gap
            max_expected_gap = 0.15   # 15% maximum gap
            
            if arbitrage_margin < min_expected_gap:
                result.anomaly_flags.append(AnomalyType.SUSPICIOUS_PROFIT_MARGIN)
                result.validation_notes.append(
                    f"Arbitrage margin too small: {arbitrage_margin_pct:.3f}%"
                )
                result.confidence_score *= 0.7
            elif arbitrage_margin > max_expected_gap:
                result.anomaly_flags.append(AnomalyType.SUSPICIOUS_PROFIT_MARGIN)
                result.validation_notes.append(
                    f"Arbitrage margin too large: {arbitrage_margin_pct:.2f}%"
                )
                result.confidence_score *= 0.2
            else:
                result.validation_notes.append(
                    f"Valid arbitrage margin: {arbitrage_margin_pct:.2f}%"
                )
                
        except Exception as e:
            logger.error(f"Implied probability validation failed: {e}")
            result.confidence_score *= 0.5
            result.validation_notes.append(f"Probability validation error: {str(e)}")
    
    async def _validate_triangle_consistency(
        self, 
        odds_snapshots: List[OddsSnapshot], 
        result: ValidationResult
    ):
        """
        Perform triangle/cross-market consistency check for 3+ book odds
        Basic sanity check that odds relationships make sense
        """
        try:
            if len(odds_snapshots) < 3:
                return
            
            # Group by sportsbook
            books = defaultdict(list)
            for snapshot in odds_snapshots:
                books[snapshot.book_id].append(snapshot)
            
            book_ids = list(books.keys())
            if len(book_ids) < 3:
                result.validation_notes.append("Insufficient books for triangle validation")
                return
            
            # Check consistency across book pairs
            consistency_scores = []
            
            for i in range(len(book_ids)):
                for j in range(i + 1, len(book_ids)):
                    book_a_odds = {s.outcome: s.odds for s in books[book_ids[i]]}
                    book_b_odds = {s.outcome: s.odds for s in books[book_ids[j]]}
                    
                    # Find common outcomes
                    common_outcomes = set(book_a_odds.keys()) & set(book_b_odds.keys())
                    
                    if len(common_outcomes) >= 2:
                        # Calculate consistency score
                        score = await self._calculate_book_consistency(
                            book_a_odds, book_b_odds, common_outcomes
                        )
                        consistency_scores.append(score)
            
            if consistency_scores:
                avg_consistency = float(np.mean(consistency_scores))
                result.triangle_consistency_score = avg_consistency
                
                # Flagging thresholds
                if avg_consistency < 0.5:  # Poor consistency
                    result.anomaly_flags.append(AnomalyType.UNUSUAL_BOOK_COMBINATION)
                    result.validation_notes.append(
                        f"Poor triangle consistency: {avg_consistency:.3f}"
                    )
                    result.confidence_score *= 0.6
                elif avg_consistency > 0.8:  # Good consistency
                    result.validation_notes.append(
                        f"Good triangle consistency: {avg_consistency:.3f}"
                    )
                else:  # Moderate consistency
                    result.validation_notes.append(
                        f"Moderate triangle consistency: {avg_consistency:.3f}"
                    )
                    result.confidence_score *= 0.9
            else:
                # Default neutral score when overlapping outcomes are sparse
                result.triangle_consistency_score = 0.0
                result.validation_notes.append(
                    "Triangle consistency check executed but lacked overlapping outcomes; defaulting score to 0.0"
                )
                result.confidence_score *= 0.95
                    
        except Exception as e:
            logger.error(f"Triangle consistency validation failed: {e}")
            result.validation_notes.append(f"Triangle validation error: {str(e)}")
    
    async def _calculate_book_consistency(
        self, 
        book_a_odds: Dict[str, float], 
        book_b_odds: Dict[str, float],
        common_outcomes: Set[str]
    ) -> float:
        """Calculate consistency score between two sportsbooks"""
        try:
            if len(common_outcomes) < 2:
                return 0.5  # Neutral score
            
            # Compare implied probabilities
            prob_differences = []
            
            for outcome in common_outcomes:
                prob_a = 1 / book_a_odds[outcome]
                prob_b = 1 / book_b_odds[outcome]
                diff = abs(prob_a - prob_b)
                prob_differences.append(diff)
            
            # Calculate consistency score (lower difference = higher consistency)
            avg_diff = float(np.mean(prob_differences))
            max_expected_diff = 0.1  # 10% probability difference is reasonable
            
            consistency_score = max(0.0, 1.0 - (avg_diff / max_expected_diff))
            return float(min(1.0, consistency_score))
            
        except Exception as e:
            logger.error(f"Book consistency calculation failed: {e}")
            return 0.5
    
    async def _detect_anomalies(
        self, 
        odds_snapshots: List[OddsSnapshot], 
        profit_pct: float,
        result: ValidationResult
    ):
        """Detect various types of anomalies in arbitrage opportunities"""
        try:
            # 1. Odds outlier detection
            await self._detect_odds_outliers(odds_snapshots, result)
            
            # 2. Volume anomaly detection
            await self._detect_volume_anomalies(odds_snapshots, result)
            
            # 3. Rapid odds movement detection
            await self._detect_rapid_movement(odds_snapshots, result)
            
            # 4. Unusual book combination detection
            await self._detect_unusual_book_combinations(odds_snapshots, result)
            
        except Exception as e:
            logger.error(f"Anomaly detection failed: {e}")
            result.validation_notes.append(f"Anomaly detection error: {str(e)}")
    
    async def _detect_odds_outliers(
        self, 
        odds_snapshots: List[OddsSnapshot], 
        result: ValidationResult
    ):
        """Detect odds that are significant outliers from market consensus"""
        try:
            # Group by outcome
            outcomes = defaultdict(list)
            for snapshot in odds_snapshots:
                outcomes[snapshot.outcome].append(snapshot.odds)
            
            for outcome, odds_list in outcomes.items():
                if len(odds_list) >= 3:  # Need at least 3 for outlier detection
                    odds_array = np.array(odds_list)
                    mean_odds = float(np.mean(odds_array))
                    std_odds = float(np.std(odds_array))
                    
                    flagged = False
                    max_z_score_value = 0.0

                    if std_odds > 0:
                        z_scores = np.abs((odds_array - mean_odds) / std_odds)
                        outlier_indices = np.where(
                            z_scores > self.config.odds_outlier_z_score_threshold
                        )[0]
                        if len(outlier_indices) > 0:
                            flagged = True
                            max_z_score_value = float(np.max(z_scores[outlier_indices]))
                            result.validation_notes.append(
                                f"Odds outlier detected for {outcome}: z-score {max_z_score_value:.2f}"
                            )

                    if not flagged:
                        median_odds = float(np.median(odds_array))
                        if median_odds > 0:
                            max_ratio = max(odds_array) / median_odds
                            min_ratio = median_odds / min(odds_array)
                            ratio_threshold = 1.5  # 50% deviation from median
                            if max_ratio >= ratio_threshold or min_ratio >= ratio_threshold:
                                flagged = True
                                result.validation_notes.append(
                                    f"Odds outlier detected for {outcome}: ratio to median {max(max_ratio, min_ratio):.2f}"
                                )

                    if flagged:
                        result.anomaly_flags.append(AnomalyType.ODDS_OUTLIER)
                        result.confidence_score *= 0.7
                            
        except Exception as e:
            logger.error(f"Odds outlier detection failed: {e}")
    
    async def _detect_stale_odds(
        self, 
        odds_snapshots: List[OddsSnapshot], 
        result: ValidationResult
    ):
        """Detect stale odds that haven't been updated recently"""
        try:
            current_time = datetime.now(timezone.utc)
            stale_threshold = timedelta(seconds=self.config.stale_odds_threshold_seconds)
            
            stale_books = []
            for snapshot in odds_snapshots:
                if snapshot.timestamp:
                    age = current_time - snapshot.timestamp
                    if age > stale_threshold:
                        stale_books.append(snapshot.book_id)
            
            if stale_books:
                result.anomaly_flags.append(AnomalyType.STALE_ODDS_DETECTED)
                result.validation_notes.append(
                    f"Stale odds detected from books: {', '.join(set(stale_books))}"
                )
                result.confidence_score *= 0.5  # Significantly reduce confidence
                
        except Exception as e:
            logger.error(f"Stale odds detection failed: {e}")
    
    async def _detect_volume_anomalies(
        self, 
        odds_snapshots: List[OddsSnapshot], 
        result: ValidationResult
    ):
        """Detect unusual betting volume patterns"""
        try:
            # This would typically connect to volume data sources
            # For now, check if volume data is available and looks suspicious
            volumes = [s.market_volume for s in odds_snapshots if s.market_volume]
            
            if len(volumes) >= 2:
                volume_array = np.array(volumes)
                if np.std(volume_array) > 0:
                    max_volume = np.max(volume_array)
                    avg_volume = np.mean(volume_array)
                    
                    if max_volume > avg_volume * self.config.volume_spike_threshold:
                        result.anomaly_flags.append(AnomalyType.VOLUME_ANOMALY)
                        result.validation_notes.append(
                            f"Volume spike detected: {max_volume:.0f} vs avg {avg_volume:.0f}"
                        )
                        
        except Exception as e:
            logger.error(f"Volume anomaly detection failed: {e}")
    
    async def _detect_rapid_movement(
        self, 
        odds_snapshots: List[OddsSnapshot], 
        result: ValidationResult
    ):
        """Detect rapid odds movement that might indicate stale data"""
        try:
            # Group by book and outcome, sort by timestamp
            book_outcome_histories = defaultdict(list)
            
            for snapshot in odds_snapshots:
                key = f"{snapshot.book_id}_{snapshot.outcome}"
                book_outcome_histories[key].append(snapshot)
            
            # Check for rapid movement in any book/outcome combination
            for key, snapshots in book_outcome_histories.items():
                if len(snapshots) >= 2:
                    snapshots.sort(key=lambda x: x.timestamp)
                    
                    for i in range(1, len(snapshots)):
                        prev_snapshot = snapshots[i-1]
                        curr_snapshot = snapshots[i]
                        
                        time_diff = (curr_snapshot.timestamp - prev_snapshot.timestamp).total_seconds()
                        if time_diff > 0 and time_diff < 60:  # Within 1 minute
                            odds_change_pct = abs(
                                (curr_snapshot.odds - prev_snapshot.odds) / prev_snapshot.odds
                            ) * 100
                            
                            if odds_change_pct > 10:  # > 10% change in < 1 minute
                                result.anomaly_flags.append(AnomalyType.RAPID_ODDS_MOVEMENT)
                                result.validation_notes.append(
                                    f"Rapid odds movement: {odds_change_pct:.1f}% in {time_diff:.0f}s"
                                )
                                
        except Exception as e:
            logger.error(f"Rapid movement detection failed: {e}")
    
    async def _detect_unusual_book_combinations(
        self, 
        odds_snapshots: List[OddsSnapshot], 
        result: ValidationResult
    ):
        """Detect unusual sportsbook combinations that rarely offer arbitrage"""
        try:
            books = set(snapshot.book_id for snapshot in odds_snapshots)
            
            # This would typically use historical data to identify unusual combinations
            # For now, just check for certain known patterns
            
            # Example: Certain books that are typically very close in pricing
            similar_pricing_books = [
                {'pinnnacle', 'betfair'},
                {'draftkings', 'fanduel'},
                {'bet365', 'william_hill'}
            ]
            
            for book_group in similar_pricing_books:
                if len(books & book_group) >= 2:
                    result.validation_notes.append(
                        f"Arbitrage between typically similar books: {books & book_group}"
                    )
                    # Note: This is just informational, not necessarily an anomaly
                    
        except Exception as e:
            logger.error(f"Unusual book combination detection failed: {e}")
    
    def _finalize_validation(self, result: ValidationResult):
        """Finalize validation result based on all checks"""
        # If there are critical anomalies, mark as invalid
        critical_anomalies = {
            AnomalyType.STALE_ODDS_DETECTED,
            AnomalyType.SUSPICIOUS_PROFIT_MARGIN
        }
        
        if any(anomaly in critical_anomalies for anomaly in result.anomaly_flags):
            result.is_valid = False
            
        # Adjust confidence based on anomaly count
        anomaly_penalty = len(result.anomaly_flags) * 0.1
        result.confidence_score = max(0.0, result.confidence_score - anomaly_penalty)


class HardenedArbitrageService:
    """
    Main hardened arbitrage detection service with comprehensive validation,
    configurable thresholds, alerting, and anomaly detection.
    """
    
    def __init__(self, config: Optional[ArbitrageConfig] = None):
        self.config = config or ArbitrageConfig()
        self.validator = HardenedArbitrageValidator(self.config)
        self.metrics = ArbitrageMetrics()
        
        # In-memory configuration storage (ephemeral)
        self._runtime_config = self.config
        
        # Alerting state
        self.alert_window = deque(maxlen=100)
        
        # Cache for odds snapshots and hashing
        self.odds_cache = {}
        
    async def detect_arbitrage_opportunities(
        self, 
        odds_data: List[Dict[str, Any]],
        market_context: Optional[Dict[str, Any]] = None
    ) -> List[HardenedArbitrageOpportunity]:
        """
        Main arbitrage detection method with full validation pipeline
        """
        opportunities = []
        
        try:
            # Convert raw odds data to structured snapshots
            odds_snapshots = await self._parse_odds_data(odds_data)
            
            # Group by event and market
            grouped_odds = self._group_odds_by_market(odds_snapshots)
            
            # Detect opportunities for each market
            for market_key, market_odds in grouped_odds.items():
                market_opportunities = await self._detect_market_arbitrage(
                    market_key, market_odds, market_context
                )
                opportunities.extend(market_opportunities)
            
            # Filter by profit threshold
            filtered_opportunities = [
                opp for opp in opportunities 
                if opp.guaranteed_profit_pct >= self._runtime_config.min_profit_pct
            ]
            
            # Check alerting thresholds
            await self._check_alerting_thresholds(filtered_opportunities)
            
            # Update metrics
            for opp in filtered_opportunities:
                self.metrics.record_opportunity(opp)
                self.metrics.increment_counter("arbitrage_opportunities_total")
                if opp.anomaly:
                    self.metrics.increment_counter("arbitrage_anomalies_total")
            
            logger.info(f"Detected {len(filtered_opportunities)} arbitrage opportunities")
            
            return filtered_opportunities
            
        except Exception as e:
            logger.error(f"Arbitrage detection failed: {e}")
            return []
    
    async def _parse_odds_data(self, odds_data: List[Dict[str, Any]]) -> List[OddsSnapshot]:
        """Parse raw odds data into structured snapshots"""
        snapshots = []
        
        for odds_entry in odds_data:
            try:
                snapshot = OddsSnapshot(
                    book_id=odds_entry.get('book_id', odds_entry.get('sportsbook', 'unknown')),
                    event_id=odds_entry.get('event_id', 'unknown'),
                    market_type=odds_entry.get('market_type', odds_entry.get('market', 'unknown')),
                    outcome=odds_entry.get('outcome', odds_entry.get('side', 'unknown')),
                    odds=float(odds_entry.get('odds', 0)),
                    line=odds_entry.get('line'),
                    max_stake=odds_entry.get('max_stake'),
                    timestamp=odds_entry.get('timestamp', datetime.now(timezone.utc)),
                    market_volume=odds_entry.get('volume'),
                    source_quality=odds_entry.get('quality', 1.0)
                )
                
                if snapshot.odds > 1.0:  # Valid odds
                    snapshots.append(snapshot)
                    
            except Exception as e:
                logger.warning(f"Failed to parse odds entry: {e}")
                continue
        
        return snapshots
    
    def _group_odds_by_market(self, snapshots: List[OddsSnapshot]) -> Dict[str, List[OddsSnapshot]]:
        """Group odds snapshots by market"""
        groups = defaultdict(list)
        
        for snapshot in snapshots:
            key = f"{snapshot.event_id}_{snapshot.market_type}"
            groups[key].append(snapshot)
        
        return dict(groups)
    
    async def _detect_market_arbitrage(
        self, 
        market_key: str, 
        market_odds: List[OddsSnapshot],
        market_context: Optional[Dict[str, Any]]
    ) -> List[HardenedArbitrageOpportunity]:
        """Detect arbitrage opportunities within a single market"""
        opportunities = []
        
        try:
            # Group by outcome
            outcomes = defaultdict(list)
            for snapshot in market_odds:
                outcomes[snapshot.outcome].append(snapshot)
            
            # Need at least 2 outcomes for arbitrage
            if len(outcomes) < 2:
                return opportunities
            
            # Find best odds for each outcome
            best_odds_by_outcome = {}
            for outcome, snapshots in outcomes.items():
                best_snapshot = max(snapshots, key=lambda s: s.odds)
                best_odds_by_outcome[outcome] = best_snapshot
            
            # Check for arbitrage
            total_implied_prob = sum(1/snapshot.odds for snapshot in best_odds_by_outcome.values())
            
            if total_implied_prob < 1.0:  # Arbitrage exists
                # Calculate profit
                arbitrage_margin = 1.0 - total_implied_prob
                profit_pct = (arbitrage_margin / total_implied_prob) * 100
                
                # Only proceed if profit meets minimum threshold
                if profit_pct >= self._runtime_config.min_profit_pct:
                    # Validate the opportunity
                    validation_result = await self.validator.validate_arbitrage_opportunity(
                        list(best_odds_by_outcome.values()), profit_pct
                    )
                    
                    if validation_result.is_valid or len(validation_result.anomaly_flags) == 0:
                        # Create arbitrage opportunity
                        opportunity = await self._create_arbitrage_opportunity(
                            market_key, best_odds_by_outcome, profit_pct, 
                            validation_result, market_context
                        )
                        opportunities.append(opportunity)
            
            return opportunities
            
        except Exception as e:
            logger.error(f"Market arbitrage detection failed for {market_key}: {e}")
            return []
    
    async def _create_arbitrage_opportunity(
        self,
        market_key: str,
        best_odds_by_outcome: Dict[str, OddsSnapshot],
        profit_pct: float,
        validation_result: ValidationResult,
        market_context: Optional[Dict[str, Any]]
    ) -> HardenedArbitrageOpportunity:
        """Create a structured arbitrage opportunity"""
        
        # Calculate stakes and financial metrics
        total_stake = 1000.0  # Base calculation
        stakes = {}
        books_involved = []
        odds_snapshots = list(best_odds_by_outcome.values())
        
        total_implied_prob = sum(1/snapshot.odds for snapshot in odds_snapshots)
        
        for outcome, snapshot in best_odds_by_outcome.items():
            implied_prob = 1 / snapshot.odds
            stake = total_stake * (implied_prob / total_implied_prob)
            stakes[snapshot.book_id] = stake
            books_involved.append(snapshot.book_id)
        
        # Generate normalized odds snapshot hash
        odds_hash = self._generate_odds_hash(odds_snapshots)
        
        # Determine detection reason
        detection_reason = self._determine_detection_reason(odds_snapshots, validation_result)
        
        # Calculate risk scores
        execution_risk = self._calculate_execution_risk(odds_snapshots)
        time_sensitivity = self._calculate_time_sensitivity(odds_snapshots)
        
        # Create opportunity
        opportunity = HardenedArbitrageOpportunity(
            id=f"harb_{market_key}_{int(time.time())}",
            detection_reason=detection_reason,
            books_involved=list(set(books_involved)),
            event_id=odds_snapshots[0].event_id,
            market_type=odds_snapshots[0].market_type,
            guaranteed_profit_pct=profit_pct,
            total_stake_required=total_stake,
            stake_distribution=stakes,
            expected_return=total_stake * (profit_pct / 100),
            validation_result=validation_result,
            anomaly=len(validation_result.anomaly_flags) > 0,
            anomaly_types=validation_result.anomaly_flags,
            normalized_odds_snapshot_hash=odds_hash,
            confidence_score=validation_result.confidence_score,
            execution_risk_score=execution_risk,
            time_sensitivity_score=time_sensitivity,
            odds_snapshots=odds_snapshots,
            implied_probabilities={
                snapshot.outcome: 1/snapshot.odds 
                for snapshot in odds_snapshots
            },
            detection_timestamp=datetime.now(timezone.utc),
            expiry_timestamp=datetime.now(timezone.utc) + timedelta(minutes=10),
            market_conditions=market_context or {}
        )
        
        return opportunity
    
    def _generate_odds_hash(self, odds_snapshots: List[OddsSnapshot]) -> str:
        """Generate a normalized hash of the odds snapshot for tracking"""
        # Sort snapshots for consistent hashing
        sorted_snapshots = sorted(
            odds_snapshots, 
            key=lambda s: (s.book_id, s.outcome, s.odds)
        )
        
        # Create hash input
        hash_data = []
        for snapshot in sorted_snapshots:
            hash_data.append(f"{snapshot.book_id}:{snapshot.outcome}:{snapshot.odds:.4f}")
        
        hash_input = "|".join(hash_data)
        return hashlib.md5(hash_input.encode()).hexdigest()[:16]
    
    def _determine_detection_reason(
        self, 
        odds_snapshots: List[OddsSnapshot], 
        validation_result: ValidationResult
    ) -> DetectionReason:
        """Determine the primary reason for arbitrage detection"""
        
        # Simple heuristic based on number of outcomes and validation results
        outcomes = set(snapshot.outcome for snapshot in odds_snapshots)
        
        if len(outcomes) == 2:
            return DetectionReason.TWO_WAY_ARBITRAGE
        elif len(outcomes) == 3:
            return DetectionReason.THREE_WAY_ARBITRAGE
        elif validation_result.triangle_consistency_score and validation_result.triangle_consistency_score < 0.7:
            return DetectionReason.TRIANGLE_ARBITRAGE
        else:
            return DetectionReason.IMPLIED_PROBABILITY_GAP
    
    def _calculate_execution_risk(self, odds_snapshots: List[OddsSnapshot]) -> float:
        """Calculate execution risk score (0-1, higher = riskier)"""
        risk_factors = []
        
        # Time-based risk
        current_time = datetime.now(timezone.utc)
        for snapshot in odds_snapshots:
            if snapshot.timestamp:
                age_seconds = (current_time - snapshot.timestamp).total_seconds()
                time_risk = min(age_seconds / 300, 1.0)  # Max risk at 5 minutes
                risk_factors.append(time_risk)
        
        # Source quality risk
        if odds_snapshots:
            quality_risk = 1.0 - float(np.mean([s.source_quality for s in odds_snapshots]))
            risk_factors.append(quality_risk)
        
        # Number of books risk (more books = higher execution complexity)
        books_count = len(set(s.book_id for s in odds_snapshots))
        books_risk = min((books_count - 2) * 0.2, 1.0)  # Risk increases with more books
        risk_factors.append(books_risk)
        
        return float(np.mean(risk_factors)) if risk_factors else 0.5
    
    def _calculate_time_sensitivity(self, odds_snapshots: List[OddsSnapshot]) -> float:
        """Calculate time sensitivity score (0-1, higher = more time sensitive)"""
        # Base sensitivity on odds volatility and market type
        
        # High sensitivity markets
        high_sensitivity_markets = ['live', 'in_play', 'live_betting']
        market_types = [s.market_type.lower() for s in odds_snapshots]
        
        if any(hs_market in market_types for hs_market in high_sensitivity_markets):
            return 0.9  # Very time sensitive
        
        # Calculate based on odds spread (higher spread = more volatile = more sensitive)
        all_odds = [s.odds for s in odds_snapshots]
        if len(all_odds) > 1:
            odds_std = float(np.std(all_odds))
            odds_mean = float(np.mean(all_odds)) if np.mean(all_odds) != 0 else 0.0
            if odds_mean == 0:
                return 0.5
            odds_cv = odds_std / odds_mean  # Coefficient of variation
            sensitivity = min(odds_cv * 5, 1.0)  # Scale to 0-1
            return float(sensitivity)
        
        return 0.5  # Default moderate sensitivity
    
    async def _check_alerting_thresholds(self, opportunities: List[HardenedArbitrageOpportunity]):
        """Check if arbitrage opportunity volume exceeds alerting thresholds"""
        current_time = datetime.now(timezone.utc)
        
        # Add current opportunities to alert window
        for opp in opportunities:
            self.alert_window.append({
                'timestamp': current_time,
                'profit_pct': opp.guaranteed_profit_pct,
                'books': opp.books_involved
            })
        
        # Check volume in time window
        window_start = current_time - timedelta(minutes=self._runtime_config.alert_time_window_minutes)
        recent_opportunities = [
            alert for alert in self.alert_window 
            if alert['timestamp'] >= window_start
        ]
        
        if len(recent_opportunities) > self._runtime_config.alert_volume_threshold:
            # Emit alert
            await self._emit_volume_alert(len(recent_opportunities), recent_opportunities)
    
    async def _emit_volume_alert(
        self, 
        opportunity_count: int, 
        recent_opportunities: List[Dict[str, Any]]
    ):
        """Emit internal log event for high arbitrage opportunity volume"""
        alert_data = {
            'alert_type': 'arbitrage_volume_spike',
            'opportunity_count': opportunity_count,
            'time_window_minutes': self._runtime_config.alert_time_window_minutes,
            'threshold': self._runtime_config.alert_volume_threshold,
            'avg_profit_pct': float(np.mean([opp['profit_pct'] for opp in recent_opportunities])) if recent_opportunities else 0.0,
            'unique_books': len(set().union(*[opp['books'] for opp in recent_opportunities])),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        
        # Log as WARNING level event
        logger.warning(
            f"Arbitrage volume alert: {opportunity_count} opportunities in "
            f"{self._runtime_config.alert_time_window_minutes} minutes "
            f"(threshold: {self._runtime_config.alert_volume_threshold})",
            extra={'alert_data': alert_data}
        )
        
        # Store alert in metrics
        self.metrics.alert_history.append(alert_data)
    
    # Configuration management methods
    
    async def get_arbitrage_config(self) -> Dict[str, Any]:
        """Get current arbitrage configuration"""
        return {
            'min_profit_pct': self._runtime_config.min_profit_pct,
            'max_profit_pct': self._runtime_config.max_profit_pct,
            'max_stake_per_opportunity': self._runtime_config.max_stake_per_opportunity,
            'alert_volume_threshold': self._runtime_config.alert_volume_threshold,
            'alert_time_window_minutes': self._runtime_config.alert_time_window_minutes,
            'enable_anomaly_detection': self._runtime_config.enable_anomaly_detection,
            'enable_triangle_validation': self._runtime_config.enable_triangle_validation,
            'enable_cross_market_validation': self._runtime_config.enable_cross_market_validation,
            'stale_odds_threshold_seconds': self._runtime_config.stale_odds_threshold_seconds,
            'min_books_for_validation': self._runtime_config.min_books_for_validation,
            'suspicious_profit_threshold': self._runtime_config.suspicious_profit_threshold,
            'odds_outlier_z_score_threshold': self._runtime_config.odds_outlier_z_score_threshold,
            'volume_spike_threshold': self._runtime_config.volume_spike_threshold,
            'last_updated': datetime.now(timezone.utc).isoformat()
        }
    
    async def update_arbitrage_config(self, config_updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update arbitrage configuration (ephemeral in-memory storage)"""
        try:
            # Validate configuration updates
            valid_fields = {
                'min_profit_pct', 'max_profit_pct', 'max_stake_per_opportunity',
                'alert_volume_threshold', 'alert_time_window_minutes',
                'enable_anomaly_detection', 'enable_triangle_validation',
                'enable_cross_market_validation', 'stale_odds_threshold_seconds',
                'min_books_for_validation', 'suspicious_profit_threshold',
                'odds_outlier_z_score_threshold', 'volume_spike_threshold'
            }
            
            validated_updates = {}
            for key, value in config_updates.items():
                if key in valid_fields:
                    validated_updates[key] = value
            
            # Apply updates to runtime config
            for key, value in validated_updates.items():
                setattr(self._runtime_config, key, value)
            
            # Update metrics
            self.metrics.increment_counter("arbitrage_threshold_adjustments_total")
            
            logger.info(f"Updated arbitrage config: {validated_updates}")
            
            return await self.get_arbitrage_config()
            
        except Exception as e:
            logger.error(f"Failed to update arbitrage config: {e}")
            raise
    
    async def get_arbitrage_metrics(self) -> Dict[str, Any]:
        """Get current arbitrage detection metrics"""
        return self.metrics.get_metrics_snapshot()
    
    async def health_check(self) -> Dict[str, Any]:
        """Health check for the arbitrage service"""
        return {
            'status': 'healthy',
            'config_loaded': self._runtime_config is not None,
            'validator_ready': self.validator is not None,
            'metrics_available': True,
            'cache_size': len(self.odds_cache),
            'alert_window_size': len(self.alert_window),
            'last_check': datetime.now(timezone.utc).isoformat()
        }


# Global service instance
hardened_arbitrage_service = HardenedArbitrageService()


async def get_hardened_arbitrage_service() -> HardenedArbitrageService:
    """Dependency injection for the hardened arbitrage service"""
    return hardened_arbitrage_service