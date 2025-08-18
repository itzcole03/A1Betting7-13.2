"""
Settlement Integration Service for Model Integrity Phase
======================================================

Automatically ingests game results and feeds settlement data into the calibration harness.
Provides real-time model validation by connecting predictions to actual outcomes.

Key Features:
- Automated game result ingestion
- Prediction-to-outcome matching
- Mismatch detection and outlier logging  
- Real-time calibration sample insertion
- Settlement event processing pipeline

Focus: Complete the value loop from prediction → outcome → calibration feedback
"""

import asyncio
import json
import time
from datetime import datetime, timedelta
from enum import Enum
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Set, Callable, Any
import logging

from ..services.unified_cache_service import unified_cache_service
from ..services.unified_error_handler import unified_error_handler
from ..services.calibration_harness import calibration_harness, PropType, OutcomeType, GamePhase

logger = logging.getLogger("settlement_integration")


class SettlementStatus(Enum):
    """Status of settlement processing"""
    PENDING = "pending"        # Waiting for game result
    MATCHED = "matched"        # Successfully matched to prediction
    MISMATCHED = "mismatched"  # Outcome doesn't match prediction pattern
    OUTLIER = "outlier"        # Result is statistical outlier
    PROCESSED = "processed"    # Successfully processed into calibration


@dataclass
class GameResult:
    """Game result data for settlement processing"""
    game_id: str
    sport: str
    final_score_home: int
    final_score_away: int
    completed_at: float
    inning_scores: Optional[List[Dict[str, Any]]] = None
    player_stats: Optional[Dict[str, Dict[str, Any]]] = None  # player_id -> stats
    
    def __post_init__(self):
        if self.inning_scores is None:
            self.inning_scores = []
        if self.player_stats is None:
            self.player_stats = {}


@dataclass
class SettlementRecord:
    """Record of a prediction settlement"""
    prediction_id: str
    game_id: str
    prop_type: PropType
    predicted_value: float
    actual_value: float
    outcome: OutcomeType
    status: SettlementStatus
    processed_at: float
    mismatch_reason: Optional[str] = None
    error_magnitude: Optional[float] = None
    is_outlier: bool = False


class SettlementIntegrationService:
    """
    Service for automatically processing game results into calibration samples
    
    Workflow:
    1. Monitor for completed games
    2. Extract relevant statistics 
    3. Match to outstanding predictions
    4. Calculate actual outcomes
    5. Feed results to calibration harness
    6. Log mismatches and outliers
    """
    
    def __init__(self):
        self.settlement_records: Dict[str, SettlementRecord] = {}
        self.pending_settlements: Dict[str, List[str]] = {}  # game_id -> prediction_ids
        self.processing_active = False
        
        # Configuration
        self.processing_interval_seconds = 60  # Check for new results every minute
        self.outlier_threshold_multiplier = 2.5  # Error > 2.5x typical = outlier
        self.mismatch_tolerance = 0.1  # 10% tolerance for matching
        
        # Statistics
        self.stats = {
            "games_processed": 0,
            "predictions_settled": 0,
            "mismatches_detected": 0,
            "outliers_detected": 0,
            "processing_errors": 0,
            "last_processing_time": 0,
            "avg_processing_latency": 0.0
        }
        
        logger.info("SettlementIntegrationService initialized")

    async def start_processing(self):
        """Start the settlement processing background task"""
        if self.processing_active:
            logger.warning("Settlement processing already active")
            return
            
        self.processing_active = True
        logger.info("Starting settlement processing...")
        
        # Start processing task
        asyncio.create_task(self._processing_loop())

    async def stop_processing(self):
        """Stop settlement processing"""
        self.processing_active = False
        logger.info("Settlement processing stopped")

    async def register_prediction_for_settlement(
        self, 
        prediction_id: str, 
        game_id: str, 
        prop_type: PropType
    ):
        """Register a prediction that needs settlement when game completes"""
        if game_id not in self.pending_settlements:
            self.pending_settlements[game_id] = []
            
        self.pending_settlements[game_id].append(prediction_id)
        
        logger.debug(f"Registered prediction {prediction_id} for settlement - "
                    f"game: {game_id}, prop_type: {prop_type.value}")

    async def _processing_loop(self):
        """Main processing loop for settlement integration"""
        while self.processing_active:
            try:
                start_time = time.time()
                
                # Process completed games
                await self._process_completed_games()
                
                # Update statistics
                processing_time = time.time() - start_time
                self.stats["last_processing_time"] = start_time
                self.stats["avg_processing_latency"] = (
                    self.stats["avg_processing_latency"] * 0.9 + processing_time * 0.1
                )
                
                # Wait for next cycle
                await asyncio.sleep(self.processing_interval_seconds)
                
            except Exception as e:
                logger.error(f"Settlement processing error: {str(e)}")
                self.stats["processing_errors"] += 1
                await asyncio.sleep(5)  # Brief pause on error

    async def _process_completed_games(self):
        """Process all games that have completed since last check"""
        try:
            # Get list of games with pending settlements
            games_to_process = list(self.pending_settlements.keys())
            
            if not games_to_process:
                return
                
            logger.debug(f"Checking {len(games_to_process)} games for completion")
            
            # For each game, check if completed and process
            for game_id in games_to_process:
                try:
                    game_result = await self._fetch_game_result(game_id)
                    if game_result:
                        await self._process_game_settlement(game_result)
                        
                except Exception as e:
                    logger.error(f"Error processing game {game_id}: {str(e)}")
                    
        except Exception as e:
            logger.error(f"Error in _process_completed_games: {str(e)}")

    async def _fetch_game_result(self, game_id: str) -> Optional[GameResult]:
        """
        Fetch game result from MLB Stats API or cache
        
        This will integrate with existing MLB data services
        """
        try:
            # Check cache first
            cache_key = f"game_result_{game_id}"
            cached_result = await unified_cache_service.get(cache_key)
            if cached_result:
                return GameResult(**cached_result)
            
            # TODO: Integrate with existing MLB data services
            # For now, return None - this will be implemented to use:
            # - unified_data_fetcher for MLB game results
            # - MLB Stats API client for detailed stats
            # - Baseball Savant for advanced metrics
            
            # Placeholder implementation
            logger.debug(f"Game result not available for {game_id}")
            return None
            
        except Exception as e:
            logger.error(f"Error fetching game result for {game_id}: {str(e)}")
            return None

    async def _process_game_settlement(self, game_result: GameResult):
        """Process settlement for a completed game"""
        game_id = game_result.game_id
        prediction_ids = self.pending_settlements.get(game_id, [])
        
        if not prediction_ids:
            return
            
        logger.info(f"Processing settlement for game {game_id} - "
                   f"{len(prediction_ids)} predictions to settle")
        
        settlements_processed = 0
        
        for prediction_id in prediction_ids:
            try:
                # Get prediction details from calibration harness
                prediction = calibration_harness.get_prediction(prediction_id)
                if not prediction:
                    logger.warning(f"Prediction not found for settlement: {prediction_id}")
                    continue
                
                # Calculate actual outcome based on game result
                actual_outcome = await self._calculate_actual_outcome(prediction, game_result)
                if actual_outcome is None:
                    logger.warning(f"Could not calculate outcome for prediction {prediction_id}")
                    continue
                    
                actual_value, outcome_type = actual_outcome
                
                # Create settlement record
                settlement = SettlementRecord(
                    prediction_id=prediction_id,
                    game_id=game_id,
                    prop_type=prediction.prop_type,
                    predicted_value=prediction.predicted_value,
                    actual_value=actual_value,
                    outcome=outcome_type,
                    status=SettlementStatus.MATCHED,
                    processed_at=time.time()
                )
                
                # Check for mismatches and outliers
                await self._validate_settlement(settlement, prediction)
                
                # Record outcome in calibration harness
                await calibration_harness.record_outcome(
                    prediction_id=prediction_id,
                    actual_value=actual_value,
                    outcome=outcome_type
                )
                
                # Store settlement record
                self.settlement_records[prediction_id] = settlement
                settlements_processed += 1
                
                logger.debug(f"Processed settlement for {prediction_id} - "
                            f"predicted: {prediction.predicted_value}, actual: {actual_value}, "
                            f"outcome: {outcome_type.value}, status: {settlement.status.value}")
                
            except Exception as e:
                logger.error(f"Error processing settlement for {prediction_id}: {str(e)}")
        
        # Remove game from pending settlements
        if game_id in self.pending_settlements:
            del self.pending_settlements[game_id]
            
        # Update statistics
        self.stats["games_processed"] += 1
        self.stats["predictions_settled"] += settlements_processed
        
        logger.info(f"Completed settlement processing for game {game_id} - "
                   f"{settlements_processed} predictions settled")

    async def _calculate_actual_outcome(
        self, 
        prediction, 
        game_result: GameResult
    ) -> Optional[tuple[float, OutcomeType]]:
        """
        Calculate actual outcome value and result type based on prop type
        
        Returns:
            Tuple of (actual_value, outcome_type) or None if cannot calculate
        """
        prop_type = prediction.prop_type
        
        try:
            if prop_type == PropType.GAME_TOTAL:
                # Game total runs
                actual_value = float(game_result.final_score_home + game_result.final_score_away)
                outcome = OutcomeType.OVER if actual_value > prediction.prop_line else OutcomeType.UNDER
                return actual_value, outcome
                
            elif prop_type == PropType.TEAM_RUNS:
                # Team total (need to determine which team from context)
                team = prediction.context.get("team", "home")
                if team == "home":
                    actual_value = float(game_result.final_score_home)
                else:
                    actual_value = float(game_result.final_score_away)
                outcome = OutcomeType.OVER if actual_value > prediction.prop_line else OutcomeType.UNDER
                return actual_value, outcome
                
            elif prop_type in [PropType.PITCHER_STRIKEOUTS, PropType.BATTER_HITS, PropType.HOME_RUNS, PropType.RBIS]:
                # Player props - need player stats
                player_id = prediction.context.get("player_id")
                if not player_id or not game_result.player_stats or player_id not in game_result.player_stats:
                    return None
                    
                player_stats = game_result.player_stats[player_id]
                
                if prop_type == PropType.PITCHER_STRIKEOUTS:
                    actual_value = float(player_stats.get("strikeouts", 0))
                elif prop_type == PropType.BATTER_HITS:
                    actual_value = float(player_stats.get("hits", 0))
                elif prop_type == PropType.HOME_RUNS:
                    actual_value = float(player_stats.get("home_runs", 0))
                elif prop_type == PropType.RBIS:
                    actual_value = float(player_stats.get("rbis", 0))
                else:
                    return None
                    
                if actual_value == prediction.prop_line:
                    outcome = OutcomeType.PUSH
                else:
                    outcome = OutcomeType.OVER if actual_value > prediction.prop_line else OutcomeType.UNDER
                    
                return actual_value, outcome
                
            else:
                logger.warning(f"Unsupported prop type for settlement: {prop_type.value}")
                return None
                
        except Exception as e:
            logger.error(f"Error calculating actual outcome: {str(e)}")
            return None

    async def _validate_settlement(self, settlement: SettlementRecord, prediction):
        """Validate settlement for mismatches and outliers"""
        
        # Calculate error magnitude
        error = abs(settlement.actual_value - settlement.predicted_value)
        settlement.error_magnitude = error
        
        # Check for outliers (simple threshold for now)
        # In production, this would use rolling statistics
        if error > (settlement.predicted_value * 0.5):  # 50% error threshold
            settlement.is_outlier = True
            settlement.status = SettlementStatus.OUTLIER
            self.stats["outliers_detected"] += 1
            
            logger.warning(f"Settlement outlier detected - {settlement.prediction_id}: "
                          f"predicted={settlement.predicted_value}, actual={settlement.actual_value}, "
                          f"error={error}")
        
        # Check for logical mismatches
        predicted_over = prediction.predicted_probability > 0.5
        actual_over = settlement.outcome == OutcomeType.OVER
        
        if settlement.outcome != OutcomeType.PUSH:
            confidence = prediction.confidence_score
            
            # High confidence predictions that are wrong are flagged
            if confidence > 0.8 and predicted_over != actual_over:
                settlement.status = SettlementStatus.MISMATCHED
                settlement.mismatch_reason = f"High confidence ({confidence:.2f}) prediction wrong"
                self.stats["mismatches_detected"] += 1
                
                logger.warning(f"Settlement mismatch detected - {settlement.prediction_id}: "
                              f"high confidence ({confidence:.2f}) prediction was incorrect")

    async def get_settlement_summary(self) -> Dict[str, Any]:
        """Get summary of settlement processing statistics"""
        return {
            "processing_active": self.processing_active,
            "stats": self.stats.copy(),
            "pending_games": len(self.pending_settlements),
            "pending_predictions": sum(len(preds) for preds in self.pending_settlements.values()),
            "settlement_records": len(self.settlement_records),
            "recent_outliers": len([s for s in self.settlement_records.values() 
                                  if s.is_outlier and s.processed_at > time.time() - 3600]),  # Last hour
            "recent_mismatches": len([s for s in self.settlement_records.values() 
                                    if s.status == SettlementStatus.MISMATCHED and s.processed_at > time.time() - 3600])
        }

    async def get_outlier_details(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get details of recent outlier settlements"""
        outliers = [s for s in self.settlement_records.values() if s.is_outlier]
        outliers.sort(key=lambda x: x.processed_at, reverse=True)
        
        return [
            {
                "prediction_id": s.prediction_id,
                "game_id": s.game_id,
                "prop_type": s.prop_type.value,
                "predicted_value": s.predicted_value,
                "actual_value": s.actual_value,
                "error_magnitude": s.error_magnitude,
                "processed_at": s.processed_at
            }
            for s in outliers[:limit]
        ]

    async def force_process_game(self, game_id: str) -> Dict[str, Any]:
        """Manually trigger settlement processing for a specific game"""
        logger.info(f"Manually processing settlement for game {game_id}")
        
        game_result = await self._fetch_game_result(game_id)
        if not game_result:
            return {"success": False, "message": f"Game result not available for {game_id}"}
            
        await self._process_game_settlement(game_result)
        
        return {
            "success": True,
            "message": f"Settlement processing completed for game {game_id}",
            "predictions_processed": len(self.pending_settlements.get(game_id, []))
        }


# Global settlement integration service instance
settlement_integration_service = SettlementIntegrationService()