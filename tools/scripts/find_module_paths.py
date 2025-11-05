import importlib.util
import sys

modules = [
    "backend.routes.metrics_routes",
    "backend.routes.trends_routes",
    "backend.routes.betting",
    "backend.routes.consolidated_ml",
    "backend.routes.diagnostics",
    "backend.routes.streaming.streaming_api",
]
for m in modules:
    spec = importlib.util.find_spec(m)
    print(m, "spec:", spec)
    if spec:
        print("origin:", spec.origin)
print("sys.path:")
for p in sys.path:
    print(" ", p)
