"""
Test Runner for A1Betting Backend Routes
Runs comprehensive pytest test suite with coverage reporting
"""

import subprocess
import sys
from pathlib import Path


def run_tests():
    """Run the complete backend test suite"""
    
    # Get project root directory
    project_root = Path(__file__).parent
    
    # Test command with coverage and detailed output
    test_cmd = [
        "python", "-m", "pytest",
        "tests/backend/routes/",  # Test directory
        "-v",  # Verbose output
        "--tb=short",  # Shorter traceback format
        "--asyncio-mode=auto",  # Auto async mode
        "-x",  # Stop on first failure
        "--disable-warnings",  # Reduce noise in output
        "-s"   # Don't capture print statements
    ]
    
    print("🚀 Running A1Betting Backend Route Tests...")
    print(f"Test Directory: {project_root / 'tests' / 'backend' / 'routes'}")
    print("=" * 60)
    
    try:
        # Run tests
        result = subprocess.run(
            test_cmd,
            cwd=project_root,
            capture_output=False,  # Show output in real-time
            text=True
        )
        
        print("=" * 60)
        
        if result.returncode == 0:
            print("✅ All tests passed successfully!")
            print_test_summary()
        else:
            print("❌ Some tests failed.")
            print(f"Exit code: {result.returncode}")
            
        return result.returncode
        
    except FileNotFoundError:
        print("❌ pytest not found. Please install with: pip install pytest pytest-asyncio")
        return 1
    except Exception as e:
        print(f"❌ Error running tests: {e}")
        return 1


def print_test_summary():
    """Print summary of test coverage"""
    
    test_files = [
        "test_enhanced_ml_routes.py",
        "test_enhanced_websocket_routes.py", 
        "test_multiple_sportsbook_routes.py",
        "test_mlb_extras.py"
    ]
    
    print("\n📊 Test Coverage Summary:")
    print("-" * 40)
    
    for test_file in test_files:
        test_path = Path("tests/backend/routes") / test_file
        
        if test_path.exists():
            print(f"✅ {test_file}")
            
            # Count test methods
            with open(test_path, 'r', encoding='utf-8') as f:
                content = f.read()
                test_count = content.count("def test_")
                async_test_count = content.count("async def test_")
                
            print(f"   📝 {test_count} total tests ({async_test_count} async)")
        else:
            print(f"❌ {test_file} - Not found")
    
    print("\n🎯 Test Categories Covered:")
    print("  • Enhanced ML Routes - SHAP, Batch Optimization, Performance Logging")
    print("  • Enhanced WebSocket Routes - Rooms, Authentication, Heartbeat")
    print("  • Multiple Sportsbook Routes - Arbitrage, Odds Comparison")
    print("  • MLB Extras Routes - PrizePicks, Comprehensive Props, Live Stats")
    
    print("\n🧪 Test Types:")
    print("  • Unit Tests - Individual endpoint testing")
    print("  • Integration Tests - Multi-service workflows")
    print("  • Error Handling - Exception and timeout scenarios")
    print("  • Performance Tests - Response time validation")
    print("  • WebSocket Tests - Real-time communication")


def run_specific_test_file(test_file: str):
    """Run a specific test file"""
    
    project_root = Path(__file__).parent
    
    test_cmd = [
        "python", "-m", "pytest",
        f"tests/backend/routes/{test_file}",
        "-v",
        "--tb=short",
        "--asyncio-mode=auto",
        "-s"
    ]
    
    print(f"🎯 Running specific test file: {test_file}")
    print("=" * 60)
    
    try:
        result = subprocess.run(
            test_cmd,
            cwd=project_root,
            capture_output=False,
            text=True
        )
        
        print("=" * 60)
        
        if result.returncode == 0:
            print(f"✅ {test_file} - All tests passed!")
        else:
            print(f"❌ {test_file} - Some tests failed.")
            
        return result.returncode
        
    except Exception as e:
        print(f"❌ Error running {test_file}: {e}")
        return 1


def validate_test_setup():
    """Validate that test setup is correct"""
    
    project_root = Path(__file__).parent
    
    print("🔍 Validating test setup...")
    
    # Check required directories
    required_dirs = [
        "tests/",
        "tests/backend/",
        "tests/backend/routes/",
        "backend/",
        "backend/routes/"
    ]
    
    missing_dirs = []
    for dir_path in required_dirs:
        full_path = project_root / dir_path
        if not full_path.exists():
            missing_dirs.append(dir_path)
            print(f"❌ Missing directory: {dir_path}")
        else:
            print(f"✅ Found directory: {dir_path}")
    
    # Check test files
    test_files = [
        "tests/conftest.py",
        "tests/backend/routes/test_enhanced_ml_routes.py",
        "tests/backend/routes/test_enhanced_websocket_routes.py", 
        "tests/backend/routes/test_multiple_sportsbook_routes.py",
        "tests/backend/routes/test_mlb_extras.py"
    ]
    
    missing_files = []
    for file_path in test_files:
        full_path = project_root / file_path
        if not full_path.exists():
            missing_files.append(file_path)
            print(f"❌ Missing test file: {file_path}")
        else:
            print(f"✅ Found test file: {file_path}")
    
    # Check pytest configuration
    pytest_files = ["pytest.ini"]
    for config_file in pytest_files:
        config_path = project_root / config_file
        if config_path.exists():
            print(f"✅ Found config: {config_file}")
        else:
            print(f"⚠️  Missing config: {config_file}")
    
    print("\n📋 Setup Validation Summary:")
    if missing_dirs or missing_files:
        print("❌ Test setup incomplete")
        if missing_dirs:
            print(f"Missing directories: {', '.join(missing_dirs)}")
        if missing_files:
            print(f"Missing files: {', '.join(missing_files)}")
        return False
    else:
        print("✅ Test setup complete - Ready to run tests!")
        return True


if __name__ == "__main__":
    """Main entry point for test runner"""
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "validate":
            success = validate_test_setup()
            sys.exit(0 if success else 1)
            
        elif command == "run":
            if len(sys.argv) > 2:
                # Run specific test file
                test_file = sys.argv[2]
                exit_code = run_specific_test_file(test_file)
            else:
                # Run all tests
                exit_code = run_tests()
            
            sys.exit(exit_code)
            
        else:
            print("❌ Unknown command. Use: python run_backend_tests.py [validate|run] [test_file]")
            sys.exit(1)
    else:
        # Default: validate then run all tests
        print("🔧 Step 1: Validating test setup...")
        if validate_test_setup():
            print("\n🚀 Step 2: Running all backend route tests...")
            exit_code = run_tests()
            sys.exit(exit_code)
        else:
            print("❌ Test setup validation failed. Fix issues and try again.")
            sys.exit(1)
