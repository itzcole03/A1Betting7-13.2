"""Check for heavy optional imports outside tests/_compat.

Exit code 1 if any occurrences are found. This is a fast guard intended for CI
so PRs don't accidentally reintroduce import-time heavy dependencies that
break pytest collection on minimal environments.
"""

import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
HEAVY_MODULE_PATTERNS = [
    r"^\s*import\s+torch\b",
    r"^\s*from\s+torch\b",
    r"^\s*import\s+tensorflow\b",
    r"^\s*from\s+tensorflow\b",
    r"^\s*import\s+ray\b",
    r"^\s*from\s+ray\b",
    r"^\s*import\s+torch_geometric\b",
    r"^\s*from\s+torch_geometric\b",
]
PATTERNS = [re.compile(p) for p in HEAVY_MODULE_PATTERNS]

# Only scan a small set of top-level locations we want to keep shim-free.
SCAN_PATHS = [
    os.path.join(ROOT, "utils"),
    os.path.join(ROOT, "torch"),
]

EXTS = {".py"}
issues = []
for base in SCAN_PATHS:
    if not os.path.exists(base):
        continue
    for dirpath, dirnames, filenames in os.walk(base):
        # ignore virtualenv and .git directories if they somehow appear here
        if ".venv" in dirpath or ".git" in dirpath:
            continue
        for fn in filenames:
            if not any(fn.endswith(ext) for ext in EXTS):
                continue
            full = os.path.join(dirpath, fn)
            try:
                with open(full, "r", encoding="utf-8") as f:
                    for i, line in enumerate(f, start=1):
                        for pat in PATTERNS:
                            if pat.search(line):
                                # Allow matches if file path contains tests/_compat
                                if os.path.normpath(
                                    os.path.join(ROOT, "tests", "_compat")
                                ) in os.path.normpath(full):
                                    continue
                                issues.append((full, i, line.strip()))
            except UnicodeDecodeError:
                # skip binary files
                continue

if issues:
    print("Found heavy optional imports outside tests/_compat:")
    for path, ln, text in issues:
        print(f"  {path}:{ln}: {text}")
    print(
        "\nPlease move lightweight shims into tests/_compat or guard imports behind runtime checks."
    )
    sys.exit(1)

print(
    "No problems found: heavy optional imports are isolated to tests/_compat (or ignored directories)."
)
sys.exit(0)
