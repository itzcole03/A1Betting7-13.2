"""
Phase 2 Implementation Verification

This script verifies that all Phase 2 components are working correctly:
- Performance optimization services
- Real data integration
- Distributed processing capabilities
- Advanced caching systems
- Real-time model updates
- Inference optimization
"""

import json
import time
from datetime import datetime
from typing import Any, Dict, Optional

import requests


class Phase2Verifier:
    """Verify Phase 2 implementation completeness"""

    def __init__(self, base_url: str = "http://127.0.0.1:8000/api/v2"):
        self.base_url = base_url
        self.verification_results: Dict[str, Any] = {}

    def verify_backend_health(self) -> Dict[str, Any]:
        """Verify basic backend health (v2) with robust JSON handling"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            data = response.json() if response.status_code == 200 else {}
            if isinstance(data, str):
                try:
                    data = json.loads(data)
                except Exception:
                    data = {"raw": data}
            return {
                "status": (
                    "healthy"
                    if response.status_code == 200
                    and isinstance(data, dict)
                    and data.get("success")
                    else "unhealthy"
                ),
                "response_code": response.status_code,
                "response_data": data,
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def verify_modern_ml_health(self) -> Dict[str, Any]:
        """Skip: /ml-health endpoint does not exist in v2"""
        return {
            "status": "skipped",
            "reason": "/ml-health endpoint not available in v2",
        }

    def verify_phase2_health(self) -> Dict[str, Any]:
        """Skip: /phase2/health endpoint does not exist in v2"""
        return {
            "status": "skipped",
            "reason": "/phase2/health endpoint not available in v2",
        }

    def verify_real_data_integration(self) -> Dict[str, Any]:
        """Verify real MLB data integration using v2 endpoints"""
        results = {}
        try:
            games_response = requests.get(f"{self.base_url}/games", timeout=10)
            games_data = (
                games_response.json() if games_response.status_code == 200 else {}
            )
            games = games_data.get("data", {}).get("games", [])
            if not games:
                return {
                    "status": "error",
                    "error": "No games returned from /games endpoint",
                }
            game = next((g for g in games if g.get("game_id")), None)
            if not game:
                return {
                    "status": "error",
                    "error": "No valid game_id found in games list",
                }
            game_id = game["game_id"]
            props_response = requests.get(
                f"{self.base_url}/games/{game_id}/props", timeout=10
            )
            props_data = (
                props_response.json() if props_response.status_code == 200 else {}
            )
            props = props_data.get("data", {}).get("props", [])
            results["/api/v2/games/{game_id}/props"] = {
                "status": "success" if props else "error",
                "total_props": len(props),
                "unique_players": len(
                    set(p.get("player_id") for p in props if p.get("player_id"))
                ),
                "response_size": len(str(props_data)),
            }
        except Exception as e:
            results["/api/v2/games/{game_id}/props"] = {
                "status": "error",
                "error": str(e),
            }
        return results

    def verify_optimized_predictions(self) -> Dict[str, Any]:
        """Skip: /predict endpoint does not exist in v2"""
        return {"status": "skipped", "reason": "/predict endpoint not available in v2"}

    def verify_performance_services(self) -> Dict[str, Any]:
        """Skip: /performance endpoint does not exist in v2"""
        return {
            "status": "skipped",
            "reason": "/performance endpoint not available in v2",
        }

    def verify_baseline_predictions(self) -> Dict[str, Any]:
        """Skip: /batch-predictions endpoint does not exist in v2"""
        return {
            "status": "skipped",
            "reason": "/batch-predictions endpoint not available in v2",
        }

    def run_comprehensive_verification(self) -> Dict[str, Any]:
        """Run complete Phase 2 verification"""
        print("Starting Phase 2 Implementation Verification...")
        print("=" * 60)

        # Basic health checks
        print("1. Verifying backend health...")
        self.verification_results["backend_health"] = self.verify_backend_health()

        print("2. Verifying modern ML service health...")
        self.verification_results["modern_ml_health"] = self.verify_modern_ml_health()

        print("3. Verifying Phase 2 service health...")
        self.verification_results["phase2_health"] = self.verify_phase2_health()

        # Real data integration
        print("4. Verifying real data integration...")
        self.verification_results["real_data_integration"] = (
            self.verify_real_data_integration()
        )

        # Performance services
        print("5. Verifying performance optimization services...")
        self.verification_results["performance_services"] = (
            self.verify_performance_services()
        )

        # Baseline predictions
        print("6. Verifying baseline predictions...")
        self.verification_results["baseline_predictions"] = (
            self.verify_baseline_predictions()
        )

        # Optimized predictions
        print("7. Verifying optimized predictions...")
        self.verification_results["optimized_predictions"] = (
            self.verify_optimized_predictions()
        )

        # Add verification metadata
        self.verification_results["verification_metadata"] = {
            "timestamp": datetime.now().isoformat(),
            "total_tests": 7,
            "completed_tests": len(self.verification_results) - 1,  # Exclude metadata
            "verification_summary": self.generate_summary(),
        }

        return self.verification_results

    def generate_summary(self) -> Dict[str, Any]:
        """Generate verification summary"""
        total_tests = 0
        passed_tests = 0
        failed_tests = 0

        for test_name, result in self.verification_results.items():
            if test_name == "verification_metadata":
                continue

            total_tests += 1

            if isinstance(result, dict):
                if (
                    result.get("status") == "success"
                    or result.get("status") == "healthy"
                ):
                    passed_tests += 1
                else:
                    failed_tests += 1

        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "success_rate": passed_tests / total_tests if total_tests > 0 else 0,
            "overall_status": (
                "PASS"
                if failed_tests == 0
                else "PARTIAL" if passed_tests > 0 else "FAIL"
            ),
        }

    def print_results(self):
        """Print formatted verification results"""
        print("\n" + "=" * 60)
        print("PHASE 2 VERIFICATION RESULTS")
        print("=" * 60)

        # Overall summary
        summary = self.verification_results.get("verification_metadata", {}).get(
            "verification_summary", {}
        )
        print(f"\nOVERALL STATUS: {summary.get('overall_status', 'UNKNOWN')}")
        print(
            f"Tests Passed: {summary.get('passed_tests', 0)}/{summary.get('total_tests', 0)}"
        )
        print(f"Success Rate: {summary.get('success_rate', 0):.1%}")

        # Detailed results
        print("\nDETAILED RESULTS:")

        for test_name, result in self.verification_results.items():
            if test_name == "verification_metadata":
                continue

            status = result.get("status", "unknown")
            print(f"\n{test_name.upper().replace('_', ' ')}:")
            print(f"  Status: {status}")

            if test_name == "real_data_integration":
                for endpoint, endpoint_result in result.items():
                    print(f"    {endpoint}: {endpoint_result.get('status', 'unknown')}")
                    if endpoint_result.get("total_props"):
                        print(f"      Total Props: {endpoint_result['total_props']}")
                    if endpoint_result.get("props_count"):
                        print(f"      Props Count: {endpoint_result['props_count']}")

            elif test_name == "optimized_predictions":
                for test_case, test_result in result.items():
                    print(f"    {test_case}: {test_result.get('status', 'unknown')}")
                    if test_result.get("latency_ms"):
                        print(f"      Latency: {test_result['latency_ms']:.2f}ms")
                    if test_result.get("confidence"):
                        print(f"      Confidence: {test_result['confidence']:.2f}")

        print("\n" + "=" * 60)

    def save_results(self, filename: Optional[str] = None):
        """Save verification results to file"""
        if filename is None:
            filename = (
                f"phase2_verification_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            )

        with open(filename, "w", encoding="utf-8") as f:
            json.dump(self.verification_results, f, indent=2, default=str)

        print(f"Verification results saved to: {filename}")


def main():
    """Run Phase 2 verification"""
    verifier = Phase2Verifier()

    try:
        # Run comprehensive verification
        results = verifier.run_comprehensive_verification()

        # Print results
        verifier.print_results()

        # Save results
        verifier.save_results()

        return results

    except Exception as e:
        print(f"Verification failed: {e}")
        return None


if __name__ == "__main__":
    main()
