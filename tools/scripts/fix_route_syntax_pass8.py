"""
Conservative fixer pass8 for backend/routes

- Fix common f-string trailing paren issues like f"...{e})" -> f"...{e}"
- Fix decorator lines where the closing quote was placed after the response_model
  argument, e.g. @router.get("/path/{id}, response_model=Model)" ->
  @router.get("/path/{id}", response_model=Model)

Backs up each modified file as <file>.pass8.orig
"""

import io
import os
import re

ROOT = os.path.join(os.path.dirname(__file__), "..", "backend", "routes")


def fix_content(content: str) -> tuple[str, bool]:
    changed = False
    new = content

    # 1) Fix f-string trailing paren patterns: {e}) or {str(e)}) -> remove the )
    new2 = re.sub(r"\{\s*str\(([^)]+)\)\}\)", r"{str(\1)}", new)
    new2 = re.sub(r"\{\s*([^}]+)\}\)", r"{\1}", new2)

    # 2) Fix decorator mis-quoted response_model (move closing quote before comma)
    # pattern: @router.<method>("/path/{id}, response_model=Model)
    deco_pattern = re.compile(r'(@router\.\w+\()("[^"]+),\s*(response_model=[^)]+\))')
    new3 = deco_pattern.sub(r"\1\2\", \3", new2)

    if new3 != content:
        changed = True
    return new3, changed


def main():
    changed_files = []
    checked = 0
    for dirpath, _, files in os.walk(ROOT):
        for f in files:
            if not f.endswith(".py"):
                continue
            checked += 1
            path = os.path.join(dirpath, f)
            try:
                with io.open(path, "r", encoding="utf-8") as fh:
                    content = fh.read()
            except Exception as e:
                print("SKIP (read):", path, e)
                continue

            new_content, changed = fix_content(content)
            if changed:
                bak = path + ".pass8.orig"
                with io.open(bak, "w", encoding="utf-8") as bh:
                    bh.write(content)
                with io.open(path, "w", encoding="utf-8") as fh:
                    fh.write(new_content)
                changed_files.append(path)

    print("checked files:", checked)
    print("files changed (pass8):", len(changed_files))
    for p in changed_files:
        print("patched:", p)


if __name__ == "__main__":
    main()
