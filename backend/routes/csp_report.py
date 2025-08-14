"""
CSP Report Endpoint

Handles Content Security Policy violation reports and integrates with metrics collection.
Provides debugging and monitoring capabilities for CSP violations.

Phase 1, Step 6: Security Headers Middleware - CSP Report Collection
"""

import logging
import json
from typing import Dict, Any
from datetime import datetime

from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, ValidationError

from ..middleware.prometheus_metrics_middleware import get_metrics_middleware
from ..config.settings import get_settings

# Initialize logger
logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(prefix="/security", tags=["security"])


def get_metrics_client():
    """
    Dependency function to get metrics client
    
    Returns:
        Metrics client instance or None if not available
    """
    try:
        return get_metrics_middleware()
    except Exception as e:
        logger.debug(f"Could not get metrics client: {e}")
        return None

# CSP Report Model
class CSPViolationReport(BaseModel):
    """
    Content Security Policy violation report structure
    
    Based on CSP Level 3 specification:
    https://www.w3.org/TR/CSP3/#violation-report-api
    """
    document_uri: str = Field(..., description="URL of the document where violation occurred")
    referrer: str = Field(default="", description="Referrer of the document")
    violated_directive: str = Field(..., description="Directive that was violated")
    effective_directive: str = Field(..., description="Effective directive (may differ from violated)")
    original_policy: str = Field(..., description="Original CSP policy string")
    disposition: str = Field(..., description="Disposition: enforce or report")
    blocked_uri: str = Field(..., description="URI that was blocked")
    line_number: int = Field(default=0, description="Line number of violation")
    column_number: int = Field(default=0, description="Column number of violation")
    status_code: int = Field(default=0, description="HTTP status code")
    source_file: str = Field(default="", description="Source file of violation")
    sample: str = Field(default="", description="Sample of violating content")


class CSPReportPayload(BaseModel):
    """
    Complete CSP report payload wrapper
    """
    csp_report: CSPViolationReport


@router.post("/csp-report")
async def receive_csp_report(
    request: Request,
    settings = Depends(get_settings),
    metrics_client = Depends(get_metrics_client)
) -> JSONResponse:
    """
    Receive and process CSP violation reports
    
    This endpoint receives CSP violation reports from browsers and:
    1. Validates the report structure
    2. Logs the violation details
    3. Updates Prometheus metrics
    4. Returns appropriate response
    
    Args:
        request: FastAPI request object containing CSP report
        settings: Application settings
        metrics_client: Prometheus metrics client
        
    Returns:
        JSONResponse: Empty response (browsers ignore response content)
        
    Raises:
        HTTPException: On malformed requests or processing errors
    """
    try:
        # Check if CSP reporting is enabled
        if not settings.security_settings.csp_report_endpoint_enabled:
            logger.debug("CSP report received but endpoint is disabled")
            raise HTTPException(status_code=404, detail="CSP reporting not enabled")
        
        # Get raw request body
        raw_body = await request.body()
        
        if not raw_body:
            logger.warning("CSP report received with empty body")
            raise HTTPException(status_code=400, detail="Empty CSP report")
        
        # Parse JSON payload
        try:
            payload_data = json.loads(raw_body.decode('utf-8'))
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            logger.error(f"Failed to parse CSP report JSON: {e}")
            logger.debug(f"Raw body: {raw_body[:500]}")  # Log first 500 chars for debugging
            raise HTTPException(status_code=400, detail="Invalid JSON in CSP report")
        
        # Validate CSP report structure
        try:
            csp_report_payload = CSPReportPayload(**payload_data)
            csp_report = csp_report_payload.csp_report
        except ValidationError as e:
            logger.error(f"CSP report validation failed: {e}")
            logger.debug(f"Payload data: {payload_data}")
            raise HTTPException(status_code=400, detail="Invalid CSP report structure")
        
        # Extract key information for logging and metrics
        violated_directive = csp_report.violated_directive
        effective_directive = csp_report.effective_directive
        blocked_uri = csp_report.blocked_uri
        document_uri = csp_report.document_uri
        disposition = csp_report.disposition
        
        # Log CSP violation
        logger.warning(
            f"CSP Violation [{disposition}]: {violated_directive} blocked {blocked_uri} "
            f"on {document_uri}"
        )
        
        # Log detailed information for debugging
        if logger.isEnabledFor(logging.DEBUG):
            logger.debug(f"CSP Violation Details:")
            logger.debug(f"  Document URI: {document_uri}")
            logger.debug(f"  Referrer: {csp_report.referrer}")
            logger.debug(f"  Violated Directive: {violated_directive}")
            logger.debug(f"  Effective Directive: {effective_directive}")
            logger.debug(f"  Blocked URI: {blocked_uri}")
            logger.debug(f"  Disposition: {disposition}")
            logger.debug(f"  Line/Column: {csp_report.line_number}:{csp_report.column_number}")
            logger.debug(f"  Source File: {csp_report.source_file}")
            logger.debug(f"  Sample: {csp_report.sample}")
            logger.debug(f"  Original Policy: {csp_report.original_policy[:200]}...")
        
        # Update Prometheus metrics
        if metrics_client and hasattr(metrics_client, 'csp_violation_reports_total'):
            # Extract directive type for metrics (e.g., 'script-src' from 'script-src-elem')
            directive_base = violated_directive.split('-')[0] if '-' in violated_directive else violated_directive
            
            metrics_client.csp_violation_reports_total.labels(
                directive=directive_base,
                violated_directive=violated_directive
            ).inc()
            
            logger.debug(f"Updated CSP violation metrics: {directive_base}/{violated_directive}")
        
        # Additional processing for common violation patterns
        _analyze_violation_patterns(csp_report, logger)
        
        # Return empty response (CSP report endpoints should return 204 or empty 200)
        return JSONResponse(
            status_code=204,
            content=None
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
        
    except Exception as e:
        logger.error(f"Unexpected error processing CSP report: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error processing CSP report")


def _analyze_violation_patterns(csp_report: CSPViolationReport, logger: logging.Logger) -> None:
    """
    Analyze CSP violation patterns and provide debugging insights
    
    Args:
        csp_report: The CSP violation report to analyze
        logger: Logger instance for outputting insights
    """
    violated_directive = csp_report.violated_directive
    blocked_uri = csp_report.blocked_uri
    
    # Common violation patterns and suggested fixes
    if violated_directive.startswith('script-src'):
        if 'inline' in blocked_uri or 'eval' in blocked_uri:
            logger.info("CSP Analysis: Inline script violation - consider using nonces or hashes")
        elif blocked_uri.startswith('chrome-extension://'):
            logger.info("CSP Analysis: Browser extension script blocked - expected behavior")
        elif blocked_uri.startswith('data:'):
            logger.info("CSP Analysis: Data URI script blocked - consider allowing 'data:' in script-src")
    
    elif violated_directive.startswith('style-src'):
        if 'inline' in blocked_uri:
            logger.info("CSP Analysis: Inline style violation - consider using nonces or 'unsafe-inline'")
        elif blocked_uri.startswith('data:'):
            logger.info("CSP Analysis: Data URI style blocked - consider allowing 'data:' in style-src")
    
    elif violated_directive.startswith('img-src'):
        if blocked_uri.startswith('data:'):
            logger.info("CSP Analysis: Data URI image blocked - consider allowing 'data:' in img-src")
        elif blocked_uri.startswith('blob:'):
            logger.info("CSP Analysis: Blob image blocked - consider allowing 'blob:' in img-src")
    
    elif violated_directive.startswith('connect-src'):
        logger.info(f"CSP Analysis: XHR/Fetch blocked to {blocked_uri} - add to connect-src if legitimate")
    
    elif violated_directive == 'frame-ancestors':
        logger.info("CSP Analysis: Frame ancestors violation - page loaded in unauthorized frame")
    
    # Check for common development vs production patterns
    if blocked_uri.startswith('http://localhost:') or 'localhost' in blocked_uri:
        logger.info("CSP Analysis: Development server resource blocked - adjust CSP for dev environment")
    
    if 'webpack' in blocked_uri or 'hot-update' in blocked_uri:
        logger.info("CSP Analysis: Webpack/HMR resource blocked - common in development")


@router.get("/csp-report/stats")
async def get_csp_stats(
    settings = Depends(get_settings),
    metrics_client = Depends(get_metrics_client)
) -> Dict[str, Any]:
    """
    Get CSP violation statistics
    
    Returns summary statistics about CSP violations for monitoring and debugging.
    
    Args:
        settings: Application settings
        metrics_client: Prometheus metrics client
        
    Returns:
        Dict containing CSP statistics and configuration info
    """
    try:
        # Check if CSP reporting is enabled
        if not settings.security_settings.csp_report_endpoint_enabled:
            raise HTTPException(status_code=404, detail="CSP reporting not enabled")
        
        stats = {
            "csp_enabled": settings.security_settings.csp_enabled,
            "csp_report_only": settings.security_settings.csp_report_only,
            "csp_report_endpoint_enabled": settings.security_settings.csp_report_endpoint_enabled,
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        # Add metrics data if available
        if metrics_client and hasattr(metrics_client, 'csp_violation_reports_total'):
            try:
                # Get current metric values (this is implementation-specific)
                # Note: Prometheus doesn't easily expose current values, so this is conceptual
                stats["metrics_available"] = True
                stats["total_violations"] = "See Prometheus metrics endpoint"
            except Exception as e:
                logger.debug(f"Could not retrieve CSP metrics: {e}")
                stats["metrics_available"] = False
        else:
            stats["metrics_available"] = False
        
        return stats
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving CSP stats: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


# Health check for CSP report endpoint
@router.get("/csp-report/health")
async def csp_report_health(settings = Depends(get_settings)) -> Dict[str, str]:
    """
    Health check for CSP report endpoint
    
    Args:
        settings: Application settings
        
    Returns:
        Dict with health status
    """
    status = "healthy" if settings.security_settings.csp_report_endpoint_enabled else "disabled"
    return {
        "status": status,
        "endpoint": "csp-report",
        "timestamp": datetime.utcnow().isoformat()
    }
