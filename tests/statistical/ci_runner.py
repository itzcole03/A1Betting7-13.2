"""
CI/CD Integration for Statistical Verification Suite

This module provides GitHub Actions workflow integration and build failure 
mechanisms for the statistical verification suite.
"""

import json
import os
import sys
import subprocess
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime

class CIStatisticalRunner:
    """
    Runner for statistical verification suite in CI/CD environments
    """
    
    def __init__(self, workspace_path: Optional[str] = None):
        self.workspace_path = Path(workspace_path) if workspace_path else Path.cwd()
        self.results_dir = self.workspace_path / "statistical_test_results"
        self.results_dir.mkdir(exist_ok=True)
        
    def setup_environment(self) -> bool:
        """Setup CI environment for statistical testing"""
        
        print("🔧 Setting up statistical testing environment...")
        
        # Check Python version
        python_version = sys.version_info
        print(f"   Python version: {python_version.major}.{python_version.minor}.{python_version.micro}")
        
        # Check for required packages
        required_packages = ['numpy', 'scipy', 'pytest']
        missing_packages = []
        
        for package in required_packages:
            try:
                __import__(package)
                print(f"   ✅ {package} available")
            except ImportError:
                missing_packages.append(package)
                print(f"   ❌ {package} missing")
        
        if missing_packages:
            print(f"⚠️  Missing packages: {missing_packages}")
            print("   Installing missing packages...")
            
            try:
                subprocess.check_call([
                    sys.executable, "-m", "pip", "install", 
                    *missing_packages, "--quiet"
                ])
                print("   ✅ Packages installed successfully")
                return True
            except subprocess.CalledProcessError as e:
                print(f"   ❌ Failed to install packages: {e}")
                return False
        
        return True
    
    def run_statistical_tests(self) -> Dict[str, Any]:
        """Run statistical verification tests"""
        
        print("📊 Running statistical verification tests...")
        
        # Set environment variables for deterministic testing
        env = os.environ.copy()
        env.update({
            'PYTEST_STATISTICAL_SEED': str(42),
            'STATISTICAL_SAMPLE_SIZE': str(50000),  # Larger for CI
            'STATISTICAL_TOLERANCE': str(0.01),     # Stricter for CI
            'STATISTICAL_STRICT_MODE': 'true'
        })
        
        # Run pytest with specific markers
        test_dir = self.workspace_path / "tests" / "statistical"
        cmd = [
            sys.executable, "-m", "pytest", 
            str(test_dir),
            "-m", "statistical",
            "--tb=short",
            "-v",
            "--json-report",
            f"--json-report-file={self.results_dir / 'pytest_results.json'}"
        ]
        
        try:
            result = subprocess.run(
                cmd, 
                env=env,
                capture_output=True, 
                text=True, 
                timeout=600  # 10 minute timeout
            )
            
            # Parse results
            results = {
                'success': result.returncode == 0,
                'return_code': result.returncode,
                'stdout': result.stdout,
                'stderr': result.stderr,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            # Try to load JSON report if available
            json_report_path = self.results_dir / 'pytest_results.json'
            if json_report_path.exists():
                try:
                    with open(json_report_path) as f:
                        pytest_json = json.load(f)
                        results['pytest_summary'] = pytest_json.get('summary', {})
                        results['test_details'] = pytest_json.get('tests', [])
                except Exception as e:
                    results['json_parse_error'] = str(e)
            
            return results
            
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'error': 'Statistical tests timed out after 10 minutes',
                'timestamp': datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }
    
    def generate_ci_report(self, test_results: Dict[str, Any]) -> str:
        """Generate CI-friendly test report"""
        
        report_path = self.results_dir / "ci_statistical_report.md"
        
        with open(report_path, 'w') as f:
            f.write("# Statistical Verification Report\n\n")
            f.write(f"**Timestamp:** {test_results.get('timestamp', 'N/A')}\n")
            f.write(f"**Status:** {'✅ PASS' if test_results['success'] else '❌ FAIL'}\n\n")
            
            if 'pytest_summary' in test_results:
                summary = test_results['pytest_summary']
                f.write("## Test Summary\n\n")
                f.write(f"- **Total:** {summary.get('total', 'N/A')}\n")
                f.write(f"- **Passed:** {summary.get('passed', 'N/A')}\n")
                f.write(f"- **Failed:** {summary.get('failed', 'N/A')}\n")
                f.write(f"- **Skipped:** {summary.get('skipped', 'N/A')}\n")
                f.write(f"- **Duration:** {summary.get('duration', 'N/A')}s\n\n")
            
            if 'test_details' in test_results:
                failed_tests = [t for t in test_results['test_details'] if t.get('outcome') == 'failed']
                if failed_tests:
                    f.write("## Failed Tests\n\n")
                    for test in failed_tests:
                        f.write(f"### {test.get('nodeid', 'Unknown Test')}\n")
                        f.write(f"**Error:** {test.get('call', {}).get('longrepr', 'N/A')}\n\n")
            
            if test_results.get('error'):
                f.write(f"## Error Details\n\n")
                f.write(f"```\n{test_results['error']}\n```\n\n")
            
            if not test_results['success']:
                f.write("## Build Recommendation\n\n")
                f.write("🔴 **FAIL BUILD** - Statistical verification failed\n\n")
                f.write("The statistical verification suite has detected issues that require attention:\n")
                f.write("- Monte Carlo simulations may not be converging properly\n")
                f.write("- Statistical distributions may have shifted from expected baselines\n")
                f.write("- Correlation matrices may be exhibiting drift or numerical instability\n")
                f.write("- Confidence intervals may have regressed in quality\n\n")
                f.write("Please review the test output and address any statistical anomalies before merging.\n")
            else:
                f.write("## Build Recommendation\n\n")
                f.write("🟢 **PASS BUILD** - Statistical verification successful\n\n")
                f.write("All statistical verification tests have passed, indicating:\n")
                f.write("- Monte Carlo simulations are producing expected results\n")
                f.write("- Statistical distributions match analytic baselines\n")
                f.write("- Correlation matrices are stable and well-conditioned\n")
                f.write("- Confidence intervals maintain expected quality\n")
        
        print(f"📋 CI report generated: {report_path}")
        return str(report_path)
    
    def set_github_outputs(self, test_results: Dict[str, Any]):
        """Set GitHub Actions outputs"""
        
        if 'GITHUB_OUTPUT' in os.environ:
            with open(os.environ['GITHUB_OUTPUT'], 'a') as f:
                f.write(f"statistical_tests_passed={str(test_results['success']).lower()}\n")
                f.write(f"statistical_tests_timestamp={test_results.get('timestamp', '')}\n")
                
                if 'pytest_summary' in test_results:
                    summary = test_results['pytest_summary']
                    f.write(f"total_tests={summary.get('total', 0)}\n")
                    f.write(f"passed_tests={summary.get('passed', 0)}\n")
                    f.write(f"failed_tests={summary.get('failed', 0)}\n")
                    f.write(f"test_duration={summary.get('duration', 0)}\n")
                
                # Set build failure flag
                f.write(f"should_fail_build={str(not test_results['success']).lower()}\n")
            
            print("🔗 GitHub Actions outputs set")
    
    def run_ci_pipeline(self) -> bool:
        """Run complete CI statistical verification pipeline"""
        
        print("🚀 Starting CI Statistical Verification Pipeline")
        print("=" * 60)
        
        try:
            # Step 1: Setup environment
            if not self.setup_environment():
                print("❌ Environment setup failed")
                return False
            
            # Step 2: Run tests
            test_results = self.run_statistical_tests()
            
            # Step 3: Generate report
            report_path = self.generate_ci_report(test_results)
            
            # Step 4: Set GitHub outputs
            self.set_github_outputs(test_results)
            
            # Step 5: Save complete results
            results_file = self.results_dir / "complete_ci_results.json"
            with open(results_file, 'w') as f:
                json.dump(test_results, f, indent=2, default=str)
            
            print("=" * 60)
            if test_results['success']:
                print("🟢 Statistical Verification: PASSED")
                print(f"📁 Results saved to: {self.results_dir}")
                print(f"📋 Report available at: {report_path}")
                return True
            else:
                print("🔴 Statistical Verification: FAILED")
                print(f"📁 Results saved to: {self.results_dir}")
                print(f"📋 Report available at: {report_path}")
                print("💥 BUILD SHOULD FAIL")
                return False
                
        except Exception as e:
            print(f"💥 CI Pipeline failed with error: {e}")
            return False


def main():
    """Main entry point for CI statistical verification"""
    
    import argparse
    
    parser = argparse.ArgumentParser(description="Run statistical verification suite in CI")
    parser.add_argument("--workspace", default=".", help="Workspace directory")
    parser.add_argument("--setup-only", action="store_true", help="Only setup environment")
    parser.add_argument("--tests-only", action="store_true", help="Only run tests")
    args = parser.parse_args()
    
    runner = CIStatisticalRunner(args.workspace)
    
    if args.setup_only:
        success = runner.setup_environment()
        sys.exit(0 if success else 1)
    
    if args.tests_only:
        results = runner.run_statistical_tests()
        sys.exit(0 if results['success'] else 1)
    
    # Run full pipeline
    success = runner.run_ci_pipeline()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()