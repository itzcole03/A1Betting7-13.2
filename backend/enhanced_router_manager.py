"""
Enhanced Router Manager - Robust router inclusion with caching bypass and verification
"""

import importlib
import logging
import sys
from typing import Any, Dict, List

from fastapi import FastAPI
from fastapi.routing import APIRouter


class EnhancedRouterManager:
    """Manages enhanced API router inclusion with robust verification and fallback mechanisms"""

    def __init__(self, app: FastAPI):
        self.app = app
        self.logger = logging.getLogger("a1betting.enhanced_router_manager")

    def force_fresh_import(self, module_name: str):
        """Force a fresh import by clearing module cache"""
        if module_name in sys.modules:
            del sys.modules[module_name]
            self.logger.info(f"Cleared cached module: {module_name}")

        # Also clear any submodules
        modules_to_clear = [
            name for name in sys.modules.keys() if name.startswith(module_name)
        ]
        for mod in modules_to_clear:
            del sys.modules[mod]
            self.logger.info(f"Cleared cached submodule: {mod}")

    def get_enhanced_api_router(self) -> APIRouter:
        """Get enhanced API router with forced fresh import"""
        self.logger.info("=== GETTING ENHANCED API ROUTER ===")

        # Force fresh import to bypass caching
        self.force_fresh_import("backend.routes.enhanced_api")

        # Import the router
        from backend.routes.enhanced_api import router as enhanced_api_router

        self.logger.info(f"✅ Enhanced API router imported successfully")
        self.logger.info(f"Router type: {type(enhanced_api_router)}")
        self.logger.info(f"Router routes count: {len(enhanced_api_router.routes)}")

        # Log all routes for verification
        for i, route in enumerate(enhanced_api_router.routes):
            if hasattr(route, "path") and hasattr(route, "methods"):
                self.logger.info(f"  Route {i+1}: {route.methods} {route.path}")
            else:
                self.logger.info(f"  Route {i+1}: {type(route)} - {route}")

        return enhanced_api_router

    def verify_route_inclusion(self, prefix: str = "/v1") -> Dict[str, Any]:
        """Verify that routes were properly included"""
        verification = {
            "total_routes": len(self.app.routes),
            "v1_routes": [],
            "enhanced_routes": [],
            "simple_test_found": False,
        }

        for route in self.app.routes:
            if hasattr(route, "path"):
                path = route.path
                if path.startswith(prefix):
                    methods = list(getattr(route, "methods", ["Unknown"]))
                    verification["v1_routes"].append(f"{methods} {path}")

                    # Check for enhanced API specific routes
                    if any(
                        keyword in path
                        for keyword in [
                            "simple-test",
                            "auth",
                            "predictions",
                            "bankroll",
                        ]
                    ):
                        verification["enhanced_routes"].append(f"{methods} {path}")

                    if "simple-test" in path:
                        verification["simple_test_found"] = True

        return verification

    def include_enhanced_router_robust(self, prefix: str = "/v1") -> bool:
        """Include enhanced API router with comprehensive verification and fallback"""
        self.logger.info("=== ROBUST ENHANCED ROUTER INCLUSION START ===")

        try:
            # Get current route count
            routes_before = len(self.app.routes)
            self.logger.info(f"App routes before inclusion: {routes_before}")

            # Get the enhanced API router with fresh import
            enhanced_router = self.get_enhanced_api_router()

            # Include the router
            self.logger.info(f"Including enhanced API router with prefix: {prefix}")
            self.app.include_router(enhanced_router, prefix=prefix)

            # Verify inclusion
            routes_after = len(self.app.routes)
            routes_added = routes_after - routes_before
            self.logger.info(
                f"App routes after inclusion: {routes_after} (added {routes_added})"
            )

            # Detailed verification
            verification = self.verify_route_inclusion(prefix)

            self.logger.info(f"✅ VERIFICATION RESULTS:")
            self.logger.info(f"  Total app routes: {verification['total_routes']}")
            self.logger.info(f"  V1 routes found: {len(verification['v1_routes'])}")
            self.logger.info(
                f"  Enhanced API routes: {len(verification['enhanced_routes'])}"
            )
            self.logger.info(
                f"  Simple test route found: {verification['simple_test_found']}"
            )

            # Log all V1 routes
            for route in verification["v1_routes"]:
                self.logger.info(f"    V1 Route: {route}")

            # Success criteria
            if verification["simple_test_found"] and len(verification["v1_routes"]) > 0:
                self.logger.info("🎉 ENHANCED ROUTER INCLUSION SUCCESSFUL!")
                return True
            else:
                self.logger.error(
                    "❌ ENHANCED ROUTER INCLUSION FAILED - Routes not properly registered"
                )
                return False

        except Exception as e:
            self.logger.error(
                f"❌ ERROR during enhanced router inclusion: {e}", exc_info=True
            )
            return False

    def manual_route_registration_fallback(self):
        """Fallback: Manually register essential enhanced API routes"""
        self.logger.info("=== MANUAL ROUTE REGISTRATION FALLBACK ===")

        try:
            # Force fresh import
            self.force_fresh_import("backend.routes.enhanced_api")

            # Import individual route functions
            from backend.routes.enhanced_api import (
                enhanced_predictions,
                get_bankroll_status,
                login_user,
                register_user,
                simple_test,
                system_health,
            )

            # Manually add routes
            self.app.get("/v1/simple-test")(simple_test)
            self.app.post("/v1/auth/register")(register_user)
            self.app.post("/v1/auth/login")(login_user)
            self.app.post("/v1/predictions/enhanced")(enhanced_predictions)
            self.app.get("/v1/bankroll/status")(get_bankroll_status)
            self.app.get("/v1/system/health")(system_health)

            self.logger.info("✅ Manual route registration completed")

            # Verify manual registration
            verification = self.verify_route_inclusion("/v1")
            self.logger.info(f"Manual registration verification: {verification}")

            return verification["simple_test_found"]

        except Exception as e:
            self.logger.error(
                f"❌ Manual route registration failed: {e}", exc_info=True
            )
            return False

    def ensure_enhanced_api_routes(self) -> bool:
        """Ensure enhanced API routes are available using primary method with fallback"""
        self.logger.info("🚀 ENSURING ENHANCED API ROUTES ARE AVAILABLE")

        # Try primary method
        if self.include_enhanced_router_robust():
            self.logger.info("✅ Primary router inclusion successful")
            return True

        # Try fallback method
        self.logger.warning("⚠️ Primary method failed, attempting fallback...")
        if self.manual_route_registration_fallback():
            self.logger.info("✅ Fallback route registration successful")
            return True

        self.logger.error("❌ ALL METHODS FAILED - Enhanced API routes not available")
        return False


def setup_enhanced_routes(app: FastAPI) -> bool:
    """Setup enhanced API routes with robust inclusion and verification"""
    manager = EnhancedRouterManager(app)
    return manager.ensure_enhanced_api_routes()
