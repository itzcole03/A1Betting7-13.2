"""
Dependencies Health API Routes

Provides diagnostic endpoints for dependency index health monitoring
and integrity verification.
"""

import asyncio
import logging
from datetime import datetime
from typing import Dict, Any, Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

from ..services.provider_resilience_manager import provider_resilience_manager

# Initialize router and logger
router = APIRouter(prefix="/dependencies", tags=["dependencies"])
logger = logging.getLogger("dependencies_api")


@router.get("/health")
async def get_dependency_health() -> Dict[str, Any]:
    """
    Get comprehensive dependency health status including:
    - Node counts by type and status
    - Integrity issue counts and types
    - Performance metrics
    - Snapshot persistence info
    """
    try:
        health_data = await provider_resilience_manager.get_dependency_health()
        
        logger.info("Dependency health requested", extra={
            "category": "dependencies_api",
            "action": "health_check",
            "health_score": health_data.get("health_score", 0),
            "total_nodes": health_data.get("total_nodes", 0),
            "critical_issues": health_data.get("integrity_issues", {}).get("critical", 0),
        })
        
        return {
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "dependency_health": health_data
        }
        
    except Exception as e:
        logger.error("Failed to get dependency health", extra={
            "category": "dependencies_api",
            "action": "health_check_error",
            "error": str(e),
        })
        
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve dependency health: {str(e)}"
        )


@router.get("/health/summary")
async def get_dependency_health_summary() -> Dict[str, Any]:
    """
    Get condensed dependency health summary for monitoring dashboards.
    Returns key metrics and health indicators.
    """
    try:
        health_data = await provider_resilience_manager.get_dependency_health()
        
        # Calculate summary metrics
        health_score = health_data.get("health_score", 0)
        total_nodes = health_data.get("total_nodes", 0)
        active_nodes = health_data.get("active_nodes", 0)
        
        integrity_issues = health_data.get("integrity_issues", {})
        critical_issues = integrity_issues.get("critical", 0)
        total_issues = integrity_issues.get("total", 0)
        
        # Determine overall health status
        if critical_issues > 0:
            status = "critical"
        elif total_issues > 0:
            status = "warning"
        elif health_score >= 0.9:
            status = "healthy"
        else:
            status = "degraded"
        
        performance = health_data.get("performance_metrics", {})
        
        summary = {
            "status": status,
            "health_score": health_score,
            "node_summary": {
                "total": total_nodes,
                "active": active_nodes,
                "inactive": total_nodes - active_nodes,
            },
            "integrity_summary": {
                "total_issues": total_issues,
                "critical_issues": critical_issues,
                "has_critical": critical_issues > 0,
            },
            "performance_summary": {
                "updates_processed": performance.get("updates_processed", 0),
                "verification_runs": performance.get("verification_runs", 0),
                "remediations_applied": performance.get("remediations_applied", 0),
                "last_verification_age_sec": (
                    datetime.utcnow().timestamp() - performance.get("last_verification", 0)
                    if performance.get("last_verification") else None
                ),
            },
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        logger.debug("Dependency health summary requested", extra={
            "category": "dependencies_api",
            "action": "health_summary",
            "status": status,
            "health_score": health_score,
            "critical_issues": critical_issues,
        })
        
        return summary
        
    except Exception as e:
        logger.error("Failed to get dependency health summary", extra={
            "category": "dependencies_api",
            "action": "health_summary_error", 
            "error": str(e),
        })
        
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve dependency health summary: {str(e)}"
        )


@router.post("/integrity/verify")
async def trigger_integrity_verification() -> Dict[str, Any]:
    """
    Manually trigger integrity verification sweep.
    Useful for on-demand verification after data updates.
    """
    try:
        # Access the dependency index directly to trigger verification
        dependency_index = provider_resilience_manager.dependency_index
        
        # Run verification
        await dependency_index._run_integrity_verification()
        
        # Get updated health status
        health_data = await dependency_index.get_dependency_health()
        
        logger.info("Manual integrity verification triggered", extra={
            "category": "dependencies_api",
            "action": "manual_verification",
            "verification_runs": health_data.get("performance_metrics", {}).get("verification_runs", 0),
            "issues_found": health_data.get("integrity_issues", {}).get("total", 0),
        })
        
        return {
            "status": "success",
            "message": "Integrity verification completed",
            "timestamp": datetime.utcnow().isoformat(),
            "verification_results": {
                "issues_found": health_data.get("integrity_issues", {}).get("total", 0),
                "critical_issues": health_data.get("integrity_issues", {}).get("critical", 0),
                "verification_runs": health_data.get("performance_metrics", {}).get("verification_runs", 0),
            }
        }
        
    except Exception as e:
        logger.error("Failed to trigger integrity verification", extra={
            "category": "dependencies_api",
            "action": "verification_error",
            "error": str(e),
        })
        
        raise HTTPException(
            status_code=500,
            detail=f"Failed to trigger integrity verification: {str(e)}"
        )


@router.post("/test/synthetic-churn")
async def run_synthetic_churn_test(
    iterations: int = Query(default=100, ge=10, le=1000, description="Number of test iterations")
) -> Dict[str, Any]:
    """
    Run synthetic churn test to validate dependency integrity and recovery logic.
    
    Creates test props/edges/tickets, simulates data churn, and verifies that
    integrity verification correctly identifies and remediates issues.
    """
    try:
        logger.info("Starting synthetic churn test", extra={
            "category": "dependencies_api",
            "action": "churn_test_start",
            "iterations": iterations,
        })
        
        # Run the test
        test_results = await provider_resilience_manager.run_synthetic_churn_test(iterations)
        
        # Determine if test passed
        test_passed = test_results.get("test_passed", False)
        issues_found = test_results.get("integrity_results", {}).get("total_issues_found", 0)
        remediated = test_results.get("integrity_results", {}).get("remediated_issues", 0)
        
        response_status = "success" if test_passed else "failure"
        
        logger.info("Synthetic churn test completed", extra={
            "category": "dependencies_api",
            "action": "churn_test_complete",
            "test_passed": test_passed,
            "issues_found": issues_found,
            "issues_remediated": remediated,
            "test_duration": test_results.get("test_duration_sec", 0),
        })
        
        return {
            "status": response_status,
            "test_passed": test_passed,
            "message": (
                "Synthetic churn test passed - recovery logic working correctly"
                if test_passed else
                "Synthetic churn test failed - issues with recovery logic"
            ),
            "timestamp": datetime.utcnow().isoformat(),
            "test_results": test_results
        }
        
    except Exception as e:
        logger.error("Synthetic churn test failed", extra={
            "category": "dependencies_api",
            "action": "churn_test_error",
            "iterations": iterations,
            "error": str(e),
        })
        
        raise HTTPException(
            status_code=500,
            detail=f"Synthetic churn test failed: {str(e)}"
        )


@router.get("/metrics")
async def get_dependency_metrics() -> Dict[str, Any]:
    """
    Get detailed dependency tracking metrics for monitoring and debugging.
    """
    try:
        health_data = await provider_resilience_manager.get_dependency_health()
        
        # Extract detailed metrics
        node_counts = health_data.get("node_counts", {})
        integrity_issues = health_data.get("integrity_issues", {})
        performance = health_data.get("performance_metrics", {})
        persistence = health_data.get("persistence", {})
        
        metrics = {
            "dependency_tracking": {
                "nodes_by_type": node_counts,
                "total_nodes": health_data.get("total_nodes", 0),
                "active_nodes": health_data.get("active_nodes", 0),
                "health_score": health_data.get("health_score", 0),
            },
            "integrity_monitoring": {
                "total_issues": integrity_issues.get("total", 0),
                "critical_issues": integrity_issues.get("critical", 0),
                "issues_by_type": integrity_issues.get("by_type", {}),
            },
            "performance_tracking": {
                "updates_processed": performance.get("updates_processed", 0),
                "verification_runs": performance.get("verification_runs", 0),
                "remediations_applied": performance.get("remediations_applied", 0),
                "last_verification": performance.get("last_verification"),
                "last_verification_age_sec": (
                    datetime.utcnow().timestamp() - performance.get("last_verification", 0)
                    if performance.get("last_verification") else None
                ),
            },
            "persistence_status": {
                "snapshot_directory": persistence.get("snapshot_dir", ""),
                "latest_snapshot": persistence.get("latest_snapshot"),
            },
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        logger.debug("Dependency metrics requested", extra={
            "category": "dependencies_api",
            "action": "metrics",
            "total_nodes": metrics["dependency_tracking"]["total_nodes"],
            "integrity_issues": metrics["integrity_monitoring"]["total_issues"],
        })
        
        return metrics
        
    except Exception as e:
        logger.error("Failed to get dependency metrics", extra={
            "category": "dependencies_api",
            "action": "metrics_error",
            "error": str(e),
        })
        
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve dependency metrics: {str(e)}"
        )


@router.get("/nodes/{entity_type}")
async def get_nodes_by_type(
    entity_type: str,
    status: Optional[str] = Query(default=None, description="Filter by status (active, retired, stale)")
) -> Dict[str, Any]:
    """
    Get nodes of a specific type (prop, edge, ticket) with optional status filtering.
    Useful for debugging and monitoring specific entity types.
    """
    try:
        if entity_type not in ["prop", "edge", "ticket"]:
            raise HTTPException(
                status_code=400,
                detail="entity_type must be one of: prop, edge, ticket"
            )
        
        # Access dependency index
        dependency_index = provider_resilience_manager.dependency_index
        
        # Get nodes of the specified type
        filtered_nodes = []
        
        async with dependency_index.node_lock:
            for (node_entity_type, entity_id), node in dependency_index.nodes.items():
                if node_entity_type == entity_type:
                    if status is None or node.status == status:
                        filtered_nodes.append({
                            "entity_id": entity_id,
                            "status": node.status,
                            "last_updated": node.last_updated,
                            "dependencies_count": len(node.dependencies),
                            "dependents_count": len(node.dependents),
                            "dependencies": list(node.dependencies),
                            "dependents": list(node.dependents),
                        })
        
        logger.debug("Nodes by type requested", extra={
            "category": "dependencies_api",
            "action": "nodes_by_type",
            "entity_type": entity_type,
            "status_filter": status,
            "nodes_found": len(filtered_nodes),
        })
        
        return {
            "status": "success",
            "entity_type": entity_type,
            "status_filter": status,
            "nodes_count": len(filtered_nodes),
            "nodes": filtered_nodes,
            "timestamp": datetime.utcnow().isoformat(),
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get nodes by type", extra={
            "category": "dependencies_api",
            "action": "nodes_by_type_error",
            "entity_type": entity_type,
            "status_filter": status,
            "error": str(e),
        })
        
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve nodes: {str(e)}"
        )