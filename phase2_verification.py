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
from typing import Any, Dict, List

import requests


class Phase2Verifier:
    """Verify Phase 2 implementation completeness"""

    def __init__(self, base_url: str = "http://127.0.0.1:8000"):
        self.base_url = base_url
        self.verification_results = {}

    def verify_backend_health(self) -> Dict[str, Any]:
        """Verify basic backend health"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            return {
                "status": "healthy" if response.status_code == 200 else "unhealthy",
                "response_code": response.status_code,
                "response_data": (
                    response.json() if response.status_code == 200 else None
                ),
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def verify_modern_ml_health(self) -> Dict[str, Any]:
        """Verify modern ML service health"""
        try:
            response = requests.get(f"{self.base_url}/api/modern-ml/health", timeout=5)
            return {
                "status": "healthy" if response.status_code == 200 else "unhealthy",
                "response_code": response.status_code,
                "response_data": (
                    response.json() if response.status_code == 200 else None
                ),
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def verify_phase2_health(self) -> Dict[str, Any]:
        """Verify Phase 2 service health"""
        try:
            response = requests.get(
                f"{self.base_url}/api/modern-ml/phase2/health", timeout=5
            )
            return {
                "status": "healthy" if response.status_code == 200 else "unhealthy",
                "response_code": response.status_code,
                "response_data": (
                    response.json() if response.status_code == 200 else None
                ),
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def verify_real_data_integration(self) -> Dict[str, Any]:
        """Verify real MLB data integration"""
        endpoints_to_test = ["/mlb/comprehensive-props/", "/mlb/prizepicks-props/"]

        results = {}

        for endpoint in endpoints_to_test:
            try:
                response = requests.get(f"{self.base_url}{endpoint}", timeout=10)

                if response.status_code == 200:
                    data = response.json()

                    if endpoint == "/mlb/comprehensive-props/":
                        # Extract coverage metrics
                        coverage = data.get("coverage_metrics", {})
                        results[endpoint] = {
                            "status": "success",
                            "total_props": coverage.get("total_props", 0),
                            "unique_players": coverage.get("unique_players", 0),
                            "stat_types": len(coverage.get("stat_types", [])),
                            "response_size": len(str(data)),
                        }

                    elif endpoint == "/mlb/prizepicks-props/":
                        # Count props
                        props_count = len(data) if isinstance(data, list) else 0
                        results[endpoint] = {
                            "status": "success",
                            "props_count": props_count,
                            "response_size": len(str(data)),
                        }

                else:
                    results[endpoint] = {
                        "status": "error",
                        "response_code": response.status_code,
                        "error": response.text[:200],
                    }

            except Exception as e:
                results[endpoint] = {"status": "error", "error": str(e)}

        return results

    def verify_optimized_predictions(self) -> Dict[str, Any]:
        """Verify optimized prediction functionality"""
        test_cases = [
            {
                "name": "Aaron_Judge_Home_Runs",
                "data": {
                    "player_name": "Aaron Judge",
                    "team": "NYY",
                    "opponent_team": "BOS",
                    "line_score": 1.5,
                    "historical_data": [{"hr": 1}, {"hr": 0}, {"hr": 2}],
                    "team_data": {"win_rate": 0.65, "avg_score": 5.8},
                    "opponent_data": {"win_rate": 0.55, "avg_score": 5.2},
                    "game_context": {"home_game": True, "temperature": 75},
                },
                "sport": "MLB",
                "prop_type": "home_runs",
            },
            {
                "name": "Mookie_Betts_Hits",
                "data": {
                    "player_name": "Mookie Betts",
                    "team": "LAD",
                    "opponent_team": "SFG",
                    "line_score": 2.5,
                    "historical_data": [{"hits": 3}, {"hits": 1}, {"hits": 2}],
                    "team_data": {"win_rate": 0.72, "avg_score": 6.1},
                    "opponent_data": {"win_rate": 0.48, "avg_score": 4.9},
                    "game_context": {"home_game": False, "temperature": 68},
                },
                "sport": "MLB",
                "prop_type": "hits",
            },
        ]

        results = {}

        for test_case in test_cases:
            try:
                start_time = time.time()

                response = requests.post(
                    f"{self.base_url}/api/modern-ml/phase2/optimized-prediction",
                    json=test_case,
                    timeout=10,
                )

                latency = (time.time() - start_time) * 1000

                if response.status_code == 200:
                    data = response.json()
                    results[test_case["name"]] = {
                        "status": "success",
                        "prediction": data.get("prediction"),
                        "confidence": data.get("confidence"),
                        "processing_time": data.get("processing_time", 0),
                        "models_used": data.get("models_used", []),
                        "latency_ms": latency,
                        "optimization_used": data.get("optimization_metadata", {}).get(
                            "phase2_optimized", False
                        ),
                    }
                else:
                    results[test_case["name"]] = {
                        "status": "error",
                        "response_code": response.status_code,
                        "error": response.text[:200],
                        "latency_ms": latency,
                    }

            except Exception as e:
                results[test_case["name"]] = {"status": "error", "error": str(e)}

        return results

    def verify_performance_services(self) -> Dict[str, Any]:
        """Verify performance optimization services"""
        try:
            # Start Phase 2 services
            start_response = requests.post(
                f"{self.base_url}/api/modern-ml/phase2/start-optimization"
            )

            # Wait a moment for services to initialize
            time.sleep(2)

            # Get optimization stats
            stats_response = requests.get(
                f"{self.base_url}/api/modern-ml/phase2/optimization-stats"
            )

            results = {
                "start_services": {
                    "status": (
                        "success" if start_response.status_code == 202 else "error"
                    ),
                    "response_code": start_response.status_code,
                    "message": (
                        start_response.json().get("message", "")
                        if start_response.status_code == 202
                        else start_response.text[:100]
                    ),
                },
                "optimization_stats": {
                    "status": (
                        "success" if stats_response.status_code == 200 else "error"
                    ),
                    "response_code": stats_response.status_code,
                    "data": (
                        stats_response.json()
                        if stats_response.status_code == 200
                        else None
                    ),
                },
            }

            return results

        except Exception as e:
            return {"status": "error", "error": str(e)}

    def verify_baseline_predictions(self) -> Dict[str, Any]:
        """Verify baseline prediction endpoint for comparison"""
        test_request = {
            "requests": [
                {
                    "data": {
                        "player_name": "Mike Trout",
                        "team": "LAA",
                        "opponent_team": "HOU",
                        "line_score": 2.0,
                        "historical_data": [],
                        "team_data": {"win_rate": 0.58},
                        "opponent_data": {"win_rate": 0.68},
                    },
                    "sport": "MLB",
                    "prop_type": "hits",
                }
            ]
        }

        try:
            start_time = time.time()

            response = requests.post(
                f"{self.base_url}/api/unified/batch-predictions",
                json=test_request,
                timeout=10,
            )

            latency = (time.time() - start_time) * 1000

            return {
                "status": "success" if response.status_code == 200 else "error",
                "response_code": response.status_code,
                "latency_ms": latency,
                "data": response.json() if response.status_code == 200 else None,
            }

        except Exception as e:
            return {"status": "error", "error": str(e)}

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

    def save_results(self, filename: str = None):
        """Save verification results to file"""
        if filename is None:
            filename = (
                f"phase2_verification_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            )

        with open(filename, "w") as f:
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
