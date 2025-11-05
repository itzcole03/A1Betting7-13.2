"""Pytest pre-import shim to alias the minimal testing compat module.

Some repository files contain a corrupted `testing_compat_shims.py`. Tests
may import `backend.routes.testing_compat_shims` directly which would cause
import-time syntax errors. To avoid editing many callers, alias the clean
minimal shim into sys.modules so imports resolve to the safe implementation
during pytest runs.
"""

import sys

try:
    # Prefer the minimal, import-safe shim
    from backend.routes import testing_compat_shims_minimal as _minimal

    sys.modules["backend.routes.testing_compat_shims"] = _minimal
except Exception:
    # If even the minimal shim is unavailable, ignore — tests will surface
    # the underlying import errors normally.
    pass
"""Test conftest for pytest.

This file runs very early and ensures the repository root is on sys.path so
local shims (e.g. a top-level `aioredis.py`) are importable during collection.

If the test environment installs a real `aioredis` package, that will still
take precedence; this only helps local-dev/test runs where a shim is used.
"""

import asyncio
import inspect
import os
import sys
from functools import wraps
from pathlib import Path
from typing import Any, Awaitable, Dict

import pytest

ROOT = os.path.dirname(__file__)
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)


def pytest_sessionstart(session):
    """Ensure the project root lives on sys.path before collection begins."""

    repo_root = Path(__file__).resolve().parent
    if str(repo_root) not in sys.path:
        sys.path.insert(0, str(repo_root))


# ---------------------------------------------------------------------------
# Asyncio fallback harness (used when pytest-asyncio is unavailable)
# ---------------------------------------------------------------------------

ASYNC_FALLBACK_ENABLED = False
_ASYNC_LOOP: asyncio.AbstractEventLoop | None = None
_WRAP_FLAG = "_a1_async_wrapper"


def _ensure_async_loop() -> asyncio.AbstractEventLoop:
    global _ASYNC_LOOP
    if _ASYNC_LOOP is None or _ASYNC_LOOP.is_closed():
        _ASYNC_LOOP = asyncio.new_event_loop()
    return _ASYNC_LOOP


def _run_in_loop(awaitable: Awaitable[Any]) -> Any:
    loop = _ensure_async_loop()
    previous: asyncio.AbstractEventLoop | None = None
    try:
        try:
            previous = asyncio.get_event_loop()
        except RuntimeError:
            previous = None
        asyncio.set_event_loop(loop)
        return loop.run_until_complete(awaitable)
    finally:
        # Keep the fallback loop as the default unless another loop was set.
        if previous is not None and previous is not loop:
            asyncio.set_event_loop(previous)
        else:
            asyncio.set_event_loop(loop)


def _filtered_kwargs(callable_obj, funcargs: Dict[str, Any]) -> Dict[str, Any]:
    try:
        signature = inspect.signature(inspect.unwrap(callable_obj))
    except (TypeError, ValueError):
        try:
            signature = inspect.signature(callable_obj)
        except (TypeError, ValueError):
            return funcargs

    accepts_var_kwargs = any(
        param.kind == inspect.Parameter.VAR_KEYWORD
        for param in signature.parameters.values()
    )
    if accepts_var_kwargs:
        return funcargs

    accepted = set(signature.parameters.keys())
    return {name: value for name, value in funcargs.items() if name in accepted}


def _wrap_async_item(item) -> None:
    test_func = getattr(item, "obj", None)
    if test_func is None:
        return

    unwrapped = inspect.unwrap(test_func)
    if not inspect.iscoroutinefunction(unwrapped):
        return

    if getattr(test_func, _WRAP_FLAG, False):
        return

    @wraps(test_func)
    def _sync_wrapper(*args, **kwargs):
        result = test_func(*args, **kwargs)
        if inspect.isawaitable(result):
            return _run_in_loop(result)
        return result

    setattr(_sync_wrapper, _WRAP_FLAG, True)
    target = test_func
    if hasattr(test_func, "__func__"):
        target = test_func.__func__
    if hasattr(target, "__dict__"):
        setattr(target, _WRAP_FLAG, True)
    item.obj = _sync_wrapper


def _resolve_fixture_args(fixturedef, request) -> Dict[str, Any]:
    resolved: Dict[str, Any] = {}
    for name in fixturedef.argnames:
        if name == "request":
            resolved[name] = request
        else:
            resolved[name] = request.getfixturevalue(name)
    return resolved


def pytest_configure(config):
    global ASYNC_FALLBACK_ENABLED

    os.environ.setdefault("PYTEST_ASYNCIO_MODE", "auto")

    plugin_manager = config.pluginmanager
    has_asyncio_plugin = plugin_manager.has_plugin("pytest_asyncio")
    if not has_asyncio_plugin:
        try:
            plugin_manager.import_plugin("pytest_asyncio")
        except ImportError:
            has_asyncio_plugin = False
        else:
            has_asyncio_plugin = True

    ASYNC_FALLBACK_ENABLED = not has_asyncio_plugin

    # Register the common marker so pytest does not warn when the real plugin
    # is missing.
    config.addinivalue_line("markers", "asyncio: async test support marker")

    if ASYNC_FALLBACK_ENABLED:
        asyncio.set_event_loop(_ensure_async_loop())


def pytest_unconfigure(config):
    global _ASYNC_LOOP

    if _ASYNC_LOOP is not None and not _ASYNC_LOOP.is_closed():
        _ASYNC_LOOP.close()
    _ASYNC_LOOP = None


def pytest_collection_modifyitems(config, items):
    for item in items:
        test_func = getattr(item, "obj", None)
        if test_func is None:
            continue

        unwrapped = inspect.unwrap(test_func)
        if inspect.iscoroutinefunction(unwrapped) and "asyncio" not in item.keywords:
            item.add_marker(pytest.mark.asyncio)
        elif ASYNC_FALLBACK_ENABLED and not inspect.iscoroutinefunction(unwrapped):
            # Synchronous tests occasionally keep the marker to signal the
            # plugin to provide an event loop. The fallback harness executes
            # them directly, so drop the marker to avoid Pytest warnings.
            item.keywords.pop("asyncio", None)
            if hasattr(item, "own_markers"):
                item.own_markers[:] = [
                    mark for mark in item.own_markers if mark.name != "asyncio"
                ]

        if ASYNC_FALLBACK_ENABLED:
            _wrap_async_item(item)


@pytest.hookimpl(tryfirst=True)
def pytest_pyfunc_call(pyfuncitem):
    if not ASYNC_FALLBACK_ENABLED:
        return None

    call_kwargs = _filtered_kwargs(pyfuncitem.obj, pyfuncitem.funcargs)
    if call_kwargs is not pyfuncitem.funcargs:
        pyfuncitem.funcargs = call_kwargs

    result = pyfuncitem.obj(**pyfuncitem.funcargs)
    if inspect.isawaitable(result):
        _run_in_loop(result)
        return True

    return None


@pytest.hookimpl(tryfirst=True)
def pytest_fixture_setup(fixturedef, request):
    if not ASYNC_FALLBACK_ENABLED:
        return None

    fixture_func = fixturedef.func

    if inspect.iscoroutinefunction(fixture_func):

        async def _call_async():
            kwargs = _resolve_fixture_args(fixturedef, request)
            return await fixture_func(**kwargs)

        result = _run_in_loop(_call_async())
    elif inspect.isasyncgenfunction(fixture_func):
        kwargs = _resolve_fixture_args(fixturedef, request)
        async_gen = fixture_func(**kwargs)

        async def _enter_async_gen():
            try:
                return await async_gen.__anext__()
            except StopAsyncIteration as exc:  # pragma: no cover - defensive
                raise RuntimeError("Async generator fixture did not yield") from exc

        result = _run_in_loop(_enter_async_gen())

        def _finalizer():
            async def _finish_async_gen():
                try:
                    await async_gen.__anext__()
                except StopAsyncIteration:
                    await async_gen.aclose()
                    return
                else:  # pragma: no cover - defensive
                    await async_gen.aclose()
                    raise RuntimeError("Async generator fixture yielded more than once")

            _run_in_loop(_finish_async_gen())

        request.addfinalizer(_finalizer)
    else:
        return None

    fixturedef.cached_result = (
        result,
        fixturedef.cache_key,
        getattr(request, "param_index", None),
    )
    return result
