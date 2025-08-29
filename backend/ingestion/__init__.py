"""
A1Betting Ingestion Pipeline Module

This module provides the complete ingestion and normalization pipeline for sports
prop market data. It supports data ingestion from external providers, normalization
to internal taxonomy, and persistence with change tracking.

Key Components:
- sources: External provider clients and data adapters
- normalization: Taxonomy mapping and data transformation services
- pipeline: End-to-end ingestion orchestration
- models: DTOs and database models for ingestion data
- scheduler: Periodic ingestion scheduling (placeholder)
"""

__version__ = "1.0.0"
__author__ = "A1Betting Platform"

# Auto-import connector modules so they register with the unified registry on package import.
# Use best-effort imports so missing optional connectors don't break startup.
try:
	# Top-level connectors
	from . import mlb_stats_connector  # noqa: F401
	from . import baseball_savant_connector  # noqa: F401
except Exception:
	pass

try:
	# Optional: import connectors placed under sources/
	from .sources import *  # noqa: F401,F403
except Exception:
	pass