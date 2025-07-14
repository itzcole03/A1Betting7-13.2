"""
Enterprise Real-Time Data Pipeline
Unified data pipeline architecture for maximum accuracy sports betting platform.
Handles data ingestion, validation, caching, and real-time updates across all sources.
"""

import asyncio
import logging
import time
import json
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional, Set, Tuple, Callable
from dataclasses import dataclass, field, asdict
from enum import Enum
import redis
import httpx
from collections import defaultdict, deque
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

logger = logging.getLogger(__name__)

Base = declarative_base()

class DataSourceType(Enum):
    """Types of data sources"""
    PRIZEPICKS = "prizepicks"
    SPORTSBOOK = "sportsbook"
    PLAYER_STATS = "player_stats"
    INJURY_REPORTS = "injury_reports"
    WEATHER = "weather"
    LINE_MOVEMENT = "line_movement"
    SHARP_MONEY = "sharp_money"
    PUBLIC_BETTING = "public_betting"

class DataQuality(Enum):
    """Data quality levels"""
    EXCELLENT = "excellent"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"
    INVALID = "invalid"

@dataclass
class DataPoint:
    """Standardized data point structure"""
    source: str
    source_type: DataSourceType
    data_id: str
    timestamp: datetime
    data: Dict[str, Any]
    quality: DataQuality = DataQuality.GOOD
    confidence: float = 0.8
    freshness_score: float = 1.0
    validation_errors: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class DataValidationRule:
    """Data validation rule definition"""
    field_name: str
    rule_type: str  # "required", "type", "range", "pattern", "custom"
    parameters: Dict[str, Any]
    error_message: str
    severity: str = "error"  # "error", "warning", "info"

@dataclass
class DataPipelineMetrics:
    """Data pipeline performance metrics"""
    source: str
    total_records: int = 0
    valid_records: int = 0
    invalid_records: int = 0
    processing_time: float = 0.0
    last_update: Optional[datetime] = None
    error_rate: float = 0.0
    freshness_score: float = 1.0
    throughput: float = 0.0
    cache_hit_rate: float = 0.0

# Database Models
class DataIngestionLog(Base):
    """Log of all data ingestion activities"""
    __tablename__ = "data_ingestion_log"
    
    id = Column(Integer, primary_key=True)
    source = Column(String, index=True)
    source_type = Column(String)
    data_id = Column(String, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    data_hash = Column(String)
    quality = Column(String)
    confidence = Column(Float)
    processing_time = Column(Float)
    validation_errors = Column(JSON)
    metadata = Column(JSON)

class DataQualityMetrics(Base):
    """Data quality metrics over time"""
    __tablename__ = "data_quality_metrics"
    
    id = Column(Integer, primary_key=True)
    source = Column(String, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    total_records = Column(Integer)
    valid_records = Column(Integer)
    error_rate = Column(Float)
    freshness_score = Column(Float)
    confidence_avg = Column(Float)
    throughput = Column(Float)

class EnterpriseDataPipeline:
    """Enterprise-grade real-time data pipeline"""
    
    def __init__(self, redis_url: str = "redis://localhost:6379", database_url: str = "sqlite:///data_pipeline.db"):
        self.redis_url = redis_url
        self.database_url = database_url
        
        # Initialize connections
        self.redis_client = None
        self.db_session = None
        
        # Data storage
        self.data_streams: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        self.validation_rules: Dict[DataSourceType, List[DataValidationRule]] = {}
        self.data_processors: Dict[DataSourceType, Callable] = {}
        self.cache_strategies: Dict[str, Dict] = {}
        
        # Metrics
        self.pipeline_metrics: Dict[str, DataPipelineMetrics] = defaultdict(DataPipelineMetrics)
        self.performance_history: deque = deque(maxlen=1440)  # 24 hours of minute-by-minute data
        
        # Configuration
        self.cache_ttl = {
            DataSourceType.PRIZEPICKS: 300,      # 5 minutes
            DataSourceType.SPORTSBOOK: 180,     # 3 minutes
            DataSourceType.PLAYER_STATS: 600,   # 10 minutes
            DataSourceType.INJURY_REPORTS: 1800, # 30 minutes
            DataSourceType.WEATHER: 3600,       # 1 hour
            DataSourceType.LINE_MOVEMENT: 60,   # 1 minute
        }
        
        self.initialize_pipeline()
    
    def initialize_pipeline(self):
        """Initialize the data pipeline"""
        logger.info("🚀 Initializing Enterprise Data Pipeline...")
        
        try:
            # Initialize Redis connection
            self.redis_client = redis.from_url(self.redis_url, decode_responses=True)
            self.redis_client.ping()
            logger.info("✅ Redis connection established")
        except Exception as e:
            logger.warning(f"⚠️ Redis connection failed: {e}")
            self.redis_client = None
        
        try:
            # Initialize database
            engine = create_engine(self.database_url)
            Base.metadata.create_all(engine)
            SessionLocal = sessionmaker(bind=engine)
            self.db_session = SessionLocal()
            logger.info("✅ Database connection established")
        except Exception as e:
            logger.error(f"❌ Database initialization failed: {e}")
        
        # Setup validation rules
        self.setup_validation_rules()
        
        # Setup data processors
        self.setup_data_processors()
        
        # Setup cache strategies
        self.setup_cache_strategies()
        
        logger.info("✅ Enterprise Data Pipeline initialized successfully")
    
    def setup_validation_rules(self):
        """Setup validation rules for each data source type"""
        
        # PrizePicks validation rules
        self.validation_rules[DataSourceType.PRIZEPICKS] = [
            DataValidationRule("player_name", "required", {}, "Player name is required"),
            DataValidationRule("line_score", "type", {"type": "float"}, "Line score must be numeric"),
            DataValidationRule("line_score", "range", {"min": 0, "max": 1000}, "Line score out of valid range"),
            DataValidationRule("stat_type", "required", {}, "Stat type is required"),
            DataValidationRule("league", "required", {}, "League is required"),
        ]
        
        # Sportsbook validation rules
        self.validation_rules[DataSourceType.SPORTSBOOK] = [
            DataValidationRule("odds", "type", {"type": "float"}, "Odds must be numeric"),
            DataValidationRule("odds", "range", {"min": -1000, "max": 1000}, "Odds out of valid range"),
            DataValidationRule("line", "type", {"type": "float"}, "Line must be numeric"),
            DataValidationRule("timestamp", "required", {}, "Timestamp is required"),
        ]
        
        # Player stats validation rules
        self.validation_rules[DataSourceType.PLAYER_STATS] = [
            DataValidationRule("player_id", "required", {}, "Player ID is required"),
            DataValidationRule("stats", "type", {"type": "dict"}, "Stats must be a dictionary"),
            DataValidationRule("game_date", "required", {}, "Game date is required"),
        ]
        
        # Injury reports validation rules
        self.validation_rules[DataSourceType.INJURY_REPORTS] = [
            DataValidationRule("player_id", "required", {}, "Player ID is required"),
            DataValidationRule("status", "pattern", {"pattern": "^(out|questionable|probable|healthy)$"}, "Invalid injury status"),
            DataValidationRule("impact_rating", "range", {"min": 0, "max": 10}, "Impact rating must be 0-10"),
        ]
        
        # Weather validation rules
        self.validation_rules[DataSourceType.WEATHER] = [
            DataValidationRule("location", "required", {}, "Location is required"),
            DataValidationRule("temperature", "range", {"min": -50, "max": 150}, "Temperature out of valid range"),
            DataValidationRule("wind_speed", "range", {"min": 0, "max": 200}, "Wind speed out of valid range"),
        ]
    
    def setup_data_processors(self):
        """Setup data processors for each source type"""
        self.data_processors[DataSourceType.PRIZEPICKS] = self.process_prizepicks_data
        self.data_processors[DataSourceType.SPORTSBOOK] = self.process_sportsbook_data
        self.data_processors[DataSourceType.PLAYER_STATS] = self.process_player_stats_data
        self.data_processors[DataSourceType.INJURY_REPORTS] = self.process_injury_data
        self.data_processors[DataSourceType.WEATHER] = self.process_weather_data
    
    def setup_cache_strategies(self):
        """Setup caching strategies for different data types"""
        self.cache_strategies = {
            "player_projections": {
                "ttl": 300,  # 5 minutes
                "key_pattern": "proj:{player_id}:{stat_type}",
                "compression": True
            },
            "market_odds": {
                "ttl": 180,  # 3 minutes
                "key_pattern": "odds:{market_id}",
                "compression": False
            },
            "player_stats": {
                "ttl": 600,  # 10 minutes
                "key_pattern": "stats:{player_id}:{date}",
                "compression": True
            },
            "injury_reports": {
                "ttl": 1800,  # 30 minutes
                "key_pattern": "injury:{player_id}",
                "compression": False
            }
        }
    
    async def start_pipeline(self):
        """Start the real-time data pipeline"""
        logger.info("🚀 Starting Enterprise Data Pipeline...")
        
        # Start background tasks
        tasks = [
            asyncio.create_task(self.data_quality_monitor(), name="quality_monitor"),
            asyncio.create_task(self.cache_maintenance(), name="cache_maintenance"),
            asyncio.create_task(self.metrics_collector(), name="metrics_collector"),
            asyncio.create_task(self.freshness_monitor(), name="freshness_monitor"),
            asyncio.create_task(self.anomaly_detector(), name="anomaly_detector"),
        ]
        
        try:
            await asyncio.gather(*tasks)
        except Exception as e:
            logger.error(f"❌ Data pipeline error: {e}")
    
    async def ingest_data(self, source: str, source_type: DataSourceType, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Ingest data from a source with validation and processing"""
        start_time = time.time()
        
        # Initialize metrics for this ingestion
        ingestion_metrics = {
            'source': source,
            'total_records': len(data),
            'valid_records': 0,
            'invalid_records': 0,
            'validation_errors': [],
            'processing_time': 0.0
        }
        
        processed_data = []
        
        for item in data:
            try:
                # Create data point
                data_point = DataPoint(
                    source=source,
                    source_type=source_type,
                    data_id=self.generate_data_id(item),
                    timestamp=datetime.now(timezone.utc),
                    data=item
                )
                
                # Validate data
                validation_result = self.validate_data(data_point)
                data_point.quality = validation_result['quality']
                data_point.validation_errors = validation_result['errors']
                
                if data_point.quality != DataQuality.INVALID:
                    # Process data
                    processed_point = await self.process_data(data_point)
                    
                    # Cache data
                    await self.cache_data(processed_point)
                    
                    # Store in stream
                    stream_key = f"{source}_{source_type.value}"
                    self.data_streams[stream_key].append(processed_point)
                    
                    # Log to database
                    await self.log_data_ingestion(processed_point)
                    
                    processed_data.append(processed_point)
                    ingestion_metrics['valid_records'] += 1
                else:
                    ingestion_metrics['invalid_records'] += 1
                    ingestion_metrics['validation_errors'].extend(data_point.validation_errors)
                
            except Exception as e:
                logger.warning(f"⚠️ Error processing data item: {e}")
                ingestion_metrics['invalid_records'] += 1
                ingestion_metrics['validation_errors'].append(str(e))
        
        # Update metrics
        processing_time = time.time() - start_time
        ingestion_metrics['processing_time'] = processing_time
        
        # Update pipeline metrics
        self.update_pipeline_metrics(source, ingestion_metrics)
        
        logger.info(f"📊 Ingested {ingestion_metrics['valid_records']}/{ingestion_metrics['total_records']} "
                   f"valid records from {source} in {processing_time:.2f}s")
        
        return {
            'processed_data': processed_data,
            'metrics': ingestion_metrics
        }
    
    def validate_data(self, data_point: DataPoint) -> Dict[str, Any]:
        """Validate data point against defined rules"""
        errors = []
        quality = DataQuality.EXCELLENT
        
        rules = self.validation_rules.get(data_point.source_type, [])
        
        for rule in rules:
            try:
                error = self.apply_validation_rule(data_point.data, rule)
                if error:
                    errors.append(error)
                    if rule.severity == "error":
                        quality = DataQuality.INVALID
                    elif rule.severity == "warning" and quality == DataQuality.EXCELLENT:
                        quality = DataQuality.GOOD
            except Exception as e:
                errors.append(f"Validation rule error: {e}")
                quality = DataQuality.POOR
        
        # Calculate overall quality
        if not errors:
            quality = DataQuality.EXCELLENT
        elif len(errors) == 1 and any("warning" in error for error in errors):
            quality = DataQuality.GOOD
        elif len(errors) <= 2:
            quality = DataQuality.FAIR
        elif any("error" in error for error in errors):
            quality = DataQuality.INVALID
        else:
            quality = DataQuality.POOR
        
        return {
            'quality': quality,
            'errors': errors
        }
    
    def apply_validation_rule(self, data: Dict[str, Any], rule: DataValidationRule) -> Optional[str]:
        """Apply a single validation rule"""
        field_value = data.get(rule.field_name)
        
        if rule.rule_type == "required":
            if field_value is None or field_value == "":
                return f"{rule.severity}: {rule.error_message}"
        
        elif rule.rule_type == "type":
            expected_type = rule.parameters.get("type")
            if expected_type == "float" and not isinstance(field_value, (int, float)):
                try:
                    float(field_value)
                except (ValueError, TypeError):
                    return f"{rule.severity}: {rule.error_message}"
            elif expected_type == "dict" and not isinstance(field_value, dict):
                return f"{rule.severity}: {rule.error_message}"
        
        elif rule.rule_type == "range":
            if field_value is not None:
                try:
                    value = float(field_value)
                    min_val = rule.parameters.get("min")
                    max_val = rule.parameters.get("max")
                    if (min_val is not None and value < min_val) or (max_val is not None and value > max_val):
                        return f"{rule.severity}: {rule.error_message}"
                except (ValueError, TypeError):
                    return f"{rule.severity}: Value cannot be converted to number for range check"
        
        elif rule.rule_type == "pattern":
            import re
            if field_value is not None:
                pattern = rule.parameters.get("pattern")
                if pattern and not re.match(pattern, str(field_value)):
                    return f"{rule.severity}: {rule.error_message}"
        
        return None
    
    async def process_data(self, data_point: DataPoint) -> DataPoint:
        """Process data point using appropriate processor"""
        processor = self.data_processors.get(data_point.source_type)
        
        if processor:
            try:
                processed_data = await processor(data_point.data)
                data_point.data = processed_data
                data_point.confidence = self.calculate_confidence(data_point)
                data_point.freshness_score = self.calculate_freshness(data_point)
            except Exception as e:
                logger.warning(f"⚠️ Error processing data: {e}")
                data_point.quality = DataQuality.POOR
                data_point.validation_errors.append(f"Processing error: {e}")
        
        return data_point
    
    async def process_prizepicks_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Process PrizePicks data"""
        processed = data.copy()
        
        # Normalize player name
        if 'player_name' in processed:
            processed['player_name'] = processed['player_name'].strip().title()
        
        # Ensure line score is float
        if 'line_score' in processed:
            processed['line_score'] = float(processed['line_score'])
        
        # Add derived fields
        processed['market_key'] = f"{processed.get('player_name', '')}_{processed.get('stat_type', '')}"
        processed['processed_timestamp'] = datetime.now(timezone.utc).isoformat()
        
        return processed
    
    async def process_sportsbook_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Process sportsbook odds data"""
        processed = data.copy()
        
        # Convert odds to decimal if needed
        if 'over_odds' in processed:
            processed['over_odds_decimal'] = self.american_to_decimal(processed['over_odds'])
        if 'under_odds' in processed:
            processed['under_odds_decimal'] = self.american_to_decimal(processed['under_odds'])
        
        # Calculate implied probabilities
        if 'over_odds_decimal' in processed:
            processed['over_probability'] = 1 / processed['over_odds_decimal']
        if 'under_odds_decimal' in processed:
            processed['under_probability'] = 1 / processed['under_odds_decimal']
        
        return processed
    
    async def process_player_stats_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Process player statistics data"""
        processed = data.copy()
        
        # Calculate derived statistics
        stats = processed.get('stats', {})
        if 'points' in stats and 'minutes' in stats and stats['minutes'] > 0:
            processed['points_per_minute'] = stats['points'] / stats['minutes']
        
        return processed
    
    async def process_injury_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Process injury report data"""
        processed = data.copy()
        
        # Standardize status
        status_mapping = {
            'out': 'out',
            'o': 'out',
            'questionable': 'questionable',
            'q': 'questionable',
            'probable': 'probable',
            'p': 'probable',
            'healthy': 'healthy',
            'h': 'healthy'
        }
        
        if 'status' in processed:
            processed['status'] = status_mapping.get(processed['status'].lower(), processed['status'])
        
        return processed
    
    async def process_weather_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Process weather data"""
        processed = data.copy()
        
        # Calculate weather impact score
        processed['impact_score'] = self.calculate_weather_impact(data)
        
        return processed
    
    def calculate_weather_impact(self, weather_data: Dict) -> float:
        """Calculate weather impact score"""
        impact = 0.0
        
        # Temperature impact
        temp = weather_data.get('temperature', 70)
        if temp < 32 or temp > 95:
            impact += 3.0
        elif temp < 45 or temp > 85:
            impact += 1.5
        
        # Wind impact
        wind_speed = weather_data.get('wind_speed', 0)
        if wind_speed > 20:
            impact += 2.5
        elif wind_speed > 10:
            impact += 1.0
        
        # Precipitation impact
        precipitation = weather_data.get('precipitation', 0)
        if precipitation > 0.5:
            impact += 3.0
        elif precipitation > 0.1:
            impact += 1.5
        
        return min(impact, 10.0)
    
    def american_to_decimal(self, american_odds: float) -> float:
        """Convert American odds to decimal"""
        if american_odds > 0:
            return (american_odds / 100) + 1
        else:
            return (100 / abs(american_odds)) + 1
    
    def calculate_confidence(self, data_point: DataPoint) -> float:
        """Calculate confidence score for data point"""
        base_confidence = 0.8
        
        # Adjust based on data quality
        quality_adjustments = {
            DataQuality.EXCELLENT: 0.1,
            DataQuality.GOOD: 0.05,
            DataQuality.FAIR: 0.0,
            DataQuality.POOR: -0.2,
            DataQuality.INVALID: -0.5
        }
        
        confidence = base_confidence + quality_adjustments.get(data_point.quality, 0)
        
        # Adjust based on source reliability
        source_reliability = {
            'prizepicks': 0.9,
            'espn': 0.85,
            'nba_api': 0.95,
            'weather_api': 0.8
        }
        
        source_factor = source_reliability.get(data_point.source.lower(), 0.7)
        confidence *= source_factor
        
        return max(0.0, min(1.0, confidence))
    
    def calculate_freshness(self, data_point: DataPoint) -> float:
        """Calculate data freshness score"""
        now = datetime.now(timezone.utc)
        age_seconds = (now - data_point.timestamp).total_seconds()
        
        # Freshness score decreases over time
        if age_seconds < 300:  # 5 minutes
            return 1.0
        elif age_seconds < 900:  # 15 minutes
            return 0.8
        elif age_seconds < 1800:  # 30 minutes
            return 0.6
        elif age_seconds < 3600:  # 1 hour
            return 0.4
        else:
            return 0.2
    
    async def cache_data(self, data_point: DataPoint):
        """Cache data point using appropriate strategy"""
        if not self.redis_client:
            return
        
        try:
            # Determine cache strategy
            cache_key = self.generate_cache_key(data_point)
            ttl = self.cache_ttl.get(data_point.source_type, 300)
            
            # Serialize data
            cache_data = {
                'data': data_point.data,
                'timestamp': data_point.timestamp.isoformat(),
                'confidence': data_point.confidence,
                'quality': data_point.quality.value
            }
            
            # Store in cache
            await asyncio.to_thread(
                self.redis_client.setex,
                cache_key,
                ttl,
                json.dumps(cache_data)
            )
            
        except Exception as e:
            logger.warning(f"⚠️ Cache error: {e}")
    
    def generate_cache_key(self, data_point: DataPoint) -> str:
        """Generate cache key for data point"""
        base_key = f"{data_point.source}:{data_point.source_type.value}:{data_point.data_id}"
        return base_key
    
    def generate_data_id(self, data: Dict[str, Any]) -> str:
        """Generate unique ID for data item"""
        # Create hash of relevant fields
        key_fields = ['player_name', 'stat_type', 'line_score', 'timestamp', 'event_id']
        key_data = {k: v for k, v in data.items() if k in key_fields}
        
        data_string = json.dumps(key_data, sort_keys=True)
        return hashlib.md5(data_string.encode()).hexdigest()
    
    async def log_data_ingestion(self, data_point: DataPoint):
        """Log data ingestion to database"""
        if not self.db_session:
            return
        
        try:
            log_entry = DataIngestionLog(
                source=data_point.source,
                source_type=data_point.source_type.value,
                data_id=data_point.data_id,
                timestamp=data_point.timestamp,
                data_hash=hashlib.md5(json.dumps(data_point.data, sort_keys=True).encode()).hexdigest(),
                quality=data_point.quality.value,
                confidence=data_point.confidence,
                validation_errors=data_point.validation_errors,
                metadata=data_point.metadata
            )
            
            self.db_session.add(log_entry)
            self.db_session.commit()
            
        except Exception as e:
            logger.warning(f"⚠️ Database logging error: {e}")
            if self.db_session:
                self.db_session.rollback()
    
    def update_pipeline_metrics(self, source: str, ingestion_metrics: Dict):
        """Update pipeline performance metrics"""
        metrics = self.pipeline_metrics[source]
        
        metrics.source = source
        metrics.total_records += ingestion_metrics['total_records']
        metrics.valid_records += ingestion_metrics['valid_records']
        metrics.invalid_records += ingestion_metrics['invalid_records']
        metrics.processing_time = ingestion_metrics['processing_time']
        metrics.last_update = datetime.now(timezone.utc)
        metrics.error_rate = metrics.invalid_records / max(metrics.total_records, 1)
        metrics.throughput = metrics.valid_records / max(metrics.processing_time, 0.001)
    
    async def data_quality_monitor(self):
        """Monitor data quality continuously"""
        while True:
            try:
                # Calculate quality metrics for each source
                for source, metrics in self.pipeline_metrics.items():
                    if metrics.last_update:
                        # Check data freshness
                        age = (datetime.now(timezone.utc) - metrics.last_update).total_seconds()
                        metrics.freshness_score = max(0, 1 - (age / 3600))  # Decreases over 1 hour
                        
                        # Log quality metrics to database
                        if self.db_session:
                            quality_record = DataQualityMetrics(
                                source=source,
                                total_records=metrics.total_records,
                                valid_records=metrics.valid_records,
                                error_rate=metrics.error_rate,
                                freshness_score=metrics.freshness_score,
                                confidence_avg=0.8,  # Would calculate from actual data
                                throughput=metrics.throughput
                            )
                            self.db_session.add(quality_record)
                            self.db_session.commit()
                
                await asyncio.sleep(300)  # Check every 5 minutes
                
            except Exception as e:
                logger.error(f"❌ Data quality monitoring error: {e}")
                await asyncio.sleep(60)
    
    async def cache_maintenance(self):
        """Maintain cache health and performance"""
        while True:
            try:
                if self.redis_client:
                    # Get cache statistics
                    info = await asyncio.to_thread(self.redis_client.info, 'memory')
                    used_memory = info.get('used_memory', 0)
                    
                    logger.info(f"📊 Cache memory usage: {used_memory / 1024 / 1024:.1f} MB")
                    
                    # Clean expired keys if needed
                    if used_memory > 100 * 1024 * 1024:  # 100 MB threshold
                        logger.info("🧹 Cleaning cache...")
                        # Would implement cache cleaning logic here
                
                await asyncio.sleep(600)  # Check every 10 minutes
                
            except Exception as e:
                logger.error(f"❌ Cache maintenance error: {e}")
                await asyncio.sleep(300)
    
    async def metrics_collector(self):
        """Collect and store performance metrics"""
        while True:
            try:
                # Collect current metrics
                current_metrics = {
                    'timestamp': datetime.now(timezone.utc),
                    'total_sources': len(self.pipeline_metrics),
                    'total_records': sum(m.total_records for m in self.pipeline_metrics.values()),
                    'valid_records': sum(m.valid_records for m in self.pipeline_metrics.values()),
                    'error_rate': sum(m.error_rate for m in self.pipeline_metrics.values()) / max(len(self.pipeline_metrics), 1),
                    'avg_throughput': sum(m.throughput for m in self.pipeline_metrics.values()) / max(len(self.pipeline_metrics), 1),
                    'cache_size': len(self.data_streams),
                }
                
                self.performance_history.append(current_metrics)
                
                # Log summary
                logger.info(f"📊 Pipeline metrics: {current_metrics['valid_records']} valid records, "
                           f"{current_metrics['error_rate']:.1%} error rate, "
                           f"{current_metrics['avg_throughput']:.1f} records/sec")
                
                await asyncio.sleep(60)  # Collect every minute
                
            except Exception as e:
                logger.error(f"❌ Metrics collection error: {e}")
                await asyncio.sleep(30)
    
    async def freshness_monitor(self):
        """Monitor data freshness and alert on stale data"""
        while True:
            try:
                stale_sources = []
                
                for source, metrics in self.pipeline_metrics.items():
                    if metrics.last_update:
                        age = (datetime.now(timezone.utc) - metrics.last_update).total_seconds()
                        if age > 1800:  # 30 minutes
                            stale_sources.append(f"{source} ({age/60:.0f}m old)")
                
                if stale_sources:
                    logger.warning(f"⚠️ Stale data sources: {', '.join(stale_sources)}")
                
                await asyncio.sleep(300)  # Check every 5 minutes
                
            except Exception as e:
                logger.error(f"❌ Freshness monitoring error: {e}")
                await asyncio.sleep(60)
    
    async def anomaly_detector(self):
        """Detect anomalies in data patterns"""
        while True:
            try:
                # Simple anomaly detection based on throughput changes
                if len(self.performance_history) >= 10:
                    recent_throughputs = [m['avg_throughput'] for m in list(self.performance_history)[-10:]]
                    avg_throughput = sum(recent_throughputs) / len(recent_throughputs)
                    current_throughput = recent_throughputs[-1]
                    
                    if current_throughput < avg_throughput * 0.5:  # 50% drop
                        logger.warning(f"⚠️ Throughput anomaly detected: {current_throughput:.1f} vs avg {avg_throughput:.1f}")
                
                await asyncio.sleep(300)  # Check every 5 minutes
                
            except Exception as e:
                logger.error(f"❌ Anomaly detection error: {e}")
                await asyncio.sleep(60)
    
    # API Methods
    async def get_cached_data(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Get data from cache"""
        if not self.redis_client:
            return None
        
        try:
            cached_data = await asyncio.to_thread(self.redis_client.get, cache_key)
            if cached_data:
                return json.loads(cached_data)
        except Exception as e:
            logger.warning(f"⚠️ Cache retrieval error: {e}")
        
        return None
    
    async def get_stream_data(self, source: str, source_type: DataSourceType, limit: int = 100) -> List[DataPoint]:
        """Get recent data from stream"""
        stream_key = f"{source}_{source_type.value}"
        stream_data = self.data_streams.get(stream_key, deque())
        
        return list(stream_data)[-limit:]
    
    def get_pipeline_metrics(self) -> Dict[str, Any]:
        """Get current pipeline metrics"""
        return {
            'sources': {source: asdict(metrics) for source, metrics in self.pipeline_metrics.items()},
            'performance_history': list(self.performance_history),
            'cache_size': len(self.data_streams),
            'total_streams': len(self.data_streams),
        }
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform health check of the pipeline"""
        health = {
            'status': 'healthy',
            'redis_connected': self.redis_client is not None,
            'database_connected': self.db_session is not None,
            'active_sources': len(self.pipeline_metrics),
            'total_records': sum(m.total_records for m in self.pipeline_metrics.values()),
            'error_rate': sum(m.error_rate for m in self.pipeline_metrics.values()) / max(len(self.pipeline_metrics), 1),
            'issues': []
        }
        
        # Check for issues
        if not health['redis_connected']:
            health['issues'].append('Redis connection failed')
            health['status'] = 'degraded'
        
        if not health['database_connected']:
            health['issues'].append('Database connection failed')
            health['status'] = 'degraded'
        
        if health['error_rate'] > 0.1:  # 10% error rate
            health['issues'].append(f"High error rate: {health['error_rate']:.1%}")
            health['status'] = 'degraded'
        
        # Check for stale data
        stale_count = 0
        for metrics in self.pipeline_metrics.values():
            if metrics.last_update:
                age = (datetime.now(timezone.utc) - metrics.last_update).total_seconds()
                if age > 1800:  # 30 minutes
                    stale_count += 1
        
        if stale_count > 0:
            health['issues'].append(f"{stale_count} sources have stale data")
            health['status'] = 'degraded'
        
        return health

# Global pipeline instance
enterprise_data_pipeline = EnterpriseDataPipeline()

async def start_data_pipeline():
    """Start the enterprise data pipeline"""
    logger.info("🚀 Starting Enterprise Data Pipeline...")
    await enterprise_data_pipeline.start_pipeline()

if __name__ == "__main__":
    # For testing
    asyncio.run(start_data_pipeline()) 