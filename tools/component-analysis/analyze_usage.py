import json
import re
from pathlib import Path

repo_root = Path(r"C:/Users/bcmad/Downloads/A1Betting7-13.2")
analysis_dir = repo_root / "tmp" / "component_analysis"
analysis_dir.mkdir(parents=True, exist_ok=True)

# Load component analysis
comp_file = analysis_dir / "component_analysis_full.json"
if not comp_file.exists():
    print("component_analysis_full.json not found in", analysis_dir)
    raise SystemExit(1)

with open(comp_file, "r", encoding="utf-8") as f:
    components = json.load(f)

# Search target directories
search_dirs = [repo_root / "frontend" / "src", repo_root / "backend"]

# Exclude directories
EXCLUDE_DIRS = {"node_modules", ".git", "__pycache__", "dist", "build"}


def normalize_path(p):
    s = str(p)
    # Convert MSYS-style "/c/Users/..." to Windows-style "C:/Users/..." if present
    m = re.match(r"^/([a-zA-Z])/(.*)", s)
    if m:
        s = f"{m.group(1).upper()}:/{m.group(2)}"
    return s


def file_contains_patterns(path, import_regex, default_import_regex, jsx_regex):
    try:
        txt = Path(path).read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return False, 0
    has_import = bool(re.search(import_regex, txt)) or bool(
        re.search(default_import_regex, txt)
    )
    jsx_count = len(re.findall(jsx_regex, txt))
    return has_import, jsx_count


usage_map = {}
unused_components = []

for comp in components:
    name = comp.get("name")
    path = comp.get("path")
    # prepare regex patterns
    # named import: import { X, Y as Z } from '...'
    import_regex = re.compile(rf"\bimport\s+{{[^}}]*\b{name}\b[^}}]*}}\s+from", re.M)
    # default import: import Name from '...'
    default_import_regex = re.compile(rf"\bimport\s+{name}\s+from\b", re.M)
    # jsx usage: <Name ...> or <Name/> or </Name>
    jsx_regex = re.compile(rf"<\/?{name}(\s|>|/)")

    used_locations = []

    for base in search_dirs:
        if not base.exists():
            continue
        for p in base.rglob("*"):
            if p.is_dir():
                if p.name in EXCLUDE_DIRS:
                    # skip walking into excluded dirs (rglob still yields, so just continue)
                    continue
            if p.suffix.lower() not in {".tsx", ".jsx", ".ts", ".js"}:
                continue
            # Avoid analyzing the component file itself (normalize both)
            try:
                norm_comp_path = normalize_path(path).lower()
                norm_p = normalize_path(str(p)).lower()
            except Exception:
                norm_comp_path = str(path).lower()
                norm_p = str(p).lower()
            if norm_p == norm_comp_path:
                continue

            has_import, jsx_count = file_contains_patterns(
                p, import_regex, default_import_regex, jsx_regex
            )
            if has_import or jsx_count:
                used_locations.append(
                    {"file": str(p), "has_import": has_import, "usage_count": jsx_count}
                )

    usage_map[name] = {
        "path": path,
        "usage_count": len(used_locations),
        "used_in": used_locations,
        "complexity": comp.get("complexity_score", 0),
        "has_tests": comp.get("has_tests", False),
    }

    if len(used_locations) == 0:
        unused_components.append(name)

# Save outputs
with open(analysis_dir / "component_usage_map.json", "w", encoding="utf-8") as f:
    json.dump(usage_map, f, indent=2)

with open(analysis_dir / "unused_components.txt", "w", encoding="utf-8") as f:
    for n in unused_components:
        f.write(n + "\n")

# Summary
print("=" * 80)
print("COMPONENT USAGE ANALYSIS")
print("=" * 80)
print("Total components:", len(usage_map))
print("Unused components:", len(unused_components))
print("Used components:", len(usage_map) - len(unused_components))
print("\nTop 10 most used components:")
sorted_by_usage = sorted(
    usage_map.items(), key=lambda x: x[1]["usage_count"], reverse=True
)
for i, (name, data) in enumerate(sorted_by_usage[:10], 1):
    print(f"  {i}. {name} (used in {data['usage_count']} files)")

print("\nWrote usage map to:", analysis_dir / "component_usage_map.json")
print("Wrote unused list to:", analysis_dir / "unused_components.txt")
print("=" * 80)
