"""
Second conservative pass to fix recurring f-string/status_code and double-paren issues.
Run from repo root: python scripts/fix_route_syntax_pass2.py
"""

import os
import re
import shutil

ROOT = r"c:\Users\bcmad\Downloads\A1Betting7-13.2\backend\routes"


def transform(s: str) -> str:
    orig = s
    # 1) Replace patterns like {str(e), status_code=500)} inside f-strings to {str(e)}", status_code=500)
    s = re.sub(
        r"\{\s*str\(e\)\s*,\s*status_code\s*=\s*(\d+)\s*\)\s*\}",
        r'{str(e)}", status_code=\1)',
        s,
    )
    # 2) Fix stray quote inside {str(e") -> {str(e)}
    s = s.replace('{str(e")', "{str(e)}")
    s = s.replace('{str(e")}', "{str(e)}")
    s = s.replace('{str(e"}', "{str(e)}")
    # 3) Collapse double closing parens for status_code=xxx)) -> status_code=xxx)
    s = re.sub(r"status_code\s*=\s*(\d+)\)\)", r"status_code=\1)", s)
    # 4) Remove stray extra trailing ')' after BusinessLogicException calls like raise BusinessLogicException(str(e), status_code=400))
    s = re.sub(
        r"BusinessLogicException\(([^\)]*status_code\s*=\s*\d+)\)\)",
        r"BusinessLogicException(\1)",
        s,
    )
    # 5) Fix some obvious unterminated string patterns like "Too many opportunities (max 20")" -> "Too many opportunities (max 20)"
    s = s.replace('(max 20")"', '(max 20)")')
    s = s.replace('(max 20")', '(max 20)")')
    # 6) Fix patterns like {k: v for k, v in model_data.items()) -> {k: v for k, v in model_data.items()} (extra ')')
    s = re.sub(
        r"for\s+[^)]*items\(\)\)\s*\)", lambda m: m.group(0).replace("))", ")"), s
    )
    return s


def safe_fix_file(path: str) -> bool:
    with open(path, "r", encoding="utf-8") as f:
        s = f.read()
    new = transform(s)
    if new != s:
        bak = path + ".pass2.orig"
        if not os.path.exists(bak):
            shutil.copyfile(path, bak)
        with open(path, "w", encoding="utf-8") as f:
            f.write(new)
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
    print("files changed (pass2):", len(changed))
    for c in changed:
        print(" -", c)


if __name__ == "__main__":
    main()
