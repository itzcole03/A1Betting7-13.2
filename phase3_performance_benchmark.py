#!/usr/bin/env python3
"""
Phase 3 Performance Benchmark Script
Comprehensive performance testing for enterprise MLOps, deployment, monitoring, and security
"""

import asyncio
import concurrent.futures
import gc
import json
import sys
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import psutil


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


@dataclass
class BenchmarkResult:
    name: str
    duration: float
    memory_before: float
    memory_after: float
    memory_peak: float
    success: bool
    details: Dict[str, Any]
    timestamp: float


class Phase3PerformanceBenchmark:
    def __init__(self):
        self.results: List[BenchmarkResult] = []
        self.process = psutil.Process()
        self.baseline_memory = 0

    def print_header(self, text: str):
        print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*70}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.BLUE}{text.center(70)}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.BLUE}{'='*70}{Colors.END}")

    def print_success(self, text: str):
        print(f"{Colors.GREEN}✅ {text}{Colors.END}")

    def print_performance(self, text: str):
        print(f"{Colors.CYAN}⚡ {text}{Colors.END}")

    def print_warning(self, text: str):
        print(f"{Colors.YELLOW}⚠️  {text}{Colors.END}")

    def get_memory_usage(self) -> float:
        """Get current memory usage in MB"""
        return self.process.memory_info().rss / 1024 / 1024

    async def benchmark_async_function(
        self, name: str, func, *args, **kwargs
    ) -> BenchmarkResult:
        """Benchmark an async function"""
        gc.collect()  # Clean up before measurement

        memory_before = self.get_memory_usage()
        memory_peak = memory_before
        start_time = time.time()
        success = True
        details = {}

        try:
            # Monitor memory during execution
            async def monitor_memory():
                nonlocal memory_peak
                while not hasattr(monitor_memory, "stop"):
                    current_memory = self.get_memory_usage()
                    memory_peak = max(memory_peak, current_memory)
                    await asyncio.sleep(0.01)

            # Start memory monitoring
            monitor_task = asyncio.create_task(monitor_memory())

            # Execute function
            result = await func(*args, **kwargs)

            # Stop memory monitoring
            monitor_memory.stop = True
            monitor_task.cancel()

            if result:
                details["result"] = (
                    str(result)[:100]
                    if isinstance(result, (str, dict, list))
                    else "Success"
                )

        except Exception as e:
            success = False
            details["error"] = str(e)

        duration = time.time() - start_time
        memory_after = self.get_memory_usage()

        benchmark_result = BenchmarkResult(
            name=name,
            duration=duration,
            memory_before=memory_before,
            memory_after=memory_after,
            memory_peak=memory_peak,
            success=success,
            details=details,
            timestamp=time.time(),
        )

        self.results.append(benchmark_result)

        # Print result
        status = "✅" if success else "❌"
        memory_change = memory_after - memory_before
        memory_change_str = (
            f"+{memory_change:.1f}" if memory_change > 0 else f"{memory_change:.1f}"
        )

        print(f"{status} {name}:")
        print(f"   ⏱️  Duration: {duration:.3f}s")
        print(
            f"   🧠 Memory: {memory_before:.1f}MB → {memory_after:.1f}MB ({memory_change_str}MB, peak: {memory_peak:.1f}MB)"
        )
        if not success:
            print(f"   ❌ Error: {details.get('error', 'Unknown error')}")
        elif details.get("result"):
            print(f"   📊 Result: {details['result']}")

        return benchmark_result

    async def benchmark_mlops_performance(self):
        """Benchmark MLOps service performance"""
        self.print_header("🤖 MLOps Services Performance Benchmarks")

        try:
            from backend.services.mlops_pipeline_service import mlops_pipeline_service

            # Benchmark health checks
            await self.benchmark_async_function(
                "MLOps Health Check", mlops_pipeline_service.health_check
            )

            # Benchmark pipeline creation
            await self.benchmark_async_function(
                "Pipeline Creation",
                mlops_pipeline_service.create_pipeline,
                {
                    "name": "benchmark_pipeline",
                    "model_type": "transformer",
                    "sport": "MLB",
                },
            )

            # Benchmark model listing
            await self.benchmark_async_function(
                "Model Registry List", mlops_pipeline_service.list_models
            )

            # Benchmark pipeline listing
            await self.benchmark_async_function(
                "Pipeline Listing", mlops_pipeline_service.list_pipelines
            )

            # Stress test: Multiple concurrent operations
            async def stress_test_mlops():
                tasks = []
                for i in range(5):
                    tasks.append(mlops_pipeline_service.health_check())
                return await asyncio.gather(*tasks)

            await self.benchmark_async_function(
                "MLOps Concurrent Stress Test (5x)", stress_test_mlops
            )

        except Exception as e:
            print(f"❌ MLOps benchmarks failed: {str(e)}")

    async def benchmark_deployment_performance(self):
        """Benchmark deployment service performance"""
        self.print_header("🚀 Deployment Services Performance Benchmarks")

        try:
            from backend.services.production_deployment_service import (
                production_deployment_service,
            )

            # Benchmark health checks
            await self.benchmark_async_function(
                "Deployment Health Check", production_deployment_service.health_check
            )

            # Benchmark configuration loading
            await self.benchmark_async_function(
                "Deployment Config Load",
                production_deployment_service.get_deployment_config,
                "benchmark_test",
            )

            # Benchmark status checking
            await self.benchmark_async_function(
                "Deployment Status Check",
                production_deployment_service.get_deployment_status,
                "benchmark_test",
            )

            # Benchmark image listing
            await self.benchmark_async_function(
                "Docker Image Listing", production_deployment_service.list_images
            )

        except Exception as e:
            print(f"❌ Deployment benchmarks failed: {str(e)}")

    async def benchmark_monitoring_performance(self):
        """Benchmark monitoring service performance"""
        self.print_header("📊 Monitoring Services Performance Benchmarks")

        try:
            from backend.services.autonomous_monitoring_service import (
                autonomous_monitoring_service,
            )

            # Benchmark health checks
            await self.benchmark_async_function(
                "Monitoring Health Check", autonomous_monitoring_service.health_check
            )

            # Benchmark metrics collection
            await self.benchmark_async_function(
                "System Metrics Collection",
                autonomous_monitoring_service.collect_system_metrics,
            )

            # Benchmark alert retrieval
            await self.benchmark_async_function(
                "Active Alerts Retrieval",
                autonomous_monitoring_service.get_active_alerts,
            )

            # Benchmark healing status
            await self.benchmark_async_function(
                "Auto-Healing Status", autonomous_monitoring_service.get_healing_status
            )

            # Stress test: Continuous monitoring
            async def monitoring_stress_test():
                results = []
                for i in range(3):
                    metrics = (
                        await autonomous_monitoring_service.collect_system_metrics()
                    )
                    results.append(len(metrics))
                return results

            await self.benchmark_async_function(
                "Monitoring Stress Test (3x metrics)", monitoring_stress_test
            )

        except Exception as e:
            print(f"❌ Monitoring benchmarks failed: {str(e)}")

    async def benchmark_security_performance(self):
        """Benchmark security service performance"""
        self.print_header("🔐 Security Services Performance Benchmarks")

        try:
            from backend.services.advanced_security_service import (
                advanced_security_service,
            )

            # Benchmark health checks
            await self.benchmark_async_function(
                "Security Health Check", advanced_security_service.health_check
            )

            # Benchmark security scanning
            await self.benchmark_async_function(
                "Model Security Scan",
                advanced_security_service.scan_model_security,
                "benchmark_model",
            )

            # Benchmark access policies
            await self.benchmark_async_function(
                "Access Policies List", advanced_security_service.list_access_policies
            )

            # Benchmark audit events
            await self.benchmark_async_function(
                "Recent Audit Events",
                advanced_security_service.get_recent_audit_events,
                limit=10,
            )

        except Exception as e:
            print(f"❌ Security benchmarks failed: {str(e)}")

    async def benchmark_modern_ml_performance(self):
        """Benchmark modern ML service performance"""
        self.print_header("🧠 Modern ML Services Performance Benchmarks")

        try:
            from backend.services.modern_ml_service import modern_ml_service
            from backend.services.performance_optimization import performance_optimizer

            # Benchmark modern ML health
            await self.benchmark_async_function(
                "Modern ML Health Check", modern_ml_service.health_check
            )

            # Benchmark performance optimizer
            await self.benchmark_async_function(
                "Performance Optimizer Health", performance_optimizer.health_check
            )

            # Benchmark batch operations
            async def batch_health_checks():
                tasks = []
                for i in range(10):
                    tasks.append(modern_ml_service.health_check())
                return await asyncio.gather(*tasks)

            await self.benchmark_async_function(
                "Batch Health Checks (10x)", batch_health_checks
            )

        except Exception as e:
            print(f"❌ Modern ML benchmarks failed: {str(e)}")

    async def benchmark_integration_performance(self):
        """Benchmark integration and route performance"""
        self.print_header("🌐 Integration Performance Benchmarks")

        try:
            from backend.production_integration import create_production_app
            from backend.routes.phase3_routes import router as phase3_router

            # Benchmark app creation
            start_time = time.time()
            app = create_production_app()
            app_creation_time = time.time() - start_time

            self.results.append(
                BenchmarkResult(
                    name="Production App Creation",
                    duration=app_creation_time,
                    memory_before=self.get_memory_usage(),
                    memory_after=self.get_memory_usage(),
                    memory_peak=self.get_memory_usage(),
                    success=True,
                    details={
                        "routes": len([r for r in app.routes if hasattr(r, "path")])
                    },
                    timestamp=time.time(),
                )
            )

            print(f"✅ Production App Creation:")
            print(f"   ⏱️  Duration: {app_creation_time:.3f}s")
            print(f"   📊 Routes: {len([r for r in app.routes if hasattr(r, 'path')])}")

            # Count Phase 3 routes
            routes = [route.path for route in app.routes if hasattr(route, "path")]
            phase3_routes = [r for r in routes if "/api/phase3" in r]

            self.results.append(
                BenchmarkResult(
                    name="Phase 3 Route Registration",
                    duration=0.001,  # Minimal time for counting
                    memory_before=self.get_memory_usage(),
                    memory_after=self.get_memory_usage(),
                    memory_peak=self.get_memory_usage(),
                    success=len(phase3_routes) > 0,
                    details={
                        "phase3_routes": len(phase3_routes),
                        "total_routes": len(routes),
                    },
                    timestamp=time.time(),
                )
            )

            print(f"✅ Phase 3 Route Registration:")
            print(f"   📊 Phase 3 Routes: {len(phase3_routes)}")
            print(f"   📊 Total Routes: {len(routes)}")

        except Exception as e:
            print(f"❌ Integration benchmarks failed: {str(e)}")

    def analyze_performance_patterns(self):
        """Analyze performance patterns and identify bottlenecks"""
        self.print_header("📈 Performance Analysis")

        if not self.results:
            print("❌ No benchmark results to analyze")
            return

        # Overall statistics
        successful_results = [r for r in self.results if r.success]
        failed_results = [r for r in self.results if not r.success]

        print(f"📊 Overall Statistics:")
        print(f"   Total Benchmarks: {len(self.results)}")
        print(f"   Successful: {len(successful_results)}")
        print(f"   Failed: {len(failed_results)}")

        if successful_results:
            # Performance statistics
            durations = [r.duration for r in successful_results]
            memory_changes = [
                r.memory_after - r.memory_before for r in successful_results
            ]

            avg_duration = sum(durations) / len(durations)
            max_duration = max(durations)
            min_duration = min(durations)

            avg_memory_change = sum(memory_changes) / len(memory_changes)
            max_memory_change = max(memory_changes)

            print(f"\n⏱️  Performance Metrics:")
            print(f"   Average Duration: {avg_duration:.3f}s")
            print(f"   Max Duration: {max_duration:.3f}s")
            print(f"   Min Duration: {min_duration:.3f}s")

            print(f"\n🧠 Memory Metrics:")
            print(f"   Average Memory Change: {avg_memory_change:+.1f}MB")
            print(f"   Max Memory Change: {max_memory_change:+.1f}MB")

            # Identify slow operations (> 1 second)
            slow_operations = [r for r in successful_results if r.duration > 1.0]
            if slow_operations:
                print(f"\n⚠️  Slow Operations (>1s):")
                for op in slow_operations:
                    print(f"   - {op.name}: {op.duration:.3f}s")

            # Identify memory-heavy operations (>10MB change)
            memory_heavy = [
                r for r in successful_results if (r.memory_after - r.memory_before) > 10
            ]
            if memory_heavy:
                print(f"\n🧠 Memory-Heavy Operations (>10MB):")
                for op in memory_heavy:
                    change = op.memory_after - op.memory_before
                    print(f"   - {op.name}: +{change:.1f}MB")

            # Performance grades
            fast_operations = len([r for r in successful_results if r.duration < 0.1])
            medium_operations = len(
                [r for r in successful_results if 0.1 <= r.duration < 1.0]
            )
            slow_operations_count = len(slow_operations)

            print(f"\n🏆 Performance Distribution:")
            print(f"   Fast (<0.1s): {fast_operations}")
            print(f"   Medium (0.1-1s): {medium_operations}")
            print(f"   Slow (>1s): {slow_operations_count}")

            # Overall grade
            if slow_operations_count == 0 and avg_duration < 0.5:
                grade = "A+ (Excellent)"
                color = Colors.GREEN
            elif slow_operations_count <= 1 and avg_duration < 1.0:
                grade = "A (Very Good)"
                color = Colors.GREEN
            elif slow_operations_count <= 2 and avg_duration < 2.0:
                grade = "B (Good)"
                color = Colors.YELLOW
            else:
                grade = "C (Needs Improvement)"
                color = Colors.RED

            print(f"\n🎯 Overall Performance Grade: {color}{grade}{Colors.END}")

    def save_benchmark_report(self):
        """Save detailed benchmark report"""
        report_data = {
            "timestamp": datetime.now().isoformat(),
            "system_info": {
                "cpu_count": psutil.cpu_count(),
                "memory_total": psutil.virtual_memory().total
                / 1024
                / 1024
                / 1024,  # GB
                "python_version": sys.version,
                "platform": sys.platform,
            },
            "summary": {
                "total_benchmarks": len(self.results),
                "successful": len([r for r in self.results if r.success]),
                "failed": len([r for r in self.results if not r.success]),
                "baseline_memory": self.baseline_memory,
            },
            "results": [
                {
                    "name": r.name,
                    "duration": r.duration,
                    "memory_before": r.memory_before,
                    "memory_after": r.memory_after,
                    "memory_peak": r.memory_peak,
                    "memory_change": r.memory_after - r.memory_before,
                    "success": r.success,
                    "details": r.details,
                    "timestamp": r.timestamp,
                }
                for r in self.results
            ],
        }

        # Save JSON report
        with open("phase3_performance_report.json", "w") as f:
            json.dump(report_data, f, indent=2)

        # Save CSV for easy analysis
        import csv

        with open("phase3_performance_report.csv", "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(
                [
                    "Name",
                    "Duration",
                    "Memory_Before",
                    "Memory_After",
                    "Memory_Change",
                    "Memory_Peak",
                    "Success",
                ]
            )
            for r in self.results:
                writer.writerow(
                    [
                        r.name,
                        r.duration,
                        r.memory_before,
                        r.memory_after,
                        r.memory_after - r.memory_before,
                        r.memory_peak,
                        r.success,
                    ]
                )

        print(f"\n📄 Reports saved:")
        print(f"   - phase3_performance_report.json (detailed)")
        print(f"   - phase3_performance_report.csv (summary)")


async def main():
    """Main benchmark function"""
    print(f"{Colors.BOLD}{Colors.PURPLE}")
    print("⚡ A1Betting Phase 3 Performance Benchmark Suite")
    print("Enterprise MLOps, Deployment, Monitoring & Security Performance Testing")
    print(f"{'='*70}{Colors.END}")

    benchmark = Phase3PerformanceBenchmark()
    benchmark.baseline_memory = benchmark.get_memory_usage()

    print(f"\n🖥️  System Information:")
    print(f"   CPU Cores: {psutil.cpu_count()}")
    print(
        f"   Total Memory: {psutil.virtual_memory().total / 1024 / 1024 / 1024:.1f} GB"
    )
    print(
        f"   Available Memory: {psutil.virtual_memory().available / 1024 / 1024 / 1024:.1f} GB"
    )
    print(f"   Baseline Memory Usage: {benchmark.baseline_memory:.1f} MB")

    try:
        # Add current directory to Python path
        sys.path.insert(0, str(Path.cwd()))

        # Run all benchmark suites
        await benchmark.benchmark_modern_ml_performance()
        await benchmark.benchmark_mlops_performance()
        await benchmark.benchmark_deployment_performance()
        await benchmark.benchmark_monitoring_performance()
        await benchmark.benchmark_security_performance()
        await benchmark.benchmark_integration_performance()

        # Analyze results
        benchmark.analyze_performance_patterns()

        # Save report
        benchmark.save_benchmark_report()

        # Final summary
        successful_count = len([r for r in benchmark.results if r.success])
        total_count = len(benchmark.results)
        success_rate = (successful_count / total_count * 100) if total_count > 0 else 0

        print(f"\n{Colors.BOLD}🏁 Benchmark Complete!{Colors.END}")
        print(
            f"   Success Rate: {Colors.GREEN if success_rate >= 90 else Colors.YELLOW if success_rate >= 70 else Colors.RED}{success_rate:.1f}%{Colors.END}"
        )
        print(f"   Total Benchmarks: {total_count}")
        print(f"   Final Memory Usage: {benchmark.get_memory_usage():.1f} MB")

        # Exit with appropriate code
        sys.exit(0 if success_rate >= 80 else 1)

    except Exception as e:
        print(f"\n{Colors.RED}❌ Benchmark failed with error: {str(e)}{Colors.END}")
        import traceback

        print(f"{Colors.RED}Traceback: {traceback.format_exc()}{Colors.END}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
