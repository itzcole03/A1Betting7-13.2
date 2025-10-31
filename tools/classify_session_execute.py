"""
Simple heuristic script to find non-test uses of `session.execute(` and guess whether
those files use SQLModel AsyncSession or raw SQLAlchemy AsyncSession.

Outputs JSON to `tools/classify_session_execute_output.json` and prints a short report.

Heuristics (conservative):
- If file contains 'from sqlmodel' or 'sqlmodel.ext.asyncio' or 'get_async_session' => guess SQLModel
- If file contains 'from sqlalchemy.ext.asyncio' or 'enhanced_database' or 'create_async_engine' => guess SQLAlchemy
- If both indicators present => 'mixed'
- Skip files under tests/ and files with .bak or _orig_backups_ in their path

This is a helper for the cautious execute()->exec sweep.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Dict, List

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(__file__).resolve().parent / "classify_session_execute_output.json"

EXCLUDE_DIRS = {"tests", "venv", ".venv", "node_modules"}
EXCLUDE_SUFFIXES = {".bak", ".orig", ".pass", ".broken"}

KEY_EXEC = "session.execute("

IND_SQLMODEL = [
    "from sqlmodel",
    "sqlmodel.ext.asyncio",
    "get_async_session",
    "SQLModel",
]
IND_SQLALCHEMY = [
    "from sqlalchemy.ext.asyncio",
    "enhanced_database",
    "create_async_engine",
    "sqlalchemy.ext.asyncio",
    "AsyncSession",
]


def should_skip(path: Path) -> bool:
    s = str(path)
    if any(part in s for part in ("_orig_backups_", "_orig_backups")):
        return True
    if any(p in s for p in EXCLUDE_DIRS):
        return True
    if any(s.endswith(suf) for suf in EXCLUDE_SUFFIXES):
        return True
    return False


def classify_file(path: Path) -> str:
    try:
        text = path.read_text(encoding="utf-8")
    except Exception:
        return "unknown"

    # Quick guard: if file doesn't contain session.execute, skip
    if KEY_EXEC not in text:
        return "none"

    has_sqlmodel = any(k in text for k in IND_SQLMODEL)
    has_sqlalchemy = any(k in text for k in IND_SQLALCHEMY)

    if has_sqlmodel and has_sqlalchemy:
        return "mixed"
    if has_sqlmodel:
        return "sqlmodel"
    if has_sqlalchemy:
        return "sqlalchemy"

    # Fallback: look at imports lines
    lines = text.splitlines()
    import_lines = "\n".join(l for l in lines[:60])
    if "sqlmodel" in import_lines:
        return "sqlmodel"
    if "sqlalchemy" in import_lines or "enhanced_database" in import_lines:
        return "sqlalchemy"

    return "unknown"


def main() -> None:
    results: List[Dict[str, str]] = []

    for p in ROOT.rglob("*.py"):
        # skip the script itself
        if p.samefile(Path(__file__)):
            continue
        if should_skip(p):
            continue
        try:
            text = p.read_text(encoding="utf-8")
        except Exception:
            continue
        if KEY_EXEC in text:
            guess = classify_file(p)
            results.append({"path": str(p.relative_to(ROOT)), "classification": guess})

    # Save output
    OUT.write_text(json.dumps(results, indent=2), encoding="utf-8")

    # Print short report
    counts: Dict[str, int] = {}
    for r in results:
        counts[r["classification"]] = counts.get(r["classification"], 0) + 1

    print("Found {} files with 'session.execute('.".format(len(results)))
    for k, v in counts.items():
        print(f"  {k}: {v}")
    print(f"Detailed output written to: {OUT}")


if __name__ == "__main__":
    main()
