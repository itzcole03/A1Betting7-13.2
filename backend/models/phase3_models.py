"""
Phase 3 MLOps Response Models
Pydantic models for Phase 3 API endpoints
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from enum import Enum


# MLOps Pipeline Models
class PipelineStatusEnum(str, Enum):
    CREATED = "created"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TrainingPipelineResponse(BaseModel):
    """Response model for training pipeline creation"""
    id: str = Field(..., description="Pipeline ID")
    name: str = Field(..., description="Pipeline name")
    status: str = Field(..., description="Pipeline status")
    created_at: str = Field(..., description="Pipeline creation timestamp")


class PipelineStatusResponse(BaseModel):
    """Response model for pipeline status"""
    id: str = Field(..., description="Pipeline ID")
    name: str = Field(..., description="Pipeline name")
    status: str = Field(..., description="Pipeline status")
    progress: Optional[float] = Field(None, description="Pipeline progress percentage")
    metrics: Optional[Dict[str, Any]] = Field(None, description="Pipeline metrics")
    logs: Optional[List[str]] = Field(None, description="Pipeline logs")


class HyperparameterOptimizationResponse(BaseModel):
    """Response model for hyperparameter optimization"""
    id: str = Field(..., description="Experiment ID")
    name: str = Field(..., description="Experiment name")
    status: str = Field(..., description="Experiment status")
    best_params: Optional[Dict[str, Any]] = Field(None, description="Best parameters found")
    best_score: Optional[float] = Field(None, description="Best score achieved")


class ModelVersionResponse(BaseModel):
    """Response model for model version info"""
    name: str = Field(..., description="Model name")
    version: str = Field(..., description="Model version")
    stage: str = Field(..., description="Model stage")
    created_at: str = Field(..., description="Version creation timestamp")
    metrics: Optional[Dict[str, Any]] = Field(None, description="Model metrics")


# Deployment Models
class DeploymentEnvironmentEnum(str, Enum):
    DEVELOPMENT = "development"
    STAGING = "staging" 
    PRODUCTION = "production"


class ContainerImageResponse(BaseModel):
    """Response model for container image build"""
    image_name: str = Field(..., description="Built container image name")
    image_tag: str = Field(..., description="Image tag")
    build_time: Optional[str] = Field(None, description="Build completion time")


class DeploymentResponse(BaseModel):
    """Response model for Kubernetes deployment"""
    deployment_id: str = Field(..., description="Deployment ID")
    status: str = Field(..., description="Deployment status")
    environment: str = Field(..., description="Deployment environment")
    endpoints: List[str] = Field(..., description="Service endpoints")
    logs: Optional[List[str]] = Field(None, description="Deployment logs")


class DeploymentListItem(BaseModel):
    """Response model for deployment list item"""
    deployment_id: str = Field(..., description="Deployment ID")
    name: str = Field(..., description="Deployment name")
    environment: str = Field(..., description="Environment")
    status: str = Field(..., description="Deployment status")
    created_at: str = Field(..., description="Creation timestamp")
    replicas: int = Field(..., description="Number of replicas")


class CICDPipelineResponse(BaseModel):
    """Response model for CI/CD pipeline creation"""
    pipeline_name: str = Field(..., description="Pipeline name")
    status: str = Field(..., description="Pipeline status")
    created_at: str = Field(..., description="Creation timestamp")


# Monitoring Models
class MetricDataPoint(BaseModel):
    """Response model for metric data point"""
    name: str = Field(..., description="Metric name")
    value: float = Field(..., description="Metric value")
    timestamp: str = Field(..., description="Data point timestamp")
    labels: Optional[Dict[str, str]] = Field(None, description="Metric labels")


class AlertResponse(BaseModel):
    """Response model for alert"""
    id: str = Field(..., description="Alert ID")
    rule_name: str = Field(..., description="Alert rule name")
    metric: str = Field(..., description="Metric name")
    severity: str = Field(..., description="Alert severity")
    message: str = Field(..., description="Alert message")
    timestamp: str = Field(..., description="Alert timestamp")
    status: str = Field(..., description="Alert status")


class SystemOverviewResponse(BaseModel):
    """Response model for system overview"""
    status: str = Field(..., description="Overall system status")
    services: Dict[str, Any] = Field(..., description="Service statuses")
    metrics: Dict[str, float] = Field(..., description="System metrics")
    active_alerts: int = Field(..., description="Number of active alerts")
    timestamp: str = Field(..., description="Overview timestamp")


# Security Models
class SecurityScanResponse(BaseModel):
    """Response model for security scan"""
    scan_id: str = Field(..., description="Scan ID")
    target: str = Field(..., description="Scan target")
    risk_score: float = Field(..., description="Risk score (0-100)")
    vulnerabilities: List[Dict[str, Any]] = Field(..., description="Found vulnerabilities")
    recommendations: List[str] = Field(..., description="Security recommendations")
    timestamp: str = Field(..., description="Scan timestamp")


class SecurityTokenResponse(BaseModel):
    """Response model for security token creation"""
    token: str = Field(..., description="Generated security token")
    expires_at: str = Field(..., description="Token expiration timestamp")
    token_type: str = Field(default="Bearer", description="Token type")


class AuditReportResponse(BaseModel):
    """Response model for audit report"""
    report_id: str = Field(..., description="Report ID")
    start_date: str = Field(..., description="Report start date")
    end_date: str = Field(..., description="Report end date")
    total_events: int = Field(..., description="Total audit events")
    events_by_type: Dict[str, int] = Field(..., description="Events grouped by type")
    critical_events: int = Field(..., description="Number of critical events")
    generated_at: str = Field(..., description="Report generation timestamp")


# Health Check Models
class ComponentHealth(BaseModel):
    """Health status for individual component"""
    status: str = Field(..., description="Component status")
    message: Optional[str] = Field(None, description="Status message")
    last_check: str = Field(..., description="Last health check timestamp")
    metrics: Optional[Dict[str, Any]] = Field(None, description="Component metrics")


class Phase3HealthResponse(BaseModel):
    """Response model for Phase 3 overall health"""
    service: str = Field(..., description="Service name")
    status: str = Field(..., description="Overall status")
    components: Dict[str, ComponentHealth] = Field(..., description="Component health details")
    timestamp: str = Field(..., description="Health check timestamp")


# Simple Response Models
class SuccessResponse(BaseModel):
    """Simple success response"""
    success: bool = Field(..., description="Operation success status")


class MessageResponse(BaseModel):
    """Simple message response"""
    message: str = Field(..., description="Response message")
