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