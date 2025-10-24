#!/usr/bin/env python3
"""Print registered FastAPI route paths from backend.main.app or create_app().
This script is PowerShell-friendly and doesn't require external env editing.
"""
import sys
import traceback
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

print(f"Workspace root: {ROOT}")

try:
    import backend.main as m
    app = getattr(m, 'app', None)
    if app is None and hasattr(m, 'create_app'):
        print('No pre-built app found on import; calling create_app()')
        try:
            app = m.create_app()
        except Exception as e:
            print('create_app() raised an exception:')
            traceback.print_exc()
            raise

    if app is None:
        print('app not found')
        sys.exit(0)

    routes = sorted(set(getattr(r, 'path', str(r)) for r in getattr(app, 'routes', [])))
    print(f"Discovered {len(routes)} unique route paths:")
    for p in routes:
        print(p)

except Exception:
    traceback.print_exc()
    sys.exit(2)
