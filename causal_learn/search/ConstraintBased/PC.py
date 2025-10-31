"""Minimal PC algorithm shim used by import-time references.
The real causal_learn.pc function performs conditional independence tests and
structure discovery. This shim returns a placeholder structure so importing
modules won't fail in environments without causal_learn installed.
"""


def pc(*args, **kwargs):
    """Placeholder `pc` function.

    Returns a minimal dict-like structure. Callers that need real causal
    inference should install the `causal-learn` package and remove this shim.
    """
    # return an empty adjacency list / graph placeholder
    return {}
