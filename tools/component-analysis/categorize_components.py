import json
from pathlib import Path

repo_root = Path(r"C:/Users/bcmad/Downloads/A1Betting7-13.2")
analysis_dir = repo_root / "tmp" / "component_analysis"

comp_file = analysis_dir / "component_analysis_full.json"
usage_file = analysis_dir / "component_usage_map.json"

for p in (comp_file, usage_file):
    if not p.exists():
        print(f"ERROR: required file {p} not found. Run previous analysis steps first.")
        raise SystemExit(1)

with open(comp_file, "r", encoding="utf-8") as f:
    components = json.load(f)
with open(usage_file, "r", encoding="utf-8") as f:
    usage_map = json.load(f)

categories = {
    "DELETE_UNUSED": [],
    "INTEGRATE": [],
    "CONSOLIDATE": [],
    "OPTIMIZE": [],
    "KEEP_AS_IS": [],
    "ADD_TESTS": [],
}

for comp in components:
    name = comp.get("name")
    usage_data = usage_map.get(name, {})
    usage_count = usage_data.get("usage_count", 0)
    has_tests = bool(comp.get("has_tests"))
    complexity = int(comp.get("complexity_score", 0) or 0)
    path = comp.get("path")

    if usage_count == 0:
        # Unused component
        if complexity > 50:
            categories["INTEGRATE"].append(
                {
                    "name": name,
                    "path": path,
                    "reason": "High complexity, likely valuable",
                    "complexity": complexity,
                }
            )
        else:
            categories["DELETE_UNUSED"].append(
                {"name": name, "path": path, "reason": "Unused and low complexity"}
            )
    elif usage_count > 10:
        # Heavily used component
        if has_tests:
            categories["KEEP_AS_IS"].append(
                {"name": name, "path": path, "usage_count": usage_count}
            )
        else:
            categories["ADD_TESTS"].append(
                {
                    "name": name,
                    "path": path,
                    "usage_count": usage_count,
                    "priority": "HIGH",
                }
            )
    elif usage_count > 0:
        # Moderately used
        if not has_tests:
            categories["ADD_TESTS"].append(
                {
                    "name": name,
                    "path": path,
                    "usage_count": usage_count,
                    "priority": "MEDIUM",
                }
            )
        elif complexity > 100:
            categories["OPTIMIZE"].append(
                {
                    "name": name,
                    "path": path,
                    "complexity": complexity,
                    "reason": "High complexity, consider refactoring",
                }
            )
        else:
            categories["KEEP_AS_IS"].append(
                {"name": name, "path": path, "usage_count": usage_count}
            )

out = analysis_dir / "component_categories.json"
with open(out, "w", encoding="utf-8") as f:
    json.dump(categories, f, indent=2)

print("=" * 80)
print("COMPONENT CATEGORIZATION")
print("=" * 80)
for category, items in categories.items():
    print(f"{category}: {len(items)} components")
print("=" * 80)
print("\nCategorization saved to:", out)
