"""
Portfolio Optimization Database Models - SQLAlchemy models for advanced correlation modeling,
Monte Carlo simulation, and portfolio optimization
"""

from __future__ import annotations

import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from backend.models.base import Base


class CorrelationMethod(enum.Enum):
    """Correlation computation methods"""
    PCA = "PCA"
    SHRUNK = "SHRUNK" 
    HYBRID = "HYBRID"
    PEARSON = "PEARSON"
    COPULA = "COPULA"


class CacheEntryType(enum.Enum):
    """Cache entry types for correlation data"""
    MATRIX = "MATRIX"
    FACTOR = "FACTOR"
    COPULA_PARAMS = "COPULA_PARAMS"


class OptimizationObjective(enum.Enum):
    """Portfolio optimization objectives"""
    EV = "EV"
    EV_VAR_RATIO = "EV_VAR_RATIO"
    TARGET_PROB = "TARGET_PROB"


class OptimizationStatus(enum.Enum):
    """Optimization run status"""
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    PARTIAL = "PARTIAL"
    RUNNING = "RUNNING"


class ArtifactType(enum.Enum):
    """Optimization artifact types"""
    TRACE = "TRACE"
    INTERMEDIATE_POP = "INTERMEDIATE_POP"
    HEURISTIC_STEP = "HEURISTIC_STEP"


class CorrelationFactorModel(Base):
    """Factor models for correlation decomposition"""
    __tablename__ = "correlation_factor_models"
    __table_args__ = (
        Index("idx_factor_sport_context", "sport", "context_hash"),
        Index("idx_factor_method", "method"),
        Index("idx_factor_computed", "computed_at"),
        UniqueConstraint("sport", "context_hash", "method", "version_tag", name="uq_factor_model"),
    )

    id = Column(Integer, primary_key=True, index=True)
    sport = Column(String(10), nullable=False, default="MLB")
    context_hash = Column(String(64), nullable=False)  # Hash of prop_ids + timeframe
    method = Column(Enum(CorrelationMethod), nullable=False)
    
    # Factor model data
    factors_json = Column(JSON, nullable=False)  # Serialized eigenvectors/loadings
    eigenvalues_json = Column(JSON, nullable=False)
    explained_variance_ratio = Column(Float, nullable=False)
    sample_size = Column(Integer, nullable=False)
    
    # Versioning and timestamps
    version_tag = Column(String(50), nullable=False, default="v1")
    computed_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )


class CorrelationCacheEntry(Base):
    """Cache entries for correlation matrices and derived data"""
    __tablename__ = "correlation_cache_entries"
    __table_args__ = (
        Index("idx_cache_key", "cache_key"),
        Index("idx_cache_type_expires", "entry_type", "expires_at"),
        Index("idx_cache_created", "created_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    cache_key = Column(String(128), nullable=False, unique=True)  # Hash of request params
    entry_type = Column(Enum(CacheEntryType), nullable=False)
    payload_json = Column(JSON, nullable=False)  # Serialized data
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )
    expires_at = Column(DateTime(timezone=True), nullable=False)


class MonteCarloRun(Base):
    """Monte Carlo simulation run results"""
    __tablename__ = "monte_carlo_runs"
    __table_args__ = (
        Index("idx_mc_run_key", "run_key"),
        Index("idx_mc_legs_count", "legs_count"),
        Index("idx_mc_created", "created_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    run_key = Column(String(128), nullable=False, unique=True)  # Hash of run parameters
    legs_count = Column(Integer, nullable=False)
    draws_requested = Column(Integer, nullable=False)
    draws_executed = Column(Integer, nullable=False)
    
    # Simulation results
    variance_estimate = Column(Float, nullable=False)
    ev_independent = Column(Float, nullable=False)  # EV assuming independence
    ev_adjusted = Column(Float, nullable=False)  # EV adjusted for correlation
    prob_joint = Column(Float, nullable=False)  # Joint success probability
    
    # Distribution summary
    distribution_snapshots_json = Column(JSON, nullable=False)  # Quantiles, CI, etc.
    parameters_json = Column(JSON, nullable=False)  # Input parameters
    
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )


class OptimizationRun(Base):
    """Portfolio optimization run records"""
    __tablename__ = "optimization_runs"
    __table_args__ = (
        Index("idx_opt_objective", "objective"),
        Index("idx_opt_status_created", "status", "created_at"),
        Index("idx_opt_best_score", "best_score"),
    )

    id = Column(Integer, primary_key=True, index=True)
    objective = Column(Enum(OptimizationObjective), nullable=False)
    input_edge_ids = Column(JSON, nullable=False)  # Array of edge IDs to optimize over
    constraints_json = Column(JSON, nullable=False)  # Optimization constraints
    
    # Results
    solution_ticket_sets = Column(JSON, nullable=True)  # Array of solution tickets with metrics
    best_score = Column(Float, nullable=True)
    
    # Execution metadata
    status = Column(Enum(OptimizationStatus), nullable=False, default=OptimizationStatus.RUNNING)
    error_message = Column(Text, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    artifacts = relationship("OptimizationArtifact", back_populates="optimization_run", cascade="all, delete-orphan")


class OptimizationArtifact(Base):
    """Optimization artifacts for debugging and analysis"""
    __tablename__ = "optimization_artifacts"
    __table_args__ = (
        Index("idx_artifact_run_type", "optimization_run_id", "artifact_type"),
        Index("idx_artifact_created", "created_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    optimization_run_id = Column(Integer, ForeignKey("optimization_runs.id"), nullable=False)
    artifact_type = Column(Enum(ArtifactType), nullable=False)
    content = Column(JSON, nullable=False)  # Artifact data
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    optimization_run = relationship("OptimizationRun", back_populates="artifacts")