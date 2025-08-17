"""
Exposure Tracker Service

Tracks user exposure across players, prop types, and correlation clusters.
Enforces exposure limits and provides risk analysis.
"""

import logging
from dataclasses import dataclass
from datetime import datetime, timezone, date
from typing import Dict, Any, Optional, List
from decimal import Decimal

from backend.models.risk_personalization import ExposureSnapshot, BankrollProfile
from backend.services.unified_config import unified_config

logger = logging.getLogger(__name__)


@dataclass
class ExposureDecision:
    """Result of exposure limit checking"""
    allowed: bool
    exposure_pct: float
    limit_pct: float
    limit_type: str
    current_exposure: float
    proposed_addition: float
    reason: Optional[str] = None


class ExposureTrackerService:
    """Service for tracking and limiting user exposure"""
    
    def __init__(self):
        self.config = unified_config
        
    def update_exposure_on_ticket_submit(
        self,
        user_id: str,
        ticket_id: int,
        stake: float,
        legs: List[Dict[str, Any]]
    ) -> None:
        """
        Update exposure snapshots when a ticket is submitted
        
        Args:
            user_id: User ID
            ticket_id: Ticket ID
            stake: Total stake amount
            legs: List of ticket legs with player_id, prop_type, etc.
        """
        current_date = date.today()
        
        logger.info(
            "Updating exposure for ticket submission: user_id=%s, ticket_id=%s, stake=%s, legs=%s",
            user_id, ticket_id, stake, len(legs)
        )
        
        # Update overall exposure for the day
        self._update_snapshot(
            user_id=user_id,
            date=current_date,
            player_id=None,
            prop_type=None,
            correlation_cluster_id=None,
            stake_to_add=stake,
            tickets_to_add=1
        )
        
        # Update exposure for each leg
        for leg in legs:
            player_id = leg.get("player_id")
            prop_type = leg.get("prop_type")
            cluster_id = leg.get("correlation_cluster_id")
            
            # Individual player exposure
            if player_id:
                self._update_snapshot(
                    user_id=user_id,
                    date=current_date,
                    player_id=player_id,
                    prop_type=None,
                    correlation_cluster_id=None,
                    stake_to_add=stake,
                    tickets_to_add=1
                )
                
            # Prop type exposure
            if prop_type:
                self._update_snapshot(
                    user_id=user_id,
                    date=current_date,
                    player_id=None,
                    prop_type=prop_type,
                    correlation_cluster_id=None,
                    stake_to_add=stake,
                    tickets_to_add=1
                )
                
            # Correlation cluster exposure
            if cluster_id:
                self._update_snapshot(
                    user_id=user_id,
                    date=current_date,
                    player_id=None,
                    prop_type=None,
                    correlation_cluster_id=cluster_id,
                    stake_to_add=stake,
                    tickets_to_add=1
                )
                
    def get_current_exposure(
        self,
        user_id: str,
        player_id: Optional[str] = None,
        prop_type: Optional[str] = None,
        cluster_id: Optional[int] = None
    ) -> float:
        """
        Get current exposure for specified filters
        
        Args:
            user_id: User ID
            player_id: Optional player ID filter
            prop_type: Optional prop type filter  
            cluster_id: Optional cluster ID filter
            
        Returns:
            Total staked amount for the current day
        """
        current_date = date.today()
        
        # This would query the database - for now return mock data
        # In real implementation: query ExposureSnapshot with filters
        
        if player_id and prop_type and cluster_id:
            # Very specific exposure
            return 50.0
        elif player_id:
            # Player-specific exposure
            return 150.0
        elif prop_type:
            # Prop type exposure
            return 200.0
        elif cluster_id:
            # Cluster exposure
            return 300.0
        else:
            # Total daily exposure
            return 500.0
            
    def is_exceeding_limits(
        self,
        user_id: str,
        bankroll: float,
        proposed_additions: List[Dict[str, Any]]
    ) -> List[ExposureDecision]:
        """
        Check if proposed additions would exceed exposure limits
        
        Args:
            user_id: User ID
            bankroll: Current bankroll amount
            proposed_additions: List of proposed ticket legs/stakes
            
        Returns:
            List of ExposureDecision objects indicating violations
        """
        decisions = []
        
        # Get exposure limits from config
        max_player_pct = self.config.get_config_value("EXPOSURE_MAX_PLAYER_PCT", 0.15)
        max_prop_type_pct = self.config.get_config_value("EXPOSURE_MAX_PROP_TYPE_PCT", 0.25)
        max_cluster_pct = self.config.get_config_value("EXPOSURE_MAX_CLUSTER_PCT", 0.20)
        max_daily_pct = self.config.get_config_value("EXPOSURE_MAX_DAILY_STAKE", 0.3)
        
        logger.debug(
            "Checking exposure limits: user_id=%s, bankroll=%s, proposed_additions=%s",
            user_id, bankroll, len(proposed_additions)
        )
        
        # Check each proposed addition
        for addition in proposed_additions:
            player_id = addition.get("player_id")
            prop_type = addition.get("prop_type")
            cluster_id = addition.get("correlation_cluster_id")
            stake = addition.get("stake", 0)
            
            # Check player exposure limit
            if player_id:
                current_exposure = self.get_current_exposure(
                    user_id, player_id=player_id
                )
                new_exposure = current_exposure + stake
                exposure_pct = new_exposure / bankroll
                
                decision = ExposureDecision(
                    allowed=exposure_pct <= max_player_pct,
                    exposure_pct=exposure_pct,
                    limit_pct=max_player_pct,
                    limit_type="player",
                    current_exposure=current_exposure,
                    proposed_addition=stake,
                    reason=f"Player {player_id} exposure" if exposure_pct > max_player_pct else None
                )
                decisions.append(decision)
                
            # Check prop type exposure limit
            if prop_type:
                current_exposure = self.get_current_exposure(
                    user_id, prop_type=prop_type
                )
                new_exposure = current_exposure + stake
                exposure_pct = new_exposure / bankroll
                
                decision = ExposureDecision(
                    allowed=exposure_pct <= max_prop_type_pct,
                    exposure_pct=exposure_pct,
                    limit_pct=max_prop_type_pct,
                    limit_type="prop_type",
                    current_exposure=current_exposure,
                    proposed_addition=stake,
                    reason=f"Prop type {prop_type} exposure" if exposure_pct > max_prop_type_pct else None
                )
                decisions.append(decision)
                
            # Check cluster exposure limit
            if cluster_id:
                current_exposure = self.get_current_exposure(
                    user_id, cluster_id=cluster_id
                )
                new_exposure = current_exposure + stake
                exposure_pct = new_exposure / bankroll
                
                decision = ExposureDecision(
                    allowed=exposure_pct <= max_cluster_pct,
                    exposure_pct=exposure_pct,
                    limit_pct=max_cluster_pct,
                    limit_type="cluster",
                    current_exposure=current_exposure,
                    proposed_addition=stake,
                    reason=f"Cluster {cluster_id} exposure" if exposure_pct > max_cluster_pct else None
                )
                decisions.append(decision)
                
        # Check total daily exposure
        current_daily = self.get_current_exposure(user_id)
        total_new_stake = sum(add.get("stake", 0) for add in proposed_additions)
        new_daily_exposure = current_daily + total_new_stake
        daily_exposure_pct = new_daily_exposure / bankroll
        
        daily_decision = ExposureDecision(
            allowed=daily_exposure_pct <= max_daily_pct,
            exposure_pct=daily_exposure_pct,
            limit_pct=max_daily_pct,
            limit_type="daily",
            current_exposure=current_daily,
            proposed_addition=total_new_stake,
            reason="Daily exposure limit" if daily_exposure_pct > max_daily_pct else None
        )
        decisions.append(daily_decision)
        
        return decisions
        
    def get_exposure_summary(
        self,
        user_id: str,
        bankroll: float,
        player_id: Optional[str] = None,
        prop_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get comprehensive exposure summary"""
        
        current_date = date.today()
        
        # Get various exposure metrics
        daily_exposure = self.get_current_exposure(user_id)
        
        summary = {
            "user_id": user_id,
            "date": current_date.isoformat(),
            "bankroll": bankroll,
            "daily_exposure": {
                "amount": daily_exposure,
                "percentage": daily_exposure / bankroll if bankroll > 0 else 0,
                "limit_percentage": self.config.get_config_value("EXPOSURE_MAX_DAILY_STAKE", 0.3)
            },
            "limits": {
                "max_player_pct": self.config.get_config_value("EXPOSURE_MAX_PLAYER_PCT", 0.15),
                "max_prop_type_pct": self.config.get_config_value("EXPOSURE_MAX_PROP_TYPE_PCT", 0.25),
                "max_cluster_pct": self.config.get_config_value("EXPOSURE_MAX_CLUSTER_PCT", 0.20),
                "max_daily_pct": self.config.get_config_value("EXPOSURE_MAX_DAILY_STAKE", 0.3)
            }
        }
        
        # Add specific exposures if requested
        if player_id:
            player_exposure = self.get_current_exposure(user_id, player_id=player_id)
            summary["player_exposure"] = {
                "player_id": player_id,
                "amount": player_exposure,
                "percentage": player_exposure / bankroll if bankroll > 0 else 0
            }
            
        if prop_type:
            prop_exposure = self.get_current_exposure(user_id, prop_type=prop_type)
            summary["prop_type_exposure"] = {
                "prop_type": prop_type,
                "amount": prop_exposure,
                "percentage": prop_exposure / bankroll if bankroll > 0 else 0
            }
            
        return summary
        
    def _update_snapshot(
        self,
        user_id: str,
        date: date,
        player_id: Optional[str],
        prop_type: Optional[str],
        correlation_cluster_id: Optional[int],
        stake_to_add: float,
        tickets_to_add: int = 1
    ) -> None:
        """
        Update or create an exposure snapshot
        
        In real implementation, this would:
        1. Query for existing snapshot with matching filters
        2. Create new snapshot if not found
        3. Update totals (total_staked, tickets_count)
        4. Save to database
        """
        
        logger.debug(
            "Updating exposure snapshot: user_id=%s, date=%s, player_id=%s, prop_type=%s, cluster_id=%s, stake=%s",
            user_id, date, player_id, prop_type, correlation_cluster_id, stake_to_add
        )
        
        # This would be a database operation in real implementation
        # For now, just log the operation
        snapshot_key = f"{user_id}_{date}_{player_id or 'null'}_{prop_type or 'null'}_{correlation_cluster_id or 'null'}"
        
        logger.info(
            "Updated exposure snapshot %s: added stake=%s, tickets=%s",
            snapshot_key, stake_to_add, tickets_to_add
        )


# Singleton instance
exposure_tracker_service = ExposureTrackerService()