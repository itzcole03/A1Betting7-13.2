import importlib
import inspect
import os
import sys
import traceback
from pathlib import Path

# Ensure repo root is on sys.path so `import backend...` works when running
# this script from the reports directory or via a task.
repo_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(repo_root))

out_path = str(Path(__file__).resolve().parents[0] / "probe_feedback_result.txt")
try:
    mod = importlib.import_module("backend.routes.feedback")
    mod_file = getattr(mod, "__file__", None)
    version = getattr(mod, "FEEDBACK_WRAPPER_VERSION", None)
    src = inspect.getsource(mod)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(f"MODULE FILE: {mod_file}\n")
        f.write(f"FEEDBACK_WRAPPER_VERSION: {version}\n\n")
        f.write("SOURCE SNIPPET:\n")
        f.write("\n".join(src.splitlines()[:200]))
    print("WROTE", out_path)
except Exception:
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("IMPORT FAILED:\n")
        traceback.print_exc(file=f)
    raise
