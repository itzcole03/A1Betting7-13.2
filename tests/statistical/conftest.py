"""
Statistical tests configuration and fixtures.
"""

import pytest
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))

# Configure pytest for statistical tests
def pytest_configure(config):
    """Configure pytest for statistical testing"""
    config.addinivalue_line(
        "markers", "statistical: marks tests as statistical verification tests"
    )
    config.addinivalue_line(
        "markers", "ci_critical: marks tests as critical for CI/CD pipeline"
    )

def pytest_collection_modifyitems(config, items):
    """Modify test collection for statistical tests"""
    for item in items:
        if "statistical" in item.nodeid:
            item.add_marker(pytest.mark.statistical)

# Check for required dependencies
def pytest_runtest_setup(item):
    """Check dependencies before running statistical tests"""
    
    # Check if this is a statistical test
    if item.get_closest_marker("statistical"):
        # Try to import required packages
        try:
            import numpy
            import scipy
        except ImportError as e:
            pytest.skip(f"Statistical test requires {e.name}: {e}")

# Fixtures for statistical testing
@pytest.fixture(scope="session")
def ensure_statistical_dependencies():
    """Ensure statistical dependencies are available"""
    try:
        import numpy as np
        import scipy.stats as stats
        return {'numpy': np, 'scipy_stats': stats}
    except ImportError as e:
        pytest.skip(f"Statistical dependencies not available: {e}")

@pytest.fixture(scope="session") 
def statistical_test_config():
    """Configuration for statistical tests"""
    return {
        'seed': int(os.environ.get('PYTEST_STATISTICAL_SEED', 42)),
        'sample_size': int(os.environ.get('STATISTICAL_SAMPLE_SIZE', 10000)),
        'tolerance': float(os.environ.get('STATISTICAL_TOLERANCE', 0.05)),
        'strict_mode': os.environ.get('STATISTICAL_STRICT_MODE', 'false').lower() == 'true'
    }