"""
CLV (Closing Line Value) Computation Service

Provides utilities for computing CLV metrics for individual opportunities.
Used by propfinder routes to enrich opportunities with CLV data.
"""

import time
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


def compute_clv_for_opportunity(
    opportunity,
    include_diagnostics: bool = False
) -> Dict[str, Any]:
    """
    Compute CLV metrics for a single opportunity.
    
    Args:
        opportunity: Opportunity data (dict or PropOpportunity object)
        include_diagnostics: Whether to include additional diagnostic info
        
    Returns:
        Dict containing CLV metrics
    """
    try:
        # Handle both dict and object types
        if hasattr(opportunity, 'line'):
            current_line = opportunity.line
            current_odds = opportunity.odds
            confidence = opportunity.confidence
        else:
            current_line = opportunity.get("line", 0)
            current_odds = opportunity.get("odds", 100)
            confidence = opportunity.get("confidence", 0)
        
        # CLV estimate based on confidence (higher confidence = better CLV)
        clv_estimate = (confidence / 100) * 0.2 - 0.05  # Range: -0.05 to 0.15
        
        # Market efficiency (inverse of CLV potential)
        market_efficiency = 1.0 - abs(clv_estimate) * 2
        market_efficiency = max(0.6, min(1.0, market_efficiency))
        
        # Historical edge (simplified)
        historical_edge = clv_estimate * 0.8
        
        # Line movement indicator
        line_movement = "stable"  # In production: analyze historical movements
        if clv_estimate > 0.1:
            line_movement = "favorable"
        elif clv_estimate < -0.02:
            line_movement = "unfavorable"
            
        result = {
            "clv_estimate": round(clv_estimate, 3),
            "market_efficiency": round(market_efficiency, 3),
            "historical_edge": round(historical_edge, 3),
            "line_movement_indicator": line_movement
        }
        
        if include_diagnostics:
            result.update({
                "computation_method": "confidence_based_simulation",
                "data_sources": ["opportunity_confidence"],
                "computed_at": time.time(),
                "baseline_odds": current_odds
            })
            
        return result
        
    except Exception as e:
        logger.error(f"Error computing CLV for opportunity: {e}")
        return {
            "clv_estimate": 0.0,
            "market_efficiency": 0.9,
            "historical_edge": 0.0,
            "line_movement_indicator": "unknown",
            "error": "computation_failed"
        }


def compute_clv_batch(
    opportunities: list,
    include_diagnostics: bool = False
) -> list:
    """
    Compute CLV metrics for multiple opportunities efficiently.
    
    Args:
        opportunities: List of opportunity objects (PropOpportunity instances or dicts)
        include_diagnostics: Whether to include diagnostic info
        
    Returns:
        List of opportunities with clv_metrics added
    """
    enriched_opportunities = []
    
    for opp in opportunities:
        try:
            clv_metrics = compute_clv_for_opportunity(opp, include_diagnostics)
            
            # Handle both dataclass objects and dicts
            if hasattr(opp, '__dict__'):
                # For dataclass objects, set the attribute directly
                setattr(opp, 'clv_metrics', clv_metrics)
                enriched_opportunities.append(opp)
            elif hasattr(opp, 'copy'):
                # For dict-like objects with copy method
                opp_copy = opp.copy()
                opp_copy["clv_metrics"] = clv_metrics
                enriched_opportunities.append(opp_copy)
            else:
                # Fallback: try to set as dict
                opp["clv_metrics"] = clv_metrics
                enriched_opportunities.append(opp)
                
        except Exception as e:
            logger.error(f"Error enriching opportunity {getattr(opp, 'id', 'unknown')}: {e}")
            # Include opportunity without CLV metrics on error
            if hasattr(opp, '__dict__'):
                setattr(opp, 'clv_metrics', None)
            else:
                opp["clv_metrics"] = None
            enriched_opportunities.append(opp)
            
    return enriched_opportunities