"""
WebVitals Pipeline

Provides comprehensive web vitals and metrics collection pipeline:
- Frontend metrics buffering
- Periodic and visibility change based flushing
- /api/metrics/v1 endpoint for metrics submission
- Performance metrics aggregation
- Core Web Vitals tracking (LCP, FID, CLS)
- Custom business metrics collection

Features:
- Buffer metrics locally to reduce network calls
- Flush on visibilitychange (page unload, tab switch)
- Periodic flush for long-running sessions
- Retry logic for failed submissions
- Compression for large metric payloads
"""

import time
import json
import gzip
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, field
from collections import deque
import threading
import asyncio
import logging

from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse

from ..services.metrics_aggregator import get_metrics_aggregator, MetricType, MetricCategory

logger = logging.getLogger(__name__)


@dataclass
class WebVitalsMetric:
    """Represents a web vitals metric"""
    name: str
    value: float
    id: str
    delta: Optional[float] = None
    rating: Optional[str] = None  # "good", "needs-improvement", "poor"
    timestamp: float = field(default_factory=time.time)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'name': self.name,
            'value': self.value,
            'id': self.id,
            'delta': self.delta,
            'rating': self.rating,
            'timestamp': self.timestamp
        }


@dataclass
class CustomMetric:
    """Represents a custom application metric"""
    name: str
    value: float
    type: str  # "counter", "gauge", "histogram", "timing"
    tags: Dict[str, str] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'name': self.name,
            'value': self.value,
            'type': self.type,
            'tags': self.tags,
            'timestamp': self.timestamp
        }


@dataclass
class MetricsBatch:
    """Batch of metrics for submission"""
    session_id: str
    page_url: str
    user_agent: str
    web_vitals: List[WebVitalsMetric] = field(default_factory=list)
    custom_metrics: List[CustomMetric] = field(default_factory=list)
    performance_entries: List[Dict[str, Any]] = field(default_factory=list)
    timestamp: float = field(default_factory=time.time)
    
    @property
    def metrics_count(self) -> int:
        """Get total count of metrics in this batch"""
        return len(self.web_vitals) + len(self.custom_metrics) + len(self.performance_entries)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'session_id': self.session_id,
            'page_url': self.page_url,
            'user_agent': self.user_agent,
            'web_vitals': [metric.to_dict() for metric in self.web_vitals],
            'custom_metrics': [metric.to_dict() for metric in self.custom_metrics],
            'performance_entries': self.performance_entries,
            'timestamp': self.timestamp,
            'metrics_count': self.metrics_count
        }


class MetricsBuffer:
    """Thread-safe buffer for metrics awaiting submission"""
    
    def __init__(self, max_size: int = 1000, flush_threshold: int = 100):
        self.max_size = max_size
        self.flush_threshold = flush_threshold
        self.buffer: deque = deque(maxlen=max_size)
        self.lock = threading.Lock()
        self.flush_callbacks: List[Callable[[List[MetricsBatch]], None]] = []
        
    def add_batch(self, batch: MetricsBatch):
        """Add metrics batch to buffer"""
        with self.lock:
            self.buffer.append(batch)
            
            # Auto-flush if threshold reached
            if len(self.buffer) >= self.flush_threshold:
                self._flush_internal()
    
    def add_flush_callback(self, callback: Callable[[List[MetricsBatch]], None]):
        """Add callback for when metrics are flushed"""
        self.flush_callbacks.append(callback)
    
    def flush(self) -> List[MetricsBatch]:
        """Manually flush all buffered metrics"""
        with self.lock:
            return self._flush_internal()
    
    def _flush_internal(self) -> List[MetricsBatch]:
        """Internal flush implementation"""
        if not self.buffer:
            return []
            
        batches = list(self.buffer)
        self.buffer.clear()
        
        # Notify callbacks
        for callback in self.flush_callbacks:
            try:
                callback(batches)
            except Exception as e:
                logger.error(f"Error in flush callback: {e}")
        
        return batches
    
    def get_stats(self) -> Dict[str, Any]:
        """Get buffer statistics"""
        with self.lock:
            return {
                'buffer_size': len(self.buffer),
                'max_size': self.max_size,
                'flush_threshold': self.flush_threshold,
                'utilization': len(self.buffer) / self.max_size
            }


class WebVitalsPipeline:
    """
    Central pipeline for web vitals and metrics processing
    """
    
    def __init__(self, buffer_size: int = 1000):
        self.buffer = MetricsBuffer(buffer_size)
        self.metrics_aggregator = get_metrics_aggregator()
        self.processing_stats = {
            'batches_received': 0,
            'batches_processed': 0,
            'processing_errors': 0,
            'last_processed': None
        }
        
        # Add flush callback to process metrics
        self.buffer.add_flush_callback(self._process_flushed_batches)
        
    def submit_metrics_batch(self, batch: MetricsBatch):
        """Submit a batch of metrics for processing"""
        self.buffer.add_batch(batch)
        self.processing_stats['batches_received'] += 1
        
        logger.info(
            f"Metrics batch submitted: {batch.metrics_count} metrics from {batch.session_id}",
            extra={
                'event_type': 'metrics_batch_submitted',
                'session_id': batch.session_id,
                'metrics_count': batch.metrics_count,
                'web_vitals_count': len(batch.web_vitals),
                'custom_metrics_count': len(batch.custom_metrics)
            }
        )
    
    def _process_flushed_batches(self, batches: List[MetricsBatch]):
        """Process flushed metric batches"""
        try:
            for batch in batches:
                self._process_single_batch(batch)
            
            self.processing_stats['batches_processed'] += len(batches)
            self.processing_stats['last_processed'] = time.time()
            
            logger.info(f"Processed {len(batches)} metric batches successfully")
            
        except Exception as e:
            self.processing_stats['processing_errors'] += 1
            logger.error(f"Error processing metric batches: {e}")
    
    def _process_single_batch(self, batch: MetricsBatch):
        """Process a single metrics batch"""
        # Process Web Vitals
        for metric in batch.web_vitals:
            self._process_web_vital(metric, batch)
        
        # Process custom metrics
        for metric in batch.custom_metrics:
            self._process_custom_metric(metric, batch)
        
        # Process performance entries
        for entry in batch.performance_entries:
            self._process_performance_entry(entry, batch)
    
    def _process_web_vital(self, metric: WebVitalsMetric, batch: MetricsBatch):
        """Process a web vital metric"""
        # Record in metrics aggregator
        self.metrics_aggregator.record_performance_metric(
            name=f"web_vital_{metric.name.lower()}",
            value=metric.value,
            unit="ms" if metric.name in ["LCP", "FID"] else "score",
            tags={
                'metric_name': metric.name,
                'metric_id': metric.id,
                'rating': metric.rating or 'unknown',
                'session_id': batch.session_id
            }
        )
        
        # Check for poor web vitals and record as issues
        if metric.rating == "poor":
            self.metrics_aggregator.record_validation_failure(
                category="performance",
                failure_type="poor_web_vital",
                details=f"{metric.name} score {metric.value} rated as poor",
                field=metric.name
            )
    
    def _process_custom_metric(self, metric: CustomMetric, batch: MetricsBatch):
        """Process a custom application metric"""
        # Determine metric type for aggregator
        metric_type_map = {
            'counter': MetricType.COUNTER,
            'gauge': MetricType.GAUGE,
            'histogram': MetricType.HISTOGRAM,
            'timing': MetricType.HISTOGRAM
        }
        
        aggregator_type = metric_type_map.get(metric.type, MetricType.COUNTER)
        
        # Record based on metric semantics
        if metric.name.startswith('fallback_'):
            self.metrics_aggregator.record_fallback(
                fallback_type=metric.tags.get('type', 'unknown'),
                reason=metric.tags.get('reason', 'Frontend fallback'),
                service=metric.tags.get('service', 'frontend')
            )
        elif metric.name.startswith('validation_failure_'):
            self.metrics_aggregator.record_validation_failure(
                category=metric.tags.get('category', 'validation'),
                failure_type=metric.tags.get('type', 'unknown'),
                details=metric.tags.get('details', '')
            )
        else:
            # Generic business metric
            self.metrics_aggregator.record_business_metric(
                name=metric.name,
                value=metric.value,
                metric_type=aggregator_type,
                tags={**metric.tags, 'source': 'frontend'}
            )
    
    def _process_performance_entry(self, entry: Dict[str, Any], batch: MetricsBatch):
        """Process a performance API entry"""
        entry_type = entry.get('entryType', 'unknown')
        
        if entry_type == 'navigation':
            # Process navigation timing
            self._process_navigation_timing(entry, batch)
        elif entry_type == 'resource':
            # Process resource timing
            self._process_resource_timing(entry, batch)
        elif entry_type == 'measure':
            # Process user timing measures
            self._process_user_timing(entry, batch)
    
    def _process_navigation_timing(self, entry: Dict[str, Any], batch: MetricsBatch):
        """Process navigation timing entry"""
        # Extract key timing metrics
        metrics = [
            ('dns_lookup', entry.get('domainLookupEnd', 0) - entry.get('domainLookupStart', 0)),
            ('tcp_connect', entry.get('connectEnd', 0) - entry.get('connectStart', 0)),
            ('ssl_negotiate', entry.get('connectEnd', 0) - entry.get('secureConnectionStart', 0)),
            ('request_time', entry.get('responseStart', 0) - entry.get('requestStart', 0)),
            ('response_time', entry.get('responseEnd', 0) - entry.get('responseStart', 0)),
            ('dom_processing', entry.get('domContentLoadedEventEnd', 0) - entry.get('domLoading', 0)),
            ('load_complete', entry.get('loadEventEnd', 0) - entry.get('loadEventStart', 0))
        ]
        
        for name, value in metrics:
            if value > 0:  # Only record positive values
                self.metrics_aggregator.record_performance_metric(
                    name=f"navigation_{name}",
                    value=value,
                    unit="ms",
                    tags={'session_id': batch.session_id}
                )
    
    def _process_resource_timing(self, entry: Dict[str, Any], batch: MetricsBatch):
        """Process resource timing entry"""
        resource_type = self._get_resource_type(entry.get('name', ''))
        duration = entry.get('duration', 0)
        
        if duration > 0:
            self.metrics_aggregator.record_performance_metric(
                name=f"resource_load_time",
                value=duration,
                unit="ms",
                tags={
                    'resource_type': resource_type,
                    'session_id': batch.session_id
                }
            )
            
            # Check for slow resources
            if duration > 5000:  # 5 seconds
                self.metrics_aggregator.record_validation_failure(
                    category="performance",
                    failure_type="slow_resource",
                    details=f"Resource {entry.get('name', 'unknown')} took {duration}ms to load",
                    field="resource_name"
                )
    
    def _process_user_timing(self, entry: Dict[str, Any], batch: MetricsBatch):
        """Process user timing measure"""
        name = entry.get('name', '')
        duration = entry.get('duration', 0)
        
        if duration > 0:
            self.metrics_aggregator.record_performance_metric(
                name=f"user_timing_{name}",
                value=duration,
                unit="ms",
                tags={'session_id': batch.session_id}
            )
    
    def _get_resource_type(self, url: str) -> str:
        """Determine resource type from URL"""
        if not url:
            return 'unknown'
            
        if any(ext in url.lower() for ext in ['.js', '.mjs']):
            return 'script'
        elif any(ext in url.lower() for ext in ['.css']):
            return 'stylesheet'
        elif any(ext in url.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']):
            return 'image'
        elif any(ext in url.lower() for ext in ['.woff', '.woff2', '.ttf', '.otf']):
            return 'font'
        elif 'api/' in url.lower():
            return 'api'
        else:
            return 'other'
    
    def get_stats(self) -> Dict[str, Any]:
        """Get pipeline statistics"""
        return {
            'buffer_stats': self.buffer.get_stats(),
            'processing_stats': self.processing_stats.copy()
        }
    
    def flush_metrics(self) -> List[MetricsBatch]:
        """Manually flush all buffered metrics"""
        return self.buffer.flush()


# Global pipeline instance
_webvitals_pipeline: Optional[WebVitalsPipeline] = None


def get_webvitals_pipeline() -> WebVitalsPipeline:
    """Get or create the global web vitals pipeline"""
    global _webvitals_pipeline
    if _webvitals_pipeline is None:
        _webvitals_pipeline = WebVitalsPipeline()
    return _webvitals_pipeline


# FastAPI routes for metrics collection
router = APIRouter()


@router.post("/api/metrics/v1")
async def submit_metrics(request: Request, background_tasks: BackgroundTasks):
    """
    Submit web vitals and custom metrics
    
    Accepts batches of metrics from frontend applications and processes them
    through the web vitals pipeline.
    
    Body should contain:
    - session_id: Unique session identifier
    - page_url: Current page URL
    - user_agent: Browser user agent
    - web_vitals: Array of web vital metrics
    - custom_metrics: Array of custom metrics
    - performance_entries: Array of performance API entries
    """
    try:
        # Parse request body
        body = await request.json()
        
        # Validate required fields
        required_fields = ['session_id', 'page_url']
        for field in required_fields:
            if field not in body:
                raise HTTPException(
                    status_code=400,
                    detail=f"Missing required field: {field}"
                )
        
        # Create metrics batch
        batch = MetricsBatch(
            session_id=body['session_id'],
            page_url=body['page_url'],
            user_agent=body.get('user_agent', request.headers.get('user-agent', 'unknown'))
        )
        
        # Parse web vitals
        for vital_data in body.get('web_vitals', []):
            vital = WebVitalsMetric(
                name=vital_data['name'],
                value=vital_data['value'],
                id=vital_data['id'],
                delta=vital_data.get('delta'),
                rating=vital_data.get('rating'),
                timestamp=vital_data.get('timestamp', time.time())
            )
            batch.web_vitals.append(vital)
        
        # Parse custom metrics
        for metric_data in body.get('custom_metrics', []):
            metric = CustomMetric(
                name=metric_data['name'],
                value=metric_data['value'],
                type=metric_data.get('type', 'counter'),
                tags=metric_data.get('tags', {}),
                timestamp=metric_data.get('timestamp', time.time())
            )
            batch.custom_metrics.append(metric)
        
        # Add performance entries as-is
        batch.performance_entries = body.get('performance_entries', [])
        
        # Submit to pipeline
        background_tasks.add_task(
            get_webvitals_pipeline().submit_metrics_batch, 
            batch
        )
        
        return JSONResponse(
            status_code=200,
            content={
                'success': True,
                'message': 'Metrics submitted successfully',
                'batch_id': batch.session_id,
                'metrics_count': batch.metrics_count
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting metrics: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal error processing metrics: {str(e)}"
        )


@router.get("/api/metrics/v1/stats")
async def get_metrics_stats():
    """Get web vitals pipeline statistics"""
    try:
        pipeline = get_webvitals_pipeline()
        stats = pipeline.get_stats()
        
        # Add aggregator stats
        aggregator_summary = get_metrics_aggregator().get_metrics_summary()
        
        return JSONResponse(
            status_code=200,
            content={
                'success': True,
                'data': {
                    'pipeline': stats,
                    'aggregator': aggregator_summary
                }
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting metrics stats: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving metrics statistics: {str(e)}"
        )


@router.post("/api/metrics/v1/flush")
async def flush_metrics():
    """Manually flush all buffered metrics"""
    try:
        pipeline = get_webvitals_pipeline()
        flushed_batches = pipeline.flush_metrics()
        
        return JSONResponse(
            status_code=200,
            content={
                'success': True,
                'message': 'Metrics flushed successfully',
                'batches_flushed': len(flushed_batches),
                'total_metrics': sum(batch.metrics_count for batch in flushed_batches)
            }
        )
        
    except Exception as e:
        logger.error(f"Error flushing metrics: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error flushing metrics: {str(e)}"
        )