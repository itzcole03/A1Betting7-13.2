"""
Utility: list registered FastAPI routes for debugging.
Run with: python scripts/list_routes.py
"""

from backend.core.app import create_app

app = create_app()

for r in app.routes:
    try:
        path = getattr(r, 'path', None)
        methods = getattr(r, 'methods', None)
        endpoint = getattr(r, 'endpoint', None)
        name = getattr(endpoint, '__name__', repr(endpoint)) if endpoint else None
        print(f"{path} {methods} {name}")
    except Exception as e:
        print('ERROR reading route:', e)
