"""
Payout Normalization Service

Converts provider-specific payout formats (odds, multipliers, boosts) into
canonical internal schema with standardized multipliers. This eliminates
branching logic in downstream processing and enables consistent line hashing.
"""

import logging
from typing import Optional, Dict, Any

from ..models.dto import PayoutSchema, PayoutType, PayoutVariant, RawExternalPropDTO

logger = logging.getLogger(__name__)


class PayoutNormalizationError(Exception):
    """Exception raised when payout normalization fails."""
    pass


def normalize_payout(raw_prop: RawExternalPropDTO) -> PayoutSchema:
    """
    Convert raw provider payout data to canonical internal schema.
    
    Args:
        raw_prop: Raw prop data from external provider
        
    Returns:
        Normalized payout schema with canonical multipliers
        
    Raises:
        PayoutNormalizationError: If normalization fails
    """
    try:
        # Determine provider payout variant based on available fields
        variant_code = _detect_payout_variant(raw_prop)
        
        # Convert to canonical multiplier format
        over_multiplier, under_multiplier = _convert_to_multipliers(raw_prop, variant_code)
        
        # Preserve original format for debugging
        provider_format = {
            "provider_name": raw_prop.provider_name,
            "payout_type": raw_prop.payout_type.value,
            "over_odds": raw_prop.over_odds,
            "under_odds": raw_prop.under_odds,
            "detected_variant": variant_code.value
        }
        
        return PayoutSchema(
            type=raw_prop.payout_type,
            variant_code=variant_code,
            over_multiplier=over_multiplier,
            under_multiplier=under_multiplier,
            over=raw_prop.over_odds,  # Keep for backward compatibility
            under=raw_prop.under_odds,  # Keep for backward compatibility
            boost_multiplier=_detect_boost_multiplier(raw_prop),
            provider_format=provider_format
        )
        
    except Exception as e:
        raise PayoutNormalizationError(
            f"Failed to normalize payout for {raw_prop.provider_name} "
            f"prop {raw_prop.provider_prop_id}: {e}"
        ) from e


def _detect_payout_variant(raw_prop: RawExternalPropDTO) -> PayoutVariant:
    """
    Detect the payout variant used by the provider.
    
    Args:
        raw_prop: Raw prop data
        
    Returns:
        Detected payout variant
    """
    provider = raw_prop.provider_name.lower()
    
    # Provider-specific variant detection
    if "prizepicks" in provider:
        return PayoutVariant.MULTIPLIER
    elif "draftkings" in provider or "fanduel" in provider:
        # DraftKings/FanDuel use American moneyline odds
        return PayoutVariant.MONEYLINE
    elif "bet365" in provider or "pinnacle" in provider:
        # European sportsbooks often use decimal odds
        return PayoutVariant.DECIMAL_ODDS
    else:
        # Default to standard odds format
        return PayoutVariant.STANDARD_ODDS


def _convert_to_multipliers(raw_prop: RawExternalPropDTO, variant: PayoutVariant) -> tuple[Optional[float], Optional[float]]:
    """
    Convert provider-specific payout format to canonical multipliers.
    
    Args:
        raw_prop: Raw prop data
        variant: Detected payout variant
        
    Returns:
        Tuple of (over_multiplier, under_multiplier)
    """
    if variant == PayoutVariant.MULTIPLIER:
        # Already in multiplier format (e.g., PrizePicks)
        return raw_prop.over_odds, raw_prop.under_odds
    
    elif variant == PayoutVariant.MONEYLINE:
        # Convert American moneyline to multipliers
        over_mult = _moneyline_to_multiplier(raw_prop.over_odds) if raw_prop.over_odds else None
        under_mult = _moneyline_to_multiplier(raw_prop.under_odds) if raw_prop.under_odds else None
        return over_mult, under_mult
    
    elif variant == PayoutVariant.DECIMAL_ODDS:
        # Decimal odds are already close to multipliers
        return raw_prop.over_odds, raw_prop.under_odds
    
    elif variant == PayoutVariant.STANDARD_ODDS:
        # Convert standard American odds to multipliers
        over_mult = _american_odds_to_multiplier(raw_prop.over_odds) if raw_prop.over_odds else None
        under_mult = _american_odds_to_multiplier(raw_prop.under_odds) if raw_prop.under_odds else None
        return over_mult, under_mult
    
    else:
        logger.warning(f"Unknown payout variant {variant}, using raw values")
        return raw_prop.over_odds, raw_prop.under_odds


def _moneyline_to_multiplier(moneyline: float) -> float:
    """
    Convert American moneyline odds to multiplier.
    
    Args:
        moneyline: American moneyline odds (e.g., -110, +150)
        
    Returns:
        Multiplier (payout per dollar wagered)
    """
    if moneyline > 0:
        # Positive moneyline: +150 means win $150 for every $100 bet
        return (moneyline / 100) + 1
    else:
        # Negative moneyline: -110 means bet $110 to win $100
        return (100 / abs(moneyline)) + 1


def _american_odds_to_multiplier(odds: float) -> float:
    """
    Convert American odds to multiplier.
    
    Args:
        odds: American odds
        
    Returns:
        Multiplier
    """
    # For now, assume American odds are similar to moneyline
    # More sophisticated conversion can be added based on provider specifics
    return _moneyline_to_multiplier(odds)


def _detect_boost_multiplier(raw_prop: RawExternalPropDTO) -> Optional[float]:
    """
    Detect if a boost multiplier is present.
    
    Args:
        raw_prop: Raw prop data
        
    Returns:
        Boost multiplier if detected, None otherwise
    """
    # Check additional data for boost indicators
    additional = raw_prop.additional_data
    
    # Common boost field names
    boost_fields = ["boost", "multiplier", "promo_multiplier", "enhanced_odds"]
    
    for field in boost_fields:
        if field in additional and additional[field]:
            try:
                boost_value = float(additional[field])
                if boost_value > 1.0:
                    return boost_value
            except (ValueError, TypeError):
                continue
    
    # Check if payout type indicates boost
    if raw_prop.payout_type == PayoutType.BOOST:
        # Infer boost from odds differential (heuristic)
        if raw_prop.over_odds and raw_prop.under_odds:
            avg_multiplier = (raw_prop.over_odds + raw_prop.under_odds) / 2
            if avg_multiplier > 2.0:  # Unusually high payout suggests boost
                return min(avg_multiplier / 1.8, 2.0)  # Cap boost at 2x
    
    return None


def validate_normalized_payout(payout: PayoutSchema) -> bool:
    """
    Validate that normalized payout schema is reasonable.
    
    Args:
        payout: Normalized payout schema
        
    Returns:
        True if valid, False otherwise
    """
    try:
        # Check for presence of canonical multipliers
        if not payout.is_canonical_format:
            logger.warning("Payout schema missing canonical multiplier format")
            return False
        
        # Validate multiplier ranges
        if payout.over_multiplier and (payout.over_multiplier < 1.01 or payout.over_multiplier > 50.0):
            logger.warning(f"Over multiplier {payout.over_multiplier} outside reasonable range")
            return False
            
        if payout.under_multiplier and (payout.under_multiplier < 1.01 or payout.under_multiplier > 50.0):
            logger.warning(f"Under multiplier {payout.under_multiplier} outside reasonable range")
            return False
        
        # Validate boost multiplier
        if payout.boost_multiplier and (payout.boost_multiplier < 1.0 or payout.boost_multiplier > 5.0):
            logger.warning(f"Boost multiplier {payout.boost_multiplier} outside reasonable range")
            return False
        
        return True
        
    except Exception as e:
        logger.error(f"Error validating payout schema: {e}")
        return False


def get_provider_payout_mapping() -> Dict[str, PayoutVariant]:
    """
    Get mapping of known providers to their payout variants.
    
    Returns:
        Dictionary mapping provider names to payout variants
    """
    return {
        # Multiplier-based providers
        "prizepicks": PayoutVariant.MULTIPLIER,
        "underdog": PayoutVariant.MULTIPLIER,
        "superdraft": PayoutVariant.MULTIPLIER,
        
        # American sportsbooks (moneyline)
        "draftkings": PayoutVariant.MONEYLINE,
        "fanduel": PayoutVariant.MONEYLINE,
        "mgm": PayoutVariant.MONEYLINE,
        "caesars": PayoutVariant.MONEYLINE,
        
        # European sportsbooks (decimal odds)
        "bet365": PayoutVariant.DECIMAL_ODDS,
        "pinnacle": PayoutVariant.DECIMAL_ODDS,
        "betfair": PayoutVariant.DECIMAL_ODDS,
        
        # Default/unknown
        "theodds": PayoutVariant.STANDARD_ODDS,
        "stub_provider": PayoutVariant.STANDARD_ODDS,
    }