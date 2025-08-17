"""
Bankroll Strategy Service

Implements various bankroll management strategies including:
- Kelly Criterion
- Fractional Kelly 
- Flat betting
- Risk-adjusted stake calculations
"""

import logging
import math
from dataclasses import dataclass
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

from backend.models.risk_personalization import BankrollProfile, BankrollStrategy
from backend.services.unified_config import unified_config

logger = logging.getLogger(__name__)


@dataclass
class StakeResult:
    """Result of stake calculation"""
    amount: float
    method: str
    raw_amount: float
    clamp_applied: bool
    notes: List[str]
    confidence: float = 1.0
    kelly_multiplier: Optional[float] = None
    risk_adjustment: Optional[float] = None


class BankrollStrategyService:
    """Service for calculating recommended stakes based on bankroll strategy"""
    
    def __init__(self):
        self.config = unified_config
        
    def compute_recommended_stake(
        self, 
        bankroll_profile: BankrollProfile, 
        edge_data: Dict[str, Any],
        constraints: Optional[Dict[str, Any]] = None
    ) -> StakeResult:
        """
        Compute recommended stake based on bankroll strategy
        
        Args:
            bankroll_profile: User's bankroll management profile
            edge_data: Dictionary containing edge information (ev, probability, odds, etc.)
            constraints: Optional risk constraints to apply
            
        Returns:
            StakeResult with recommended stake and calculation details
        """
        logger.info(
            "Computing stake recommendation: user_id=%s, strategy=%s, edge_ev=%s, bankroll=%s",
            bankroll_profile.user_id,
            bankroll_profile.strategy.value,
            edge_data.get("ev", 0),
            bankroll_profile.current_bankroll
        )
        
        # Extract edge parameters
        ev = edge_data.get("ev", 0.0)
        probability = edge_data.get("probability", 0.5)
        odds = edge_data.get("odds", 2.0)  # Decimal odds
        
        notes = []
        clamp_applied = False
        
        # Calculate raw stake based on strategy
        if bankroll_profile.strategy == BankrollStrategy.KELLY:
            raw_stake, kelly_mult = self._calculate_kelly_stake(
                bankroll_profile, ev, probability, odds
            )
            method = "kelly"
        elif bankroll_profile.strategy == BankrollStrategy.FRACTIONAL_KELLY:
            raw_stake, kelly_mult = self._calculate_fractional_kelly_stake(
                bankroll_profile, ev, probability, odds
            )
            method = "fractional_kelly"
        elif bankroll_profile.strategy == BankrollStrategy.FLAT:
            raw_stake, kelly_mult = self._calculate_flat_stake(bankroll_profile)
            method = "flat"
        else:
            raise ValueError(f"Unknown bankroll strategy: {bankroll_profile.strategy}")
            
        # Apply risk constraints and limits
        final_stake = raw_stake
        
        # Apply minimum stake
        min_stake = bankroll_profile.min_stake
        if final_stake < min_stake and final_stake > 0:
            final_stake = min_stake
            clamp_applied = True
            notes.append(f"Applied minimum stake of ${min_stake}")
            
        # Apply maximum stake percentage
        max_stake = bankroll_profile.current_bankroll * bankroll_profile.max_stake_pct
        if final_stake > max_stake:
            final_stake = max_stake
            clamp_applied = True
            notes.append(f"Clamped to maximum stake of ${max_stake:.2f}")
            
        # Apply additional constraints if provided
        if constraints:
            exposure_limit = constraints.get("exposure_limit")
            if exposure_limit and final_stake > exposure_limit:
                final_stake = exposure_limit
                clamp_applied = True
                notes.append(f"Clamped to exposure limit of ${exposure_limit:.2f}")
                
        # Handle negative EV
        if ev <= 0:
            final_stake = 0
            notes.append("Zero stake for non-positive EV")
            
        # Calculate confidence based on edge quality
        confidence = self._calculate_confidence(ev, probability, odds)
        
        result = StakeResult(
            amount=max(0, final_stake),
            method=method,
            raw_amount=raw_stake,
            clamp_applied=clamp_applied,
            notes=notes,
            confidence=confidence,
            kelly_multiplier=kelly_mult,
            risk_adjustment=1.0 - (raw_stake - final_stake) / max(raw_stake, 1) if raw_stake > 0 else 1.0
        )
        
        logger.info(
            "Stake calculation completed: user_id=%s, final_stake=%s, raw_stake=%s, method=%s, clamp_applied=%s, confidence=%s",
            bankroll_profile.user_id,
            result.amount,
            raw_stake,
            method,
            clamp_applied,
            confidence
        )
        
        return result
        
    def _calculate_kelly_stake(
        self, 
        profile: BankrollProfile, 
        ev: float, 
        probability: float, 
        odds: float
    ) -> tuple[float, Optional[float]]:
        """Calculate Kelly criterion stake"""
        
        # Handle edge cases
        if ev <= 0 or probability <= 0 or probability >= 1 or odds <= 1:
            return 0.0, 0.0
            
        # Kelly formula: f = (bp - q) / b
        # Where: b = odds - 1 (payout multiplier), p = probability, q = 1 - p
        b = odds - 1
        p = probability
        q = 1 - p
        
        if b <= 0:
            return 0.0, 0.0
            
        kelly_fraction = (b * p - q) / b
        
        # Clamp Kelly fraction to reasonable bounds (0 to 0.5)
        kelly_fraction = max(0, min(kelly_fraction, 0.5))
        
        stake = profile.current_bankroll * kelly_fraction
        
        return stake, kelly_fraction
        
    def _calculate_fractional_kelly_stake(
        self, 
        profile: BankrollProfile, 
        ev: float, 
        probability: float, 
        odds: float
    ) -> tuple[float, Optional[float]]:
        """Calculate fractional Kelly stake"""
        
        # Get full Kelly first
        kelly_stake, kelly_fraction = self._calculate_kelly_stake(
            profile, ev, probability, odds
        )
        
        if kelly_stake <= 0:
            return 0.0, 0.0
            
        # Apply fractional multiplier
        fraction = profile.kelly_fraction or 0.25
        fractional_stake = kelly_stake * fraction
        fractional_multiplier = kelly_fraction * fraction if kelly_fraction else 0
        
        return fractional_stake, fractional_multiplier
        
    def _calculate_flat_stake(
        self, 
        profile: BankrollProfile
    ) -> tuple[float, Optional[float]]:
        """Calculate flat betting stake"""
        
        flat_unit = profile.flat_unit or 50.0
        
        # Ensure flat unit doesn't exceed bankroll percentage limits
        max_allowed = profile.current_bankroll * profile.max_stake_pct
        stake = min(flat_unit, max_allowed)
        
        return stake, None
        
    def _calculate_confidence(
        self, 
        ev: float, 
        probability: float, 
        odds: float
    ) -> float:
        """Calculate confidence score for the edge"""
        
        # Base confidence on EV magnitude
        ev_confidence = min(1.0, abs(ev) / 0.1)  # Full confidence at 10% EV
        
        # Adjust for probability (more confident near 0.5-0.7 range)
        prob_confidence = 1.0 - abs(probability - 0.6) / 0.4
        prob_confidence = max(0.3, min(1.0, prob_confidence))
        
        # Combine factors
        overall_confidence = (ev_confidence * 0.7 + prob_confidence * 0.3)
        
        return max(0.1, min(1.0, overall_confidence))
        
    def update_bankroll(
        self, 
        profile: BankrollProfile, 
        amount_change: float,
        reason: str = "stake_placed"
    ) -> BankrollProfile:
        """Update bankroll after stake placement or settlement"""
        
        old_bankroll = profile.current_bankroll
        profile.current_bankroll = max(0, profile.current_bankroll + amount_change)
        profile.last_updated_at = datetime.now(timezone.utc)
        
        logger.info(
            "Bankroll updated: user_id=%s, old_bankroll=%s, new_bankroll=%s, change=%s, reason=%s",
            profile.user_id,
            old_bankroll,
            profile.current_bankroll,
            amount_change,
            reason
        )
        
        return profile
        
    def get_or_create_default_profile(self, user_id: str) -> BankrollProfile:
        """Get or create a default bankroll profile for user"""
        
        # This would typically query the database, but for now return a default
        default_profile = BankrollProfile(
            user_id=user_id,
            strategy=BankrollStrategy.FLAT,
            base_bankroll=1000.0,
            current_bankroll=1000.0,
            kelly_fraction=0.25,
            flat_unit=50.0,
            max_stake_pct=0.05,
            min_stake=1.0,
            last_updated_at=datetime.now(timezone.utc)
        )
        
        logger.info(
            "Created default bankroll profile: user_id=%s, strategy=%s, bankroll=%s",
            user_id,
            default_profile.strategy.value,
            default_profile.current_bankroll
        )
        
        return default_profile


# Singleton instance
bankroll_strategy_service = BankrollStrategyService()