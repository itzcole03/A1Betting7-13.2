"""
Ingestion Pipeline Module

Provides end-to-end ingestion pipelines for sports data.
"""

from .nba_ingestion_pipeline import NBAIngestionPipeline, run_nba_ingestion

__all__ = [
    "NBAIngestionPipeline",
    "run_nba_ingestion"
]