"""Move .orig backup files out of backend/routes into a timestamped backup folder.

Usage: python scripts/cleanup_route_orig_files.py

This script will:
- create directory `backend/routes/_orig_backups_<YYYYmmdd_HHMMSS>`
- move all files matching `*.orig` and `*.pass*.orig` from `backend/routes` into that dir
- write a manifest file with the list of moved files
- be careful: it only moves files (no deletes) and prints a summary
"""

from __future__ import annotations

import os
import shutil
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ROUTES_DIR = ROOT / "backend" / "routes"
if not ROUTES_DIR.exists():
    print(f"Routes directory not found: {ROUTES_DIR}")
    raise SystemExit(1)

timestamp = time.strftime("%Y%m%d_%H%M%S")
backup_dir = ROUTES_DIR / f"_orig_backups_{timestamp}"
backup_dir.mkdir(parents=True, exist_ok=False)

moved = []
for p in ROUTES_DIR.glob("*.orig"):
    dest = backup_dir / p.name
    shutil.move(str(p), str(dest))
    moved.append((str(p), str(dest)))

# also move files like *.pass*.orig
for p in ROUTES_DIR.glob("*.pass*.orig"):
    dest = backup_dir / p.name
    shutil.move(str(p), str(dest))
    moved.append((str(p), str(dest)))

manifest = backup_dir / "manifest_moved.txt"
with manifest.open("w", encoding="utf-8") as mf:
    for src, dst in moved:
        mf.write(f"{src} -> {dst}\n")

print(f"Moved {len(moved)} files to {backup_dir}")
print(f"Manifest written to {manifest}")
if len(moved) > 0:
    print("First 20 moved files:")
    for src, dst in moved[:20]:
        print(src, "->", dst)
else:
    print("No .orig files found to move")
