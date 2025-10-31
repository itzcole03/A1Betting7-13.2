"""Minimal shim for causal_learn.utils.cit.fisherz"""


def fisherz(*args, **kwargs):
    """Return a conservative default to satisfy callers during import/test.

    Real implementation computes Fisher-Z conditional independence statistic.
    """
    return 0.0
