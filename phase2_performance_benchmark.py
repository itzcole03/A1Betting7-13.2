"""
Phase 2 Performance Benchmark Test

This script tests the performance improvements of Phase 2 optimizations:
- Inference speed comparison
- Memory usage analysis
- Cache hit rate evaluation
- Throughput benchmarking
"""

import asyncio
import json
import statistics
import time
from datetime import datetime
from typing import Any, Dict, List

import requests


class PerformanceBenchmark:
    """Benchmark Phase 2 performance improvements"""

    def __init__(self, base_url: str = "http://127.0.0.1:8000"):
        self.base_url = base_url
        self.results = {"baseline": {}, "optimized": {}, "comparison": {}}

    def generate_test_request(self, player_idx: int) -> Dict[str, Any]:
        """Generate test prediction request"""
        players = ["Aaron Judge", "Mookie Betts", "Mike Trout", "Ronald Acuna Jr."]
        teams = ["NYY", "LAD", "LAA", "ATL"]
        opponents = ["BOS", "SFG", "HOU", "NYM"]

        return {
            "data": {
                "player_name": players[player_idx % len(players)],
                "team": teams[player_idx % len(teams)],
                "opponent_team": opponents[player_idx % len(opponents)],
                "line_score": 2.5 + (player_idx % 3) * 0.5,
                "historical_data": [{"stat": i} for i in range(10)],
                "team_data": {"win_rate": 0.6 + (player_idx % 10) * 0.02},
                "opponent_data": {"win_rate": 0.5 + (player_idx % 8) * 0.02},
                "game_context": {
                    "home_game": player_idx % 2 == 0,
                    "temperature": 70 + (player_idx % 20),
                },
            },
            "sport": "MLB",
            "prop_type": "home_runs",
        }

    async def benchmark_baseline_prediction(
        self, num_requests: int = 100
    ) -> Dict[str, Any]:
        """Benchmark baseline prediction endpoint"""
        print(f"Benchmarking baseline predictions ({num_requests} requests)...")

        latencies = []
        successful_requests = 0

        start_time = time.time()

        for i in range(num_requests):
            request_data = self.generate_test_request(i)

            try:
                response = requests.post(
                    f"{self.base_url}/api/unified/batch-predictions",
                    json={"requests": [request_data]},
                    timeout=10,
                )

                if response.status_code == 200:
                    successful_requests += 1
                    # Estimate latency (simplified)
                    latencies.append(response.elapsed.total_seconds() * 1000)

            except Exception as e:
                print(f"Baseline request {i} failed: {e}")

        total_time = time.time() - start_time

        return {
            "total_requests": num_requests,
            "successful_requests": successful_requests,
            "total_time_seconds": total_time,
            "throughput_rps": successful_requests / total_time if total_time > 0 else 0,
            "average_latency_ms": statistics.mean(latencies) if latencies else 0,
            "median_latency_ms": statistics.median(latencies) if latencies else 0,
            "p95_latency_ms": (
                statistics.quantiles(latencies, n=20)[18] if len(latencies) > 20 else 0
            ),
            "success_rate": successful_requests / num_requests,
        }

    async def benchmark_optimized_prediction(
        self, num_requests: int = 100
    ) -> Dict[str, Any]:
        """Benchmark optimized prediction endpoint"""
        print(f"Benchmarking optimized predictions ({num_requests} requests)...")

        latencies = []
        successful_requests = 0
        cached_responses = 0

        start_time = time.time()

        for i in range(num_requests):
            request_data = self.generate_test_request(i)

            try:
                response = requests.post(
                    f"{self.base_url}/api/modern-ml/phase2/optimized-prediction",
                    json=request_data,
                    timeout=10,
                )

                if response.status_code == 200:
                    successful_requests += 1
                    latencies.append(response.elapsed.total_seconds() * 1000)

                    # Check if response was cached
                    response_data = response.json()
                    if response_data.get("optimization_metadata", {}).get(
                        "cached", False
                    ):
                        cached_responses += 1

            except Exception as e:
                print(f"Optimized request {i} failed: {e}")

        total_time = time.time() - start_time

        return {
            "total_requests": num_requests,
            "successful_requests": successful_requests,
            "cached_responses": cached_responses,
            "total_time_seconds": total_time,
            "throughput_rps": successful_requests / total_time if total_time > 0 else 0,
            "average_latency_ms": statistics.mean(latencies) if latencies else 0,
            "median_latency_ms": statistics.median(latencies) if latencies else 0,
            "p95_latency_ms": (
                statistics.quantiles(latencies, n=20)[18] if len(latencies) > 20 else 0
            ),
            "success_rate": successful_requests / num_requests,
            "cache_hit_rate": (
                cached_responses / successful_requests if successful_requests > 0 else 0
            ),
        }

    def get_system_stats(self) -> Dict[str, Any]:
        """Get current system statistics"""
        try:
            # Get Phase 2 optimization stats
            response = requests.get(
                f"{self.base_url}/api/modern-ml/phase2/optimization-stats"
            )
            if response.status_code == 200:
                return response.json()

        except Exception as e:
            print(f"Error getting system stats: {e}")

        return {}

    def get_health_status(self) -> Dict[str, Any]:
        """Get Phase 2 health status"""
        try:
            response = requests.get(f"{self.base_url}/api/modern-ml/phase2/health")
            if response.status_code == 200:
                return response.json()

        except Exception as e:
            print(f"Error getting health status: {e}")

        return {"phase2_available": False}

    async def run_comprehensive_benchmark(
        self, baseline_requests: int = 50, optimized_requests: int = 50
    ) -> Dict[str, Any]:
        """Run comprehensive performance benchmark"""
        print("Starting comprehensive performance benchmark...")

        # Check system health first
        health = self.get_health_status()
        print(f"Phase 2 Health Status: {health}")

        # Get initial system stats
        initial_stats = self.get_system_stats()
        print(f"Initial System Stats: {json.dumps(initial_stats, indent=2)}")

        # Run baseline benchmark
        print("\n" + "=" * 50)
        self.results["baseline"] = await self.benchmark_baseline_prediction(
            baseline_requests
        )

        # Start Phase 2 services if not running
        if not health.get("phase2_available", False):
            print("\nStarting Phase 2 optimization services...")
            try:
                response = requests.post(
                    f"{self.base_url}/api/modern-ml/phase2/start-optimization"
                )
                if response.status_code == 202:
                    print("Phase 2 services starting...")
                    await asyncio.sleep(5)  # Wait for services to start
                else:
                    print(f"Failed to start Phase 2 services: {response.text}")
            except Exception as e:
                print(f"Error starting Phase 2 services: {e}")

        # Run optimized benchmark
        print("\n" + "=" * 50)
        self.results["optimized"] = await self.benchmark_optimized_prediction(
            optimized_requests
        )

        # Get final system stats
        final_stats = self.get_system_stats()

        # Calculate comparisons
        self.results["comparison"] = self.calculate_performance_comparison()

        # Add system information
        self.results["system_info"] = {
            "initial_stats": initial_stats,
            "final_stats": final_stats,
            "health_status": health,
            "timestamp": datetime.now().isoformat(),
        }

        return self.results

    def calculate_performance_comparison(self) -> Dict[str, Any]:
        """Calculate performance improvements"""
        baseline = self.results["baseline"]
        optimized = self.results["optimized"]

        if not baseline or not optimized:
            return {"error": "Missing benchmark data"}

        # Calculate improvements
        throughput_improvement = (
            (optimized["throughput_rps"] - baseline["throughput_rps"])
            / baseline["throughput_rps"]
            * 100
            if baseline["throughput_rps"] > 0
            else 0
        )

        latency_improvement = (
            (baseline["average_latency_ms"] - optimized["average_latency_ms"])
            / baseline["average_latency_ms"]
            * 100
            if baseline["average_latency_ms"] > 0
            else 0
        )

        p95_latency_improvement = (
            (baseline["p95_latency_ms"] - optimized["p95_latency_ms"])
            / baseline["p95_latency_ms"]
            * 100
            if baseline["p95_latency_ms"] > 0
            else 0
        )

        return {
            "throughput_improvement_percent": round(throughput_improvement, 2),
            "average_latency_improvement_percent": round(latency_improvement, 2),
            "p95_latency_improvement_percent": round(p95_latency_improvement, 2),
            "cache_hit_rate": optimized.get("cache_hit_rate", 0),
            "baseline_throughput_rps": baseline["throughput_rps"],
            "optimized_throughput_rps": optimized["throughput_rps"],
            "baseline_avg_latency_ms": baseline["average_latency_ms"],
            "optimized_avg_latency_ms": optimized["average_latency_ms"],
            "performance_summary": self.generate_performance_summary(
                throughput_improvement,
                latency_improvement,
                optimized.get("cache_hit_rate", 0),
            ),
        }

    def generate_performance_summary(
        self,
        throughput_improvement: float,
        latency_improvement: float,
        cache_hit_rate: float,
    ) -> str:
        """Generate human-readable performance summary"""
        summary = []

        if throughput_improvement > 10:
            summary.append(f"🚀 Throughput improved by {throughput_improvement:.1f}%")
        elif throughput_improvement > 0:
            summary.append(
                f"⬆️ Modest throughput improvement of {throughput_improvement:.1f}%"
            )
        else:
            summary.append(
                f"⚠️ Throughput decreased by {abs(throughput_improvement):.1f}%"
            )

        if latency_improvement > 10:
            summary.append(f"⚡ Latency reduced by {latency_improvement:.1f}%")
        elif latency_improvement > 0:
            summary.append(
                f"✅ Slight latency improvement of {latency_improvement:.1f}%"
            )
        else:
            summary.append(f"❌ Latency increased by {abs(latency_improvement):.1f}%")

        if cache_hit_rate > 0.3:
            summary.append(
                f"💾 Good cache performance with {cache_hit_rate:.1%} hit rate"
            )
        elif cache_hit_rate > 0:
            summary.append(f"📊 Cache hit rate: {cache_hit_rate:.1%}")
        else:
            summary.append("🔍 No cache hits detected")

        return " | ".join(summary)

    def print_results(self):
        """Print formatted benchmark results"""
        print("\n" + "=" * 70)
        print("PERFORMANCE BENCHMARK RESULTS")
        print("=" * 70)

        if "baseline" in self.results:
            print("\nBASELINE PERFORMANCE:")
            baseline = self.results["baseline"]
            print(f"  Throughput: {baseline['throughput_rps']:.2f} requests/second")
            print(f"  Avg Latency: {baseline['average_latency_ms']:.2f} ms")
            print(f"  P95 Latency: {baseline['p95_latency_ms']:.2f} ms")
            print(f"  Success Rate: {baseline['success_rate']:.1%}")

        if "optimized" in self.results:
            print("\nOPTIMIZED PERFORMANCE:")
            optimized = self.results["optimized"]
            print(f"  Throughput: {optimized['throughput_rps']:.2f} requests/second")
            print(f"  Avg Latency: {optimized['average_latency_ms']:.2f} ms")
            print(f"  P95 Latency: {optimized['p95_latency_ms']:.2f} ms")
            print(f"  Success Rate: {optimized['success_rate']:.1%}")
            print(f"  Cache Hit Rate: {optimized.get('cache_hit_rate', 0):.1%}")

        if "comparison" in self.results:
            print("\nPERFORMANCE COMPARISON:")
            comparison = self.results["comparison"]
            print(
                f"  {comparison.get('performance_summary', 'No comparison available')}"
            )
            print(
                f"  Throughput Improvement: {comparison.get('throughput_improvement_percent', 0):.2f}%"
            )
            print(
                f"  Latency Improvement: {comparison.get('average_latency_improvement_percent', 0):.2f}%"
            )

        print("\n" + "=" * 70)

    def save_results(self, filename: str = None):
        """Save benchmark results to file"""
        if filename is None:
            filename = (
                f"phase2_benchmark_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            )

        with open(filename, "w") as f:
            json.dump(self.results, f, indent=2, default=str)

        print(f"Results saved to: {filename}")


async def main():
    """Run the performance benchmark"""
    benchmark = PerformanceBenchmark()

    try:
        # Run comprehensive benchmark
        results = await benchmark.run_comprehensive_benchmark(
            baseline_requests=25,  # Smaller numbers for faster testing
            optimized_requests=25,
        )

        # Print results
        benchmark.print_results()

        # Save results
        benchmark.save_results()

        return results

    except Exception as e:
        print(f"Benchmark failed: {e}")
        return None


if __name__ == "__main__":
    asyncio.run(main())
