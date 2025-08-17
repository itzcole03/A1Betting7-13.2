"""
LLM Integration Hooks for Risk Management

Provides LLM-powered explanations for stake recommendations and risk analysis.
Integrates with the existing unified LLM service.
"""

import logging
from typing import Dict, Any, Optional

from backend.models.risk_personalization import BankrollProfile
from backend.services.risk.bankroll_strategy import StakeResult
from backend.services.unified_config import unified_config

logger = logging.getLogger(__name__)


def build_stake_explanation_prompt(
    edge_data: Dict[str, Any],
    stake_result: StakeResult,
    bankroll_profile: BankrollProfile
) -> str:
    """
    Build a prompt for LLM to explain stake recommendation
    
    Args:
        edge_data: Dictionary containing edge information
        stake_result: Result from stake calculation
        bankroll_profile: User's bankroll profile
        
    Returns:
        Formatted prompt string for LLM
    """
    
    # Extract key information
    ev = edge_data.get("ev", 0)
    probability = edge_data.get("probability", 0.5)
    odds = edge_data.get("odds", 2.0)
    player_name = edge_data.get("player_name", "Unknown Player")
    prop_type = edge_data.get("prop_type", "Unknown Prop")
    
    prompt = f"""Please explain this stake recommendation for a sports betting edge:

**Betting Opportunity:**
- Player: {player_name}
- Prop: {prop_type}
- Expected Value (EV): {ev:.2%}
- Probability: {probability:.1%}
- Odds: {odds:.2f}

**User's Bankroll Strategy:**
- Strategy: {bankroll_profile.strategy.value}
- Current Bankroll: ${bankroll_profile.current_bankroll:.2f}
- Base Bankroll: ${bankroll_profile.base_bankroll:.2f}

**Recommendation:**
- Recommended Stake: ${stake_result.amount:.2f}
- Method Used: {stake_result.method}
- Raw Calculation: ${stake_result.raw_amount:.2f}
- Clamp Applied: {stake_result.clamp_applied}
- Confidence: {stake_result.confidence:.1%}

**Additional Details:**
- Kelly Multiplier: {stake_result.kelly_multiplier if stake_result.kelly_multiplier else 'N/A'}
- Risk Adjustment: {stake_result.risk_adjustment if stake_result.risk_adjustment else 'N/A'}
- Notes: {'; '.join(stake_result.notes) if stake_result.notes else 'None'}

Please provide a clear, concise explanation (2-3 paragraphs) covering:
1. Why this stake amount was recommended
2. How the bankroll strategy influenced the calculation
3. Any risk factors or adjustments that were applied
4. Whether this is a good betting opportunity given the user's profile

Keep the explanation accessible to someone who understands basic betting concepts but may not know the mathematical details of Kelly Criterion or risk management."""

    return prompt


async def generate_stake_explanation(
    edge_data: Dict[str, Any],
    stake_result: StakeResult,
    bankroll_profile: BankrollProfile,
    llm_service: Optional[Any] = None
) -> Optional[str]:
    """
    Generate LLM explanation for stake recommendation
    
    Args:
        edge_data: Dictionary containing edge information
        stake_result: Result from stake calculation
        bankroll_profile: User's bankroll profile
        llm_service: Optional LLM service instance
        
    Returns:
        Generated explanation text, or None if LLM is disabled/unavailable
    """
    
    config = unified_config
    
    # Check if LLM explanations are enabled
    if not config.get_config_value("LLM_EXPLAIN_STAKE", False):
        logger.debug("LLM stake explanations disabled in config")
        return None
        
    # Build the prompt
    prompt = build_stake_explanation_prompt(edge_data, stake_result, bankroll_profile)
    
    try:
        # Try to import and use unified LLM service
        if llm_service is None:
            try:
                from backend.services.llm.unified_llm_service import unified_llm_service
                llm_service = unified_llm_service
            except ImportError:
                logger.warning("Unified LLM service not available")
                return None
                
        # Generate explanation using LLM service
        logger.info(
            "Generating stake explanation: user_id=%s, stake=%s, method=%s",
            bankroll_profile.user_id,
            stake_result.amount,
            stake_result.method
        )
        
        # Call LLM service (this would be the actual API call)
        explanation = await llm_service.generate_response(
            prompt=prompt,
            context_type="stake_explanation",
            user_id=bankroll_profile.user_id,
            max_tokens=500,
            temperature=0.3  # Lower temperature for more consistent explanations
        )
        
        logger.info(
            "Stake explanation generated: user_id=%s, explanation_length=%s",
            bankroll_profile.user_id,
            len(explanation) if explanation else 0
        )
        
        return explanation
        
    except Exception as e:
        logger.error(
            "Failed to generate stake explanation: user_id=%s, error=%s",
            bankroll_profile.user_id,
            str(e)
        )
        return None


def build_portfolio_rationale_prompt(
    edges: list[Dict[str, Any]],
    total_stake: float,
    bankroll_profile: BankrollProfile
) -> str:
    """
    Build a prompt for explaining a portfolio of betting edges
    
    Args:
        edges: List of edge data dictionaries
        total_stake: Total stake across all edges
        bankroll_profile: User's bankroll profile
        
    Returns:
        Formatted prompt string for portfolio explanation
    """
    
    prompt = f"""Please explain this portfolio of betting edges:

**Portfolio Summary:**
- Number of Bets: {len(edges)}
- Total Stake: ${total_stake:.2f}
- Bankroll: ${bankroll_profile.current_bankroll:.2f}
- Portfolio Risk: {total_stake/bankroll_profile.current_bankroll:.1%} of bankroll

**Individual Edges:**
"""
    
    for i, edge in enumerate(edges, 1):
        player_name = edge.get("player_name", f"Player {i}")
        prop_type = edge.get("prop_type", "Unknown")
        ev = edge.get("ev", 0)
        stake = edge.get("recommended_stake", 0)
        
        prompt += f"""
{i}. {player_name} - {prop_type}
   - EV: {ev:.2%}
   - Stake: ${stake:.2f}
   - Kelly%: {edge.get('kelly_pct', 0):.1%}"""
    
    prompt += f"""

**Strategy:** {bankroll_profile.strategy.value}

Please provide an analysis covering:
1. Overall portfolio quality and diversification
2. Risk-reward balance
3. How this fits the user's bankroll strategy
4. Any concerns or recommendations for improvement

Keep the explanation concise but comprehensive."""

    return prompt


async def generate_portfolio_explanation(
    edges: list[Dict[str, Any]],
    total_stake: float,
    bankroll_profile: BankrollProfile,
    llm_service: Optional[Any] = None
) -> Optional[str]:
    """
    Generate LLM explanation for a portfolio of edges
    
    TODO: Multi-edge portfolio rationale - placeholder for future implementation
    """
    
    logger.info(
        "Portfolio explanation requested: user_id=%s, edges=%s, total_stake=%s",
        bankroll_profile.user_id,
        len(edges),
        total_stake
    )
    
    # TODO: Implement portfolio-level explanations
    # This would analyze correlations, diversification, aggregate risk, etc.
    
    return "Portfolio explanation feature coming soon - analyze multiple edges together for comprehensive risk assessment."


def explain_risk_findings(
    findings: list,
    user_context: Dict[str, Any],
    llm_service: Optional[Any] = None
) -> Optional[str]:
    """
    Generate LLM explanation for risk findings
    
    Args:
        findings: List of RiskFinding objects
        user_context: User context information
        llm_service: Optional LLM service instance
        
    Returns:
        Generated explanation of risk findings
    """
    
    if not findings:
        return "No significant risk concerns identified with this betting activity."
        
    # Build summary of findings
    critical_count = sum(1 for f in findings if f.level.value == "CRITICAL")
    high_count = sum(1 for f in findings if f.level.value == "HIGH") 
    medium_count = sum(1 for f in findings if f.level.value == "MEDIUM")
    
    summary = f"""Risk Analysis Summary:
- Critical Issues: {critical_count}
- High Risk Issues: {high_count} 
- Medium Risk Issues: {medium_count}

Specific Findings:
"""
    
    for finding in findings:
        summary += f"- {finding.level.value}: {finding.message}\n"
        summary += f"  Recommendation: {finding.recommendation}\n"
    
    logger.info(
        "Risk findings explanation: user_id=%s, findings=%s",
        user_context.get("user_id", "unknown"),
        len(findings)
    )
    
    return summary