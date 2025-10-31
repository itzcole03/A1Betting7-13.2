"""
Modeling Database Models - SQLAlchemy models for baseline modeling, valuation, and edge detection
"""

from __future__ import annotations

import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
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


class ModelType(enum.Enum):
    """Types of statistical models"""
    POISSON = "POISSON"
    NORMAL = "NORMAL"
    NEG_BINOMIAL = "NEG_BINOMIAL"
    RULE_BASED = "RULE_BASED"


class DistributionFamily(enum.Enum):
    """Distribution families for model predictions"""
    POISSON = "POISSON"
    NORMAL = "NORMAL"
    NEG_BINOMIAL = "NEG_BINOMIAL"


class EdgeStatus(enum.Enum):
    """Edge detection status"""
    ACTIVE = "ACTIVE"
    RETIRED = "RETIRED"


class ModelVersion(Base):
    """Model versions table for model registry"""
    __tablename__ = "model_versions"
    __table_args__ = (
        Index("idx_model_name_version", "name", "version_tag"),
        Index("idx_model_type", "model_type"),
        Index("idx_model_created", "created_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # e.g. "baseline_poisson_points"
    version_tag = Column(String(50), nullable=False)  # e.g. "v1"
    model_type = Column(Enum(ModelType), nullable=False)
    hyperparams = Column(JSON, nullable=True)
    created_at = Column(
        DateTime(timezone=True), 
        nullable=False, 
        default=lambda: datetime.now(timezone.utc)
    )
    is_default = Column(Boolean, default=False, nullable=False)

    # Relationships
    predictions = relationship("ModelPrediction", back_populates="model_version")
    prop_type_defaults = relationship("ModelPropTypeDefault", back_populates="model_version")
    edges = relationship("Edge", back_populates="model_version")
    explanations = relationship("Explanation", back_populates="model_version")


class ModelPropTypeDefault(Base):
    """Junction table for model defaults by prop type"""
    __tablename__ = "model_prop_type_defaults"
    __table_args__ = (
        Index("idx_prop_type_active", "prop_type", "active"),
        UniqueConstraint("model_version_id", "prop_type", name="uq_model_prop_type"),
    )

    id = Column(Integer, primary_key=True, index=True)
    model_version_id = Column(Integer, ForeignKey("model_versions.id"), nullable=False)
    prop_type = Column(String(50), nullable=False)  # POINTS, ASSISTS, REBOUNDS, etc.
    active = Column(Boolean, default=True, nullable=False)
    assigned_at = Column(
        DateTime(timezone=True), 
        nullable=False, 
        default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    model_version = relationship("ModelVersion", back_populates="prop_type_defaults")


class ModelPrediction(Base):
    """Model predictions table"""
    __tablename__ = "model_predictions"
    __table_args__ = (
        Index("idx_prediction_prop_model", "prop_id", "model_version_id"),
        Index("idx_prediction_player", "player_id"),
        Index("idx_prediction_prop_type", "prop_type"),
        Index("idx_prediction_generated", "generated_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    model_version_id = Column(Integer, ForeignKey("model_versions.id"), nullable=False)
    prop_id = Column(Integer, nullable=False)  # FK to props table (external)
    player_id = Column(Integer, nullable=False)  # FK to players table (external)
    prop_type = Column(String(50), nullable=False)
    
    # Prediction values
    mean = Column(Float, nullable=False)
    variance = Column(Float, nullable=False)
    distribution_family = Column(Enum(DistributionFamily), nullable=False)
    sample_size = Column(Integer, nullable=True)
    features_hash = Column(String(64), nullable=False)  # SHA256 hash
    generated_at = Column(
        DateTime(timezone=True), 
        nullable=False, 
        default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    model_version = relationship("ModelVersion", back_populates="predictions")
    valuations = relationship("Valuation", back_populates="model_prediction")


class Valuation(Base):
    """Valuations table for fair value calculations"""
    __tablename__ = "valuations"
    __table_args__ = (
        Index("idx_valuation_prop_model", "prop_id", "model_prediction_id", "created_at"),
        Index("idx_valuation_hash", "valuation_hash"),
        UniqueConstraint("valuation_hash", name="uq_valuation_hash"),
    )

    id = Column(Integer, primary_key=True, index=True)
    model_prediction_id = Column(Integer, ForeignKey("model_predictions.id"), nullable=False)
    prop_id = Column(Integer, nullable=False)  # FK to props table (external)
    
    # Market data
    offered_line = Column(Float, nullable=False)
    fair_line = Column(Float, nullable=False)
    
    # Probability calculations
    prob_over = Column(Float, nullable=False)
    prob_under = Column(Float, nullable=False)
    expected_value = Column(Float, nullable=False)
    
    # Market metadata
    payout_schema = Column(JSON, nullable=False)
    volatility_score = Column(Float, nullable=False)
    valuation_hash = Column(String(64), nullable=False, unique=True)
    created_at = Column(
        DateTime(timezone=True), 
        nullable=False, 
        default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    model_prediction = relationship("ModelPrediction", back_populates="valuations")
    edges = relationship("Edge", back_populates="valuation")


class Edge(Base):
    """Edges table for detected betting opportunities"""
    __tablename__ = "edges"
    __table_args__ = (
        Index("idx_edge_prop_model_status", "prop_id", "model_version_id", "status"),
        Index("idx_edge_score", "edge_score"),
        Index("idx_edge_status_created", "status", "created_at"),
        Index("idx_edge_correlation", "correlation_cluster_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    valuation_id = Column(Integer, ForeignKey("valuations.id"), nullable=False)
    prop_id = Column(Integer, nullable=False)  # FK to props table (external)
    model_version_id = Column(Integer, ForeignKey("model_versions.id"), nullable=False)
    
    # Edge metrics
    edge_score = Column(Float, nullable=False)
    ev = Column(Float, nullable=False)  # Expected value
    prob_over = Column(Float, nullable=False)
    offered_line = Column(Float, nullable=False)
    fair_line = Column(Float, nullable=False)
    
    # Status and correlation
    status = Column(Enum(EdgeStatus), default=EdgeStatus.ACTIVE)
    correlation_cluster_id = Column(Integer, nullable=True)
    
    # Timestamps
    created_at = Column(
        DateTime(timezone=True), 
        nullable=False, 
        default=lambda: datetime.now(timezone.utc)
    )
    retired_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    valuation = relationship("Valuation", back_populates="edges")
    model_version = relationship("ModelVersion", back_populates="edges")
    explanations = relationship("Explanation", back_populates="edge")


class Explanation(Base):
    """Explanations table for LLM-generated edge explanations"""
    __tablename__ = "explanations"
    __table_args__ = (
        Index("idx_explanation_edge", "edge_id"),
        Index("idx_explanation_model", "model_version_id"),
        Index("idx_explanation_created", "created_at"),
        Index("idx_explanation_model_prompt", "edge_id", "model_version_id", "prompt_version"),
    )

    id = Column(Integer, primary_key=True, index=True)
    edge_id = Column(Integer, ForeignKey("edges.id"), nullable=False)
    model_version_id = Column(Integer, ForeignKey("model_versions.id"), nullable=False)
    content = Column(Text, nullable=False)
    
    # LLM metadata columns
    prompt_version = Column(String(20), nullable=True, default="v1")
    provider = Column(String(50), nullable=True, default="local_stub")  
    tokens_used = Column(Integer, nullable=True, default=0)
    
    created_at = Column(
        DateTime(timezone=True), 
        nullable=False, 
        default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    edge = relationship("Edge", back_populates="explanations")
    model_version = relationship("ModelVersion", back_populates="explanations")