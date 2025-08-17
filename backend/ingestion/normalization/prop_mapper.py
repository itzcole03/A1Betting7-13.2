"""
Prop Mapper for Data Normalization

Transforms raw external prop data into normalized DTOs ready for persistence.
Handles line hash computation, payout schema standardization, and validation.
"""

import hashlib
import logging
from datetime import datetime
from typing import Dict, Any, Optional

from ..models.dto import RawExternalPropDTO, NormalizedPropDTO, PayoutSchema, PayoutType, PropTypeEnum
from .taxonomy_service import TaxonomyService, TaxonomyError
from .payout_normalizer import normalize_payout, PayoutNormalizationError

logger = logging.getLogger(__name__)


class PropMappingError(Exception):
    """Exception raised when prop mapping fails."""
    pass


def map_raw_to_normalized(raw_prop: RawExternalPropDTO, taxonomy_service: TaxonomyService, sport: str = "NBA") -> NormalizedPropDTO:
    """
    Map raw external prop data to normalized DTO.
    
    Args:
        raw_prop: Raw prop data from external provider
        taxonomy_service: Service for taxonomy normalization
        sport: Sport context for normalization (default: NBA)
        
    Returns:
        Normalized prop DTO ready for persistence
        
    Raises:
        PropMappingError: If mapping fails due to data issues
    """
    try:
        # Normalize prop category using taxonomy service with provider context
        prop_type = derive_prop_type(raw_prop.prop_category, taxonomy_service, sport, raw_prop.provider_name)
        
        # Normalize team code
        team_abbreviation = taxonomy_service.normalize_team_code(raw_prop.team_code, sport)
        
        # Create standardized payout schema using normalization
        payout_schema = normalize_payout(raw_prop)
        
        # Parse timestamp
        timestamp = datetime.fromisoformat(raw_prop.updated_ts.replace('Z', '+00:00'))
        
        # Create external IDs mapping
        external_ids = {
            "provider_player_id": raw_prop.external_player_id,
            "provider_prop_id": raw_prop.provider_prop_id,
            "provider_name": raw_prop.provider_name
        }
        
        # Create normalized DTO
        normalized = NormalizedPropDTO(
            player_name=_normalize_player_name(raw_prop.player_name),
            team_abbreviation=team_abbreviation,
            prop_type=prop_type,
            offered_line=raw_prop.line_value,
            source=raw_prop.provider_name,
            payout_schema=payout_schema,
            external_ids=external_ids,
            timestamp=timestamp,
            position=raw_prop.additional_data.get("position"),
            sport=sport,  # Use passed sport parameter
            player_id=None,  # Will be set during persistence
            line_hash=""     # Will be computed below
        )
        
        # Compute and set line hash
        normalized.line_hash = compute_line_hash(
            prop_type=normalized.prop_type,
            offered_line=normalized.offered_line,
            payout_schema=normalized.payout_schema
        )
        
        logger.debug(f"Successfully mapped prop: {raw_prop.player_name} {prop_type.value} {raw_prop.line_value}")
        return normalized
        
    except TaxonomyError as e:
        raise PropMappingError(f"Taxonomy mapping failed for prop {raw_prop.provider_prop_id}: {e}") from e
    except PayoutNormalizationError as e:
        raise PropMappingError(f"Payout normalization failed for prop {raw_prop.provider_prop_id}: {e}") from e
    except ValueError as e:
        raise PropMappingError(f"Data validation failed for prop {raw_prop.provider_prop_id}: {e}") from e
    except Exception as e:
        raise PropMappingError(f"Unexpected error mapping prop {raw_prop.provider_prop_id}: {e}") from e


def derive_prop_type(raw_category: str, taxonomy_service: TaxonomyService, sport: str = "NBA", provider: Optional[str] = None) -> PropTypeEnum:
    """
    Derive canonical prop type from raw category using provider-specific mappings.
    
    Args:
        raw_category: Raw prop category string
        taxonomy_service: Service for taxonomy lookups
        sport: Sport context for normalization (default: NBA)
        provider: Provider name for provider-specific translation (optional)
        
    Returns:
        Canonical prop type enum
        
    Raises:
        PropMappingError: If prop type cannot be derived
    """
    try:
        return taxonomy_service.normalize_prop_category(raw_category, sport, provider)
    except TaxonomyError as e:
        raise PropMappingError(f"Cannot derive prop type from category '{raw_category}': {e}") from e


def compute_line_hash(prop_type: PropTypeEnum, offered_line: float, payout_schema: PayoutSchema) -> str:
    """
    Compute stable hash for line change detection using canonical representation.
    
    The hash includes all factors that constitute a "line change":
    - Prop type 
    - Offered line value
    - Canonical payout schema (normalized multipliers)
    
    This ensures consistent hashing across providers and triggers 
    proper edge/valuation recomputation when payouts change.
    
    Args:
        prop_type: Canonical prop type
        offered_line: Offered line value
        payout_schema: Standardized payout information
        
    Returns:
        SHA-256 hash as hex string
    """
    # Create consistent string representation for hashing
    hash_components = [
        prop_type.value,
        f"{offered_line:.1f}",  # Standardize precision
        payout_schema.type.value,
        payout_schema.variant_code.value,
        
        # Use canonical multipliers for consistent hashing
        f"{payout_schema.over_multiplier:.3f}" if payout_schema.over_multiplier else "None",
        f"{payout_schema.under_multiplier:.3f}" if payout_schema.under_multiplier else "None",
        f"{payout_schema.boost_multiplier:.3f}" if payout_schema.boost_multiplier else "None"
    ]
    
    # Join with consistent separator
    hash_input = "|".join(hash_components)
    
    # Compute SHA-256 hash
    hash_bytes = hashlib.sha256(hash_input.encode('utf-8')).hexdigest()
    
    logger.debug(f"Computed line hash for {prop_type.value} {offered_line} "
                f"(variant: {payout_schema.variant_code.value}): {hash_bytes[:8]}...")
    return hash_bytes


def _normalize_player_name(raw_name: str) -> str:
    """
    Normalize player name for consistency.
    
    Args:
        raw_name: Raw player name
        
    Returns:
        Normalized player name
    """
    # Basic normalization: trim whitespace and standardize case
    normalized = raw_name.strip()
    
    # Handle common name variations
    # TODO: Add more sophisticated name normalization if needed
    
    return normalized


def validate_normalized_prop(normalized_prop: NormalizedPropDTO) -> bool:
    """
    Validate that normalized prop has all required fields.
    
    Args:
        normalized_prop: Normalized prop DTO to validate
        
    Returns:
        True if valid, False otherwise
    """
    try:
        # Check required fields
        if not normalized_prop.player_name or len(normalized_prop.player_name.strip()) == 0:
            logger.warning("Invalid normalized prop: empty player name")
            return False
            
        if not normalized_prop.team_abbreviation or len(normalized_prop.team_abbreviation.strip()) == 0:
            logger.warning("Invalid normalized prop: empty team abbreviation")
            return False
            
        if normalized_prop.offered_line < 0:
            logger.warning(f"Invalid normalized prop: negative line value {normalized_prop.offered_line}")
            return False
            
        if not normalized_prop.source:
            logger.warning("Invalid normalized prop: empty source")
            return False
            
        if not normalized_prop.line_hash:
            logger.warning("Invalid normalized prop: empty line hash")
            return False
            
        return True
        
    except Exception as e:
        logger.error(f"Error validating normalized prop: {e}")
        return False


def create_external_ids_mapping(raw_prop: RawExternalPropDTO) -> Dict[str, str]:
    """
    Create external IDs mapping for tracking provider references.
    
    Args:
        raw_prop: Raw prop data
        
    Returns:
        Dictionary mapping provider names to external IDs
    """
    return {
        raw_prop.provider_name: raw_prop.external_player_id,
        f"{raw_prop.provider_name}_prop": raw_prop.provider_prop_id
    }


def extract_position_from_additional_data(additional_data: Dict[str, Any]) -> Optional[str]:
    """
    Extract player position from additional data.
    
    Args:
        additional_data: Provider's additional data
        
    Returns:
        Player position string or None
    """
    if not additional_data:
        return None
        
    # Try common position field names
    position_keys = ["position", "pos", "player_position"]
    
    for key in position_keys:
        if key in additional_data and additional_data[key]:
            return str(additional_data[key]).strip().upper()
    
    return None