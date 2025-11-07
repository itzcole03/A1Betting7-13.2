"""
Test runner for all LLM tests

Runs the comprehensive LLM test suite.
"""

import pytest
import sys
import os

# Add backend to path for imports
backend_path = os.path.join(os.path.dirname(__file__), '..')
sys.path.insert(0, backend_path)


def run_llm_tests():
    """Run all LLM tests with detailed reporting"""
    
    # Test discovery patterns
    test_patterns = [
        'test_prompt_templates.py',
        'test_llm_cache.py', 
        'test_explanation_service.py',
        'test_adapters.py',
        'test_api_endpoints.py',
        'test_error_handling.py'
    ]
    
    # Run tests with verbose output
    exit_code = pytest.main([
        '--verbose',
        '--tb=short',
        '--durations=10',  # Show 10 slowest tests
        '--cov=backend.services.llm',  # Coverage for LLM module
        '--cov-report=term-missing',
        *test_patterns
    ])
    
    return exit_code


if __name__ == "__main__":
    print("🚀 Running LLM Service Test Suite...")
    print("=" * 60)
    
    exit_code = run_llm_tests()
    
    if exit_code == 0:
        print("✅ All LLM tests passed!")
    else:
        print("❌ Some LLM tests failed!")
        
    sys.exit(exit_code)