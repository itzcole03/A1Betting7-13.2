#!/usr/bin/env python3
"""
Phase 3 Implementation Verification Script
Validates all Phase 3 enterprise MLOps, deployment, monitoring, and security features
"""

import asyncio
import importlib.util
import json
import sys
import time
import traceback
from pathlib import Path
from typing import Any, Dict, List


# Color codes for output
class Colors:
    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    PURPLE = "\033[95m"
    CYAN = "\033[96m"
    WHITE = "\033[97m"
    BOLD = "\033[1m"
    END = "\033[0m"


class Phase3Verifier:
    def __init__(self):
        self.results = {
            "mlops_services": {},
            "deployment_services": {},
            "monitoring_services": {},
            "security_services": {},
            "api_routes": {},
            "integration": {},
            "dependencies": {},
            "performance": {},
        }
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0

    def print_header(self, text: str):
        print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.BLUE}{text.center(60)}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")

    def print_success(self, text: str):
        print(f"{Colors.GREEN}✅ {text}{Colors.END}")

    def print_failure(self, text: str):
        print(f"{Colors.RED}❌ {text}{Colors.END}")

    def print_warning(self, text: str):
        print(f"{Colors.YELLOW}⚠️  {text}{Colors.END}")

    def print_info(self, text: str):
        print(f"{Colors.CYAN}ℹ️  {text}{Colors.END}")

    def record_test(
        self, category: str, test_name: str, success: bool, details: str = ""
    ):
        self.total_tests += 1
        if success:
            self.passed_tests += 1
            self.print_success(f"{test_name}: {details}")
        else:
            self.failed_tests += 1
            self.print_failure(f"{test_name}: {details}")

        self.results[category][test_name] = {
            "success": success,
            "details": details,
            "timestamp": time.time(),
        }

    def check_file_exists(self, file_path: str) -> bool:
        """Check if a file exists"""
        return Path(file_path).exists()

    def check_import(self, module_name: str) -> tuple[bool, str]:
        """Check if a module can be imported"""
        try:
            spec = importlib.util.find_spec(module_name)
            if spec is None:
                return False, f"Module {module_name} not found"
            return True, f"Module {module_name} available"
        except Exception as e:
            return False, f"Import error: {str(e)}"

    async def verify_phase3_files(self):
        """Verify Phase 3 service files exist"""
        self.print_header("📁 Phase 3 File Structure Verification")

        critical_files = {
            "MLOps Pipeline Service": "backend/services/mlops_pipeline_service.py",
            "Production Deployment Service": "backend/services/production_deployment_service.py",
            "Autonomous Monitoring Service": "backend/services/autonomous_monitoring_service.py",
            "Advanced Security Service": "backend/services/advanced_security_service.py",
            "Phase 3 Routes": "backend/routes/phase3_routes.py",
            "Backend Deployment": "k8s/backend-deployment.yaml",
            "Frontend Deployment": "k8s/frontend-deployment.yaml",
            "Infrastructure Config": "k8s/infrastructure.yaml",
            "CI/CD Pipeline": ".github/workflows/ci-cd.yml",
            "Production Dockerfile": "Dockerfile.backend.prod",
        }

        for name, file_path in critical_files.items():
            exists = self.check_file_exists(file_path)
            if exists:
                file_size = Path(file_path).stat().st_size
                self.record_test(
                    "integration",
                    f"{name} File",
                    True,
                    f"{file_path} ({file_size} bytes)",
                )
            else:
                self.record_test(
                    "integration", f"{name} File", False, f"{file_path} not found"
                )

    async def verify_phase3_imports(self):
        """Verify Phase 3 service imports"""
        self.print_header("📦 Phase 3 Import Verification")

        imports = {
            "MLOps Pipeline Service": "backend.services.mlops_pipeline_service",
            "Production Deployment Service": "backend.services.production_deployment_service",
            "Autonomous Monitoring Service": "backend.services.autonomous_monitoring_service",
            "Advanced Security Service": "backend.services.advanced_security_service",
            "Phase 3 Routes": "backend.routes.phase3_routes",
            "Production Integration": "backend.production_integration",
        }

        for name, module in imports.items():
            success, details = self.check_import(module)
            self.record_test("integration", f"{name} Import", success, details)

    async def verify_mlops_services(self):
        """Verify MLOps pipeline services"""
        self.print_header("🤖 MLOps Services Verification")

        try:
            from backend.services.mlops_pipeline_service import (
                ModelVersion,
                TrainingPipeline,
                mlops_pipeline_service,
            )

            # Test service initialization
            health = await mlops_pipeline_service.health_check()
            self.record_test(
                "mlops_services",
                "Service Health Check",
                True,
                f"Status: {health.get('status', 'unknown')}",
            )

            # Test pipeline creation
            try:
                config = {
                    "name": "test_verification_pipeline",
                    "model_type": "transformer",
                    "sport": "MLB",
                }
                pipeline = await mlops_pipeline_service.create_pipeline(config)
                self.record_test(
                    "mlops_services",
                    "Pipeline Creation",
                    True,
                    f"Pipeline ID: {pipeline.id}",
                )
            except Exception as e:
                self.record_test(
                    "mlops_services", "Pipeline Creation", False, f"Error: {str(e)}"
                )

            # Test model registry
            try:
                models = await mlops_pipeline_service.list_models()
                self.record_test(
                    "mlops_services",
                    "Model Registry",
                    True,
                    f"Available models: {len(models)}",
                )
            except Exception as e:
                self.record_test(
                    "mlops_services", "Model Registry", False, f"Error: {str(e)}"
                )

            # Test training pipeline methods
            try:
                pipelines = await mlops_pipeline_service.list_pipelines()
                self.record_test(
                    "mlops_services",
                    "Pipeline Listing",
                    True,
                    f"Active pipelines: {len(pipelines)}",
                )
            except Exception as e:
                self.record_test(
                    "mlops_services", "Pipeline Listing", False, f"Error: {str(e)}"
                )

        except Exception as e:
            self.record_test(
                "mlops_services",
                "MLOps Service Import",
                False,
                f"Import failed: {str(e)}",
            )

    async def verify_deployment_services(self):
        """Verify production deployment services"""
        self.print_header("🚀 Production Deployment Services Verification")

        try:
            from backend.services.production_deployment_service import (
                DeploymentConfig,
                production_deployment_service,
            )

            # Test service health
            health = await production_deployment_service.health_check()
            self.record_test(
                "deployment_services",
                "Service Health Check",
                True,
                f"Status: {health.get('status', 'unknown')}",
            )

            # Test deployment configuration
            try:
                config = await production_deployment_service.get_deployment_config(
                    "test"
                )
                self.record_test(
                    "deployment_services",
                    "Deployment Config",
                    True,
                    f"Config name: {config.name}",
                )
            except Exception as e:
                self.record_test(
                    "deployment_services",
                    "Deployment Config",
                    False,
                    f"Error: {str(e)}",
                )

            # Test Kubernetes integration
            try:
                status = await production_deployment_service.get_deployment_status(
                    "test"
                )
                self.record_test(
                    "deployment_services",
                    "Deployment Status",
                    True,
                    f"Status available",
                )
            except Exception as e:
                self.record_test(
                    "deployment_services",
                    "Deployment Status",
                    False,
                    f"Error: {str(e)}",
                )

            # Test Docker integration
            try:
                images = await production_deployment_service.list_images()
                self.record_test(
                    "deployment_services",
                    "Docker Images",
                    True,
                    f"Images listed: {len(images)}",
                )
            except Exception as e:
                self.record_test(
                    "deployment_services", "Docker Images", False, f"Error: {str(e)}"
                )

        except Exception as e:
            self.record_test(
                "deployment_services",
                "Deployment Service Import",
                False,
                f"Import failed: {str(e)}",
            )

    async def verify_monitoring_services(self):
        """Verify autonomous monitoring services"""
        self.print_header("📊 Autonomous Monitoring Services Verification")

        try:
            from backend.services.autonomous_monitoring_service import (
                Alert,
                MetricPoint,
                autonomous_monitoring_service,
            )

            # Test service health
            health = await autonomous_monitoring_service.health_check()
            self.record_test(
                "monitoring_services",
                "Service Health Check",
                True,
                f"Status: {health.get('status', 'unknown')}",
            )

            # Test metrics collection
            try:
                metrics = await autonomous_monitoring_service.collect_system_metrics()
                self.record_test(
                    "monitoring_services",
                    "System Metrics",
                    True,
                    f"Metrics collected: {len(metrics)}",
                )
            except Exception as e:
                self.record_test(
                    "monitoring_services", "System Metrics", False, f"Error: {str(e)}"
                )

            # Test alert system
            try:
                alerts = await autonomous_monitoring_service.get_active_alerts()
                self.record_test(
                    "monitoring_services",
                    "Alert System",
                    True,
                    f"Active alerts: {len(alerts)}",
                )
            except Exception as e:
                self.record_test(
                    "monitoring_services", "Alert System", False, f"Error: {str(e)}"
                )

            # Test auto-healing
            try:
                healing_status = (
                    await autonomous_monitoring_service.get_healing_status()
                )
                self.record_test(
                    "monitoring_services",
                    "Auto-Healing",
                    True,
                    f"Healing enabled: {healing_status.get('enabled', False)}",
                )
            except Exception as e:
                self.record_test(
                    "monitoring_services", "Auto-Healing", False, f"Error: {str(e)}"
                )

        except Exception as e:
            self.record_test(
                "monitoring_services",
                "Monitoring Service Import",
                False,
                f"Import failed: {str(e)}",
            )

    async def verify_security_services(self):
        """Verify advanced security services"""
        self.print_header("🔐 Advanced Security Services Verification")

        try:
            from backend.services.advanced_security_service import (
                AuditEvent,
                SecurityScanResult,
                advanced_security_service,
            )

            # Test service health
            health = await advanced_security_service.health_check()
            self.record_test(
                "security_services",
                "Service Health Check",
                True,
                f"Status: {health.get('status', 'unknown')}",
            )

            # Test security scanning
            try:
                scan_result = await advanced_security_service.scan_model_security(
                    "test_model"
                )
                self.record_test(
                    "security_services",
                    "Model Security Scan",
                    True,
                    f"Scan score: {scan_result.overall_score}",
                )
            except Exception as e:
                self.record_test(
                    "security_services",
                    "Model Security Scan",
                    False,
                    f"Error: {str(e)}",
                )

            # Test access policies
            try:
                policies = await advanced_security_service.list_access_policies()
                self.record_test(
                    "security_services",
                    "Access Policies",
                    True,
                    f"Policies configured: {len(policies)}",
                )
            except Exception as e:
                self.record_test(
                    "security_services", "Access Policies", False, f"Error: {str(e)}"
                )

            # Test audit logging
            try:
                events = await advanced_security_service.get_recent_audit_events(
                    limit=10
                )
                self.record_test(
                    "security_services",
                    "Audit Logging",
                    True,
                    f"Recent events: {len(events)}",
                )
            except Exception as e:
                self.record_test(
                    "security_services", "Audit Logging", False, f"Error: {str(e)}"
                )

        except Exception as e:
            self.record_test(
                "security_services",
                "Security Service Import",
                False,
                f"Import failed: {str(e)}",
            )

    async def verify_api_routes(self):
        """Verify Phase 3 API routes integration"""
        self.print_header("🌐 Phase 3 API Routes Verification")

        try:
            from backend.production_integration import create_production_app
            from backend.routes.phase3_routes import router as phase3_router

            # Test route registration
            app = create_production_app()
            routes = [route.path for route in app.routes if hasattr(route, "path")]
            phase3_routes = [r for r in routes if "/api/phase3" in r]

            self.record_test(
                "api_routes",
                "Route Registration",
                True,
                f"Phase 3 routes: {len(phase3_routes)}",
            )

            # Test specific route categories
            mlops_routes = [r for r in phase3_routes if "/mlops/" in r]
            deployment_routes = [r for r in phase3_routes if "/deployment/" in r]
            monitoring_routes = [r for r in phase3_routes if "/monitoring/" in r]
            security_routes = [r for r in phase3_routes if "/security/" in r]

            self.record_test(
                "api_routes",
                "MLOps Routes",
                len(mlops_routes) > 0,
                f"MLOps endpoints: {len(mlops_routes)}",
            )
            self.record_test(
                "api_routes",
                "Deployment Routes",
                len(deployment_routes) > 0,
                f"Deployment endpoints: {len(deployment_routes)}",
            )
            self.record_test(
                "api_routes",
                "Monitoring Routes",
                len(monitoring_routes) > 0,
                f"Monitoring endpoints: {len(monitoring_routes)}",
            )
            self.record_test(
                "api_routes",
                "Security Routes",
                len(security_routes) > 0,
                f"Security endpoints: {len(security_routes)}",
            )

            # Check for key endpoints
            expected_endpoints = [
                "/api/phase3/health",
                "/api/phase3/mlops/health",
                "/api/phase3/deployment/health",
                "/api/phase3/monitoring/health",
                "/api/phase3/security/health",
            ]

            for endpoint in expected_endpoints:
                found = endpoint in phase3_routes
                self.record_test(
                    "api_routes", f"Endpoint {endpoint}", found, f"Available: {found}"
                )

        except Exception as e:
            self.record_test(
                "api_routes", "API Routes Import", False, f"Import failed: {str(e)}"
            )

    async def verify_dependencies(self):
        """Verify Phase 3 dependencies"""
        self.print_header("📚 Phase 3 Dependencies Verification")

        # Core dependencies
        core_deps = {
            "FastAPI": "fastapi",
            "Uvicorn": "uvicorn",
            "SQLAlchemy": "sqlalchemy",
            "Pydantic": "pydantic",
            "Redis": "redis",
            "Asyncio": "asyncio",
        }

        # Optional Phase 3 dependencies
        optional_deps = {
            "PyTorch": "torch",
            "Transformers": "transformers",
            "MLflow": "mlflow",
            "Optuna": "optuna",
            "Docker": "docker",
            "Kubernetes": "kubernetes",
            "PyJWT": "jwt",
            "Cryptography": "cryptography",
        }

        # Test core dependencies
        for name, module in core_deps.items():
            success, details = self.check_import(module)
            self.record_test("dependencies", f"Core: {name}", success, details)

        # Test optional dependencies (with fallbacks)
        optional_count = 0
        for name, module in optional_deps.items():
            success, details = self.check_import(module)
            if success:
                optional_count += 1
            self.record_test("dependencies", f"Optional: {name}", success, details)

        # Summary of optional dependencies
        optional_percentage = (optional_count / len(optional_deps)) * 100
        self.print_info(
            f"Optional dependencies available: {optional_count}/{len(optional_deps)} ({optional_percentage:.1f}%)"
        )

    async def verify_performance(self):
        """Verify Phase 3 performance characteristics"""
        self.print_header("⚡ Phase 3 Performance Verification")

        try:
            # Test service import times
            start_time = time.time()
            from backend.services.modern_ml_service import modern_ml_service

            import_time = time.time() - start_time
            self.record_test(
                "performance",
                "Modern ML Import",
                import_time < 2.0,
                f"Import time: {import_time:.3f}s",
            )

            # Test service health check times
            start_time = time.time()
            health = await modern_ml_service.health_check()
            health_time = time.time() - start_time
            self.record_test(
                "performance",
                "Health Check Speed",
                health_time < 1.0,
                f"Health check: {health_time:.3f}s",
            )

            # Test Phase 3 service performance
            try:
                from backend.services.performance_optimization import (
                    performance_optimizer,
                )

                start_time = time.time()
                opt_health = await performance_optimizer.health_check()
                opt_time = time.time() - start_time
                self.record_test(
                    "performance",
                    "Performance Optimizer",
                    opt_time < 1.0,
                    f"Optimizer health: {opt_time:.3f}s",
                )
            except Exception as e:
                self.record_test(
                    "performance", "Performance Optimizer", False, f"Error: {str(e)}"
                )

        except Exception as e:
            self.record_test(
                "performance", "Performance Tests", False, f"Error: {str(e)}"
            )

    def generate_report(self):
        """Generate comprehensive verification report"""
        self.print_header("📋 Phase 3 Verification Report")

        # Summary statistics
        pass_rate = (
            (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        )

        print(f"\n{Colors.BOLD}📊 Summary Statistics:{Colors.END}")
        print(f"   Total Tests: {self.total_tests}")
        print(f"   Passed: {Colors.GREEN}{self.passed_tests}{Colors.END}")
        print(f"   Failed: {Colors.RED}{self.failed_tests}{Colors.END}")
        print(
            f"   Pass Rate: {Colors.GREEN if pass_rate >= 80 else Colors.YELLOW if pass_rate >= 60 else Colors.RED}{pass_rate:.1f}%{Colors.END}"
        )

        # Category breakdown
        print(f"\n{Colors.BOLD}📈 Category Breakdown:{Colors.END}")
        for category, tests in self.results.items():
            if tests:
                category_total = len(tests)
                category_passed = sum(1 for test in tests.values() if test["success"])
                category_rate = (
                    (category_passed / category_total * 100)
                    if category_total > 0
                    else 0
                )

                status_color = (
                    Colors.GREEN
                    if category_rate >= 80
                    else Colors.YELLOW if category_rate >= 60 else Colors.RED
                )
                print(
                    f"   {category.replace('_', ' ').title()}: {status_color}{category_passed}/{category_total} ({category_rate:.1f}%){Colors.END}"
                )

        # Overall assessment
        print(f"\n{Colors.BOLD}🎯 Overall Assessment:{Colors.END}")
        if pass_rate >= 90:
            print(
                f"   {Colors.GREEN}🏆 Excellent! Phase 3 implementation is comprehensive and robust.{Colors.END}"
            )
        elif pass_rate >= 80:
            print(
                f"   {Colors.GREEN}✅ Good! Phase 3 implementation is solid with minor issues.{Colors.END}"
            )
        elif pass_rate >= 60:
            print(
                f"   {Colors.YELLOW}⚠️  Acceptable. Phase 3 implementation needs some improvements.{Colors.END}"
            )
        else:
            print(
                f"   {Colors.RED}❌ Poor. Phase 3 implementation requires significant work.{Colors.END}"
            )

        # Save detailed report
        report_data = {
            "timestamp": time.time(),
            "summary": {
                "total_tests": self.total_tests,
                "passed_tests": self.passed_tests,
                "failed_tests": self.failed_tests,
                "pass_rate": pass_rate,
            },
            "results": self.results,
        }

        with open("phase3_verification_report.json", "w") as f:
            json.dump(report_data, f, indent=2)

        self.print_info("Detailed report saved to: phase3_verification_report.json")

        return pass_rate >= 80


async def main():
    """Main verification function"""
    print(f"{Colors.BOLD}{Colors.PURPLE}")
    print("🚀 A1Betting Phase 3 Implementation Verification")
    print("Enterprise MLOps, Deployment, Monitoring & Security")
    print(f"{'='*60}{Colors.END}")

    verifier = Phase3Verifier()

    try:
        # Run all verification tests
        await verifier.verify_phase3_files()
        await verifier.verify_phase3_imports()
        await verifier.verify_mlops_services()
        await verifier.verify_deployment_services()
        await verifier.verify_monitoring_services()
        await verifier.verify_security_services()
        await verifier.verify_api_routes()
        await verifier.verify_dependencies()
        await verifier.verify_performance()

        # Generate report
        success = verifier.generate_report()

        # Exit with appropriate code
        sys.exit(0 if success else 1)

    except Exception as e:
        print(f"\n{Colors.RED}❌ Verification failed with error: {str(e)}{Colors.END}")
        print(f"{Colors.RED}Traceback: {traceback.format_exc()}{Colors.END}")
        sys.exit(1)


if __name__ == "__main__":
    # Add current directory to Python path
    sys.path.insert(0, str(Path.cwd()))

    # Run verification
    asyncio.run(main())
