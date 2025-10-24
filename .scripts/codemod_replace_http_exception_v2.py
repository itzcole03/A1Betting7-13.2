"""Conservative codemod to replace remaining raise HTTPException and direct error returns
with BusinessLogicException across backend/routes.
Creates backups with .bak extension.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ROUTES_DIR = ROOT / "backend" / "routes"

HTTP_RE = re.compile(r"raise\s+HTTPException\s*\(", re.MULTILINE)
JSONRESP_ERR_RE = re.compile(r'JSONResponse\([^\)]*\{[^\}]*["\']error["\'][^\}]*\}[^\)]*\)', re.MULTILINE | re.DOTALL)
RETURN_ERR_RE = re.compile(r"return\s+\{\s*[\"']error[\"']\s*:\s*[^\}]+\}", re.MULTILINE)
RETURN_STATUS_ERROR_RE = re.compile(r"return\s+\{\s*[\"']status[\"']\s*:\s*[\"']error[\"']", re.MULTILINE)

IMPORT_LINE = "from backend.core.exceptions import BusinessLogicException\n"

modified = []
for py in ROUTES_DIR.glob("*.py"):
    if py.name.startswith("__"):
        continue
    text = py.read_text(encoding='utf-8')
    orig = text
    changed = False

    # Replace raise HTTPException(...)
    if HTTP_RE.search(text):
        text = HTTP_RE.sub("raise BusinessLogicException(", text)
        changed = True

    # Replace JSONResponse(...) that include an "error" key with BusinessLogicException
    def jsonresp_replacer(m):
        # Create a conservative replacement: raise BusinessLogicException("Service error")
        return "raise BusinessLogicException(\"Service error\")"

    if JSONRESP_ERR_RE.search(text):
        text = JSONRESP_ERR_RE.sub(jsonresp_replacer, text)
        changed = True

    # Replace return {"error": ...}
    if RETURN_ERR_RE.search(text):
        text = RETURN_ERR_RE.sub("raise BusinessLogicException(\"Handler error\")", text)
        changed = True

    # Replace return {"status": "error" ...}
    if RETURN_STATUS_ERROR_RE.search(text):
        text = RETURN_STATUS_ERROR_RE.sub("raise BusinessLogicException(\"Handler status error\")", text)
        changed = True

    if changed:
        # Ensure import exists
        if IMPORT_LINE.strip() not in text:
            # Insert after other imports (after first block of from / import lines)
            lines = text.splitlines(True)
            insert_at = 0
            for i, l in enumerate(lines):
                if l.strip().startswith('from ') or l.strip().startswith('import '):
                    insert_at = i + 1
            lines.insert(insert_at, IMPORT_LINE)
            text = ''.join(lines)

        # Write backup and new file
        bak = py.with_suffix(py.suffix + '.bak')
        bak.write_text(orig, encoding='utf-8')
        py.write_text(text, encoding='utf-8')
        modified.append(str(py))

print(f"Codemod v2 completed. Modified {len(modified)} files.")
for m in modified:
    print(m)
