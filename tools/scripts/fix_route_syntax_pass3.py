"""
Third conservative pass to fix trailing stray quotes and obvious unmatched trailing braces from prior edits.
Run from repo root: python scripts/fix_route_syntax_pass3.py
"""

import os
import re
import shutil

ROOT = r"c:\Users\bcmad\Downloads\A1Betting7-13.2\backend\routes"

PATTERNS = [
    # Remove stray double-quote immediately after a closing parenthesis for BusinessLogicException calls
    (re.compile(r'(BusinessLogicException\([^\)]*\))"'), r"\1"),
    # Remove stray double-quote immediately after closing paren anywhere at line end
    (re.compile(r'(\)\s*)"\s*(#.*)?$'), r"\1\2"),
    # Replace '"})' patterns -> '})'
    (re.compile(r'"\}\)'), r"}\)"),
    # Replace ')}"' -> ')}'
    (re.compile(r'\)\}"'), r")}"),
]


def safe_fix_file(path: str) -> bool:
    with open(path, "r", encoding="utf-8") as f:
        s = f.read()
    orig = s
    for pat, repl in PATTERNS:
        s = pat.sub(repl, s)
    # Fix obvious '... )}' sequences where a '"' may have been left: ')")}' -> ')}'
    s = s.replace(')")}', ")}")
    s = s.replace(')"}', ")}")
    s = s.replace('}"', "}")
    # Remove stray trailing '}' on lines that end with ') }' -> ')
    s = re.sub(r"\)\}\s*$", ")", s, flags=re.M)

    if s != orig:
        bak = path + ".pass3.orig"
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
                continue
    print("files changed (pass3):", len(changed))
    for c in changed:
        print(" -", c)


if __name__ == "__main__":
    main()
