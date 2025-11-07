"""
Ingestion Normalization Module

Provides services for normalizing external data to internal taxonomy.
"""

from .taxonomy_service import TaxonomyService, TaxonomyError, taxonomy_service
from .prop_mapper import (
    map_raw_to_normalized,
    derive_prop_type,
    compute_line_hash,
    validate_normalized_prop,
    create_external_ids_mapping,
    extract_position_from_additional_data,
    PropMappingError
)

__all__ = [
    # Services
    "TaxonomyService",
    "taxonomy_service",
    
    # Mapping functions
    "map_raw_to_normalized",
    "derive_prop_type", 
    "compute_line_hash",
    "validate_normalized_prop",
    "create_external_ids_mapping",
    "extract_position_from_additional_data",
    
    # Exceptions
    "TaxonomyError",
    "PropMappingError"
]