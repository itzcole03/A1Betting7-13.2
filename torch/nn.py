"""Minimal torch.nn shim used for import-time compatibility in tests.

This module provides a tiny subset of the public torch.nn API so code that
imports `torch.nn` or does `from torch import nn` will succeed during
import-scans and tests in trimmed environments without full PyTorch.
"""

from types import SimpleNamespace


class Module:
    """Placeholder for torch.nn.Module."""

    def __init__(self, *args, **kwargs):
        pass


class Linear(Module):
    def __init__(self, in_features, out_features, bias=True):
        super().__init__()


class Conv2d(Module):
    def __init__(self, in_channels, out_channels, kernel_size, stride=1, padding=0):
        super().__init__()


def relu(x):
    return x


def softmax(x, dim=None):
    return x


functional = SimpleNamespace(relu=relu, softmax=softmax)


# Export names commonly accessed from `torch.nn`
__all__ = ["Module", "Linear", "Conv2d", "functional"]
