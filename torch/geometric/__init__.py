"""Shim for torch.geometric subpackage used in a few optional modules.
This exposes a minimal API surface so import-time checks succeed.
"""

__all__ = ["data", "nn"]


class data:
    @staticmethod
    def Data(*args, **kwargs):
        return None


class nn:
    @staticmethod
    def MessagePassing(*args, **kwargs):
        class _MP:
            pass

        return _MP
