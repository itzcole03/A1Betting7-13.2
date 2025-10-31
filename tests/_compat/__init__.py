"""Test-only compatibility shim package.

Centralized repository for small import-time shims used during pytest
collection. Tests should import directly from their normal locations; the
original modules in the tree are thin re-exports that forward to the
implementations kept here. Keeping the real shim code under `tests/_compat`
makes it simpler to remove or refine them later.
"""

__all__ = [
    "llm_engine",
    "prediction_utils",
    "torch",
    "testing_compat_shims_minimal",
]

# marker to make it easy for runtime checks
TEST_COMPAT = True
