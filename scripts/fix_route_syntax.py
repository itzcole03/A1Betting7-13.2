"""
Conservative syntax fixer for backend/routes.
Applies a small set of safe transformations to fix common, repetitive syntax mistakes.
Run from the repo root: python scripts/fix_route_syntax.py
"""

import os
import re
import shutil

ROOT = r"c:\Users\bcmad\Downloads\A1Betting7-13.2\backend\routes"


def safe_fix_file(path: str) -> bool:
    """Return True if file was modified."""
    with open(path, "r", encoding="utf-8") as f:
        s = f.read()
    orig = s

    # 1) Remove misplaced 'from backend.core.exceptions import BusinessLogicException' lines
    s = re.sub(
        r"^\s*from\s+backend\.core\.exceptions\s+import\s+BusinessLogicException\s*$\n",
        "",
        s,
        flags=re.M,
    )

    # 2) Ensure a top-level import exists if file references BusinessLogicException
    if (
        "BusinessLogicException" in s
        and "from backend.core.exceptions import BusinessLogicException" not in s
    ):
        m = re.search(r"^(?:from\s+\S+.*\n|import\s+\S+.*\n)+", s, flags=re.M)
        insert_at = m.end() if m else 0
        s = (
            s[:insert_at]
            + "from backend.core.exceptions import BusinessLogicException\n"
            + s[insert_at:]
        )

    # 3) Fix `return raise` -> `raise`
    s = re.sub(r"\breturn\s+raise\b", "raise", s)

    # 4) Fix common mistaken patterns for str(e) and wrapped calls
    s = s.replace('"str(e"', "str(e")
    s = s.replace('"str(e")', "str(e))")
    s = s.replace(
        'raise BusinessLogicException("str(e"))', "raise BusinessLogicException(str(e))"
    )

    # 5) Fix miswritten f-strings like ("f"Model ...) -> (f"Model ...)
    s = s.replace('("f"', '(f"')
    s = s.replace("(\"f'", "(f'")
    s = s.replace('raise BusinessLogicException("f"', 'raise BusinessLogicException(f"')
    s = s.replace('BusinessLogicException("f"', 'BusinessLogicException(f"')

    # 6) Fix pattern str(e, status_code= -> str(e), status_code=
    s = s.replace("str(e, status_code=", "str(e), status_code=")

    # 7) Fix accidental double quotes like '"f"Model' -> 'f"Model'
    s = s.replace('"f"Model', 'f"Model')

    # 8) Trim trailing stray '"}"' sequences often from broken dict literals -> ')}'
    s = s.replace(')"}', ")}")

    # 9) Balance obvious doubled-quote sequences
    s = s.replace('")")', '")"')

    if s != orig:
        bak = path + ".orig"
        if not os.path.exists(bak):
            shutil.copyfile(path, bak)
        with open(path, "w", encoding="utf-8") as f:
            f.write(s)
        return True
    return False


def main():
    changed = []
    for dirpath, dirs, files in os.walk(ROOT):
        for fn in files:
            if not fn.endswith(".py"):
                continue
            path = os.path.join(dirpath, fn)
            try:
                if safe_fix_file(path):
                    changed.append(path)
            except Exception:
                # skip files that cause unexpected errors during fixes
                continue

    print("files changed:", len(changed))
    for c in changed:
        print(" -", c)
    print("done")


if __name__ == "__main__":
    main()
