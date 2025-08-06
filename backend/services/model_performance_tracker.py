"""Model Performance Tracking Service
Advanced analytics system for monitoring ML model performance across all sports.
Part of Phase 3 Week 3: Advanced Analytics implementation.
"""

import asyncio
import json
import logging
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
import redis
from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    Integer,
    String,
    create_engine,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker

logger = logging.getLogger("propollama.performance_tracker")

Base = declarative_base()


class ModelStatus(Enum):
    """Model status enumeration"""

    ACTIVE = "active"
    INACTIVE = "inactive"
    TRAINING = "training"
    DEGRADED = "degraded"
    ERROR = "error"


class MetricType(Enum):
    """Performance metric types"""

    ACCURACY = "accuracy"
    PRECISION = "precision"
    RECALL = "recall"
    F1_SCORE = "f1_score"
    ROI = "roi"
    WIN_RATE = "win_rate"
    CONFIDENCE_SCORE = "confidence_score"
    PREDICTION_LATENCY = "prediction_latency"
    KELLY_CRITERION = "kelly_criterion"
    EXPECTED_VALUE = "expected_value"


@dataclass
class PerformanceMetric:
    """Performance metric data structure"""

    metric_type: MetricType
    value: float
    timestamp: datetime
    model_name: str
    sport: str
    confidence_interval: Optional[Tuple[float, float]] = None
    sample_size: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class ModelPerformanceSnapshot:
    """Complete performance snapshot for a model"""

    model_name: str
    sport: str
    timestamp: datetime
    status: ModelStatus
    metrics: Dict[str, float]
    predictions_count: int
    wins: int
    losses: int
    total_roi: float
    avg_confidence: float
    error_rate: float
    last_prediction: Optional[datetime] = None
    version: Optional[str] = None


class ModelPerformanceRecord(Base):
    """Database model for performance tracking"""

    __tablename__ = "model_performance"

    id = Column(Integer, primary_key=True)
    model_name = Column(String(100), nullable=False, index=True)
    sport = Column(String(20), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    status = Column(String(20), nullable=False)

    # Core metrics
    accuracy = Column(Float)
    precision = Column(Float)
    recall = Column(Float)
    f1_score = Column(Float)
    roi = Column(Float)
    win_rate = Column(Float)
    confidence_score = Column(Float)
    prediction_latency = Column(Float)

    # Betting metrics
    kelly_criterion = Column(Float)
    expected_value = Column(Float)
    total_predictions = Column(Integer, default=0)
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)

    # Additional data
    error_rate = Column(Float, default=0.0)
    sample_size = Column(Integer)
    model_metadata = Column(JSON)
    version = Column(String(50))


class ModelPerformanceTracker:
    """Advanced model performance tracking and analytics service"""

    def __init__(
        self,
        db_url: str = "sqlite:///model_performance.db",
        redis_url: str = "redis://localhost:6379",
    ):
        self.db_url = db_url
        self.redis_url = redis_url
        self.engine = create_engine(db_url)
        self.SessionLocal = sessionmaker(bind=self.engine)
        self.redis_client = None
        self.is_initialized = False

        # Performance thresholds for alerts
        self.performance_thresholds = {
            MetricType.ACCURACY: 0.75,
            MetricType.WIN_RATE: 0.60,
            MetricType.ROI: 0.05,
            MetricType.CONFIDENCE_SCORE: 0.70,
        }

        # Cache settings
        self.cache_ttl = 300  # 5 minutes

    async def initialize(self) -> bool:
        """Initialize the performance tracking system"""
        try:
            # Create database tables
            Base.metadata.create_all(self.engine)

            # Initialize Redis connection
            try:
                self.redis_client = redis.from_url(
                    self.redis_url, decode_responses=True
                )
                await asyncio.to_thread(self.redis_client.ping)
                logger.info("Redis connection established for performance tracking")
            except Exception as e:
                logger.warning(f"Redis not available for performance tracking: {e}")
                self.redis_client = None

            self.is_initialized = True
            logger.info("ModelPerformanceTracker initialized successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to initialize ModelPerformanceTracker: {e}")
            return False

    async def record_prediction(
        self,
        model_name: str,
        sport: str,
        prediction_value: float,
        actual_value: Optional[float] = None,
        confidence: float = 0.0,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """Record a model prediction for performance tracking"""
        try:
            if not self.is_initialized:
                await self.initialize()

            # Store prediction in cache for later evaluation
            prediction_data = {
                "model_name": model_name,
                "sport": sport,
                "prediction_value": prediction_value,
                "actual_value": actual_value,
                "confidence": confidence,
                "timestamp": datetime.utcnow().isoformat(),
                "metadata": metadata or {},
            }

            # Cache in Redis if available
            if self.redis_client:
                cache_key = (
                    f"prediction:{model_name}:{sport}:{datetime.utcnow().timestamp()}"
                )
                await asyncio.to_thread(
                    self.redis_client.setex,
                    cache_key,
                    self.cache_ttl * 24,  # Keep predictions for 24 hours
                    json.dumps(prediction_data),
                )

            # Store in database
            with self.SessionLocal() as session:
                # Check if we need to update performance metrics
                await self._update_model_metrics(
                    session, model_name, sport, prediction_data
                )

            return True

        except Exception as e:
            logger.error(f"Failed to record prediction for {model_name}: {e}")
            return False

    async def update_performance_metrics(
        self, model_name: str, sport: str, metrics: Dict[str, float]
    ) -> bool:
        """Update performance metrics for a specific model"""
        try:
            if not self.is_initialized:
                await self.initialize()

            with self.SessionLocal() as session:
                record = ModelPerformanceRecord(
                    model_name=model_name,
                    sport=sport,
                    timestamp=datetime.utcnow(),
                    status=ModelStatus.ACTIVE.value,
                    accuracy=metrics.get("accuracy"),
                    precision=metrics.get("precision"),
                    recall=metrics.get("recall"),
                    f1_score=metrics.get("f1_score"),
                    roi=metrics.get("roi"),
                    win_rate=metrics.get("win_rate"),
                    confidence_score=metrics.get("confidence_score"),
                    prediction_latency=metrics.get("prediction_latency"),
                    kelly_criterion=metrics.get("kelly_criterion"),
                    expected_value=metrics.get("expected_value"),
                    total_predictions=int(metrics.get("total_predictions", 0)),
                    wins=int(metrics.get("wins", 0)),
                    losses=int(metrics.get("losses", 0)),
                    error_rate=metrics.get("error_rate", 0.0),
                    sample_size=int(metrics.get("sample_size", 0)),
                    model_metadata=metrics.get("metadata", {}),
                )

                session.add(record)
                session.commit()

                # Cache latest metrics
                if self.redis_client:
                    cache_key = f"metrics:{model_name}:{sport}"
                    await asyncio.to_thread(
                        self.redis_client.setex,
                        cache_key,
                        self.cache_ttl,
                        json.dumps(metrics),
                    )

                logger.info(f"Updated performance metrics for {model_name} ({sport})")
                return True

        except Exception as e:
            logger.error(f"Failed to update performance metrics for {model_name}: {e}")
            return False

    async def get_model_performance(
        self, model_name: str, sport: str, days: int = 7
    ) -> Optional[ModelPerformanceSnapshot]:
        """Get performance snapshot for a specific model"""
        try:
            # Check cache first
            if self.redis_client:
                cache_key = f"performance:{model_name}:{sport}:{days}"
                cached = await asyncio.to_thread(self.redis_client.get, cache_key)
                if cached:
                    data = json.loads(cached)
                    return ModelPerformanceSnapshot(**data)

            with self.SessionLocal() as session:
                end_date = datetime.utcnow()
                start_date = end_date - timedelta(days=days)

                records = (
                    session.query(ModelPerformanceRecord)
                    .filter(
                        ModelPerformanceRecord.model_name == model_name,
                        ModelPerformanceRecord.sport == sport,
                        ModelPerformanceRecord.timestamp >= start_date,
                    )
                    .order_by(ModelPerformanceRecord.timestamp.desc())
                    .all()
                )

                if not records:
                    return None

                latest_record = records[0]

                # Calculate aggregated metrics
                total_predictions = sum(r.total_predictions or 0 for r in records)
                total_wins = sum(r.wins or 0 for r in records)
                total_losses = sum(r.losses or 0 for r in records)
                avg_roi = np.mean([r.roi for r in records if r.roi is not None])
                avg_confidence = np.mean(
                    [
                        r.confidence_score
                        for r in records
                        if r.confidence_score is not None
                    ]
                )

                snapshot = ModelPerformanceSnapshot(
                    model_name=model_name,
                    sport=sport,
                    timestamp=latest_record.timestamp,
                    status=ModelStatus(latest_record.status),
                    metrics={
                        "accuracy": latest_record.accuracy or 0.0,
                        "precision": latest_record.precision or 0.0,
                        "recall": latest_record.recall or 0.0,
                        "f1_score": latest_record.f1_score or 0.0,
                        "roi": avg_roi or 0.0,
                        "win_rate": latest_record.win_rate or 0.0,
                        "confidence_score": avg_confidence or 0.0,
                    },
                    predictions_count=total_predictions,
                    wins=total_wins,
                    losses=total_losses,
                    total_roi=avg_roi or 0.0,
                    avg_confidence=avg_confidence or 0.0,
                    error_rate=latest_record.error_rate or 0.0,
                    last_prediction=latest_record.timestamp,
                    version=latest_record.version,
                )

                # Cache result
                if self.redis_client:
                    await asyncio.to_thread(
                        self.redis_client.setex,
                        cache_key,
                        self.cache_ttl,
                        json.dumps(asdict(snapshot), default=str),
                    )

                return snapshot

        except Exception as e:
            logger.error(f"Failed to get performance for {model_name}: {e}")
            return None

    async def get_all_models_performance(
        self, sport: Optional[str] = None
    ) -> List[ModelPerformanceSnapshot]:
        """Get performance snapshots for all models"""
        try:
            with self.SessionLocal() as session:
                query = session.query(
                    ModelPerformanceRecord.model_name, ModelPerformanceRecord.sport
                ).distinct()

                if sport:
                    query = query.filter(ModelPerformanceRecord.sport == sport)

                model_sport_pairs = query.all()

                snapshots = []
                for model_name, model_sport in model_sport_pairs:
                    snapshot = await self.get_model_performance(model_name, model_sport)
                    if snapshot:
                        snapshots.append(snapshot)

                return snapshots

        except Exception as e:
            logger.error(f"Failed to get all models performance: {e}")
            return []

    async def detect_performance_degradation(
        self, threshold_percentage: float = 0.10
    ) -> List[Dict[str, Any]]:
        """Detect models with performance degradation"""
        try:
            alerts = []
            snapshots = await self.get_all_models_performance()

            for snapshot in snapshots:
                issues = []

                # Check each metric against thresholds
                for metric_type, threshold in self.performance_thresholds.items():
                    metric_value = snapshot.metrics.get(metric_type.value, 0.0)
                    if metric_value < threshold:
                        issues.append(
                            f"{metric_type.value}: {metric_value:.3f} < {threshold}"
                        )

                # Check error rate
                if snapshot.error_rate > 0.05:  # 5% error rate threshold
                    issues.append(f"High error rate: {snapshot.error_rate:.3f}")

                if issues:
                    alerts.append(
                        {
                            "model_name": snapshot.model_name,
                            "sport": snapshot.sport,
                            "issues": issues,
                            "timestamp": snapshot.timestamp,
                            "severity": "high" if len(issues) > 2 else "medium",
                        }
                    )

            return alerts

        except Exception as e:
            logger.error(f"Failed to detect performance degradation: {e}")
            return []

    async def _update_model_metrics(
        self,
        session: Session,
        model_name: str,
        sport: str,
        prediction_data: Dict[str, Any],
    ) -> None:
        """Internal method to update model metrics based on new prediction"""
        try:
            # For now, just increment prediction count
            # In a real implementation, you'd wait for actual results and calculate metrics
            latest_record = (
                session.query(ModelPerformanceRecord)
                .filter(
                    ModelPerformanceRecord.model_name == model_name,
                    ModelPerformanceRecord.sport == sport,
                )
                .order_by(ModelPerformanceRecord.timestamp.desc())
                .first()
            )

            if latest_record:
                latest_record.total_predictions = (
                    latest_record.total_predictions or 0
                ) + 1
                session.commit()

        except Exception as e:
            logger.error(f"Failed to update model metrics: {e}")

    async def get_performance_trends(
        self, model_name: str, sport: str, days: int = 30
    ) -> Dict[str, List[float]]:
        """Get performance trends over time"""
        try:
            with self.SessionLocal() as session:
                end_date = datetime.utcnow()
                start_date = end_date - timedelta(days=days)

                records = (
                    session.query(ModelPerformanceRecord)
                    .filter(
                        ModelPerformanceRecord.model_name == model_name,
                        ModelPerformanceRecord.sport == sport,
                        ModelPerformanceRecord.timestamp >= start_date,
                    )
                    .order_by(ModelPerformanceRecord.timestamp.asc())
                    .all()
                )

                trends = {
                    "timestamps": [r.timestamp.isoformat() for r in records],
                    "accuracy": [r.accuracy or 0.0 for r in records],
                    "roi": [r.roi or 0.0 for r in records],
                    "win_rate": [r.win_rate or 0.0 for r in records],
                    "confidence": [r.confidence_score or 0.0 for r in records],
                }

                return trends

        except Exception as e:
            logger.error(f"Failed to get performance trends: {e}")
            return {}


# Global instance
performance_tracker = ModelPerformanceTracker()
