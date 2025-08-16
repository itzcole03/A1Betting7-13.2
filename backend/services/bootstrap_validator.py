"""
Bootstrap Validator - Unified Configuration & Route Sanity Checker

Provides comprehensive validation at application startup, summarizing:
- Expected vs Resolved endpoints (auth, sports, websockets, metrics) 
- Configuration consistency across unified services
- WebSocket path alignment validation
- CORS configuration verification
- Critical dependencies availability
"""

import asyncio
from contextlib import asynccontextmanager
import logging
import time
import uuid
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional, Set, Union
from dataclasses import dataclass, field

try:
    from fastapi import FastAPI
    from fastapi.routing import APIRoute, APIWebSocketRoute
    FASTAPI_AVAILABLE = True
except ImportError:
    FastAPI = None
    APIRoute = None
    APIWebSocketRoute = None
    FASTAPI_AVAILABLE = False

# Import unified services
try:
    from backend.services.unified_config import unified_config
    from backend.services.unified_logging import unified_logger, LogContext, LogComponent
    UNIFIED_SERVICES_AVAILABLE = True
except ImportError as e:
    print(f"⚠️ Failed to import unified services: {e}")
    unified_config = None
    unified_logger = None
    LogContext = None
    LogComponent = None
    UNIFIED_SERVICES_AVAILABLE = False


class ValidationLevel(Enum):
    """Validation severity levels"""
    INFO = "INFO"
    WARN = "WARN"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class EndpointType(Enum):
    """Types of endpoints to validate"""
    AUTH = "auth"
    SPORTS = "sports"
    WEBSOCKET = "websocket"
    METRICS = "metrics"
    HEALTH = "health"
    ADMIN = "admin"
    API_V2 = "api_v2"
    SYSTEM = "system"


@dataclass
class EndpointExpectation:
    """Expected endpoint configuration"""
    path: str
    methods: List[str]
    endpoint_type: EndpointType
    required: bool = True
    cors_enabled: bool = False
    auth_required: bool = False
    description: str = ""


@dataclass
class EndpointResolution:
    """Resolved endpoint from FastAPI app"""
    path: str
    methods: List[str]
    endpoint_type: EndpointType
    found: bool = False
    route_name: Optional[str] = None
    cors_configured: bool = False
    middleware_applied: List[str] = field(default_factory=list)


@dataclass
class ValidationResult:
    """Result of endpoint validation"""
    expected: EndpointExpectation
    resolved: Optional[EndpointResolution]
    level: ValidationLevel
    message: str
    suggestions: List[str] = field(default_factory=list)


@dataclass
class BootstrapSummary:
    """Complete bootstrap validation summary"""
    correlation_id: str
    validation_start_time: datetime
    validation_end_time: Optional[datetime] = None
    total_validations: int = 0
    passed_validations: int = 0
    warnings: int = 0
    errors: int = 0
    critical_issues: int = 0
    results: List[ValidationResult] = field(default_factory=list)
    config_summary: Optional[Dict] = None
    websocket_paths: List[str] = field(default_factory=list)
    cors_origins: List[str] = field(default_factory=list)


class BootstrapValidator:
    """
    Comprehensive bootstrap validation system
    
    Validates:
    1. Expected vs Resolved endpoints
    2. Configuration consistency  
    3. WebSocket path alignment
    4. CORS configuration
    5. Critical dependencies
    """
    
    def __init__(self, app=None):
        self.app = app
        self.correlation_id = str(uuid.uuid4())
        self.logger = unified_logger if unified_logger else logging.getLogger("bootstrap_validator")
        
        # Expected endpoints configuration
        self.expected_endpoints = self._define_expected_endpoints()
        
    def _define_expected_endpoints(self) -> List[EndpointExpectation]:
        """Define the expected endpoints for A1Betting system"""
        return [
            # Health endpoints
            EndpointExpectation(
                path="/api/health",
                methods=["GET", "HEAD"],
                endpoint_type=EndpointType.HEALTH,
                required=True,
                cors_enabled=True,
                description="Legacy health check endpoint"
            ),
            EndpointExpectation(
                path="/health",
                methods=["GET", "HEAD"],
                endpoint_type=EndpointType.HEALTH,
                required=True,
                cors_enabled=True,
                description="Normalized health alias"
            ),
            EndpointExpectation(
                path="/api/v2/diagnostics/health",
                methods=["GET"],
                endpoint_type=EndpointType.HEALTH,
                required=True,
                cors_enabled=True,
                description="Structured health endpoint"
            ),
            
            # Sports activation endpoints
            EndpointExpectation(
                path="/api/v2/sports/activate",
                methods=["POST", "OPTIONS"],
                endpoint_type=EndpointType.SPORTS,
                required=True,
                cors_enabled=True,
                description="Sports activation with CORS preflight"
            ),
            
            # WebSocket endpoints
            EndpointExpectation(
                path="/ws/client",
                methods=["WEBSOCKET"],
                endpoint_type=EndpointType.WEBSOCKET,
                required=True,
                description="Enhanced WebSocket client endpoint"
            ),
            EndpointExpectation(
                path="/ws/legacy/{client_id}",
                methods=["WEBSOCKET"],
                endpoint_type=EndpointType.WEBSOCKET,
                required=False,  # Deprecated but should exist
                description="Legacy WebSocket endpoint (deprecated)"
            ),
            
            # Metrics endpoints
            EndpointExpectation(
                path="/metrics",
                methods=["GET"],
                endpoint_type=EndpointType.METRICS,
                required=True,
                description="Prometheus metrics endpoint"
            ),
            EndpointExpectation(
                path="/api/metrics/summary",
                methods=["GET"],
                endpoint_type=EndpointType.METRICS,
                required=True,
                cors_enabled=True,
                description="Human-readable metrics summary"
            ),
            
            # Auth endpoints
            EndpointExpectation(
                path="/api/auth/login",
                methods=["POST"],
                endpoint_type=EndpointType.AUTH,
                required=False,
                auth_required=False,
                description="User authentication endpoint"
            ),
            
            # API v2 endpoints
            EndpointExpectation(
                path="/api/props",
                methods=["GET"],
                endpoint_type=EndpointType.API_V2,
                required=True,
                cors_enabled=True,
                description="Props data endpoint"
            ),
        ]
        
    def _extract_routes_from_app(self) -> Dict[str, EndpointResolution]:
        """Extract all routes from FastAPI app"""
        if not self.app or not FASTAPI_AVAILABLE:
            return {}
            
        resolved = {}
        
        for route in self.app.routes:
            if FASTAPI_AVAILABLE and APIRoute and isinstance(route, APIRoute):
                # HTTP route
                methods = list(route.methods)
                path = route.path
                
                # Determine endpoint type based on path
                endpoint_type = self._classify_endpoint_type(path)
                
                resolution = EndpointResolution(
                    path=path,
                    methods=methods,
                    endpoint_type=endpoint_type,
                    found=True,
                    route_name=route.name,
                    middleware_applied=self._detect_middleware(route)
                )
                
                resolved[path] = resolution
                
            elif FASTAPI_AVAILABLE and APIWebSocketRoute and isinstance(route, APIWebSocketRoute):
                # WebSocket route
                path = route.path
                
                resolution = EndpointResolution(
                    path=path,
                    methods=["WEBSOCKET"],
                    endpoint_type=EndpointType.WEBSOCKET,
                    found=True,
                    route_name=route.name
                )
                
                resolved[path] = resolution
                
        return resolved
        
    def _classify_endpoint_type(self, path: str) -> EndpointType:
        """Classify endpoint type based on path"""
        if "/auth/" in path:
            return EndpointType.AUTH
        elif "/sports/" in path:
            return EndpointType.SPORTS
        elif "/metrics" in path:
            return EndpointType.METRICS
        elif "/health" in path or "/diagnostics/" in path:
            return EndpointType.HEALTH
        elif "/admin/" in path:
            return EndpointType.ADMIN
        elif "/api/v2/" in path:
            return EndpointType.API_V2
        else:
            return EndpointType.API_V2  # Default classification
            
    def _detect_middleware(self, route) -> List[str]:
        """Detect middleware applied to route"""
        middleware = []
        
        # This is a simplified detection - in practice, middleware detection
        # would need to inspect the app's middleware stack
        if hasattr(route, 'dependencies') and route.dependencies:
            middleware.append("dependencies")
            
        return middleware
        
    def _validate_websocket_paths(self, resolved: Dict[str, EndpointResolution]) -> List[ValidationResult]:
        """Validate WebSocket path alignment and consistency"""
        results = []
        websocket_paths = [path for path, res in resolved.items() 
                          if res.endpoint_type == EndpointType.WEBSOCKET]
        
        # Check for trailing underscores
        problematic_paths = [path for path in websocket_paths if path.endswith('_')]
        if problematic_paths:
            results.append(ValidationResult(
                expected=EndpointExpectation("", [], EndpointType.WEBSOCKET, description="Clean WebSocket paths"),
                resolved=None,
                level=ValidationLevel.WARN,
                message=f"WebSocket paths with trailing underscores found: {problematic_paths}",
                suggestions=["Remove trailing underscores from WebSocket paths"]
            ))
        
        # Check for consistent path pattern
        client_pattern_paths = [path for path in websocket_paths if "/ws/client" in path]
        legacy_pattern_paths = [path for path in websocket_paths if "/ws/legacy" in path]
        
        if client_pattern_paths and legacy_pattern_paths:
            results.append(ValidationResult(
                expected=EndpointExpectation("", [], EndpointType.WEBSOCKET, description="Consistent WebSocket patterns"),
                resolved=None,
                level=ValidationLevel.INFO,
                message=f"Found both new (/ws/client) and legacy WebSocket patterns",
                suggestions=["Consider deprecating legacy WebSocket endpoints"]
            ))
        
        return results
        
    def _validate_cors_configuration(self) -> List[ValidationResult]:
        """Validate CORS configuration"""
        results = []
        
        if not unified_config:
            results.append(ValidationResult(
                expected=EndpointExpectation("", [], EndpointType.API_V2, description="CORS configuration"),
                resolved=None,
                level=ValidationLevel.ERROR,
                message="Cannot validate CORS - unified_config not available",
                suggestions=["Ensure unified_config is properly imported"]
            ))
            return results
        
        try:
            api_config = unified_config.get_api_config()
            cors_origins = api_config.cors_origins
            
            if not cors_origins:
                results.append(ValidationResult(
                    expected=EndpointExpectation("", [], EndpointType.API_V2, description="CORS origins"),
                    resolved=None,
                    level=ValidationLevel.WARN,
                    message="No CORS origins configured",
                    suggestions=["Configure appropriate CORS origins for frontend access"]
                ))
            else:
                results.append(ValidationResult(
                    expected=EndpointExpectation("", [], EndpointType.API_V2, description="CORS origins"),
                    resolved=None,
                    level=ValidationLevel.INFO,
                    message=f"CORS origins configured: {cors_origins}",
                    suggestions=[]
                ))
                
        except Exception as e:
            results.append(ValidationResult(
                expected=EndpointExpectation("", [], EndpointType.API_V2, description="CORS configuration"),
                resolved=None,
                level=ValidationLevel.ERROR,
                message=f"Error validating CORS configuration: {e}",
                suggestions=["Check unified_config CORS settings"]
            ))
        
        return results
        
    def _validate_dependencies(self) -> List[ValidationResult]:
        """Validate critical dependencies"""
        results = []
        
        # Check FastAPI availability
        if FastAPI is None:
            results.append(ValidationResult(
                expected=EndpointExpectation("", [], EndpointType.API_V2, description="FastAPI dependency"),
                resolved=None,
                level=ValidationLevel.CRITICAL,
                message="FastAPI not available - cannot create web application",
                suggestions=["Install FastAPI: pip install fastapi"]
            ))
        
        # Check unified services
        if unified_config is None:
            results.append(ValidationResult(
                expected=EndpointExpectation("", [], EndpointType.API_V2, description="Unified config"),
                resolved=None,
                level=ValidationLevel.ERROR,
                message="unified_config not available",
                suggestions=["Ensure backend.services.unified_config is properly implemented"]
            ))
            
        if unified_logger is None:
            results.append(ValidationResult(
                expected=EndpointExpectation("", [], EndpointType.API_V2, description="Unified logging"),
                resolved=None,
                level=ValidationLevel.ERROR,
                message="unified_logger not available",
                suggestions=["Ensure backend.services.unified_logging is properly implemented"]
            ))
        
        return results
        
    def _validate_correlation_system(self) -> List[ValidationResult]:
        """Validate correlation ID system"""
        results = []
        
        try:
            from backend.services.correlation_service import (
                correlation_manager, 
                get_correlation_statistics,
                CorrelationScope
            )
            
            # Test correlation system functionality
            stats = get_correlation_statistics()
            
            results.append(ValidationResult(
                expected=EndpointExpectation("", [], EndpointType.SYSTEM, description="Correlation system"),
                resolved=None,
                level=ValidationLevel.INFO,
                message=f"✅ Correlation system available with {stats.get('total_active_contexts', 0)} active contexts",
                suggestions=[]
            ))
            
            # Validate WebSocket correlation support
            if hasattr(correlation_manager, 'create_context'):
                results.append(ValidationResult(
                    expected=EndpointExpectation("", [], EndpointType.WEBSOCKET, description="WebSocket correlation"),
                    resolved=None,
                    level=ValidationLevel.INFO,
                    message="✅ WebSocket correlation ID support available",
                    suggestions=[]
                ))
            
        except ImportError:
            results.append(ValidationResult(
                expected=EndpointExpectation("", [], EndpointType.SYSTEM, description="Correlation system"),
                resolved=None,
                level=ValidationLevel.WARN,
                message="⚠️ Correlation system not available",
                suggestions=["Ensure backend.services.correlation_service is properly implemented"]
            ))
        
        return results
    
    async def validate_bootstrap(self) -> BootstrapSummary:
        """
        Comprehensive bootstrap validation
        
        Returns:
            BootstrapSummary with complete validation results
        """
        # Import correlation service for tracking
        try:
            from backend.services.correlation_service import validation_correlation, CorrelationScope, async_correlation_context
            use_correlation = True
        except ImportError:
            use_correlation = False
            CorrelationScope = None
            async_correlation_context = None
        
        start_time = datetime.utcnow()
        
        # Create correlation context for validation tracking
        if use_correlation and async_correlation_context and CorrelationScope:
            correlation_context_manager = async_correlation_context(
                scope=CorrelationScope.VALIDATION,
                correlation_id=self.correlation_id,
                source="bootstrap_validator",
                trace_data={
                    "validation_type": "bootstrap",
                    "validator_name": "BootstrapValidator"
                }
            )
        else:
            # Fallback context manager for synchronous operation
            @asynccontextmanager
            async def null_context():
                yield
            correlation_context_manager = null_context()
        
        async with correlation_context_manager:
            if unified_logger and LogContext and LogComponent:
                context = LogContext(
                    component=LogComponent.SYSTEM,
                    operation="bootstrap_validation",
                    additional_data={"correlation_id": self.correlation_id}
                )
                unified_logger.info(f"🔍 Starting bootstrap validation [correlation_id: {self.correlation_id}]", context)
            else:
                print(f"🔍 Starting bootstrap validation [correlation_id: {self.correlation_id}]")
            
            summary = BootstrapSummary(
                correlation_id=self.correlation_id,
                validation_start_time=start_time
            )
            
            results = []
            
            # 1. Validate dependencies first
            dependency_results = self._validate_dependencies()
            results.extend(dependency_results)
            
            # 2. Extract routes from app (if available)
            resolved_endpoints = {}
            if self.app:
                resolved_endpoints = self._extract_routes_from_app()
                summary.websocket_paths = [path for path, res in resolved_endpoints.items() 
                                         if res.endpoint_type == EndpointType.WEBSOCKET]
            
            # 3. Validate expected endpoints
            for expected in self.expected_endpoints:
                # Find matching resolved endpoint
                resolved = resolved_endpoints.get(expected.path)
                
                if not resolved:
                    # Check for similar paths (might have path parameters)
                    similar_paths = [path for path in resolved_endpoints.keys() 
                                   if expected.path.replace('{client_id}', 'client_id') in path.replace('{', '').replace('}', '')]
                    
                    if similar_paths:
                        resolved = resolved_endpoints.get(similar_paths[0])
                        if resolved:
                            resolved.found = True
                
                # Create validation result
                if resolved and resolved.found:
                    # Check method compatibility
                    expected_methods = set(expected.methods)
                    resolved_methods = set(resolved.methods)
                    
                    if expected_methods.issubset(resolved_methods):
                        level = ValidationLevel.INFO
                        message = f"✅ Endpoint {expected.path} found with methods {resolved.methods}"
                    else:
                        level = ValidationLevel.WARN
                        message = f"⚠️ Endpoint {expected.path} found but missing methods. Expected: {expected.methods}, Found: {resolved.methods}"
                else:
                    level = ValidationLevel.ERROR if expected.required else ValidationLevel.WARN
                    message = f"❌ Expected endpoint {expected.path} not found"
                    
                result = ValidationResult(
                    expected=expected,
                    resolved=resolved,
                    level=level,
                    message=message,
                    suggestions=[]
                )
                results.append(result)
            
            # 4. Validate WebSocket paths
            ws_results = self._validate_websocket_paths(resolved_endpoints)
            results.extend(ws_results)
            
            # 5. Validate CORS configuration
            cors_results = self._validate_cors_configuration()
            results.extend(cors_results)
            
            # 6. Validate correlation ID system (NEW)
            correlation_results = self._validate_correlation_system()
            results.extend(correlation_results)
            
            # 7. Compile summary statistics
            summary.results = results
            summary.total_validations = len(results)
            summary.passed_validations = len([r for r in results if r.level == ValidationLevel.INFO])
            summary.warnings = len([r for r in results if r.level == ValidationLevel.WARN])
            summary.errors = len([r for r in results if r.level == ValidationLevel.ERROR])
            summary.critical_issues = len([r for r in results if r.level == ValidationLevel.CRITICAL])
            
            # 8. Add configuration summary
            if unified_config:
                try:
                    summary.config_summary = unified_config.get_config_summary()
                    summary.cors_origins = unified_config.get_api_config().cors_origins
                except Exception as e:
                    if unified_logger:
                        unified_logger.warning(f"Failed to get config summary: {e}")
                    else:
                        print(f"⚠️ Failed to get config summary: {e}")
            
            summary.validation_end_time = datetime.utcnow()
            
            # 9. Log comprehensive summary
            self._log_bootstrap_summary(summary)
            
            return summary
    
    def _log_bootstrap_summary(self, summary: BootstrapSummary):
        """Log comprehensive bootstrap validation summary"""
        if summary.validation_end_time is None:
            summary.validation_end_time = datetime.utcnow()
            
        duration = (summary.validation_end_time - summary.validation_start_time).total_seconds()
        
        # Create summary message
        summary_lines = [
            "🚀 BOOTSTRAP VALIDATION SUMMARY",
            f"Correlation ID: {summary.correlation_id}",
            f"Validation Duration: {duration:.2f}s",
            f"Total Validations: {summary.total_validations}",
            f"✅ Passed: {summary.passed_validations}",
            f"⚠️ Warnings: {summary.warnings}",
            f"❌ Errors: {summary.errors}",
            f"🔥 Critical: {summary.critical_issues}",
            "",
            "📋 ENDPOINT VALIDATION DETAILS:"
        ]
        
        # Group results by type
        by_type = {}
        for result in summary.results:
            endpoint_type = result.expected.endpoint_type if result.expected else EndpointType.API_V2
            if endpoint_type not in by_type:
                by_type[endpoint_type] = []
            by_type[endpoint_type].append(result)
        
        for endpoint_type, type_results in by_type.items():
            summary_lines.append(f"  {endpoint_type.value.upper()}:")
            for result in type_results:
                icon = "✅" if result.level == ValidationLevel.INFO else "⚠️" if result.level == ValidationLevel.WARN else "❌"
                summary_lines.append(f"    {icon} {result.message}")
        
        # WebSocket paths summary
        if summary.websocket_paths:
            summary_lines.extend([
                "",
                "🔌 WEBSOCKET PATHS:",
                *[f"  • {path}" for path in summary.websocket_paths]
            ])
        
        # CORS configuration
        if summary.cors_origins:
            summary_lines.extend([
                "",
                "🌐 CORS ORIGINS:",
                *[f"  • {origin}" for origin in summary.cors_origins]
            ])
        
        # Configuration summary
        if summary.config_summary:
            config = summary.config_summary
            summary_lines.extend([
                "",
                "⚙️ CONFIGURATION SUMMARY:",
                f"  Environment: {config.get('environment', 'unknown')}",
                f"  Debug Mode: {config.get('debug', False)}",
                f"  API Host: {config.get('api_host', 'unknown')}:{config.get('api_port', 'unknown')}",
                f"  Database: {config.get('database_url', 'unknown')[:50]}{'...' if len(config.get('database_url', '')) > 50 else ''}",
                f"  Cache Enabled: {config.get('cache_enabled', False)}",
                f"  ML Enabled: {config.get('ml_enabled', False)}",
                f"  Modern ML: {config.get('modern_ml_enabled', False)}"
            ])
        
        # Final assessment
        if summary.critical_issues > 0:
            summary_lines.extend([
                "",
                "🔥 CRITICAL ISSUES DETECTED - Application may not start properly!"
            ])
        elif summary.errors > 0:
            summary_lines.extend([
                "",
                "❌ Errors detected - Some functionality may be unavailable"
            ])
        elif summary.warnings > 0:
            summary_lines.extend([
                "",
                "⚠️ Warnings detected - Review configuration for optimal performance"
            ])
        else:
            summary_lines.extend([
                "",
                "✅ All validations passed - Application ready for startup!"
            ])
        
        summary_message = "\n".join(summary_lines)
        
        if unified_logger and UNIFIED_SERVICES_AVAILABLE and LogContext and LogComponent:
            context = LogContext(
                component=LogComponent.SYSTEM,
                operation="bootstrap_validation_summary",
                additional_data={
                    "correlation_id": summary.correlation_id,
                    "duration_seconds": duration,
                    "validation_stats": {
                        "total": summary.total_validations,
                        "passed": summary.passed_validations,
                        "warnings": summary.warnings,
                        "errors": summary.errors,
                        "critical": summary.critical_issues
                    }
                }
            )
            
            if summary.critical_issues > 0:
                unified_logger.critical(summary_message, context)
            elif summary.errors > 0:
                unified_logger.error(summary_message, context)
            elif summary.warnings > 0:
                unified_logger.warning(summary_message, context)
            else:
                unified_logger.info(summary_message, context)
        else:
            print(summary_message)


# Convenience functions
async def validate_app_bootstrap(app):
    """Validate application bootstrap with FastAPI app"""
    validator = BootstrapValidator(app)
    return await validator.validate_bootstrap()


def validate_config_only():
    """Validate configuration without FastAPI app (for early startup checks)"""
    import asyncio
    validator = BootstrapValidator()
    return asyncio.run(validator.validate_bootstrap())


# Export interfaces
__all__ = [
    "BootstrapValidator",
    "BootstrapSummary",
    "ValidationResult", 
    "EndpointExpectation",
    "EndpointResolution",
    "ValidationLevel",
    "EndpointType",
    "validate_app_bootstrap",
    "validate_config_only"
]