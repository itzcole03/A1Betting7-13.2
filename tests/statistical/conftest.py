"""Statistical tests configuration and fixtures."""

import os
import sys
import pytest

# Ensure tests/statistical package imports work when pytest runs from repo root
# Add the tests package root to sys.path if necessary
tests_root = os.path.dirname(__file__)
if tests_root not in sys.path:
    sys.path.insert(0, tests_root)

try:
    # Use a relative import from the same package to avoid relying on top-level
    # package name resolution during pytest collection.
    from .test_monte_carlo_deterministic import StatisticalTestSuite

    @pytest.fixture
    def statistical_suite():
        return StatisticalTestSuite()
except Exception:
    @pytest.fixture
    def statistical_suite():
        pytest.skip("Statistical test helpers not available: import failed during collection")


# Pytest configuration helpers
def pytest_configure(config):
    config.addinivalue_line("markers", "statistical: marks tests as statistical verification tests")
    config.addinivalue_line("markers", "ci_critical: marks tests as critical for CI/CD pipeline")


def pytest_collection_modifyitems(config, items):
    for item in items:
        if "tests/statistical" in getattr(item, 'nodeid', '') or "statistical" in getattr(item, 'nodeid', ''):
            item.add_marker(pytest.mark.statistical)


def pytest_runtest_setup(item):
    # Run-time dependency checks for statistical tests
    if item.get_closest_marker("statistical"):
        try:
            import numpy  # noqa: F401
            import scipy  # noqa: F401
        except Exception as e:
            pytest.skip(f"Statistical test requires missing dependency: {e}")


@pytest.fixture(scope="session")
def ensure_statistical_dependencies():
    try:
        import numpy as np  # noqa: F401
        import scipy.stats as stats  # noqa: F401
        return {"numpy": np, "scipy_stats": stats}
    except Exception as e:
        pytest.skip(f"Statistical dependencies not available: {e}")


@pytest.fixture(scope="session")
def statistical_test_config():
    return {
        'seed': int(os.environ.get('PYTEST_STATISTICAL_SEED', 42)),
        'sample_size': int(os.environ.get('STATISTICAL_SAMPLE_SIZE', 10000)),
        'tolerance': float(os.environ.get('STATISTICAL_TOLERANCE', 0.05)),
        'strict_mode': os.environ.get('STATISTICAL_STRICT_MODE', 'false').lower() == 'true'
    }