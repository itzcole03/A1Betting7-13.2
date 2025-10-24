"""Codemod to replace raise HTTPException(...) with raise BusinessLogicException(...)

This script scans all Python files under backend/routes and performs conservative replacements for
common patterns:
 - raise HTTPException(status_code=XXX, detail=Y) -> raise BusinessLogicException(str(Y), status_code=XXX)
 - raise HTTPException(detail=Y, status_code=XXX) -> same
 - raise HTTPException("message") -> raise BusinessLogicException("message")

It creates .bak copies of changed files.

Run from repo root: python .scripts/codemod_replace_http_exception.py
"""
import re
from pathlib import Path

ROUTES_DIR = Path("backend/routes")

# Patterns to handle
PATTERNS = [
    # status_code=..., detail=... (single-line)
    (re.compile(r"raise\s+HTTPException\s*\(\s*status_code\s*=\s*(?P<code>\d+)\s*,\s*detail\s*=\s*(?P<detail>[^)]+)\)"),
     lambda m: f"raise BusinessLogicException({m.group('detail').strip()}, status_code={m.group('code')})"),

    # detail=..., status_code=... (order reversed)
    (re.compile(r"raise\s+HTTPException\s*\(\s*detail\s*=\s*(?P<detail>[^),]+)\s*,\s*status_code\s*=\s*(?P<code>\d+)\s*\)"),
     lambda m: f"raise BusinessLogicException({m.group('detail').strip()}, status_code={m.group('code')})"),

    # raise HTTPException("some message")
    (re.compile(r"raise\s+HTTPException\s*\(\s*(?P<msg>\"[^\"]*\"|'[^']*')\s*\)"),
     lambda m: f"raise BusinessLogicException({m.group('msg')})"),

    # raise HTTPException(status_code=XXX) -> generic message
    (re.compile(r"raise\s+HTTPException\s*\(\s*status_code\s*=\s*(?P<code>\d+)\s*\)"),
     lambda m: f"raise BusinessLogicException('HTTP error', status_code={m.group('code')})"),
]

IMPORT_LINE = 'from backend.core.exceptions import BusinessLogicException\n'

changed_files = []

for py in ROUTES_DIR.rglob('*.py'):
    try:
        text = py.read_text(encoding='utf-8')
    except Exception:
        continue

    original = text
    new_text = text

    for patt, repl in PATTERNS:
        new_text = patt.sub(repl, new_text)

    if new_text != original:
        # Ensure import present
        if 'BusinessLogicException' not in new_text.splitlines()[0:40]:
            # Try to insert after other imports (after first block of imports)
            lines = new_text.splitlines()
            insert_at = 0
            for i, l in enumerate(lines[:80]):
                if l.strip().startswith('from ') or l.strip().startswith('import '):
                    insert_at = i + 1
            lines.insert(insert_at, IMPORT_LINE.rstrip())
            new_text = '\n'.join(lines) + '\n'

        # Backup original
        bak = py.with_suffix(py.suffix + '.bak')
        bak.write_text(original, encoding='utf-8')
        py.write_text(new_text, encoding='utf-8')
        changed_files.append(str(py))

print(f"Codemod completed. Modified {len(changed_files)} files.")
for f in changed_files:
    print(f" - {f}")
