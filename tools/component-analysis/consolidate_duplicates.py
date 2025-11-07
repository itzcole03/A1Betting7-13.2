import json
import os
import re
import shutil
from datetime import datetime
from pathlib import Path

repo_root = Path(r"C:/Users/bcmad/Downloads/A1Betting7-13.2")
analysis_dir = repo_root / "tmp" / "component_analysis"

dup_file = analysis_dir / "duplicate_components.json"
usage_file = analysis_dir / "component_usage_map.json"
components_file = analysis_dir / "component_analysis_full.json"

if not dup_file.exists():
    print("duplicate_components.json not found. Run duplicate detection first.")
    raise SystemExit(1)

with open(dup_file, "r", encoding="utf-8") as f:
    pairs = json.load(f)
with open(usage_file, "r", encoding="utf-8") as f:
    usage_map = json.load(f)
with open(components_file, "r", encoding="utf-8") as f:
    components = json.load(f)

# Map name -> component entries
comp_by_name = {c["name"]: c for c in components}

# Filter pairs by high similarity
THRESHOLD = 0.92
high_pairs = [p for p in pairs if p.get("similarity", 0) >= THRESHOLD]

# Build clusters (union-find)
parents: dict[str, str] = {}


def find(x):
    parents.setdefault(x, x)
    if parents[x] != x:
        parents[x] = find(parents[x])
    return parents[x]


def union(x, y):
    ra, rb = find(x), find(y)
    if ra != rb:
        parents[rb] = ra


for p in high_pairs:
    a = p["component1"]
    b = p["component2"]
    union(a, b)

# Group members
clusters: dict[str, set] = {}
for name in list(comp_by_name.keys()):
    r = find(name) if name in parents else None
    if r:
        clusters.setdefault(r, set()).add(name)

# Keep only clusters with size > 1
clusters = {k: v for k, v in clusters.items() if len(v) > 1}

print(f"Found {len(clusters)} clusters with similarity >= {THRESHOLD}")

# Prepare base dir
base_dir = repo_root / "frontend" / "src" / "components" / "base"
base_dir.mkdir(parents=True, exist_ok=True)

# Backup dir
timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
backup_dir = analysis_dir / f"consolidation_backups_{timestamp}"
backup_dir.mkdir(parents=True, exist_ok=True)

manifest = []

for root, members_set in clusters.items():
    members = sorted(list(members_set))
    # choose canonical: prefer name with usage_count>0 and highest usage, else highest complexity
    best = None
    best_usage = -1
    for name in members:
        usage = usage_map.get(name, {}).get("usage_count", 0)
        if usage > best_usage:
            best = name
            best_usage = usage
    if best is None:
        best = members[0]
    # if best has zero usage, try choose highest complexity
    if best_usage == 0:
        best = max(
            members,
            key=lambda n: int(comp_by_name.get(n, {}).get("complexity_score", 0) or 0),
        )

    best_entry = comp_by_name.get(best)
    if not best_entry:
        continue
    best_path = Path(best_entry["path"])
    # normalize path if starts with /c/
    m = re.match(r"^/([a-zA-Z])/(.*)", str(best_path))
    if m:
        best_path = Path(f"{m.group(1).upper()}:/{m.group(2)}")
    if not best_path.exists():
        # try removing leading backslash
        best_path = Path(str(best_path).lstrip("\\"))
    if not best_path.exists():
        print("Canonical path not found for", best, best_path)
        continue

    # copy canonical to base
    dest_name = best_path.name
    dest_path = base_dir / dest_name
    if not dest_path.exists():
        shutil.copy2(best_path, dest_path)
        print("Copied canonical", best_path, "->", dest_path)
    else:
        print("Canonical already exists at", dest_path)

    # For each other member, overwrite to re-export from base
    for member in members:
        if member == best:
            continue
        entry = comp_by_name.get(member)
        if not entry:
            continue
        member_path = Path(entry["path"])
        m = re.match(r"^/([a-zA-Z])/(.*)", str(member_path))
        if m:
            member_path = Path(f"{m.group(1).upper()}:/{m.group(2)}")
        if not member_path.exists():
            member_path = Path(str(member_path).lstrip("\\"))
        if not member_path.exists():
            print("Member path not found", member, member_path)
            continue
        # backup
        rel_backup = backup_dir / Path(member_path.name)
        shutil.copy2(member_path, rel_backup)
        # compute relative import from member file to base dest_path
        rel = Path(member_path.parent).relative_to(repo_root)  # relative to repo
        # compute import path relative from member to base: use posix style
        member_parent = member_path.parent
        try:
            relative_import = Path(
                os.path.relpath(dest_path, start=member_parent)
            ).as_posix()
        except (ValueError, OSError):
            # fallback simple
            relative_import = str(dest_path.relative_to(member_parent)).replace(
                "\\", "/"
            )
        # If relative_import does not start with '.', make it './'
        if not relative_import.startswith("."):
            relative_import = "./" + relative_import
        # strip file extension for TS imports
        rel_import_no_ext = re.sub(r"\\.tsx?$|\\.jsx?$", "", relative_import)
        # create re-export content
        reexport = f"// AUTO-GENERATED: re-export to consolidated component\nexport * from '{rel_import_no_ext}';\nexport {{ default }} from '{rel_import_no_ext}';\n"
        # write
        with open(member_path, "w", encoding="utf-8") as mf:
            mf.write(reexport)
        manifest.append(
            {
                "canonical": str(dest_path),
                "reexported": str(member_path),
                "original_backup": str(rel_backup),
            }
        )
        print("Re-exported", member_path, "->", dest_path)

# save manifest
with open(
    analysis_dir / f"consolidation_manifest_{timestamp}.json", "w", encoding="utf-8"
) as mf:
    json.dump(manifest, mf, indent=2)

print("Consolidation complete. Manifest written.")
