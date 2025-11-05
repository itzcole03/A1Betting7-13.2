"""
Pass 4: balance unpaired single/double quotes on lines outside triple-quoted blocks.
This is heuristic and conservative: it only appends a missing closing quote at end of line when a line has an odd number of unescaped quotes.
Backups are saved as .pass4.orig
Run: python scripts/fix_route_syntax_pass4.py
"""

import os
import shutil

ROOT = r"c:\Users\bcmad\Downloads\A1Betting7-13.2\backend\routes"


def fix_file(path):
    with open(path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    in_triple = None
    changed = False
    out = []
    for ln in lines:
        s = ln
        # detect entering/exiting triple quotes
        # count occurrences of triple quotes (""" or '''), toggling state
        i = 0
        while True:
            idx = s.find('"""', i)
            idx2 = s.find("'''", i)
            if idx == -1 and idx2 == -1:
                break
            if idx != -1 and (idx2 == -1 or idx < idx2):
                # found """
                if in_triple == '"""':
                    in_triple = None
                elif in_triple is None:
                    in_triple = '"""'
                i = idx + 3
            else:
                if in_triple == "'''":
                    in_triple = None
                elif in_triple is None:
                    in_triple = "'''"
                i = idx2 + 3
        if in_triple is None:
            # Only operate on lines outside triple-quoted blocks
            # Count unescaped double quotes
            def count_unescaped(text, quote):
                cnt = 0
                i = 0
                while True:
                    j = text.find(quote, i)
                    if j == -1:
                        break
                    # if preceded by backslash and not itself escaped
                    back = 0
                    k = j - 1
                    while k >= 0 and text[k] == "\\":
                        back += 1
                        k -= 1
                    if back % 2 == 0:
                        cnt += 1
                    i = j + 1
                return cnt

            dq = count_unescaped(s, '"')
            sq = count_unescaped(s, "'")
            # If line has odd number of double quotes and even single quotes, close double quote
            if dq % 2 == 1 and sq % 2 == 0:
                s = s.rstrip("\n") + '"\n'
                changed = True
            # Else if single quotes odd and double quotes even, close single quote
            elif sq % 2 == 1 and dq % 2 == 0:
                s = s.rstrip("\n") + "'\n"
                changed = True
        out.append(s)
    if changed:
        bak = path + ".pass4.orig"
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
    print("files changed (pass4):", len(changed))
    for c in changed:
        print(" -", c)


if __name__ == "__main__":
    main()
