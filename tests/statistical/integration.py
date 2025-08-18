"""
Statistical Verification Suite Integration Script

This script provides easy integration and validation of the statistical verification suite.
It can be run standalone or integrated into existing test pipelines.
"""

import sys
import os
import subprocess
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional

class StatisticalVerificationIntegration:
    """
    Integration helper for the statistical verification suite
    """
    
    def __init__(self, project_root: Optional[str] = None):
        self.project_root = Path(project_root) if project_root else Path(__file__).parent.parent.parent
        self.tests_dir = self.project_root / "tests" / "statistical"
        self.results_dir = self.project_root / "statistical_verification_results"
        
        # Ensure results directory exists
        self.results_dir.mkdir(exist_ok=True)
    
    def check_dependencies(self) -> Dict[str, bool]:
        """Check if required dependencies are available"""
        
        print("🔍 Checking statistical verification dependencies...")
        
        dependencies = {
            'numpy': False,
            'scipy': False,
            'pytest': False,
            'pytest-json-report': False
        }
        
        for package in dependencies.keys():
            try:
                if package == 'pytest-json-report':
                    import pytest_jsonreport
                    dependencies[package] = True
                else:
                    __import__(package)
                    dependencies[package] = True
                print(f"   ✅ {package}")
            except ImportError:
                print(f"   ❌ {package} - missing")
        
        return dependencies
    
    def install_dependencies(self) -> bool:
        """Install missing dependencies"""
        
        print("📦 Installing statistical verification dependencies...")
        
        # Core packages needed for statistical verification
        packages = [
            'numpy>=1.20.0',
            'scipy>=1.7.0', 
            'pytest>=6.0.0',
            'pytest-json-report>=1.4.0',
            'pytest-xdist>=2.0.0'
        ]
        
        try:
            cmd = [sys.executable, "-m", "pip", "install"] + packages + ["--quiet"]
            subprocess.run(cmd, check=True, capture_output=True, text=True)
            print("   ✅ Dependencies installed successfully")
            return True
        except subprocess.CalledProcessError as e:
            print(f"   ❌ Failed to install dependencies: {e}")
            return False
    
    def validate_test_files(self) -> bool:
        """Validate that all required test files exist"""
        
        print("📋 Validating statistical test files...")
        
        required_files = [
            "test_monte_carlo_deterministic.py",
            "test_statistical_verification_suite.py", 
            "test_drift_injection.py",
            "conftest.py",
            "ci_runner.py"
        ]
        
        all_present = True
        for filename in required_files:
            filepath = self.tests_dir / filename
            if filepath.exists():
                print(f"   ✅ {filename}")
            else:
                print(f"   ❌ {filename} - missing")
                all_present = False
        
        return all_present
    
    def run_quick_validation(self) -> Dict[str, Any]:
        """Run quick validation of the statistical verification suite"""
        
        print("⚡ Running quick statistical verification validation...")
        
        # Set environment for quick testing
        env = os.environ.copy()
        env.update({
            'PYTEST_STATISTICAL_SEED': '42',
            'STATISTICAL_SAMPLE_SIZE': '1000',  # Small for quick test
            'STATISTICAL_TOLERANCE': '0.05',
            'STATISTICAL_STRICT_MODE': 'false'
        })
        
        # Run specific validation tests
        cmd = [
            sys.executable, "-m", "pytest",
            str(self.tests_dir / "test_statistical_verification_suite.py::TestDeterministicMonteCarlo::test_seed_reproducibility"),
            str(self.tests_dir / "test_statistical_verification_suite.py::TestKSTestRunner::test_ks_normal_distribution"),
            "-v", "--tb=short"
        ]
        
        try:
            result = subprocess.run(
                cmd, env=env, capture_output=True, text=True, timeout=120
            )
            
            return {
                'success': result.returncode == 0,
                'stdout': result.stdout,
                'stderr': result.stderr,
                'return_code': result.returncode,
                'duration': 'quick_test'
            }
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'error': 'Quick validation timed out',
                'return_code': -1
            }
    
    def run_full_verification(self) -> Dict[str, Any]:
        """Run complete statistical verification suite"""
        
        print("🔬 Running full statistical verification suite...")
        
        # Use the CI runner for comprehensive testing
        ci_runner_path = self.tests_dir / "ci_runner.py"
        
        if not ci_runner_path.exists():
            return {
                'success': False,
                'error': 'CI runner not found',
                'return_code': -1
            }
        
        try:
            result = subprocess.run([
                sys.executable, str(ci_runner_path), 
                "--workspace", str(self.project_root)
            ], capture_output=True, text=True, timeout=600)
            
            return {
                'success': result.returncode == 0,
                'stdout': result.stdout,
                'stderr': result.stderr,
                'return_code': result.returncode
            }
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'error': 'Full verification timed out after 10 minutes',
                'return_code': -1
            }
    
    def run_drift_injection_tests(self) -> Dict[str, Any]:
        """Run drift injection tests to validate alert systems"""
        
        print("🎯 Running drift injection validation tests...")
        
        cmd = [
            sys.executable, "-m", "pytest",
            str(self.tests_dir / "test_drift_injection.py"),
            "-v", "--tb=short", "-m", "statistical"
        ]
        
        env = os.environ.copy()
        env.update({
            'PYTEST_STATISTICAL_SEED': '42',
            'STATISTICAL_SAMPLE_SIZE': '5000'
        })
        
        try:
            result = subprocess.run(
                cmd, env=env, capture_output=True, text=True, timeout=300
            )
            
            return {
                'success': result.returncode == 0,
                'stdout': result.stdout,
                'stderr': result.stderr,
                'return_code': result.returncode
            }
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'error': 'Drift injection tests timed out',
                'return_code': -1
            }
    
    def generate_integration_report(self, results: Dict[str, Dict[str, Any]]) -> str:
        """Generate comprehensive integration report"""
        
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        report_path = self.results_dir / f"integration_report_{timestamp}.md"
        
        with open(report_path, 'w') as f:
            f.write("# Statistical Verification Suite Integration Report\n\n")
            f.write(f"**Generated:** {datetime.utcnow().isoformat()}\n")
            f.write(f"**Project Root:** {self.project_root}\n\n")
            
            # Overall status
            all_passed = all(result.get('success', False) for result in results.values())
            f.write(f"**Overall Status:** {'✅ PASSED' if all_passed else '❌ FAILED'}\n\n")
            
            # Individual test results
            f.write("## Test Results\n\n")
            
            for test_name, result in results.items():
                status = "✅ PASSED" if result.get('success', False) else "❌ FAILED"
                f.write(f"### {test_name.replace('_', ' ').title()}\n")
                f.write(f"**Status:** {status}\n")
                f.write(f"**Return Code:** {result.get('return_code', 'N/A')}\n")
                
                if result.get('error'):
                    f.write(f"**Error:** {result['error']}\n")
                
                f.write("\n")
                
                # Add stdout if available and not too long
                if result.get('stdout') and len(result['stdout']) < 2000:
                    f.write("**Output:**\n```\n")
                    f.write(result['stdout'][:1000])
                    if len(result['stdout']) > 1000:
                        f.write("\n... (truncated)")
                    f.write("\n```\n\n")
            
            # Integration recommendations
            f.write("## Integration Recommendations\n\n")
            
            if all_passed:
                f.write("🟢 **Ready for Integration**\n\n")
                f.write("The statistical verification suite is working correctly and ready for:\n")
                f.write("- CI/CD pipeline integration\n")
                f.write("- Automated statistical quality monitoring\n")
                f.write("- Production deployment validation\n\n")
                
                f.write("### Next Steps\n")
                f.write("1. Add statistical verification to your CI workflow\n")
                f.write("2. Configure alert thresholds for your specific requirements\n")
                f.write("3. Set up monitoring dashboards for statistical metrics\n")
                f.write("4. Establish baseline statistical profiles\n\n")
            else:
                f.write("🔴 **Integration Issues Detected**\n\n")
                f.write("Please address the following issues before integration:\n")
                
                failed_tests = [name for name, result in results.items() if not result.get('success', False)]
                for test_name in failed_tests:
                    f.write(f"- {test_name.replace('_', ' ').title()}\n")
                
                f.write("\n### Troubleshooting\n")
                f.write("1. Ensure all dependencies are installed correctly\n")
                f.write("2. Verify test files are present and accessible\n") 
                f.write("3. Check Python environment compatibility\n")
                f.write("4. Review error messages in test output\n\n")
            
            # Usage examples
            f.write("## Usage Examples\n\n")
            f.write("### Manual Testing\n")
            f.write("```bash\n")
            f.write("# Quick validation\n")
            f.write(f"python {self.tests_dir / 'integration.py'} --quick\n\n")
            f.write("# Full verification\n")
            f.write(f"python {self.tests_dir / 'integration.py'} --full\n\n")
            f.write("# Drift injection tests\n")
            f.write(f"python {self.tests_dir / 'integration.py'} --drift\n")
            f.write("```\n\n")
            
            f.write("### CI Integration\n")
            f.write("```bash\n")
            f.write("# In your CI pipeline\n")
            f.write(f"python {self.tests_dir / 'ci_runner.py'} --workspace .\n")
            f.write("```\n\n")
        
        print(f"📋 Integration report generated: {report_path}")
        return str(report_path)
    
    def run_complete_integration_check(self) -> bool:
        """Run complete integration validation"""
        
        print("🚀 Starting Statistical Verification Suite Integration Check")
        print("=" * 70)
        
        # Step 1: Check dependencies
        dependencies = self.check_dependencies()
        missing_deps = [pkg for pkg, available in dependencies.items() if not available]
        
        if missing_deps:
            print(f"❌ Missing dependencies: {missing_deps}")
            if input("Install missing dependencies? (y/n): ").lower().startswith('y'):
                if not self.install_dependencies():
                    print("❌ Failed to install dependencies")
                    return False
            else:
                print("❌ Cannot proceed without dependencies")
                return False
        
        # Step 2: Validate test files
        if not self.validate_test_files():
            print("❌ Missing required test files")
            return False
        
        # Step 3: Run test suite
        results = {}
        
        # Quick validation
        print("\n" + "="*50)
        results['quick_validation'] = self.run_quick_validation()
        
        if results['quick_validation']['success']:
            # Full verification
            print("\n" + "="*50)  
            results['full_verification'] = self.run_full_verification()
            
            # Drift injection tests
            print("\n" + "="*50)
            results['drift_injection'] = self.run_drift_injection_tests()
        else:
            print("❌ Quick validation failed, skipping comprehensive tests")
        
        # Step 4: Generate report
        print("\n" + "="*50)
        report_path = self.generate_integration_report(results)
        
        # Summary
        print("=" * 70)
        success_count = sum(1 for result in results.values() if result.get('success', False))
        total_count = len(results)
        
        overall_success = success_count == total_count and success_count > 0
        
        if overall_success:
            print("🟢 Statistical Verification Suite Integration: SUCCESS")
            print(f"   All {total_count} validation checks passed")
            print("   Ready for CI/CD integration")
        else:
            print("🔴 Statistical Verification Suite Integration: FAILED")
            print(f"   {success_count}/{total_count} validation checks passed")
            print("   Please review integration report for details")
        
        print(f"📋 Detailed report: {report_path}")
        return overall_success


def main():
    """Main entry point for statistical verification integration"""
    
    import argparse
    
    parser = argparse.ArgumentParser(description="Statistical Verification Suite Integration")
    parser.add_argument("--project-root", help="Project root directory")
    parser.add_argument("--quick", action="store_true", help="Run quick validation only")
    parser.add_argument("--full", action="store_true", help="Run full verification only") 
    parser.add_argument("--drift", action="store_true", help="Run drift injection tests only")
    parser.add_argument("--check-deps", action="store_true", help="Check dependencies only")
    parser.add_argument("--install-deps", action="store_true", help="Install dependencies")
    
    args = parser.parse_args()
    
    integration = StatisticalVerificationIntegration(args.project_root)
    
    if args.check_deps:
        dependencies = integration.check_dependencies()
        missing = [pkg for pkg, available in dependencies.items() if not available]
        if missing:
            print(f"Missing dependencies: {missing}")
            sys.exit(1)
        else:
            print("All dependencies available")
            sys.exit(0)
    
    if args.install_deps:
        success = integration.install_dependencies()
        sys.exit(0 if success else 1)
    
    if args.quick:
        result = integration.run_quick_validation()
        print("Quick validation:", "PASSED" if result['success'] else "FAILED")
        sys.exit(0 if result['success'] else 1)
    
    if args.full:
        result = integration.run_full_verification() 
        print("Full verification:", "PASSED" if result['success'] else "FAILED")
        sys.exit(0 if result['success'] else 1)
    
    if args.drift:
        result = integration.run_drift_injection_tests()
        print("Drift injection tests:", "PASSED" if result['success'] else "FAILED")
        sys.exit(0 if result['success'] else 1)
    
    # Run complete integration check
    success = integration.run_complete_integration_check()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()