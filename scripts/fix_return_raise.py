"""Fix 'return raise' occurrences across backend route files.

This script replaces the invalid pattern "return raise" with "raise" in
Python files under backend/routes so modules can be imported.

Run it from the repository root.
"""

import pathlib

root = pathlib.Path(__file__).resolve().parent.parent
routes_dir = root / "backend" / "routes"

modified_files = []
for path in routes_dir.rglob("*.py"):
    text = path.read_text(encoding="utf-8")
    if "return raise " in text:
        new_text = text.replace("return raise ", "raise ")
        path.write_text(new_text, encoding="utf-8")
        modified_files.append(str(path.relative_to(root)))

if modified_files:
    print("Modified files:")
    for f in modified_files:
        print(f)
else:
    print("No files changed")
