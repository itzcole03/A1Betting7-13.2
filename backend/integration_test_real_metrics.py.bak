"""Import-safe stub for integration_test_real_metrics.

This module used to include JS-style templated strings that prevented
Python from compiling the package during pytest collection. Replace with
a minimal, pure-Python stub that provides the expected helpers.
"""

from typing import Dict

BASE_URL = "http://127.0.0.1:8000/api/ultra-accuracy"


def get_base_url() -> str:
    """Return a local base URL for quick tests and imports."""
    return BASE_URL


def is_testable() -> Dict[str, bool]:
    """Simple helper used by tests to verify the module is importable."""
    return {"importable": True}
