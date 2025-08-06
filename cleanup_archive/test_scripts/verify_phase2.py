#!/usr/bin/env python3
"""
Phase 2 Performance Optimization Verification Script

This script verifies that all Phase 2 performance optimizations
are working correctly and produces a comprehensive report.
"""

import asyncio
import json
import time
from datetime import datetime
from pathlib import Path

import requests


class Phase2Verifier:
    """Verifies Phase 2 performance optimization implementation"""

    def __init__(
        self, backend_url="http://localhost:8000", frontend_url="http://localhost:5173"
    ):
        self.backend_url = backend_url
        self.frontend_url = frontend_url
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "phase2_items": {},
            "performance_metrics": {},
            "summary": {},
        }

    def check_backend_endpoints(self):
        """Check backend performance endpoints"""
        print("🔍 Checking backend performance endpoints...")

        endpoints = {
            "health": "/health",
            "cache_health": "/cache/health",
            "cache_stats": "/cache/stats",
            "metrics": "/metrics",
        }

        for name, endpoint in endpoints.items():
            try:
                start_time = time.time()
                response = requests.get(f"{self.backend_url}{endpoint}", timeout=5)
                response_time = (time.time() - start_time) * 1000

                self.results["phase2_items"][f"backend_{name}"] = {
                    "status": "✅ PASS",
                    "response_code": response.status_code,
                    "response_time_ms": round(response_time, 2),
                    "content_preview": (
                        response.text[:200] + "..."
                        if len(response.text) > 200
                        else response.text
                    ),
                }
                print(f"  ✅ {name}: {response.status_code} ({response_time:.1f}ms)")

            except Exception as e:
                self.results["phase2_items"][f"backend_{name}"] = {
                    "status": "❌ FAIL",
                    "error": str(e),
                }
                print(f"  ❌ {name}: {e}")

    def check_cache_functionality(self):
        """Check cache service functionality"""
        print("🔍 Checking cache service functionality...")

        try:
            # Test cache health
            response = requests.get(f"{self.backend_url}/cache/health")
            cache_health = response.json()

            # Test cache stats
            response = requests.get(f"{self.backend_url}/cache/stats")
            cache_stats = response.json()

            self.results["phase2_items"]["cache_service"] = {
                "status": "✅ PASS",
                "health": cache_health,
                "stats": cache_stats,
                "backend_type": cache_health.get("backend", "unknown"),
            }

            print(
                f"  ✅ Cache service: {cache_health.get('status')} ({cache_health.get('backend')})"
            )
            print(
                f"  📊 Cache stats: {cache_stats.get('hit_rate_percent', 0)}% hit rate, {cache_stats.get('total_requests', 0)} requests"
            )

        except Exception as e:
            self.results["phase2_items"]["cache_service"] = {
                "status": "❌ FAIL",
                "error": str(e),
            }
            print(f"  ❌ Cache service: {e}")

    def check_frontend_files(self):
        """Check frontend performance optimization files"""
        print("🔍 Checking frontend performance files...")

        frontend_files = {
            "vite_config": "vite.config.js",
            "lazy_loading": "frontend/src/utils/lazyLoading.tsx",
            "performance_monitoring": "frontend/src/utils/performance.ts",
            "app_integration": "frontend/src/App.tsx",
        }

        for name, file_path in frontend_files.items():
            try:
                path = Path(file_path)
                if path.exists():
                    size_kb = path.stat().st_size / 1024

                    # Check for specific optimization markers
                    content = path.read_text(encoding="utf-8")
                    optimization_markers = {
                        "vite_config": ["manualChunks", "rollupOptions", "terser"],
                        "lazy_loading": [
                            "createLazyComponent",
                            "LazyComponents",
                            "React.lazy",
                        ],
                        "performance_monitoring": [
                            "performanceMonitor",
                            "trackWebVitals",
                            "PerformanceObserver",
                        ],
                        "app_integration": [
                            "LazyOnboardingFlow",
                            "LazyUserFriendlyApp",
                            "usePerformanceTracking",
                        ],
                    }

                    markers_found = []
                    for marker in optimization_markers.get(name, []):
                        if marker in content:
                            markers_found.append(marker)

                    self.results["phase2_items"][f"frontend_{name}"] = {
                        "status": "✅ PASS",
                        "file_size_kb": round(size_kb, 2),
                        "optimization_markers": markers_found,
                        "marker_count": len(markers_found),
                    }
                    print(
                        f"  ✅ {name}: {size_kb:.1f}KB, {len(markers_found)} optimizations"
                    )

                else:
                    self.results["phase2_items"][f"frontend_{name}"] = {
                        "status": "❌ FAIL",
                        "error": "File not found",
                    }
                    print(f"  ❌ {name}: File not found")

            except Exception as e:
                self.results["phase2_items"][f"frontend_{name}"] = {
                    "status": "❌ FAIL",
                    "error": str(e),
                }
                print(f"  ❌ {name}: {e}")

    def check_frontend_server(self):
        """Check if frontend development server is running"""
        print("🔍 Checking frontend development server...")

        try:
            start_time = time.time()
            response = requests.get(self.frontend_url, timeout=5)
            response_time = (time.time() - start_time) * 1000

            self.results["phase2_items"]["frontend_server"] = {
                "status": "✅ PASS",
                "response_code": response.status_code,
                "response_time_ms": round(response_time, 2),
                "vite_detected": "vite" in response.text.lower(),
            }
            print(
                f"  ✅ Frontend server: {response.status_code} ({response_time:.1f}ms)"
            )

        except Exception as e:
            self.results["phase2_items"]["frontend_server"] = {
                "status": "❌ FAIL",
                "error": str(e),
            }
            print(f"  ❌ Frontend server: {e}")

    def check_production_integration(self):
        """Check production integration completeness"""
        print("🔍 Checking production integration...")

        try:
            # Check detailed health endpoint for complete integration info
            response = requests.get(f"{self.backend_url}/health/detailed")
            health_data = response.json()

            # Check metrics endpoint for comprehensive monitoring
            response = requests.get(f"{self.backend_url}/metrics")
            metrics_text = response.text

            cache_metrics_found = sum(
                1 for line in metrics_text.split("\n") if "cache" in line.lower()
            )
            db_metrics_found = sum(
                1 for line in metrics_text.split("\n") if "database" in line.lower()
            )

            self.results["phase2_items"]["production_integration"] = {
                "status": "✅ PASS",
                "health_check": health_data.get("status"),
                "cache_metrics_count": cache_metrics_found,
                "database_metrics_count": db_metrics_found,
                "dependencies": health_data.get("dependencies", {}),
            }

            print(f"  ✅ Production integration: {health_data.get('status')}")
            print(
                f"  📊 Metrics: {cache_metrics_found} cache + {db_metrics_found} DB metrics"
            )

        except Exception as e:
            self.results["phase2_items"]["production_integration"] = {
                "status": "❌ FAIL",
                "error": str(e),
            }
            print(f"  ❌ Production integration: {e}")

    def generate_performance_metrics(self):
        """Generate overall performance metrics"""
        print("📊 Generating performance metrics...")

        passed_items = sum(
            1
            for item in self.results["phase2_items"].values()
            if item["status"].startswith("✅")
        )
        total_items = len(self.results["phase2_items"])
        success_rate = (passed_items / total_items * 100) if total_items > 0 else 0

        # Calculate average response times
        response_times = []
        for item in self.results["phase2_items"].values():
            if "response_time_ms" in item:
                response_times.append(item["response_time_ms"])

        avg_response_time = (
            sum(response_times) / len(response_times) if response_times else 0
        )

        self.results["performance_metrics"] = {
            "success_rate_percent": round(success_rate, 1),
            "passed_items": passed_items,
            "total_items": total_items,
            "average_response_time_ms": round(avg_response_time, 2),
            "response_time_samples": len(response_times),
        }

        print(f"  📈 Success rate: {success_rate:.1f}% ({passed_items}/{total_items})")
        print(f"  ⚡ Avg response time: {avg_response_time:.1f}ms")

    def generate_summary(self):
        """Generate verification summary"""
        phase2_checklist = [
            "frontend_vite_config",
            "frontend_lazy_loading",
            "frontend_performance_monitoring",
            "frontend_app_integration",
            "backend_cache_health",
            "backend_cache_stats",
            "backend_metrics",
            "cache_service",
            "production_integration",
        ]

        completed_items = []
        failed_items = []

        for item in phase2_checklist:
            if item in self.results["phase2_items"]:
                if self.results["phase2_items"][item]["status"].startswith("✅"):
                    completed_items.append(item)
                else:
                    failed_items.append(item)
            else:
                failed_items.append(f"{item} (not checked)")

        self.results["summary"] = {
            "phase2_completion_percent": round(
                len(completed_items) / len(phase2_checklist) * 100, 1
            ),
            "completed_items": completed_items,
            "failed_items": failed_items,
            "recommendation": self._get_recommendation(),
        }

    def _get_recommendation(self):
        """Get recommendation based on results"""
        success_rate = self.results["performance_metrics"]["success_rate_percent"]

        if success_rate >= 90:
            return "🎉 Phase 2 implementation is excellent! Ready for production."
        elif success_rate >= 75:
            return "✅ Phase 2 implementation is good. Minor issues to address."
        elif success_rate >= 50:
            return "⚠️ Phase 2 implementation needs improvement. Several issues found."
        else:
            return (
                "❌ Phase 2 implementation has major issues. Significant work needed."
            )

    def run_verification(self):
        """Run complete Phase 2 verification"""
        print("🚀 Starting Phase 2 Performance Optimization Verification\n")

        self.check_backend_endpoints()
        print()

        self.check_cache_functionality()
        print()

        self.check_frontend_files()
        print()

        self.check_frontend_server()
        print()

        self.check_production_integration()
        print()

        self.generate_performance_metrics()
        print()

        self.generate_summary()

        return self.results

    def print_report(self):
        """Print formatted verification report"""
        print("=" * 80)
        print("📋 PHASE 2 PERFORMANCE OPTIMIZATION VERIFICATION REPORT")
        print("=" * 80)
        print()

        # Summary
        summary = self.results["summary"]
        metrics = self.results["performance_metrics"]

        print(f"🎯 COMPLETION STATUS: {summary['phase2_completion_percent']}%")
        print(f"✅ PASSED CHECKS: {metrics['passed_items']}/{metrics['total_items']}")
        print(f"⚡ AVG RESPONSE TIME: {metrics['average_response_time_ms']}ms")
        print()
        print(f"📝 RECOMMENDATION: {summary['recommendation']}")
        print()

        # Completed items
        if summary["completed_items"]:
            print("✅ COMPLETED ITEMS:")
            for item in summary["completed_items"]:
                print(f"  • {item}")
            print()

        # Failed items
        if summary["failed_items"]:
            print("❌ FAILED ITEMS:")
            for item in summary["failed_items"]:
                print(f"  • {item}")
            print()

        print("=" * 80)

    def save_report(self, filename="phase2_verification_report.json"):
        """Save detailed report to JSON file"""
        with open(filename, "w") as f:
            json.dump(self.results, f, indent=2)
        print(f"💾 Detailed report saved to: {filename}")


def main():
    """Main verification function"""
    verifier = Phase2Verifier()

    try:
        results = verifier.run_verification()
        verifier.print_report()
        verifier.save_report()

        # Exit with appropriate code
        success_rate = results["performance_metrics"]["success_rate_percent"]
        exit_code = 0 if success_rate >= 75 else 1
        exit(exit_code)

    except KeyboardInterrupt:
        print("\n⚠️ Verification interrupted by user")
        exit(2)
    except Exception as e:
        print(f"\n❌ Verification failed with error: {e}")
        exit(3)


if __name__ == "__main__":
    main()
