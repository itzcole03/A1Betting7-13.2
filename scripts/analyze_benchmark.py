#!/usr/bin/env python3
"""
A1Betting Benchmark Analysis Script
==================================

Analyzes smoke test results for performance benchmarks and generates reports.
Part of Epic 7 implementation for cross-platform CI integration.
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Dict, Any, List, Optional


class BenchmarkAnalyzer:
    """Analyzes performance benchmarks from smoke test results"""
    
    def __init__(self):
        # Performance thresholds
        self.thresholds = {
            "max_response_time_ms": 2000,  # 2 seconds max for any endpoint
            "avg_response_time_ms": 500,   # 500ms average
            "min_success_rate": 95.0,      # 95% success rate minimum
            "max_error_rate": 5.0          # 5% error rate maximum
        }
    
    def analyze_results(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze smoke test results for performance issues"""
        
        analysis = {
            "timestamp": results.get("timestamp"),
            "platform": results.get("platform", {}),
            "performance_summary": {},
            "threshold_violations": [],
            "recommendations": [],
            "overall_status": "PASS"
        }
        
        # Extract performance metrics
        perf_metrics = results.get("performance_metrics", {})
        
        # Analyze overall performance
        avg_response_time = perf_metrics.get("avg_response_time_ms", 0)
        max_response_time = perf_metrics.get("max_response_time_ms", 0)
        error_rate = perf_metrics.get("error_rate", 0)
        
        analysis["performance_summary"] = {
            "avg_response_time_ms": avg_response_time,
            "max_response_time_ms": max_response_time,
            "error_rate_percent": error_rate,
            "total_requests": len(perf_metrics.get("response_times", []))
        }
        
        # Check threshold violations
        if avg_response_time > self.thresholds["avg_response_time_ms"]:
            analysis["threshold_violations"].append({
                "metric": "avg_response_time_ms",
                "value": avg_response_time,
                "threshold": self.thresholds["avg_response_time_ms"],
                "severity": "WARNING" if avg_response_time < self.thresholds["avg_response_time_ms"] * 2 else "CRITICAL"
            })
        
        if max_response_time > self.thresholds["max_response_time_ms"]:
            analysis["threshold_violations"].append({
                "metric": "max_response_time_ms",
                "value": max_response_time,
                "threshold": self.thresholds["max_response_time_ms"],
                "severity": "CRITICAL"
            })
        
        if error_rate > self.thresholds["max_error_rate"]:
            analysis["threshold_violations"].append({
                "metric": "error_rate_percent",
                "value": error_rate,
                "threshold": self.thresholds["max_error_rate"],
                "severity": "CRITICAL"
            })
        
        # Analyze individual test performance
        test_results = results.get("test_results", [])
        slow_tests = []
        
        for test in test_results:
            details = test.get("details", {})
            
            # Check for slow individual tests
            if isinstance(details, dict):
                response_time = details.get("response_time_ms", 0)
                if response_time > 1000:  # 1 second threshold for individual tests
                    slow_tests.append({
                        "test_name": test.get("test_name"),
                        "response_time_ms": response_time
                    })
                
                # Check benchmark results
                if test.get("test_name") == "performance_benchmark":
                    benchmarks = details.get("details", {}).get("benchmarks", [])
                    for benchmark in benchmarks:
                        if benchmark.get("success_rate_percent", 100) < self.thresholds["min_success_rate"]:
                            analysis["threshold_violations"].append({
                                "metric": "success_rate_percent",
                                "endpoint": benchmark.get("endpoint"),
                                "value": benchmark["success_rate_percent"],
                                "threshold": self.thresholds["min_success_rate"],
                                "severity": "WARNING"
                            })
        
        if slow_tests:
            analysis["slow_tests"] = slow_tests
        
        # Generate recommendations
        analysis["recommendations"] = self.generate_recommendations(analysis)
        
        # Determine overall status
        critical_violations = [v for v in analysis["threshold_violations"] if v["severity"] == "CRITICAL"]
        warning_violations = [v for v in analysis["threshold_violations"] if v["severity"] == "WARNING"]
        
        if critical_violations:
            analysis["overall_status"] = "FAIL"
        elif warning_violations:
            analysis["overall_status"] = "WARNING"
        else:
            analysis["overall_status"] = "PASS"
        
        return analysis
    
    def generate_recommendations(self, analysis: Dict[str, Any]) -> List[str]:
        """Generate performance improvement recommendations"""
        recommendations = []
        
        violations = analysis["threshold_violations"]
        
        for violation in violations:
            metric = violation["metric"]
            
            if metric == "avg_response_time_ms":
                recommendations.append(
                    "Consider optimizing database queries and implementing response caching"
                )
            elif metric == "max_response_time_ms":
                recommendations.append(
                    "Investigate slow endpoints and consider implementing timeout handling"
                )
            elif metric == "error_rate_percent":
                recommendations.append(
                    "Review error logs and improve error handling and retry mechanisms"
                )
            elif metric == "success_rate_percent":
                endpoint = violation.get("endpoint", "unknown")
                recommendations.append(
                    f"Investigate reliability issues with endpoint: {endpoint}"
                )
        
        # Platform-specific recommendations
        platform = analysis.get("platform", {}).get("system", "")
        if platform == "Windows" and analysis["performance_summary"]["avg_response_time_ms"] > 300:
            recommendations.append(
                "Windows platform detected - consider Windows-specific performance optimizations"
            )
        
        return list(set(recommendations))  # Remove duplicates
    
    def format_report(self, analysis: Dict[str, Any], format_type: str = "text") -> str:
        """Format analysis results into various output formats"""
        
        if format_type == "json":
            return json.dumps(analysis, indent=2)
        
        elif format_type == "text":
            platform = analysis.get("platform", {})
            perf = analysis["performance_summary"]
            
            report = f"""
🔍 A1Betting Performance Analysis Report
=======================================
Platform: {platform.get('system', 'Unknown')} {platform.get('release', '')}
Timestamp: {analysis.get('timestamp', 'Unknown')}
Status: {analysis['overall_status']}

📊 Performance Summary:
- Average Response Time: {perf['avg_response_time_ms']}ms
- Maximum Response Time: {perf['max_response_time_ms']}ms
- Error Rate: {perf['error_rate_percent']}%
- Total Requests: {perf['total_requests']}

"""
            
            violations = analysis["threshold_violations"]
            if violations:
                report += "⚠️ Threshold Violations:\n"
                for violation in violations:
                    severity_icon = "🚨" if violation["severity"] == "CRITICAL" else "⚠️"
                    report += f"{severity_icon} {violation['metric']}: {violation['value']} "
                    report += f"(threshold: {violation['threshold']})\n"
                    if "endpoint" in violation:
                        report += f"   Endpoint: {violation['endpoint']}\n"
                report += "\n"
            else:
                report += "✅ No threshold violations detected\n\n"
            
            slow_tests = analysis.get("slow_tests", [])
            if slow_tests:
                report += "🐌 Slow Tests:\n"
                for test in slow_tests:
                    report += f"- {test['test_name']}: {test['response_time_ms']}ms\n"
                report += "\n"
            
            recommendations = analysis["recommendations"]
            if recommendations:
                report += "💡 Recommendations:\n"
                for i, rec in enumerate(recommendations, 1):
                    report += f"{i}. {rec}\n"
            else:
                report += "✅ No performance recommendations - system is performing well!\n"
            
            return report
        
        else:
            return self.format_report(analysis, "text")


def main():
    parser = argparse.ArgumentParser(description="A1Betting Benchmark Analysis")
    parser.add_argument("results_file", help="Path to smoke test results JSON file")
    parser.add_argument("--format", choices=["text", "json"], default="text",
                       help="Output format")
    parser.add_argument("--output", type=str, help="Output file (default: stdout)")
    parser.add_argument("--fail-on-violations", action="store_true",
                       help="Exit with error code if violations are found")
    parser.add_argument("--thresholds", type=str,
                       help="JSON file with custom performance thresholds")
    
    args = parser.parse_args()
    
    # Load results file
    try:
        with open(args.results_file, 'r') as f:
            results = json.load(f)
    except FileNotFoundError:
        print(f"❌ Results file not found: {args.results_file}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in results file: {e}")
        sys.exit(1)
    
    # Initialize analyzer
    analyzer = BenchmarkAnalyzer()
    
    # Load custom thresholds if provided
    if args.thresholds:
        try:
            with open(args.thresholds, 'r') as f:
                custom_thresholds = json.load(f)
                analyzer.thresholds.update(custom_thresholds)
        except Exception as e:
            print(f"⚠️ Warning: Could not load custom thresholds: {e}")
    
    # Analyze results
    analysis = analyzer.analyze_results(results)
    
    # Format report
    report = analyzer.format_report(analysis, args.format)
    
    # Output report
    if args.output:
        with open(args.output, 'w') as f:
            f.write(report)
        print(f"📁 Analysis report written to {args.output}")
    else:
        print(report)
    
    # Exit with appropriate code
    if args.fail_on_violations:
        if analysis["overall_status"] == "FAIL":
            print("❌ Critical performance violations detected!")
            sys.exit(1)
        elif analysis["overall_status"] == "WARNING":
            print("⚠️ Performance warnings detected!")
            sys.exit(2)
    
    print(f"✅ Analysis complete - Status: {analysis['overall_status']}")
    sys.exit(0)


if __name__ == "__main__":
    main()