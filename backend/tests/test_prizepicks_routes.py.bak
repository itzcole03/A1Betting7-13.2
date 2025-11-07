import importlib.util
import pathlib
import sys


def import_module_from_path(path):
    spec = importlib.util.spec_from_file_location("prizepicks_routes", path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)
    return mod


def test_prizepicks_router_importable():
    repo_root = pathlib.Path(__file__).resolve().parents[2]
    route_path = repo_root / "backend" / "routes" / "prizepicks_routes.py"
    assert route_path.exists(), f"Expected file at {route_path}"

    mod = import_module_from_path(str(route_path))
    assert hasattr(mod, "router"), "prizepicks_routes must expose `router`"

    # Call health endpoint function directly (no ASGI app)
    health = mod.health()
    # health may be coroutine
    if hasattr(health, "__await__"):
        import asyncio

        health = asyncio.get_event_loop().run_until_complete(health)

    assert isinstance(health, dict) or hasattr(
        health, "dict"
    ), "health must be a dict-like envelope"


def test_prizepicks_props_returns_list():
    repo_root = pathlib.Path(__file__).resolve().parents[2]
    route_path = repo_root / "backend" / "routes" / "prizepicks_routes.py"
    mod = import_module_from_path(str(route_path))

    props = mod.list_prizepicks_props()
    if hasattr(props, "__await__"):
        import asyncio

        props = asyncio.get_event_loop().run_until_complete(props)

    # Should be canonical envelope with data (or fallback ok). Accept dicts.
    assert isinstance(props, dict) or hasattr(props, "dict")

    # Extract data field if present
    data = props.get("data") if isinstance(props, dict) else None
    if data is None and hasattr(props, "dict"):
        data = props.dict().get("data")

    assert data == []
