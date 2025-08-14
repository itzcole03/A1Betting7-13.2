"""
Phase 3: Advanced MLOps Routes
API endpoints for MLOps pipelines, production deployment, autonomous monitoring, and security
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Request, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

# Import standardized response handling  
from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..core.exceptions import (
    BusinessLogicException,
    AuthenticationException,
    AuthorizationException,
    ResourceNotFoundException,
    ServiceUnavailableException
)

from ..services.advanced_security_service import (
    AuditEventType,
    SecurityLevel,
    advanced_security_service,
)
from ..services.autonomous_monitoring_service import (
    AlertSeverity,
    autonomous_monitoring_service,
)
from ..services.mlops_pipeline_service import (
    ModelStage,
    PipelineStatus,
    mlops_pipeline_service,
)
from ..services.production_deployment_service import (
    DeploymentConfig,
    DeploymentEnvironment,
    production_deployment_service,
)

# Setup router and security
router = APIRouter(prefix="/api/phase3", tags=["Phase 3 - MLOps & Production"])
security = HTTPBearer(auto_error=False)
logger = logging.getLogger(__name__)


# Security dependency
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
):
    """Validate user credentials and return ResponseBuilder.success(user) info"""
    if not credentials:
        raise AuthenticationException("Authentication required")

    token = credentials.credentials
    user_info = await advanced_security_service.validate_token(token)

    if not user_info:
        raise AuthenticationException("Invalid token")

    return ResponseBuilder.success(data=user_info)


# MLOps Pipeline Endpoints


@router.post("/mlops/pipelines", response_model=StandardAPIResponse[Dict[str, Any]])
async def create_training_pipeline(
    config: Dict[str, Any], current_user=Depends(get_current_user)
):
    """Create automated training pipeline"""
    try:
        # Check permissions
        has_access = await advanced_security_service.check_access_policy(
            "/api/phase3/mlops/pipelines", current_user.roles, current_user.permissions
        )

        if not has_access:
            raise AuthorizationException("Insufficient permissions")

        pipeline = await mlops_pipeline_service.create_training_pipeline(config)

        # Log audit event
        await advanced_security_service.log_audit_event(
            event_type=AuditEventType.ADMIN_ACTION,
            user_id=current_user.user_id,
            resource="mlops_pipeline",
            action="create",
            ip_address=current_user.ip_address,
            user_agent="Phase3API",
            success=True,
            details={"pipeline_id": pipeline.id, "name": pipeline.name},
        )

        pipeline_data = {
            "id": pipeline.id,
            "name": pipeline.name,
            "status": pipeline.status.value,
            "created_at": pipeline.created_at.isoformat(),
        }
        return ResponseBuilder.success(data=pipeline_data)

    except Exception as e:
        logger.error(f"Failed to create training pipeline: {e}")
        raise BusinessLogicException(
            message=f"Operation failed: {str(e)}",
            error_code="OPERATION_FAILED"
        )


@router.post("/mlops/pipelines/{pipeline_id}/run", response_model=StandardAPIResponse[Dict[str, Any]])
async def run_training_pipeline(
    pipeline_id: str, current_user=Depends(get_current_user)
):
    """Execute training pipeline"""
    try:
        result = await mlops_pipeline_service.run_training_pipeline(pipeline_id)

        # Log audit event
        await advanced_security_service.log_audit_event(
            event_type=AuditEventType.MODEL_ACCESS,
            user_id=current_user.user_id,
            resource=f"mlops_pipeline/{pipeline_id}",
            action="run",
            ip_address=current_user.ip_address,
            user_agent="Phase3API",
            success=True,
            details=result,
        )

        return ResponseBuilder.success(data=result)

    except Exception as e:
        logger.error(f"Failed to run training pipeline: {e}")
        raise BusinessLogicException(
            message=f"Operation failed: {str(e)}",
            error_code="OPERATION_FAILED"
        )


@router.get("/mlops/pipelines/{pipeline_id}/status", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_pipeline_status(pipeline_id: str, current_user=Depends(get_current_user)):
    """Get pipeline status and metrics"""
    try:
        status = await mlops_pipeline_service.get_pipeline_status(pipeline_id)
        return ResponseBuilder.success(data=status)

    except ValueError as e:
        raise ResourceNotFoundException("Resource", details={"error": str(e)})
    except Exception as e:
        logger.error(f"Failed to get pipeline status: {e}")
        raise BusinessLogicException(
            message=f"Operation failed: {str(e)}",
            error_code="OPERATION_FAILED"
        )


@router.post("/mlops/hyperparameter-optimization", response_model=StandardAPIResponse[Dict[str, Any]])
async def optimize_hyperparameters(
    config: Dict[str, Any], current_user=Depends(get_current_user)
):
    """Run automated hyperparameter optimization"""
    try:
        experiment = await mlops_pipeline_service.optimize_hyperparameters(config)

        # Log audit event
        await advanced_security_service.log_audit_event(
            event_type=AuditEventType.MODEL_ACCESS,
            user_id=current_user.user_id,
            resource="hyperparameter_optimization",
            action="create",
            ip_address=current_user.ip_address,
            user_agent="Phase3API",
            success=True,
            details={"experiment_id": experiment.id, "name": experiment.name},
        )

        experiment_data = {
            "id": experiment.id,
            "name": experiment.name,
            "status": experiment.status.value,
            "best_params": experiment.best_params,
            "best_score": experiment.best_score,
        }
        return ResponseBuilder.success(data=experiment_data)

    except Exception as e:
        logger.error(f"Failed to optimize hyperparameters: {e}")
        raise BusinessLogicException(
            message=f"Operation failed: {str(e)}",
            error_code="OPERATION_FAILED"
        )


@router.get("/mlops/models/{model_name}/versions", response_model=StandardAPIResponse[List[Dict[str, Any]]])
async def list_model_versions(model_name: str, current_user=Depends(get_current_user)):
    """List all versions of a model"""
    try:
        versions = await mlops_pipeline_service.list_model_versions(model_name)
        return ResponseBuilder.success(data=versions)

    except Exception as e:
        logger.error(f"Failed to list model versions: {e}")
        raise BusinessLogicException(
            message=f"Operation failed: {str(e)}",
            error_code="OPERATION_FAILED"
        )


@router.post(
    "/mlops/models/{model_name}/versions/{version}/promote",
    response_model=StandardAPIResponse[Dict[str, Any]],
)
async def promote_model(
    model_name: str, version: str, stage: str, current_user=Depends(get_current_user)
):
    """Promote model to different stage"""
    try:
        success = await mlops_pipeline_service.promote_model(model_name, version, stage)

        # Log audit event
        await advanced_security_service.log_audit_event(
            event_type=AuditEventType.ADMIN_ACTION,
            user_id=current_user.user_id,
            resource=f"model/{model_name}/{version}",
            action="promote",
            ip_address=current_user.ip_address,
            user_agent="Phase3API",
            success=success,
            details={"stage": stage},
        )

        return ResponseBuilder.success(data={"success": success})

    except Exception as e:
        logger.error(f"Failed to promote model: {e}")
        raise BusinessLogicException(
            message=f"Operation failed: {str(e)}",
            error_code="OPERATION_FAILED"
        )


# Production Deployment Endpoints


@router.post("/deployment/build", response_model=StandardAPIResponse[Dict[str, Any]])
async def build_container_image(
    config: Dict[str, Any], current_user=Depends(get_current_user)
):
    """Build optimized container image"""
    try:
        image_name = await production_deployment_service.build_container_image(config)

        # Log audit event
        await advanced_security_service.log_audit_event(
            event_type=AuditEventType.ADMIN_ACTION,
            user_id=current_user.user_id,
            resource="container_image",
            action="build",
            ip_address=current_user.ip_address,
            user_agent="Phase3API",
            success=True,
            details={"image_name": image_name},
        )

        return ResponseBuilder.success(data={"image_name": image_name})

    except Exception as e:
        logger.error(f"Failed to build container image: {e}")
        raise BusinessLogicException(
            message=f"Operation failed: {str(e)}",
            error_code="OPERATION_FAILED"
        )


@router.post("/deployment/deploy", response_model=StandardAPIResponse[Dict[str, Any]])
async def deploy_to_kubernetes(
    deployment_config: Dict[str, Any], current_user=Depends(get_current_user)
):
    """Deploy application to Kubernetes"""
    try:
        # Convert dict to DeploymentConfig
        config = DeploymentConfig(
            name=deployment_config["name"],
            environment=DeploymentEnvironment(deployment_config["environment"]),
            image_tag=deployment_config["image_tag"],
            replicas=deployment_config.get("replicas", 3),
            cpu_request=deployment_config.get("cpu_request", "100m"),
            cpu_limit=deployment_config.get("cpu_limit", "500m"),
            memory_request=deployment_config.get("memory_request", "256Mi"),
            memory_limit=deployment_config.get("memory_limit", "512Mi"),
            env_vars=deployment_config.get("env_vars", {}),
            secrets=deployment_config.get("secrets", []),
        )

        result = await production_deployment_service.deploy_to_kubernetes(config)

        # Log audit event
        await advanced_security_service.log_audit_event(
            event_type=AuditEventType.ADMIN_ACTION,
            user_id=current_user.user_id,
            resource=f"deployment/{config.name}",
            action="deploy",
            ip_address=current_user.ip_address,
            user_agent="Phase3API",
            success=result.status.value == "deployed",
            details={
                "deployment_id": result.deployment_id,
                "environment": result.environment.value,
                "image_tag": result.image_tag,
            },
        )

        deployment_data = {
            "deployment_id": result.deployment_id,
            "status": result.status.value,
            "environment": result.environment.value,
            "endpoints": result.endpoints,
            "logs": result.logs,
        }
        return ResponseBuilder.success(data=deployment_data)

    except Exception as e:
        logger.error(f"Failed to deploy to Kubernetes: {e}")
        raise BusinessLogicException(
            message=f"Operation failed: {str(e)}",
            error_code="OPERATION_FAILED"
        )


@router.post("/deployment/{deployment_id}/rollback", response_model=StandardAPIResponse[Dict[str, Any]])
async def rollback_deployment(
    deployment_id: str, target_version: str, current_user=Depends(get_current_user)
):
    """Rollback deployment to previous version"""
    try:
        success = await production_deployment_service.rollback_deployment(
            deployment_id, target_version
        )

        # Log audit event
        await advanced_security_service.log_audit_event(
            event_type=AuditEventType.ADMIN_ACTION,
            user_id=current_user.user_id,
            resource=f"deployment/{deployment_id}",
            action="rollback",
            ip_address=current_user.ip_address,
            user_agent="Phase3API",
            success=success,
            details={"target_version": target_version},
        )

        return ResponseBuilder.success(data={"success": success})

    except Exception as e:
        logger.error(f"Failed to rollback deployment: {e}")
        raise BusinessLogicException(
            message=f"Operation failed: {str(e)}",
            error_code="OPERATION_FAILED"
        )


@router.post("/deployment/{deployment_name}/scale", response_model=StandardAPIResponse[Dict[str, Any]])
async def scale_deployment(
    deployment_name: str, replicas: int, current_user=Depends(get_current_user)
):
    """Scale deployment to specified number of replicas"""
    try:
        success = await production_deployment_service.scale_deployment(
            deployment_name, replicas
        )

        # Log audit event
        await advanced_security_service.log_audit_event(
            event_type=AuditEventType.ADMIN_ACTION,
            user_id=current_user.user_id,
            resource=f"deployment/{deployment_name}",
            action="scale",
            ip_address=current_user.ip_address,
            user_agent="Phase3API",
            success=success,
            details={"replicas": replicas},
        )

        return ResponseBuilder.success(data={"success": success})

    except Exception as e:
        logger.error(f"Failed to scale deployment: {e}")
        raise BusinessLogicException(
            message=f"Operation failed: {str(e)}",
            error_code="OPERATION_FAILED"
        )


@router.get("/deployment", response_model=StandardAPIResponse[List[Dict[str, Any]]])
async def list_deployments(
    environment: Optional[str] = None, current_user=Depends(get_current_user)
):
    """List all deployments"""
    try:
        deployments = await production_deployment_service.list_deployments(environment)
        return ResponseBuilder.success(data=deployments)

    except Exception as e:
        logger.error(f"Failed to list deployments: {e}")
        raise BusinessLogicException(
            message=f"Operation failed: {str(e)}",
            error_code="OPERATION_FAILED"
        )


@router.post("/deployment/ci-cd", response_model=StandardAPIResponse[Dict[str, Any]])
async def create_ci_cd_pipeline(
    config: Dict[str, Any], current_user=Depends(get_current_user)
):
    """Create CI/CD pipeline configuration"""
    try:
        pipeline_name = await production_deployment_service.create_ci_cd_pipeline(
            config
        )

        # Log audit event
        await advanced_security_service.log_audit_event(
            event_type=AuditEventType.ADMIN_ACTION,
            user_id=current_user.user_id,
            resource="ci_cd_pipeline",
            action="create",
            ip_address=current_user.ip_address,
            user_agent="Phase3API",
            success=True,
            details={"pipeline_name": pipeline_name},
        )

        return ResponseBuilder.success(data={"pipeline_name": pipeline_name})

    except Exception as e:
        logger.error(f"Failed to create CI/CD pipeline: {e}")
        raise BusinessLogicException(
            message=f"Operation failed: {str(e)}",
            error_code="OPERATION_FAILED"
        )


# Autonomous Monitoring Endpoints


@router.post("/monitoring/metrics", response_model=StandardAPIResponse[Dict[str, Any]])
async def record_metric(
    metric_data: Dict[str, Any], current_user=Depends(get_current_user)
):
    """Record a metric data point"""
    try:
        await autonomous_monitoring_service.record_metric(
            name=metric_data["name"],
            value=metric_data["value"],
            labels=metric_data.get("labels"),
        )

        return ResponseBuilder.success(data={"success": True})

    except Exception as e:
        logger.error(f"Failed to record metric: {e}")
        raise BusinessLogicException(
            message=f"Operation failed: {str(e)}",
            error_code="OPERATION_FAILED"
        )


@router.get("/monitoring/metrics/{metric_name}", response_model=StandardAPIResponse[List[Dict[str, Any]]])
async def get_metrics(
    metric_name: str, time_range: int = 3600, current_user=Depends(get_current_user)
):
    """Get metrics for specified time range"""
    try:
        metrics = await autonomous_monitoring_service.get_metrics(
            metric_name, time_range
        )
        return ResponseBuilder.success(data=metrics)

    except Exception as e:
        logger.error(f"Failed to get metrics: {e}")
        raise BusinessLogicException(
            message=f"Operation failed: {str(e)}",
            error_code="OPERATION_FAILED"
        )


@router.post("/monitoring/health-checks", response_model=StandardAPIResponse[Dict[str, Any]])
async def add_health_check(
    health_check_config: Dict[str, Any], current_user=Depends(get_current_user)
):
    """Add health check endpoint"""
    try:
        await autonomous_monitoring_service.add_health_check(
            name=health_check_config["name"],
            url=health_check_config["url"],
            **{
                k: v for k, v in health_check_config.items() if k not in ["name", "url"]
            },
        )

        return ResponseBuilder.success(data={"success": True})

    except Exception as e:
        logger.error(f"Failed to add health check: {e}")
        raise BusinessLogicException(
            message=f"Operation failed: {str(e)}",
            error_code="OPERATION_FAILED"
        )


@router.post("/monitoring/alert-rules", response_model=StandardAPIResponse[Dict[str, Any]])
async def add_alert_rule(
    alert_rule: Dict[str, Any], current_user=Depends(get_current_user)
):
    """Add alert rule"""
    try:
        await autonomous_monitoring_service.add_alert_rule(
            rule_name=alert_rule["rule_name"],
            metric=alert_rule["metric"],
            threshold=alert_rule["threshold"],
            **{
                k: v
                for k, v in alert_rule.items()
                if k not in ["rule_name", "metric", "threshold"]
            },
        )

        return ResponseBuilder.success(data={"success": True})

    except Exception as e:
        logger.error(f"Failed to add alert rule: {e}")
        raise BusinessLogicException(
            message=f"Operation failed: {str(e)}",
            error_code="OPERATION_FAILED"
        )


@router.get("/monitoring/alerts", response_model=StandardAPIResponse[List[Dict[str, Any]]])
async def get_active_alerts(
    severity: Optional[str] = None, current_user=Depends(get_current_user)
):
    """Get active alerts"""
    try:
        alerts = await autonomous_monitoring_service.get_active_alerts(severity)
        return ResponseBuilder.success(data=alerts)

    except Exception as e:
        logger.error(f"Failed to get active alerts: {e}")
        raise BusinessLogicException(
            message=f"Operation failed: {str(e)}",
            error_code="OPERATION_FAILED"
        )


@router.get("/monitoring/overview", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_system_overview(current_user=Depends(get_current_user)):
    """Get system health overview"""
    try:
        overview = await autonomous_monitoring_service.get_system_overview()
        return ResponseBuilder.success(data=overview)

    except Exception as e:
        logger.error(f"Failed to get system overview: {e}")
        raise BusinessLogicException(
            message=f"Operation failed: {str(e)}",
            error_code="OPERATION_FAILED"
        )


# Security Endpoints


@router.post("/security/scan/model", response_model=StandardAPIResponse[Dict[str, Any]])
async def scan_model_security(
    scan_request: Dict[str, Any], current_user=Depends(get_current_user)
):
    """Perform comprehensive security scan on ML model"""
    try:
        result = await advanced_security_service.scan_model_security(
            model_path=scan_request["model_path"],
            model_metadata=scan_request.get("model_metadata", {}),
        )

        # Log audit event
        await advanced_security_service.log_audit_event(
            event_type=(
                AuditEventType.SECURITY_VIOLATION
                if result.risk_score > 10
                else AuditEventType.ADMIN_ACTION
            ),
            user_id=current_user.user_id,
            resource=f"model_security_scan/{scan_request['model_path']}",
            action="scan",
            ip_address=current_user.ip_address,
            user_agent="Phase3API",
            success=True,
            details={"scan_id": result.scan_id, "risk_score": result.risk_score},
        )

        scan_data = {
            "scan_id": result.scan_id,
            "target": result.target,
            "risk_score": result.risk_score,
            "vulnerabilities": result.vulnerabilities,
            "recommendations": result.recommendations,
            "timestamp": result.timestamp.isoformat(),
        }
        return ResponseBuilder.success(data=scan_data)

    except Exception as e:
        logger.error(f"Failed to scan model security: {e}")
        raise BusinessLogicException(
            message=f"Operation failed: {str(e)}",
            error_code="OPERATION_FAILED"
        )


@router.post("/security/tokens", response_model=StandardAPIResponse[Dict[str, Any]])
async def create_security_token(token_request: Dict[str, Any], request: Request):
    """Create secure authentication token"""
    try:
        # This would typically validate user credentials first
        user_id = token_request["user_id"]
        roles = set(token_request.get("roles", ["user"]))
        permissions = set(token_request.get("permissions", []))
        ip_address = request.client.host if request.client else "unknown"

        token = await advanced_security_service.create_security_token(
            user_id=user_id,
            roles=roles,
            permissions=permissions,
            ip_address=ip_address,
            expires_hours=token_request.get("expires_hours", 24),
        )

        return ResponseBuilder.success(data={"token": token})

    except Exception as e:
        logger.error(f"Failed to create security token: {e}")
        raise BusinessLogicException(
            message=f"Operation failed: {str(e)}",
            error_code="OPERATION_FAILED"
        )


@router.get("/security/audit-report", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_audit_report(
    start_date: str,
    end_date: str,
    event_types: Optional[str] = None,
    current_user=Depends(get_current_user),
):
    """Generate audit report for compliance"""
    try:
        start_dt = datetime.fromisoformat(start_date)
        end_dt = datetime.fromisoformat(end_date)
        event_type_list = event_types.split(",") if event_types else None

        report = await advanced_security_service.get_audit_report(
            start_date=start_dt, end_date=end_dt, event_types=event_type_list
        )

        # Log audit event
        await advanced_security_service.log_audit_event(
            event_type=AuditEventType.ADMIN_ACTION,
            user_id=current_user.user_id,
            resource="audit_report",
            action="generate",
            ip_address=current_user.ip_address,
            user_agent="Phase3API",
            success=True,
            details={"start_date": start_date, "end_date": end_date},
        )

        return ResponseBuilder.success(data=report)

    except Exception as e:
        logger.error(f"Failed to generate audit report: {e}")
        raise BusinessLogicException(
            message=f"Operation failed: {str(e)}",
            error_code="OPERATION_FAILED"
        )


@router.get("/security/alerts", response_model=StandardAPIResponse[List[Dict[str, Any]]])
async def get_security_alerts(
    severity: Optional[str] = None, current_user=Depends(get_current_user)
):
    """Get security alerts"""
    try:
        alerts = await advanced_security_service.get_security_alerts(severity)
        return ResponseBuilder.success(data=alerts)

    except Exception as e:
        logger.error(f"Failed to get security alerts: {e}")
        raise BusinessLogicException(
            message=f"Operation failed: {str(e)}",
            error_code="OPERATION_FAILED"
        )


# Health Check Endpoints


@router.get("/health/mlops", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_mlops_health():
    """Get MLOps service health"""
    try:
        health = await mlops_pipeline_service.get_service_health()
        return ResponseBuilder.success(data=health)
    except Exception as e:
        logger.error(f"Failed to get MLOps health: {e}")
        raise BusinessLogicException(
            message=f"Operation failed: {str(e)}",
            error_code="OPERATION_FAILED"
        )


@router.get("/health/deployment", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_deployment_health():
    """Get deployment service health"""
    try:
        health = await production_deployment_service.get_service_health()
        return ResponseBuilder.success(data=health)
    except Exception as e:
        logger.error(f"Failed to get deployment health: {e}")
        raise BusinessLogicException(
            message=f"Operation failed: {str(e)}",
            error_code="OPERATION_FAILED"
        )


@router.get("/health/monitoring", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_monitoring_health():
    """Get monitoring service health"""
    try:
        health = await autonomous_monitoring_service.get_service_health()
        return ResponseBuilder.success(data=health)
    except Exception as e:
        logger.error(f"Failed to get monitoring health: {e}")
        raise BusinessLogicException(
            message=f"Operation failed: {str(e)}",
            error_code="OPERATION_FAILED"
        )


@router.get("/health/security", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_security_health():
    """Get security service health"""
    try:
        health = await advanced_security_service.get_service_health()
        return ResponseBuilder.success(data=health)
    except Exception as e:
        logger.error(f"Failed to get security health: {e}")
        raise BusinessLogicException(
            message=f"Operation failed: {str(e)}",
            error_code="OPERATION_FAILED"
        )


@router.get("/health", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_phase3_health():
    """Get overall Phase 3 health status"""
    try:
        mlops_health = await mlops_pipeline_service.get_service_health()
        deployment_health = await production_deployment_service.get_service_health()
        monitoring_health = await autonomous_monitoring_service.get_service_health()
        security_health = await advanced_security_service.get_service_health()

        # Determine overall status
        all_healthy = all(
            [
                health["status"] == "healthy"
                for health in [
                    mlops_health,
                    deployment_health,
                    monitoring_health,
                    security_health,
                ]
            ]
        )

        health_data = {
            "service": "phase3_mlops_production",
            "status": "healthy" if all_healthy else "degraded",
            "components": {
                "mlops": mlops_health,
                "deployment": deployment_health,
                "monitoring": monitoring_health,
                "security": security_health,
            },
            "timestamp": datetime.now().isoformat(),
        }
        return ResponseBuilder.success(data=health_data)

    except Exception as e:
        logger.error(f"Failed to get Phase 3 health: {e}")
        raise BusinessLogicException(
            message=f"Operation failed: {str(e)}",
            error_code="OPERATION_FAILED"
        )
