"""
Pass 5: remove stray trailing quotes after exception/log/status_code lines and close odd f-strings at line end.
Run: python scripts/fix_route_syntax_pass5.py
"""

import os
import re
import shutil

ROOT = r"c:\Users\bcmad\Downloads\A1Betting7-13.2\backend\routes"

KEYWORDS = (
    "BusinessLogicException",
    "status_code=",
    "raise ",
    "logger.error",
    "ResponseBuilder",
    "return ",
)


def count_unescaped(text, quote):
    cnt = 0
    i = 0
    while True:
        j = text.find(quote, i)
        if j == -1:
            break
        # count backslashes
        back = 0
        k = j - 1
        while k >= 0 and text[k] == "\\":
            back += 1
            k -= 1
        if back % 2 == 0:
            cnt += 1
        i = j + 1
    return cnt


def fix_file(path):
    with open(path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    changed = False
    in_triple = None
    out = []
    for ln in lines:
        s = ln
        # detect triple quotes naive
        if '"""' in s or "'''" in s:
            # toggle naive
            if in_triple is None:
                in_triple = True
            else:
                in_triple = None
        if in_triple is None:
            # 1) remove trailing double quote after )" or )"\n for lines containing KEYWORDS
            if s.rstrip().endswith(')"') or s.rstrip().endswith(')"'):
                if any(k in s for k in KEYWORDS):
                    s = s.rstrip("\n")
                    if s.endswith(')"'):
                        s = s[:-2] + ")\n"
                        changed = True
            # 2) close f-strings that have odd number of unescaped quotes on the line
            if 'f"' in s or "f'" in s:
                dq = count_unescaped(s, '"')
                sq = count_unescaped(s, "'")
                if dq % 2 == 1 and sq % 2 == 0:
                    s = s.rstrip("\n") + '"\n'
                    changed = True
                elif sq % 2 == 1 and dq % 2 == 0:
                    s = s.rstrip("\n") + "'\n"
                    changed = True
        out.append(s)
    if changed:
        bak = path + ".pass5.orig"
        if not os.path.exists(bak):
            shutil.copyfile(path, bak)
        with open(path, "w", encoding="utf-8") as f:
            f.writelines(out)
    return changed


def main():
    changed = []
    for dirpath, dirs, files in os.walk(ROOT):
        for fn in files:
            if not fn.endswith(".py"):
                continue
            path = os.path.join(dirpath, fn)
            try:
                if fix_file(path):
                    changed.append(path)
            except Exception:
                continue
    print("files changed (pass5):", len(changed))
    for c in changed:
        print(" -", c)


if __name__ == "__main__":
    main()
