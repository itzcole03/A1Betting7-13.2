"""
Interest Model Service

Tracks user interest signals and provides personalized recommendations.
Implements decay-based scoring for temporal relevance.
"""

import logging
import math
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Tuple
from collections import defaultdict

from backend.models.risk_personalization import UserInterestSignal, InterestSignalType
from backend.services.unified_config import unified_config

logger = logging.getLogger(__name__)


class InterestModelService:
    """Service for tracking user interests and providing personalized recommendations"""
    
    def __init__(self):
        self.config = unified_config
        
    def record_signal(
        self,
        user_id: str,
        signal_type: InterestSignalType,
        weight: float = 1.0,
        player_id: Optional[str] = None,
        prop_type: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Record a user interest signal
        
        Args:
            user_id: User ID
            signal_type: Type of signal (EDGE_VIEW, TICKET_ADD, etc.)
            weight: Signal weight (default 1.0)
            player_id: Optional player ID
            prop_type: Optional prop type
            context: Optional additional context
        """
        
        logger.info(
            "Recording interest signal: user_id=%s, signal_type=%s, player_id=%s, prop_type=%s, weight=%s",
            user_id, signal_type.value, player_id, prop_type, weight
        )
        
        # In real implementation, this would create a UserInterestSignal record
        # and save to database
        signal = UserInterestSignal(
            user_id=user_id,
            player_id=player_id,
            prop_type=prop_type,
            signal_type=signal_type,
            weight=weight,
            context=context or {},
            created_at=datetime.now(timezone.utc)
        )
        
        # TODO: Save to database
        logger.debug("Interest signal recorded: %s", signal)
        
    def get_interest_profile(self, user_id: str) -> Dict[str, Any]:
        """
        Get user's current interest profile with scores
        
        Args:
            user_id: User ID
            
        Returns:
            Dictionary with prop_type_scores and player_scores
        """
        
        logger.info("Generating interest profile: user_id=%s", user_id)
        
        # In real implementation, this would query UserInterestSignal table
        # For now, return mock data with realistic structure
        
        # Mock data for demonstration
        signals = self._get_mock_signals(user_id)
        
        # Calculate scores with decay
        prop_type_scores = defaultdict(float)
        player_scores = defaultdict(float)
        
        current_time = datetime.now(timezone.utc)
        decay_rate = self.config.get_config_value("INTEREST_DECAY_RATE", 0.1)
        
        for signal in signals:
            age_days = (current_time - signal["created_at"]).days
            decay_factor = self._calculate_decay_factor(age_days, decay_rate)
            adjusted_weight = signal["weight"] * decay_factor
            
            # Score prop types
            if signal["prop_type"]:
                prop_type_scores[signal["prop_type"]] += adjusted_weight
                
            # Score players
            if signal["player_id"]:
                player_scores[signal["player_id"]] += adjusted_weight
                
        # Sort by score descending
        prop_type_scores = dict(sorted(
            prop_type_scores.items(), 
            key=lambda x: x[1], 
            reverse=True
        ))
        
        player_scores = dict(sorted(
            player_scores.items(), 
            key=lambda x: x[1], 
            reverse=True
        ))
        
        profile = {
            "user_id": user_id,
            "generated_at": current_time.isoformat(),
            "prop_type_scores": prop_type_scores,
            "player_scores": player_scores,
            "total_signals": len(signals),
            "decay_rate": decay_rate
        }
        
        logger.info(
            "Interest profile generated: user_id=%s, prop_types=%s, players=%s",
            user_id, len(prop_type_scores), len(player_scores)
        )
        
        return profile
        
    def recommend_edges(
        self,
        user_id: str,
        edges_pool: List[Dict[str, Any]],
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Re-rank edges based on user interest profile
        
        Args:
            user_id: User ID
            edges_pool: Pool of available edges to rank
            limit: Maximum number of edges to return
            
        Returns:
            Reranked edges with interest boost scores
        """
        
        logger.info(
            "Generating edge recommendations: user_id=%s, pool_size=%s, limit=%s",
            user_id, len(edges_pool), limit
        )
        
        # Get user's interest profile
        profile = self.get_interest_profile(user_id)
        prop_type_scores = profile["prop_type_scores"]
        player_scores = profile["player_scores"]
        
        # Score each edge
        scored_edges = []
        for edge in edges_pool:
            base_score = edge.get("ev", 0)  # Base on expected value
            interest_boost = 0.0
            
            # Apply prop type interest boost
            prop_type = edge.get("prop_type")
            if prop_type and prop_type in prop_type_scores:
                prop_boost = prop_type_scores[prop_type] * 0.1  # 10% boost per interest point
                interest_boost += prop_boost
                
            # Apply player interest boost
            player_id = edge.get("player_id")
            if player_id and player_id in player_scores:
                player_boost = player_scores[player_id] * 0.15  # 15% boost per interest point
                interest_boost += player_boost
                
            # Calculate final score
            final_score = base_score + interest_boost
            
            edge_with_scores = edge.copy()
            edge_with_scores.update({
                "base_score": base_score,
                "interest_boost": interest_boost,
                "final_score": final_score,
                "prop_type_interest": prop_type_scores.get(prop_type, 0),
                "player_interest": player_scores.get(player_id, 0)
            })
            
            scored_edges.append(edge_with_scores)
            
        # Sort by final score descending
        scored_edges.sort(key=lambda x: x["final_score"], reverse=True)
        
        # Apply limit
        recommended_edges = scored_edges[:limit]
        
        logger.info(
            "Edge recommendations generated: user_id=%s, recommended=%s",
            user_id, len(recommended_edges)
        )
        
        return recommended_edges
        
    def _calculate_decay_factor(self, age_days: int, decay_rate: float) -> float:
        """Calculate decay factor based on age"""
        # Simple decay function: 1 / (1 + decay_rate * age_days)
        return 1.0 / (1.0 + decay_rate * age_days)
        
    def _get_mock_signals(self, user_id: str) -> List[Dict[str, Any]]:
        """Generate mock interest signals for demonstration"""
        
        current_time = datetime.now(timezone.utc)
        
        # Mock signals with varying ages and types
        signals = [
            {
                "user_id": user_id,
                "signal_type": InterestSignalType.EDGE_VIEW,
                "prop_type": "POINTS",
                "player_id": "lebron_james", 
                "weight": 1.0,
                "created_at": current_time - timedelta(days=1)
            },
            {
                "user_id": user_id,
                "signal_type": InterestSignalType.TICKET_ADD,
                "prop_type": "ASSISTS",
                "player_id": "stephen_curry",
                "weight": 2.0,  # Higher weight for ticket adds
                "created_at": current_time - timedelta(days=2)
            },
            {
                "user_id": user_id,
                "signal_type": InterestSignalType.EDGE_VIEW,
                "prop_type": "REBOUNDS",
                "player_id": "giannis_antetokounmpo",
                "weight": 1.0,
                "created_at": current_time - timedelta(days=5)
            },
            {
                "user_id": user_id,
                "signal_type": InterestSignalType.EXPLANATION_REQUEST,
                "prop_type": "POINTS",
                "player_id": "lebron_james",
                "weight": 1.5,  # Medium weight for explanations
                "created_at": current_time - timedelta(days=3)
            },
            {
                "user_id": user_id,
                "signal_type": InterestSignalType.EDGE_VIEW,
                "prop_type": "THREE_POINTERS",
                "player_id": "stephen_curry",
                "weight": 1.0,
                "created_at": current_time - timedelta(days=7)
            }
        ]
        
        return signals
        
    def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """Get user interaction statistics"""
        
        # In real implementation, this would query database for stats
        mock_stats = {
            "user_id": user_id,
            "total_signals_30d": 25,
            "edge_views_30d": 18,
            "tickets_added_30d": 5,
            "explanations_requested_30d": 2,
            "most_viewed_prop_type": "POINTS",
            "most_followed_player": "lebron_james",
            "avg_daily_activity": 0.8,
            "engagement_trend": "increasing"
        }
        
        logger.info(
            "User stats retrieved: user_id=%s, signals_30d=%s",
            user_id, mock_stats["total_signals_30d"]
        )
        
        return mock_stats


# Singleton instance
interest_model_service = InterestModelService()