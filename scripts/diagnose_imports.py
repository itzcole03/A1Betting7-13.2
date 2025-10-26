import importlib
import sys
import traceback

modules = [
    "backend.routes.metrics_routes",
    "backend.routes.trends_routes",
    "backend.routes.betting",
    "backend.routes.consolidated_ml",
    "backend.routes.diagnostics",
    "backend.routes.streaming.streaming_api",
]
for m in modules:
    try:
        mod = importlib.import_module(m)
        print(m, "->", getattr(mod, "__file__", "built-in"))
    except Exception:
        print("IMPORT ERROR for", m)
        traceback.print_exc()
        sys.stdout.flush()
