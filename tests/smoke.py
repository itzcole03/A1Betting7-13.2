"""Shim for tests.smoke to satisfy import-time references in archived codepaths."""

# This module intentionally left minimal; actual smoke tests live elsewhere.


def run():
    return True


__all__ = ["run"]


def run_websocket_envelope_smoke_tests(*args, **kwargs):
    """Alias expected by some archived smoke runners.

    Keep minimal: return True to indicate the (shim) tests passed.
    """
    return True


__all__.extend(["run_websocket_envelope_smoke_tests"])
