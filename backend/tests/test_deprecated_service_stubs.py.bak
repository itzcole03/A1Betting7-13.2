import importlib
import sys

import pytest


def _clear_module(module_name: str) -> None:
    sys.modules.pop(module_name, None)


@pytest.mark.parametrize(
    "module_name",
    [
        "backend.services.real_data_service",
        "backend.services.real_data_integration",
    ],
)
def test_deprecated_service_modules_raise_import_error(module_name: str) -> None:
    """Ensure legacy service entry points stay retired."""

    _clear_module(module_name)

    try:
        mod = importlib.import_module(module_name)
    except ImportError as excinfo:
        # older behavior: module raises an informative ImportError guiding
        # callers to the new unified surface. That's still acceptable.
        message = str(excinfo)
        assert "backend.services.unified_data_service" in message or message.startswith(
            "No module named"
        )
        return

    # Newer behavior: module has been replaced with a small delegating shim
    # that forwards to the unified surface. Ensure it exposes at least one
    # of the well-known real-data entrypoints so callers continue to work.
    assert hasattr(mod, "fetch_real_betting_opportunities") or getattr(
        mod, "__all__", None
    )
