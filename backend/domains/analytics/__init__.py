"""
Unified Analytics Service Domain

This module consolidates all performance tracking, reporting, and analytical capabilities
into a comprehensive service that provides insights into both user behavior and system performance.

Consolidates the following services:
- Real-time analytics engines and WebSocket services
- Model performance monitoring and tracking
- Data quality monitoring and observability
- System health and infrastructure monitoring  
- Business intelligence and reporting services
- User behavior and engagement analytics
- Advanced AI analytics and insights
"""

from .service import UnifiedAnalyticsService
from .models import (
    AnalyticsRequest,
    AnalyticsResponse,
    PerformanceMetrics,
    SystemHealthMetrics,
    ModelPerformanceReport,
    DataQualityReport,
    UserAnalyticsReport,
    BusinessIntelligenceReport,
)
from .router import analytics_router

__all__ = [
    "UnifiedAnalyticsService",
    "AnalyticsRequest",
    "AnalyticsResponse",
    "PerformanceMetrics",
    "SystemHealthMetrics", 
    "ModelPerformanceReport",
    "DataQualityReport",
    "UserAnalyticsReport",
    "BusinessIntelligenceReport",
    "analytics_router",
]
