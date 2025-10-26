import importlib
import inspect
import sys

try:
    mod = importlib.import_module("backend.routes.feedback")
    print("MODULE FILE:", getattr(mod, "__file__", None))
    src = inspect.getsource(mod)
    print("SOURCE SNIPPET:\n", "\n".join(src.splitlines()[:200]))
except Exception as e:
    import traceback

    traceback.print_exc()
    sys.exit(1)
