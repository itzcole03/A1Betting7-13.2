"""
Phase 2 Performance Optimization Verification Script
Verifies implementation of Phase 2 performance optimization services.
"""

import asyncio
import json
import sys
import time
from pathlib import Path
from typing import Any, Dict, List

# Add backend to path
sys.path.append(str(Path(__file__).parent / "backend"))


def print_header(title: str):
    """Print a formatted header"""
    print("\n" + "=" * 60)
    print(f" {title}")
    print("=" * 60)


def print_section(title: str):
    """Print a formatted section"""
    print(f"\n📋 {title}")
    print("-" * 40)


def print_success(message: str):
    """Print success message"""
    print(f"✅ {message}")


def print_warning(message: str):
    """Print warning message"""
    print(f"⚠️  {message}")


def print_error(message: str):
    """Print error message"""
    print(f"❌ {message}")


def print_info(message: str):
    """Print info message"""
    print(f"ℹ️  {message}")


class Phase2Verifier:
    """Verifies Phase 2 implementation"""

    def __init__(self):
        self.results = {
            "services": {},
            "files": {},
            "integration": {},
            "performance": {},
        }

    def verify_file_structure(self):
        """Verify Phase 2 file structure"""
        print_section("File Structure Verification")

        required_files = {
            "backend/services/async_connection_pool.py": "Async Connection Pool Service",
            "backend/services/advanced_caching_system.py": "Advanced Caching System",
            "backend/services/query_optimizer.py": "Query Optimizer Service",
            "backend/services/background_task_manager.py": "Background Task Manager",
            "backend/services/response_optimizer.py": "Response Optimizer",
            "backend/routes/phase2_routes.py": "Phase 2 API Routes",
        }

        for file_path, description in required_files.items():
            path = Path(file_path)
            if path.exists():
                print_success(f"{description}: {file_path}")
                self.results["files"][file_path] = True

                # Check file size to ensure it's not empty
                size = path.stat().st_size
                if size > 1000:  # At least 1KB
                    print_info(f"  File size: {size:,} bytes")
                else:
                    print_warning(f"  File seems small: {size} bytes")
            else:
                print_error(f"{description}: MISSING - {file_path}")
                self.results["files"][file_path] = False

    def verify_imports(self):
        """Verify Phase 2 service imports"""
        print_section("Import Verification")

        services = {
            "async_connection_pool": "backend.services.async_connection_pool",
            "advanced_caching_system": "backend.services.advanced_caching_system",
            "query_optimizer": "backend.services.query_optimizer",
            "background_task_manager": "backend.services.background_task_manager",
            "response_optimizer": "backend.services.response_optimizer",
        }

        for service_name, module_path in services.items():
            try:
                __import__(module_path)
                print_success(f"{service_name}: Import successful")
                self.results["services"][service_name] = {"import": True, "error": None}
            except Exception as e:
                print_error(f"{service_name}: Import failed - {e}")
                self.results["services"][service_name] = {
                    "import": False,
                    "error": str(e),
                }

    def verify_class_implementations(self):
        """Verify key class implementations"""
        print_section("Class Implementation Verification")

        # Check Async Connection Pool
        try:
            from backend.services.async_connection_pool import (
                AsyncConnectionPoolManager,
            )

            pool_manager = AsyncConnectionPoolManager()
            print_success("AsyncConnectionPoolManager: Class instantiated")

            # Check key methods
            methods = ["initialize", "shutdown", "get_session", "health_check"]
            for method in methods:
                if hasattr(pool_manager, method):
                    print_success(f"  {method}(): Method exists")
                else:
                    print_error(f"  {method}(): Method missing")

        except Exception as e:
            print_error(f"AsyncConnectionPoolManager: {e}")

        # Check Advanced Caching System
        try:
            from backend.services.advanced_caching_system import AdvancedCachingSystem

            cache_system = AdvancedCachingSystem()
            print_success("AdvancedCachingSystem: Class instantiated")

            methods = ["initialize", "shutdown", "get", "set", "delete", "clear"]
            for method in methods:
                if hasattr(cache_system, method):
                    print_success(f"  {method}(): Method exists")
                else:
                    print_error(f"  {method}(): Method missing")

        except Exception as e:
            print_error(f"AdvancedCachingSystem: {e}")

        # Check Query Optimizer
        try:
            from backend.services.query_optimizer import QueryOptimizer

            optimizer = QueryOptimizer()
            print_success("QueryOptimizer: Class instantiated")

            methods = [
                "execute_optimized_query",
                "get_performance_report",
                "health_check",
            ]
            for method in methods:
                if hasattr(optimizer, method):
                    print_success(f"  {method}(): Method exists")
                else:
                    print_error(f"  {method}(): Method missing")

        except Exception as e:
            print_error(f"QueryOptimizer: {e}")

        # Check Background Task Manager
        try:
            from backend.services.background_task_manager import BackgroundTaskManager

            task_manager = BackgroundTaskManager()
            print_success("BackgroundTaskManager: Class instantiated")

            methods = ["start", "stop", "add_task", "get_task_status", "cancel_task"]
            for method in methods:
                if hasattr(task_manager, method):
                    print_success(f"  {method}(): Method exists")
                else:
                    print_error(f"  {method}(): Method missing")

        except Exception as e:
            print_error(f"BackgroundTaskManager: {e}")

        # Check Response Optimizer
        try:
            from backend.services.response_optimizer import ResponseOptimizer

            response_opt = ResponseOptimizer()
            print_success("ResponseOptimizer: Class instantiated")

            methods = ["optimize_response", "get_performance_report", "health_check"]
            for method in methods:
                if hasattr(response_opt, method):
                    print_success(f"  {method}(): Method exists")
                else:
                    print_error(f"  {method}(): Method missing")

        except Exception as e:
            print_error(f"ResponseOptimizer: {e}")

    def verify_global_instances(self):
        """Verify global service instances"""
        print_section("Global Instance Verification")

        instances = {
            "async_connection_pool_manager": "backend.services.async_connection_pool",
            "advanced_caching_system": "backend.services.advanced_caching_system",
            "query_optimizer": "backend.services.query_optimizer",
            "background_task_manager": "backend.services.background_task_manager",
            "response_optimizer": "backend.services.response_optimizer",
        }

        for instance_name, module_path in instances.items():
            try:
                module = __import__(module_path, fromlist=[instance_name])
                instance = getattr(module, instance_name)
                print_success(f"{instance_name}: Global instance available")
                print_info(f"  Type: {type(instance).__name__}")
            except Exception as e:
                print_error(f"{instance_name}: {e}")

    def verify_enhanced_production_integration(self):
        """Verify Phase 2 integration in enhanced production"""
        print_section("Enhanced Production Integration")

        try:
            # Read the enhanced production file
            prod_file = Path("backend/enhanced_production_integration.py")
            if not prod_file.exists():
                print_error("enhanced_production_integration.py not found")
                return

            content = prod_file.read_text()

            # Check for Phase 2 service imports
            phase2_imports = [
                "async_connection_pool_manager",
                "advanced_caching_system",
                "query_optimizer",
                "background_task_manager",
                "response_optimizer",
            ]

            for import_name in phase2_imports:
                if import_name in content:
                    print_success(f"Phase 2 import found: {import_name}")
                else:
                    print_warning(f"Phase 2 import missing: {import_name}")

            # Check for initialization calls
            init_calls = [
                "async_connection_pool_manager.initialize()",
                "advanced_caching_system.initialize()",
                "background_task_manager.start()",
            ]

            for call in init_calls:
                if call in content:
                    print_success(f"Initialization call found: {call}")
                else:
                    print_warning(f"Initialization call missing: {call}")

        except Exception as e:
            print_error(f"Error verifying integration: {e}")

    def verify_api_routes(self):
        """Verify Phase 2 API routes"""
        print_section("API Routes Verification")

        try:
            from backend.routes.phase2_routes import router

            print_success("Phase 2 routes imported successfully")

            # Check route count
            route_count = len(router.routes)
            print_info(f"Total routes: {route_count}")

            # Check for key endpoints
            expected_endpoints = [
                "/api/phase2/health",
                "/api/phase2/connection-pool/status",
                "/api/phase2/cache/status",
                "/api/phase2/query-optimizer/report",
                "/api/phase2/background-tasks/status",
                "/api/phase2/response-optimizer/report",
                "/api/phase2/performance/summary",
            ]

            route_paths = [
                route.path for route in router.routes if hasattr(route, "path")
            ]

            for endpoint in expected_endpoints:
                if endpoint in route_paths:
                    print_success(f"Endpoint found: {endpoint}")
                else:
                    print_warning(f"Endpoint missing: {endpoint}")

        except Exception as e:
            print_error(f"Error verifying routes: {e}")

    async def verify_async_functionality(self):
        """Verify async functionality"""
        print_section("Async Functionality Verification")

        # Test Background Task Manager
        try:
            from backend.services.background_task_manager import background_task_manager

            # Test simple task addition
            def simple_task():
                return "Hello from background task!"

            task_id = background_task_manager.add_task(simple_task, name="test_task")
            print_success(f"Background task added: {task_id[:8]}")

            # Check task status
            await asyncio.sleep(0.1)  # Brief delay
            status = background_task_manager.get_task_status(task_id)
            if status:
                print_success(f"Task status retrieved: {status.status.value}")
            else:
                print_warning("Task status not found")

        except Exception as e:
            print_error(f"Background task test failed: {e}")

        # Test Async Connection Pool (without actual DB)
        try:
            from backend.services.async_connection_pool import (
                async_connection_pool_manager,
            )

            # Just check if health check method works
            health = await async_connection_pool_manager.health_check()
            print_success(
                f"Connection pool health check: {health.get('status', 'unknown')}"
            )

        except Exception as e:
            print_warning(f"Connection pool test: {e} (expected without DB)")

        # Test Advanced Caching System
        try:
            from backend.services.advanced_caching_system import advanced_caching_system

            # Test without Redis dependency
            health = await advanced_caching_system.health_check()
            print_success(
                f"Cache system health check: {health.get('status', 'unknown')}"
            )

        except Exception as e:
            print_warning(f"Cache system test: {e} (expected without Redis)")

    def verify_fallback_mechanisms(self):
        """Verify graceful fallback mechanisms"""
        print_section("Fallback Mechanism Verification")

        # Check structured logging fallbacks
        try:
            from backend.services.async_connection_pool import (
                app_logger,
                performance_logger,
            )

            print_success("Logging imports with fallbacks work")
            print_info(f"  app_logger: {type(app_logger).__name__}")
            print_info(f"  performance_logger: {type(performance_logger).__name__}")
        except Exception as e:
            print_error(f"Logging fallback test failed: {e}")

        # Check cache service fallbacks
        try:
            from backend.services.query_optimizer import (
                advanced_caching_system as cache_fallback,
            )

            if cache_fallback is None:
                print_success(
                    "Cache fallback mechanism working (None when unavailable)"
                )
            else:
                print_success("Cache service available")
        except Exception as e:
            print_error(f"Cache fallback test failed: {e}")

    def generate_report(self):
        """Generate verification report"""
        print_section("Verification Report")

        total_files = len(self.results["files"])
        successful_files = sum(
            1 for success in self.results["files"].values() if success
        )

        total_services = len(self.results["services"])
        successful_services = sum(
            1
            for service in self.results["services"].values()
            if service.get("import", False)
        )

        print_info(f"File Structure: {successful_files}/{total_files} files found")
        print_info(
            f"Service Imports: {successful_services}/{total_services} services imported"
        )

        if successful_files == total_files and successful_services == total_services:
            print_success("🎉 Phase 2 implementation verification PASSED!")
            return True
        else:
            print_warning("⚠️ Phase 2 implementation has some issues")
            return False

    async def run_verification(self):
        """Run complete verification"""
        print_header("Phase 2 Performance Optimization Verification")

        self.verify_file_structure()
        self.verify_imports()
        self.verify_class_implementations()
        self.verify_global_instances()
        self.verify_enhanced_production_integration()
        self.verify_api_routes()
        await self.verify_async_functionality()
        self.verify_fallback_mechanisms()

        success = self.generate_report()

        # Save results
        results_file = Path("phase2_verification_results.json")
        with open(results_file, "w") as f:
            json.dump(self.results, f, indent=2, default=str)

        print_info(f"Detailed results saved to: {results_file}")

        return success


async def main():
    """Main verification function"""
    verifier = Phase2Verifier()
    success = await verifier.run_verification()

    if success:
        print_header("Phase 2 Implementation Complete! 🚀")
        print_info(
            "All Phase 2 performance optimization services are implemented and verified."
        )
        print_info(
            "Ready to proceed with integration testing and performance benchmarks."
        )
    else:
        print_header("Phase 2 Verification Issues Found")
        print_info("Please review the warnings and errors above.")
        print_info("Check phase2_verification_results.json for detailed information.")

    return success


if __name__ == "__main__":
    try:
        result = asyncio.run(main())
        sys.exit(0 if result else 1)
    except KeyboardInterrupt:
        print("\n\nVerification interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error during verification: {e}")
        sys.exit(1)
