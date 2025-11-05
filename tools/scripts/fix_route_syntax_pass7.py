r"""
Conservative fixer pass7 for backend/routes

- Backs up each modified file as <filename>.pass7.orig
- Applies only very conservative text transforms to reduce common parse errors
    observed during earlier passes:
    - remove stray '})\)' sequences inside strings
    - fix router decorator trailing quote/paren ordering when mis-quoted
    - remove stray quote characters that sometimes follow a closed docstring
    - for logger.* lines with an f-string that ends with a stray ')', remove it

This pass aims to reduce obvious unterminated-string and decorator syntax issues
without changing program semantics otherwise. It writes a .pass7.orig backup
for each file it modifies.
"""

import io
import os
import re

ROOT = os.path.join(os.path.dirname(__file__), "..", "backend", "routes")


def fix_content_text(content: str) -> tuple[str, bool]:
    changed = False
    lines = content.splitlines(True)
    out_lines = []

    for line in lines:
        new_line = line

        # 1) remove literal '}\)' sequences that commonly appear inside strings
        if "})\\)" in new_line:
            new_line = new_line.replace("})\\)", "})")
        if "}\\)" in new_line:
            new_line = new_line.replace("}\\)", "}")

        # 2) Fix mis-ordered decorator trailing quote/paren: @router.post("/{id})"
        if new_line.strip().startswith("@router.") and ')"' in new_line:
            new_line = new_line.replace(')"', '")')

        # 3) Remove a trailing single-quote that sometimes follows a closed docstring
        #    e.g. ..."""' or ...''''
        stripped = new_line.rstrip()
        if stripped.endswith('"""\'') or stripped.endswith("''''"):
            new_line = stripped[:-1] + "\n"

        # 4) logger lines: if logger.* contains an f-string and the first/only quoted
        #    argument ends with a stray ')' just before the closing quote, drop that ')'
        if "logger." in new_line and 'f"' in new_line:
            # simple heuristic: find the first f"..." occurrence and if it ends with ')', remove it
            match = re.search(r"f\"(.*?)\"", new_line)
            if match:
                inner = match.group(1)
                if inner.endswith(")"):
                    fixed_inner = inner[:-1]
                    new_line = new_line.replace(f'f"{inner}"', f'f"{fixed_inner}"')

        if new_line != line:
            changed = True
        out_lines.append(new_line)

    return "".join(out_lines), changed


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
                print("SKIP (read error):", path, e)
                continue

            new_content, changed = fix_content_text(content)
            if changed:
                bak = path + ".pass7.orig"
                # write backup
                with io.open(bak, "w", encoding="utf-8") as bh:
                    bh.write(content)
                # write fixed file
                with io.open(path, "w", encoding="utf-8") as fh:
                    fh.write(new_content)
                changed_files.append(path)

    print("checked files:", checked)
    print("files changed (pass7):", len(changed_files))
    for p in changed_files:
        print("patched:", p)


if __name__ == "__main__":
    main()
