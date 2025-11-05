"""Probe which file is imported for backend.routes.performance and write result to reports/which_performance.txt"""

import importlib
import os
import sys

repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)

out = []
try:
    mod = importlib.import_module("backend.routes.performance")
    out.append(f"module_file={getattr(mod, '__file__', 'NONE')}")
    src = open(mod.__file__, "r", encoding="utf-8").read()
    out.append("---SOURCE_SNIPPET---")
    out.append("\n".join(src.splitlines()[:80]))
except Exception as e:
    out.append("ERROR:" + str(e))

with open(
    os.path.join(repo_root, "reports", "which_performance.txt"), "w", encoding="utf-8"
) as f:
    f.write("\n".join(out))

print("Wrote reports/which_performance.txt")
