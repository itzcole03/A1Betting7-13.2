#!/usr/bin/env python3
"""
Production Validation Script
Validates the backend/frontend terminal resolution with comprehensive testing.
"""

import asyncio
import json
import time
from typing import Any, Dict, Optional

import requests

# Backend configuration
BACKEND_URL = "http://127.0.0.1:8000"  # Current backend port
HEALTH_ENDPOINT = f"{BACKEND_URL}/health"
PRODUCTION_HEALTH_ENDPOINT = f"{BACKEND_URL}/api/production/health/comprehensive"
BACKGROUND_TASK_HEALTH_ENDPOINT = (
    f"{BACKEND_URL}/api/production/health/background-tasks"
)
STRESS_TEST_ENDPOINT = f"{BACKEND_URL}/api/production/test/background-task-stress"


def print_banner(title: str):
    """Print a formatted banner"""
    print(f"\n{'='*60}")
    print(f"🔧 {title}")
    print("=" * 60)


def print_result(
    test_name: str, success: bool, details: Optional[Dict[str, Any]] = None
):
    """Print test result with formatting"""
    status = "✅ PASSED" if success else "❌ FAILED"
    print(f"{status} {test_name}")
    if details:
        print(f"   Details: {json.dumps(details, indent=6)}")


def test_basic_connectivity():
    """Test basic backend connectivity"""
    print_banner("Basic Connectivity Test")

    try:
        response = requests.get(HEALTH_ENDPOINT, timeout=5)
        if response.status_code == 200:
            data = response.json()
            print_result("Basic Health Check", True, data)
            return True
        else:
            print_result(
                "Basic Health Check", False, {"status_code": response.status_code}
            )
            return False
    except Exception as e:
        print_result("Basic Health Check", False, {"error": str(e)})
        return False


def test_production_health():
    """Test comprehensive production health monitoring"""
    print_banner("Production Health Monitoring Test")

    try:
        response = requests.get(PRODUCTION_HEALTH_ENDPOINT, timeout=10)
        if response.status_code == 200:
            data = response.json()

            # Extract key validation points
            validation_results = {
                "async_validation": data.get("async_validation", {}),
                "background_task_fix": data.get("background_task_fix", {}),
                "production_logging": data.get("production_logging"),
                "system_metrics": data.get("system_metrics", {}),
            }

            # Check if async operations are working
            async_ok = data.get("async_validation", {}).get("basic_async") is True
            fix_ok = "IMPLEMENTED" in str(data.get("background_task_fix", {}))

            success = async_ok and fix_ok
            print_result("Production Health Check", success, validation_results)
            return success
        else:
            print_result(
                "Production Health Check", False, {"status_code": response.status_code}
            )
            return False
    except Exception as e:
        print_result("Production Health Check", False, {"error": str(e)})
        return False


def test_background_task_system():
    """Test background task system health (validates the critical fix)"""
    print_banner("Background Task System Validation")

    try:
        response = requests.get(BACKGROUND_TASK_HEALTH_ENDPOINT, timeout=15)
        if response.status_code == 200:
            data = response.json()

            # Extract validation points
            validation_results = {
                "background_task_system": data.get("background_task_system", {}),
                "critical_fix_status": data.get("critical_fix_status", {}),
                "production_logging": data.get("production_logging"),
            }

            # Check if the critical fix is working
            task_addition_ok = (
                data.get("background_task_system", {}).get("task_addition") == "SUCCESS"
            )
            task_retrieval_ok = (
                data.get("background_task_system", {}).get("task_retrieval")
                == "SUCCESS"
            )
            fix_validated = (
                data.get("background_task_system", {}).get("asyncio_fix_validated")
                is True
            )

            success = task_addition_ok and task_retrieval_ok and fix_validated
            print_result("Background Task System", success, validation_results)
            return success
        else:
            print_result(
                "Background Task System", False, {"status_code": response.status_code}
            )
            return False
    except Exception as e:
        print_result("Background Task System", False, {"error": str(e)})
        return False


def test_stress_testing():
    """Test background task system under stress"""
    print_banner("Stress Testing Background Tasks")

    try:
        # Run a moderate stress test
        params = {"num_tasks": 20, "concurrent_workers": 4}
        response = requests.post(STRESS_TEST_ENDPOINT, params=params, timeout=30)

        if response.status_code == 200:
            data = response.json()

            # Extract performance metrics
            performance_results = {
                "execution_time": data.get("execution_time_seconds"),
                "tasks_processed": data.get("tasks", {}).get("total_processed"),
                "success_rate": data.get("tasks", {}).get("success_rate"),
                "asyncio_fix_status": data.get("asyncio_fix_validation", {}).get(
                    "overall_status"
                ),
            }

            # Check if stress test passed
            success_rate = data.get("tasks", {}).get("success_rate", 0)
            fix_status = data.get("asyncio_fix_validation", {}).get("overall_status")

            success = success_rate >= 90 and fix_status == "PASSED"
            print_result("Stress Test", success, performance_results)
            return success
        else:
            print_result("Stress Test", False, {"status_code": response.status_code})
            return False
    except Exception as e:
        print_result("Stress Test", False, {"error": str(e)})
        return False


def main():
    """Run comprehensive validation tests"""
    print_banner("A1Betting Backend/Frontend Terminal Resolution Validation")
    print("🎯 Validating the critical AsyncIO fix and production stability...")

    # Run all tests
    tests = [
        ("Basic Connectivity", test_basic_connectivity),
        ("Production Health", test_production_health),
        ("Background Task System", test_background_task_system),
        ("Stress Testing", test_stress_testing),
    ]

    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print_result(test_name, False, {"unexpected_error": str(e)})
            results.append((test_name, False))

        # Brief pause between tests
        time.sleep(1)

    # Summary
    print_banner("Validation Summary")
    passed = sum(1 for _, result in results if result)
    total = len(results)

    print(f"📊 Tests Passed: {passed}/{total}")

    for test_name, result in results:
        status = "✅" if result else "❌"
        print(f"   {status} {test_name}")

    if passed == total:
        print(
            f"\n🎉 ALL TESTS PASSED! Backend/Frontend terminal resolution is SUCCESSFUL!"
        )
        print(f"✅ Critical AsyncIO fix is working correctly")
        print(f"✅ Background task system is stable")
        print(f"✅ Production logging and monitoring is functional")
        return True
    else:
        print(f"\n⚠️ {total - passed} test(s) failed. Please review the results above.")
        return False


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
