"""Probe imports for key route modules and write their __file__ paths for triage."""

import importlib
import os
import sys

repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)

modules = [
    "backend.routes.performance",
    "backend.routes.feedback",
    "backend.routes.mlb_extras",
]

out_lines = []
for m in modules:
    try:
        mod = importlib.import_module(m)
        out_lines.append(f"{m} -> {getattr(mod, '__file__', 'NONE')}")
    except Exception as e:
        out_lines.append(f"{m} -> ERROR: {e}")

with open(
    os.path.join(repo_root, "reports", "which_imports_after_clear.txt"),
    "w",
    encoding="utf-8",
) as f:
    f.write("\n".join(out_lines))

print("Wrote reports/which_imports_after_clear.txt")
