"""Conservative fixer pass #6
- Replace accidental runs of four double-quote characters into proper triple-quote delimiters
- Backup modified files as .pass6.orig

Run from the repository root using the same Python interpreter used previously.
"""

import io
import os
from pathlib import Path

ROOT = Path(r"c:\Users\bcmad\Downloads\A1Betting7-13.2\backend\routes")


def fix_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    new = text.replace('""""', '"""')
    # Also collapse literal occurrences of 4 single quotes if present
    new = new.replace("'''''", "'''")
    if new != text:
        backup = path.with_suffix(path.suffix + ".pass6.orig")
        backup.write_text(text, encoding="utf-8")
        path.write_text(new, encoding="utf-8")
        print(f"patched: {path} -> backup: {backup.name}")
        return True
    return False


def main():
    changed = 0
    checked = 0
    for p in ROOT.rglob("*.py"):
        checked += 1
        try:
            if fix_file(p):
                changed += 1
        except Exception as e:
            print("ERROR", p, e)
    print("\nchecked files:", checked)
    print("files changed (pass6):", changed)


if __name__ == "__main__":
    main()
