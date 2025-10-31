"""Thin re-export wrapper that forwards to the consolidated test compat
`tests._compat.torch` shim. If that package isn't available, fall back to a
minimal in-file shim so import-time codepaths remain safe.
"""

try:
    # Prefer the centralized test-only shim and explicitly import the
    # small surface area we expect to re-export.
    import tests._compat.torch as _compat_torch  # type: ignore
    from tests._compat.torch import Tensor, geometric, nn, tensor  # type: ignore

    __all__ = getattr(_compat_torch, "__all__", ["geometric", "nn", "tensor", "Tensor"])
except (
    Exception
) as _exc:  # pragma: no cover - fallback for non-test environments  # pylint: disable=broad-except
    # Best-effort fallback (keeps surface area small and import-safe)
    import sys
    import types as _types
    from types import SimpleNamespace

    __all__ = ["geometric", "nn", "tensor", "Tensor"]

    class Tensor:
        def __init__(self, data=None):
            self.data = data

    def tensor(data, dtype=None):
        # keep `dtype` referenced to avoid linter "unused-argument" warnings
        _ = dtype
        return Tensor(data)

    class _Module:
        def __init__(self, *args, **kwargs):
            pass

    class _Linear(_Module):
        def __init__(self, in_features, out_features, bias=True):
            # reference args to avoid linter unused-argument warnings
            _ = (in_features, out_features, bias)
            super().__init__()

    def _relu(x):
        return x

    def _softmax(x, dim=None):
        # reference dim to avoid unused-argument linter warnings
        _ = dim
        return x

    nn = SimpleNamespace()
    nn.Module = _Module
    nn.Linear = _Linear
    nn.functional = SimpleNamespace(relu=_relu, softmax=_softmax)

    # Register shallow submodules so importers like `import torch.nn.functional`
    # succeed even in this minimal fallback.
    if "torch.nn" not in sys.modules:
        _nn_mod = _types.ModuleType("torch.nn")
        _nn_mod.Module = _Module
        _nn_mod.Linear = _Linear
        _nn_mod.functional = _types.SimpleNamespace(relu=_relu, softmax=_softmax)
        sys.modules["torch.nn"] = _nn_mod

    if "torch.nn.functional" not in sys.modules:
        _fn_mod = _types.ModuleType("torch.nn.functional")
        _fn_mod.relu = _relu
        _fn_mod.softmax = _softmax
        sys.modules["torch.nn.functional"] = _fn_mod
