"""
Risk Constraints Service

Provides comprehensive risk analysis and constraint checking for betting tickets.
Identifies high-risk scenarios and applies pre-submission validation.
"""

import logging
from dataclasses import dataclass
from typing import Dict, Any, List, Optional
from enum import Enum

from backend.models.risk_personalization import BankrollProfile
from backend.services.unified_config import unified_config

logger = logging.getLogger(__name__)


class RiskLevel(Enum):
    """Risk severity levels"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


@dataclass
class RiskFinding:
    """Individual risk finding"""
    risk_type: str
    level: RiskLevel
    message: str
    recommendation: str
    details: Dict[str, Any]


class RiskViolationError(Exception):
    """Exception raised when risk constraints are violated"""
    
    def __init__(self, message: str, findings: List[RiskFinding]):
        super().__init__(message)
        self.findings = findings


class RiskConstraintsService:
    """Service for comprehensive risk analysis and constraint enforcement"""
    
    def __init__(self):
        self.config = unified_config
        
    def aggregate_risk_checks(
        self,
        user_id: str,
        bankroll_profile: BankrollProfile,
        edges: List[Dict[str, Any]]
    ) -> List[RiskFinding]:
        """
        Perform aggregate risk analysis on a set of edges/tickets
        
        Args:
            user_id: User ID
            bankroll_profile: User's bankroll profile
            edges: List of edge data dictionaries
            
        Returns:
            List of risk findings identified
        """
        findings = []
        
        logger.info(
            "Performing aggregate risk analysis: user_id=%s, edges=%s, bankroll=%s",
            user_id, len(edges), bankroll_profile.current_bankroll
        )
        
        # Check for high correlation risk
        correlation_findings = self._check_correlation_risk(edges)
        findings.extend(correlation_findings)
        
        # Check bankroll risk
        bankroll_findings = self._check_bankroll_risk(bankroll_profile, edges)
        findings.extend(bankroll_findings)
        
        # Check concentration risk
        concentration_findings = self._check_concentration_risk(edges)
        findings.extend(concentration_findings)
        
        # Check EV distribution risk
        ev_findings = self._check_ev_distribution_risk(edges)
        findings.extend(ev_findings)
        
        logger.info(
            "Risk analysis completed: user_id=%s, findings=%s",
            user_id, len(findings)
        )
        
        return findings
        
    def apply_pre_submission_checks(
        self,
        user_id: str,
        ticket_data: Dict[str, Any],
        bankroll_profile: BankrollProfile
    ) -> List[RiskFinding]:
        """
        Apply risk checks before ticket submission
        Raises RiskViolationError if critical violations found
        
        Args:
            user_id: User ID
            ticket_data: Ticket information including legs and stake
            bankroll_profile: User's bankroll profile
            
        Raises:
            RiskViolationError: If critical risk violations are found
        """
        findings = []
        
        logger.info(
            "Applying pre-submission checks: user_id=%s, ticket_legs=%s, stake=%s",
            user_id, len(ticket_data.get("legs", [])), ticket_data.get("stake", 0)
        )
        
        # Check if stake exceeds bankroll limits
        stake = ticket_data.get("stake", 0)
        if stake > bankroll_profile.current_bankroll * 0.5:  # 50% of bankroll
            findings.append(RiskFinding(
                risk_type="excessive_stake",
                level=RiskLevel.CRITICAL,
                message=f"Stake ${stake:.2f} exceeds 50% of bankroll",
                recommendation="Reduce stake size or increase bankroll",
                details={"stake": stake, "bankroll": bankroll_profile.current_bankroll}
            ))
            
        # Check for too many correlated legs
        legs = ticket_data.get("legs", [])
        correlation_cluster_ids = [
            leg.get("correlation_cluster_id") 
            for leg in legs 
            if leg.get("correlation_cluster_id")
        ]
        
        if correlation_cluster_ids:
            # Count legs per cluster
            cluster_counts = {}
            for cluster_id in correlation_cluster_ids:
                cluster_counts[cluster_id] = cluster_counts.get(cluster_id, 0) + 1
                
            # Flag clusters with too many legs
            max_legs_per_cluster = self.config.get_config_value("RISK_MAX_LEGS_PER_CLUSTER", 3)
            for cluster_id, count in cluster_counts.items():
                if count > max_legs_per_cluster:
                    findings.append(RiskFinding(
                        risk_type="high_correlation",
                        level=RiskLevel.HIGH,
                        message=f"Cluster {cluster_id} has {count} correlated legs",
                        recommendation="Consider reducing correlated legs in parlay",
                        details={"cluster_id": cluster_id, "leg_count": count}
                    ))
                    
        # Check for negative EV legs
        negative_ev_count = sum(1 for leg in legs if leg.get("ev", 0) < 0)
        if negative_ev_count > 0:
            findings.append(RiskFinding(
                risk_type="negative_ev",
                level=RiskLevel.MEDIUM,
                message=f"Ticket contains {negative_ev_count} negative EV legs",
                recommendation="Consider removing negative EV legs",
                details={"negative_ev_count": negative_ev_count, "total_legs": len(legs)}
            ))
            
        # Check for low probability success
        if legs:
            combined_probability = 1.0
            for leg in legs:
                prob = leg.get("probability", 0.5)
                combined_probability *= prob
                
            min_probability = self.config.get_config_value("RISK_MIN_COMBINED_PROBABILITY", 0.01)
            if combined_probability < min_probability:
                findings.append(RiskFinding(
                    risk_type="low_probability",
                    level=RiskLevel.HIGH,
                    message=f"Combined probability {combined_probability:.3f} is very low",
                    recommendation="Consider reducing number of legs or improving odds",
                    details={"combined_probability": combined_probability, "leg_count": len(legs)}
                ))
                
        # Check for critical findings that should block submission
        critical_findings = [f for f in findings if f.level == RiskLevel.CRITICAL]
        if critical_findings:
            raise RiskViolationError(
                f"Critical risk violations found: {len(critical_findings)} issues",
                critical_findings
            )
            
        logger.info(
            "Pre-submission checks completed: user_id=%s, findings=%s",
            user_id, len(findings)
        )
        
        return findings
        
    def _check_correlation_risk(self, edges: List[Dict[str, Any]]) -> List[RiskFinding]:
        """Check for high correlation risk across edges"""
        findings = []
        
        if len(edges) < 2:
            return findings
            
        # Group edges by correlation cluster
        cluster_groups = {}
        for edge in edges:
            cluster_id = edge.get("correlation_cluster_id")
            if cluster_id:
                if cluster_id not in cluster_groups:
                    cluster_groups[cluster_id] = []
                cluster_groups[cluster_id].append(edge)
                
        # Check each cluster for risk
        max_correlated_edges = self.config.get_config_value("RISK_MAX_CORRELATED_EDGES", 5)
        for cluster_id, cluster_edges in cluster_groups.items():
            if len(cluster_edges) > max_correlated_edges:
                findings.append(RiskFinding(
                    risk_type="high_correlation",
                    level=RiskLevel.HIGH,
                    message=f"Too many edges ({len(cluster_edges)}) in correlation cluster {cluster_id}",
                    recommendation="Diversify across different correlation clusters",
                    details={
                        "cluster_id": cluster_id, 
                        "edge_count": len(cluster_edges),
                        "max_allowed": max_correlated_edges
                    }
                ))
                
        return findings
        
    def _check_bankroll_risk(
        self, 
        bankroll_profile: BankrollProfile, 
        edges: List[Dict[str, Any]]
    ) -> List[RiskFinding]:
        """Check for bankroll-related risks"""
        findings = []
        
        # Check for potential bankroll depletion
        if bankroll_profile.current_bankroll < bankroll_profile.base_bankroll * 0.5:
            findings.append(RiskFinding(
                risk_type="bankroll_depletion",
                level=RiskLevel.HIGH,
                message=f"Bankroll depleted to {bankroll_profile.current_bankroll/bankroll_profile.base_bankroll:.1%} of original",
                recommendation="Consider reducing stake sizes or taking a break",
                details={
                    "current_bankroll": bankroll_profile.current_bankroll,
                    "base_bankroll": bankroll_profile.base_bankroll,
                    "depletion_pct": 1 - (bankroll_profile.current_bankroll / bankroll_profile.base_bankroll)
                }
            ))
            
        # Check for aggressive betting relative to bankroll
        total_potential_stake = sum(
            edge.get("recommended_stake", 0) for edge in edges
        )
        
        if total_potential_stake > bankroll_profile.current_bankroll * 0.2:  # 20% of bankroll
            findings.append(RiskFinding(
                risk_type="aggressive_betting",
                level=RiskLevel.MEDIUM,
                message=f"Total potential stake ${total_potential_stake:.2f} is {total_potential_stake/bankroll_profile.current_bankroll:.1%} of bankroll",
                recommendation="Consider smaller position sizes",
                details={
                    "total_stake": total_potential_stake,
                    "bankroll": bankroll_profile.current_bankroll,
                    "stake_pct": total_potential_stake / bankroll_profile.current_bankroll
                }
            ))
            
        return findings
        
    def _check_concentration_risk(self, edges: List[Dict[str, Any]]) -> List[RiskFinding]:
        """Check for concentration risk in players or prop types"""
        findings = []
        
        # Check player concentration
        player_counts = {}
        for edge in edges:
            player_id = edge.get("player_id")
            if player_id:
                player_counts[player_id] = player_counts.get(player_id, 0) + 1
                
        max_per_player = self.config.get_config_value("RISK_MAX_EDGES_PER_PLAYER", 3)
        for player_id, count in player_counts.items():
            if count > max_per_player:
                findings.append(RiskFinding(
                    risk_type="player_concentration",
                    level=RiskLevel.MEDIUM,
                    message=f"Too many edges ({count}) on player {player_id}",
                    recommendation="Diversify across more players",
                    details={"player_id": player_id, "edge_count": count}
                ))
                
        # Check prop type concentration
        prop_type_counts = {}
        for edge in edges:
            prop_type = edge.get("prop_type")
            if prop_type:
                prop_type_counts[prop_type] = prop_type_counts.get(prop_type, 0) + 1
                
        max_per_prop_type = self.config.get_config_value("RISK_MAX_EDGES_PER_PROP_TYPE", 5)
        for prop_type, count in prop_type_counts.items():
            if count > max_per_prop_type:
                findings.append(RiskFinding(
                    risk_type="prop_type_concentration",
                    level=RiskLevel.MEDIUM,
                    message=f"Too many edges ({count}) on prop type {prop_type}",
                    recommendation="Diversify across more prop types",
                    details={"prop_type": prop_type, "edge_count": count}
                ))
                
        return findings
        
    def _check_ev_distribution_risk(self, edges: List[Dict[str, Any]]) -> List[RiskFinding]:
        """Check for EV distribution risks"""
        findings = []
        
        if not edges:
            return findings
            
        # Calculate EV statistics
        ev_values = [edge.get("ev", 0) for edge in edges]
        avg_ev = sum(ev_values) / len(ev_values)
        
        # Check for too many low EV bets
        low_ev_threshold = self.config.get_config_value("RISK_LOW_EV_THRESHOLD", 0.02)
        low_ev_count = sum(1 for ev in ev_values if 0 < ev < low_ev_threshold)
        
        if low_ev_count > len(edges) * 0.5:  # More than half are low EV
            findings.append(RiskFinding(
                risk_type="low_ev_concentration",
                level=RiskLevel.MEDIUM,
                message=f"{low_ev_count} edges have low EV (< {low_ev_threshold:.1%})",
                recommendation="Focus on higher EV opportunities",
                details={
                    "low_ev_count": low_ev_count,
                    "total_edges": len(edges),
                    "low_ev_threshold": low_ev_threshold,
                    "avg_ev": avg_ev
                }
            ))
            
        return findings


# Singleton instance
risk_constraints_service = RiskConstraintsService()