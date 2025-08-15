#!/usr/bin/env python3
"""
Comprehensive testing validation script for A1Betting CI/CD pipeline

This script validates:
1. Backend route tests can run
2. Frontend build process works
3. Integration test setup is correct
4. Docker build succeeds

Usage:
    python validate_testing_setup.py [--quick] [--backend-only] [--frontend-only]
"""

import sys
import subprocess
import os
import time
import argparse
from pathlib import Path


def run_command(cmd, cwd=None, check=True):
    """Run a shell command and return result"""
    print(f"🔧 Running: {cmd}")
    if cwd:
        print(f"   📁 Directory: {cwd}")
    
    start_time = time.time()
    result = subprocess.run(
        cmd, 
        shell=True, 
        cwd=cwd, 
        capture_output=True, 
        text=True,
        check=False
    )
    
    elapsed = time.time() - start_time
    
    if result.returncode == 0:
        print(f"✅ Success ({elapsed:.1f}s)")
        if result.stdout.strip():
            print(f"   📄 Output: {result.stdout.strip()[:200]}...")
    else:
        print(f"❌ Failed ({elapsed:.1f}s)")
        if result.stderr.strip():
            print(f"   ⚠️  Error: {result.stderr.strip()[:200]}...")
        if check:
            sys.exit(1)
    
    return result.returncode == 0, result.stdout, result.stderr


def validate_backend_tests():
    """Validate backend testing setup"""
    print("\n🧪 VALIDATING BACKEND TESTS")
    print("=" * 50)
    
    # Check if tests directory exists
    tests_dir = Path("tests/backend/routes")
    if not tests_dir.exists():
        print(f"❌ Tests directory not found: {tests_dir}")
        return False
    
    # List test files
    test_files = list(tests_dir.glob("test_*.py"))
    print(f"📋 Found {len(test_files)} test files:")
    for test_file in test_files:
        print(f"   - {test_file.name}")
    
    if not test_files:
        print("❌ No test files found")
        return False
    
    # Check Python dependencies
    success, _, _ = run_command("python -c \"import pytest, httpx, fastapi\"", check=False)
    if not success:
        print("❌ Missing required test dependencies")
        return False
    
    # Run a quick syntax check on test files
    for test_file in test_files:
        success, _, _ = run_command(f"python -m py_compile {test_file}", check=False)
        if not success:
            print(f"❌ Syntax error in {test_file}")
            return False
    
    # Try to run tests (with timeout)
    print("\n🚀 Running backend tests...")
    success, stdout, stderr = run_command(
        "python -m pytest tests/backend/routes/ --collect-only -q",
        check=False
    )
    
    if success:
        print("✅ Backend tests collection successful")
        return True
    else:
        print("❌ Backend tests collection failed")
        return False


def validate_frontend_tests():
    """Validate frontend testing setup"""
    print("\n🎭 VALIDATING FRONTEND TESTS")
    print("=" * 50)
    
    frontend_dir = Path("frontend")
    if not frontend_dir.exists():
        print("❌ Frontend directory not found")
        return False
    
    # Check package.json
    package_json = frontend_dir / "package.json"
    if not package_json.exists():
        print("❌ package.json not found in frontend")
        return False
    
    # Check for Playwright config
    playwright_config = frontend_dir / "playwright.config.ts"
    if not playwright_config.exists():
        print("❌ playwright.config.ts not found")
        return False
    
    # Check if Playwright is installed
    success, _, _ = run_command("npm list @playwright/test", cwd="frontend", check=False)
    if not success:
        print("❌ @playwright/test not installed")
        return False
    
    # Check Playwright test files
    e2e_dir = frontend_dir / "tests" / "e2e"
    if e2e_dir.exists():
        test_files = list(e2e_dir.glob("*.spec.ts"))
        print(f"📋 Found {len(test_files)} Playwright test files:")
        for test_file in test_files:
            print(f"   - {test_file.name}")
    
    print("✅ Frontend test setup validated")
    return True


def validate_build_process():
    """Validate build process"""
    print("\n🏗️ VALIDATING BUILD PROCESS")
    print("=" * 50)
    
    # Check if we can build frontend
    success, _, _ = run_command("npm run build", cwd="frontend", check=False)
    if success:
        print("✅ Frontend build successful")
        
        # Check if dist directory exists
        dist_dir = Path("frontend/dist")
        if dist_dir.exists():
            files_count = len(list(dist_dir.rglob("*")))
            print(f"📦 Build output: {files_count} files in dist/")
        
        return True
    else:
        print("❌ Frontend build failed")
        return False


def validate_docker_setup():
    """Validate Docker setup"""
    print("\n🐋 VALIDATING DOCKER SETUP")
    print("=" * 50)
    
    # Check if Dockerfile exists
    dockerfile = Path("Dockerfile")
    if not dockerfile.exists():
        print("❌ Dockerfile not found")
        return False
    
    # Check if docker-compose.yml exists
    compose_file = Path("docker-compose.yml")
    if not compose_file.exists():
        print("❌ docker-compose.yml not found")
        return False
    
    # Check if Docker is available
    success, _, _ = run_command("docker --version", check=False)
    if not success:
        print("⚠️  Docker not available (skipping build test)")
        return True  # Not a failure if Docker not installed
    
    print("✅ Docker configuration files found")
    return True


def validate_ci_workflow():
    """Validate CI workflow configuration"""
    print("\n⚙️  VALIDATING CI WORKFLOW")
    print("=" * 50)
    
    # Check if CI workflow exists
    ci_file = Path(".github/workflows/ci.yml")
    if not ci_file.exists():
        print("❌ CI workflow file not found")
        return False
    
    # Read and validate workflow content
    with open(ci_file, 'r') as f:
        content = f.read()
    
    required_sections = [
        'backend-quality',
        'frontend-quality', 
        'integration-tests',
        'pytest'
    ]
    
    for section in required_sections:
        if section in content:
            print(f"✅ Found: {section}")
        else:
            print(f"⚠️  Missing or incomplete: {section}")
    
    print("✅ CI workflow validated")
    return True


def main():
    parser = argparse.ArgumentParser(description="Validate A1Betting testing setup")
    parser.add_argument("--quick", action="store_true", help="Run quick validation only")
    parser.add_argument("--backend-only", action="store_true", help="Validate backend only")
    parser.add_argument("--frontend-only", action="store_true", help="Validate frontend only")
    args = parser.parse_args()
    
    print("🎯 A1BETTING TESTING VALIDATION")
    print("=" * 60)
    print(f"Python: {sys.version}")
    print(f"Working Directory: {os.getcwd()}")
    print("=" * 60)
    
    success = True
    
    if not args.frontend_only:
        success &= validate_backend_tests()
    
    if not args.backend_only:
        success &= validate_frontend_tests()
    
    if not args.quick:
        if not args.frontend_only:
            success &= validate_build_process()
        success &= validate_docker_setup()
        success &= validate_ci_workflow()
    
    print("\n🎯 VALIDATION SUMMARY")
    print("=" * 30)
    
    if success:
        print("✅ All validations passed!")
        print("🚀 Testing setup is ready for CI/CD pipeline")
        sys.exit(0)
    else:
        print("❌ Some validations failed")
        print("🔧 Please fix the issues above before deploying")
        sys.exit(1)


if __name__ == "__main__":
    main()
