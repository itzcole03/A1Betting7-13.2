"""
Minimal shim for the `causal_learn` package used in tests/import-time runs.
This provides tiny fallbacks for the specific submodules imported by the codebase
so imports succeed in a trimmed environment. The real package is required for
actual causal inference functionality; this shim only prevents ModuleNotFoundError
during import-time and tests that do not rely on causal functionality.
"""

__all__ = [
    "search",
    "utils",
]
