"""Top-level pytest configuration helpers."""

import asyncio
import inspect
import os
import sys

import pytest

ROOT = os.path.dirname(__file__)
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

# Ensure pytest-asyncio runs in auto mode so legacy async tests without
# explicit markers continue to execute.
os.environ.setdefault("PYTEST_ASYNCIO_MODE", "auto")


def pytest_collection_modifyitems(config, items):
    """Auto-mark bare async tests for pytest-asyncio strict mode."""

    for item in items:
        test_func = getattr(item, "obj", None)
        if test_func is None:
            continue
        if inspect.iscoroutinefunction(inspect.unwrap(test_func)) and "asyncio" not in item.keywords:
            item.add_marker(pytest.mark.asyncio)


@pytest.hookimpl(tryfirst=True)
def pytest_pyfunc_call(pyfuncitem):
    """Allow bare async test functions without requiring pytest-asyncio."""

    def _run(coro):
        try:
            asyncio.run(coro)
        except RuntimeError as exc:  # pragma: no cover - defensive fallback
            if "asyncio.run() cannot be called" not in str(exc):
                raise
            loop = asyncio.new_event_loop()
            try:
                loop.run_until_complete(coro)
            finally:
                loop.close()

    def _filtered_kwargs(callable_obj):
        """Return funcargs limited to parameters accepted by callable_obj."""

        try:
            signature = inspect.signature(inspect.unwrap(callable_obj))
        except (TypeError, ValueError):
            try:
                signature = inspect.signature(callable_obj)
            except (TypeError, ValueError):
                return pyfuncitem.funcargs

        accepts_var_kwargs = any(
            param.kind == inspect.Parameter.VAR_KEYWORD
            for param in signature.parameters.values()
        )
        if accepts_var_kwargs:
            return pyfuncitem.funcargs

        accepted = set(signature.parameters.keys())
        return {name: value for name, value in pyfuncitem.funcargs.items() if name in accepted}

    call_kwargs = _filtered_kwargs(pyfuncitem.obj)

    if call_kwargs is not pyfuncitem.funcargs:
        pyfuncitem.funcargs = call_kwargs

    plugin_manager = pyfuncitem._request.config.pluginmanager
    has_asyncio_plugin = plugin_manager.has_plugin("asyncio") or plugin_manager.has_plugin("pytest_asyncio")

    if has_asyncio_plugin:
        # Let pytest-asyncio (or equivalent) handle coroutine execution.
        return None

    test_func = inspect.unwrap(pyfuncitem.obj)
    wrapped = getattr(pyfuncitem.obj, "__wrapped__", None)

    if inspect.iscoroutinefunction(test_func) or (
        wrapped is not None and inspect.iscoroutinefunction(wrapped)
    ):
        coro = pyfuncitem.obj(**call_kwargs)
        if inspect.isawaitable(coro):
            _run(coro)
            return True
        return None

    # Fallback: handle callables returning awaitables (some patch wrappers)
    result = pyfuncitem.obj(**call_kwargs)
    if inspect.isawaitable(result):
        _run(result)
        return True

    return None
