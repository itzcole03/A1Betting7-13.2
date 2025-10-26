"""Simple analyzer to report try blocks without except/finally in a Python file.
Usage: python scripts/check_try_blocks.py backend/routes/unified_api.py
"""

import sys
from pathlib import Path


def check_file(path: Path):
    lines = path.read_text(encoding="utf-8").splitlines()
    stack = []  # list of (indent_level, line_no)
    issues = []
    for i, line in enumerate(lines, start=1):
        stripped = line.lstrip("\t ")
        indent = len(line) - len(stripped)
        if stripped.startswith("try:"):
            stack.append((indent, i))
        elif stripped.startswith("except") or stripped.startswith("finally"):
            if not stack:
                issues.append((i, "except/finally without try"))
            else:
                stack.pop()
    # any remaining tries without except/finally
    for indent, lineno in stack:
        issues.append((lineno, "try without except/finally"))
    return issues


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/check_try_blocks.py <file>")
        sys.exit(1)
    p = Path(sys.argv[1])
    if not p.exists():
        print("File not found:", p)
        sys.exit(1)
    issues = check_file(p)
    if not issues:
        print("No issues found")
    else:
        for lineno, msg in issues:
            print(f"{p}:{lineno}: {msg}")
