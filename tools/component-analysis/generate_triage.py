import csv
import json
from pathlib import Path

repo_root = Path(r"C:/Users/bcmad/Downloads/A1Betting7-13.2")
analysis_dir = repo_root / "tmp" / "component_analysis"

# Input files
comp_file = analysis_dir / "component_analysis_full.json"
usage_file = analysis_dir / "component_usage_map.json"
dup_file = analysis_dir / "duplicate_components.json"
cat_file = analysis_dir / "component_categories.json"

for p in (comp_file, usage_file, dup_file, cat_file):
    if not p.exists():
        print(f"ERROR: required file {p} not found. Run previous analysis steps first.")
        raise SystemExit(1)

with open(comp_file, "r", encoding="utf-8") as f:
    components = json.load(f)
with open(usage_file, "r", encoding="utf-8") as f:
    usage_map = json.load(f)
with open(dup_file, "r", encoding="utf-8") as f:
    duplicates = json.load(f)
with open(cat_file, "r", encoding="utf-8") as f:
    categories = json.load(f)

# Build duplicate counts per component name
dup_count = {}
dup_partners = {}
for pair in duplicates:
    a = pair.get("component1")
    b = pair.get("component2")
    if not a or not b:
        continue
    dup_count[a] = dup_count.get(a, 0) + 1
    dup_count[b] = dup_count.get(b, 0) + 1
    dup_partners.setdefault(a, set()).add(b)
    dup_partners.setdefault(b, set()).add(a)

# Build component lookup by name (if multiples, prefer first)
comp_lookup = {c["name"]: c for c in components}

# Prepare triage rows
rows = []
for name, comp in comp_lookup.items():
    path = comp.get("path", "")
    complexity = comp.get("complexity_score", 0) or 0
    has_tests = bool(comp.get("has_tests"))
    usage = usage_map.get(name, {})
    usage_count = usage.get("usage_count", 0)
    duplicates_count = dup_count.get(name, 0)
    partners = ",".join(list(dup_partners.get(name, set()))[:3])
    # category membership
    category = "UNKNOWN"
    for cat_name, items in categories.items():
        if any(item.get("name") == name for item in items):
            category = cat_name
            break
    # priority score: untested high-usage are prioritized. Tunable heuristic.
    score = 0
    score += usage_count * 10
    score += duplicates_count * 5
    score += (complexity / 100.0) * 10
    if not has_tests:
        score += 200
    # Lower score for KEEP_AS_IS
    if category == "KEEP_AS_IS":
        score -= 100
    rows.append(
        {
            "name": name,
            "path": path,
            "usage_count": usage_count,
            "complexity": complexity,
            "has_tests": has_tests,
            "duplicates_count": duplicates_count,
            "duplicate_sample": partners,
            "category": category,
            "priority_score": round(score, 2),
        }
    )

# Sort by score descending
rows_sorted = sorted(rows, key=lambda r: r["priority_score"], reverse=True)

# Write CSV
out_csv = analysis_dir / "component_triage.csv"
with open(out_csv, "w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(
        f,
        fieldnames=[
            "name",
            "path",
            "usage_count",
            "complexity",
            "has_tests",
            "duplicates_count",
            "duplicate_sample",
            "category",
            "priority_score",
        ],
    )
    writer.writeheader()
    for r in rows_sorted:
        writer.writerow(r)

# Print top 50
print("Wrote triage CSV to:", out_csv)
print("\nTop 50 triage items:")
for i, r in enumerate(rows_sorted[:50], 1):
    print(
        f"{i:2d}. {r['name']}  | usage={r['usage_count']}  | dup={r['duplicates_count']}  | comp={r['complexity']}  | tests={'YES' if r['has_tests'] else 'NO'}  | cat={r['category']}  | score={r['priority_score']}"
    )

print("\nTotal components in triage:", len(rows_sorted))
