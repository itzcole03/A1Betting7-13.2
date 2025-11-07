import json
from pathlib import Path

repo_root = Path(r"C:/Users/bcmad/Downloads/A1Betting7-13.2")
analysis_dir = repo_root / "tmp" / "component_analysis"

files = {
    "components": analysis_dir / "component_analysis_full.json",
    "usage": analysis_dir / "component_usage_map.json",
    "duplicates": analysis_dir / "duplicate_components.json",
    "unused": analysis_dir / "unused_components.txt",
}

for k, p in files.items():
    if not p.exists():
        print(f"ERROR: required file {p} not found. Run previous analysis steps first.")
        raise SystemExit(1)

with open(files["components"], "r", encoding="utf-8") as f:
    components = json.load(f)
with open(files["usage"], "r", encoding="utf-8") as f:
    usage_map = json.load(f)
with open(files["duplicates"], "r", encoding="utf-8") as f:
    duplicates = json.load(f)
with open(files["unused"], "r", encoding="utf-8") as f:
    unused = [line.strip() for line in f if line.strip()]

report_lines = []
report_lines.append("# Component Research Report\n\n")
report_lines.append(f"**Generated:** {__file__}\n\n")
report_lines.append(
    "**Purpose:** Comprehensive analysis of all React components in the A1Betting codebase\n\n"
)

report_lines.append("## Executive Summary\n\n")
report_lines.append(f"- **Total Components:** {len(components)}\n")
report_lines.append(
    f"- **Unused Components:** {len(unused)} ({len(unused)/len(components)*100:.1f}%)\n"
)
report_lines.append(f"- **Duplicate Pairs:** {len(duplicates)}\n")
report_lines.append(
    f"- **Components with Tests:** {sum(1 for c in components if c.get('has_tests'))} ({sum(1 for c in components if c.get('has_tests'))/len(components)*100:.1f}%)\n"
)
report_lines.append(
    f"- **TypeScript Components:** {sum(1 for c in components if c.get('typescript'))} ({sum(1 for c in components if c.get('typescript'))/len(components)*100:.1f}%)\n\n"
)

report_lines.append("## Critical Findings\n\n")
report_lines.append("### 1. Unused Components (Left Behind)\n\n")
report_lines.append(
    f"**{len(unused)} components** were built but never integrated into the application.\n\n"
)
report_lines.append("**Action Required:** Review each unused component and either:\n")
report_lines.append("- **Integrate** if it provides value\n")
report_lines.append("- **Delete** if it's redundant or obsolete\n\n")
report_lines.append("**List of Unused Components (sample):**\n\n")
for comp in unused[:30]:
    report_lines.append(f"- `{comp}`\n")
if len(unused) > 30:
    report_lines.append(f"- ... and {len(unused) - 30} more\n")
report_lines.append("\n")

report_lines.append("### 2. Duplicate Components\n\n")
report_lines.append(
    f"**{len(duplicates)} component pairs** have high similarity (≥ threshold), indicating potential duplication.\n\n"
)
report_lines.append("**Top 10 Duplicate Pairs:**\n\n")
report_lines.append("| Component 1 | Component 2 | Similarity |\n")
report_lines.append("|-------------|-------------|------------|\n")
sorted_dupes = sorted(duplicates, key=lambda x: x.get("similarity", 0), reverse=True)
for dupe in sorted_dupes[:10]:
    sim = dupe.get("similarity", 0)
    report_lines.append(
        f"| `{dupe.get('component1')}` | `{dupe.get('component2')}` | {sim*100:.1f}% |\n"
    )
report_lines.append("\n")

report_lines.append("### 3. Most Used Components (Core Components)\n\n")
sorted_usage = sorted(
    usage_map.items(), key=lambda x: x[1].get("usage_count", 0), reverse=True
)
report_lines.append("| Component | Usage Count | Has Tests | Complexity |\n")
report_lines.append("|-----------|-------------|-----------|------------|\n")
for name, data in sorted_usage[:20]:
    tests = "✅" if data.get("has_tests") else "❌"
    report_lines.append(
        f"| `{name}` | {data.get('usage_count', 0)} | {tests} | {data.get('complexity', 0)} |\n"
    )
report_lines.append("\n")

report_lines.append("### 4. Components Without Tests\n\n")
no_tests = [c for c in components if not c.get("has_tests")]
report_lines.append(
    f"**{len(no_tests)} components** ({len(no_tests)/len(components)*100:.1f}%) lack test coverage.\n\n"
)
report_lines.append("**High-priority components needing tests (most used):**\n\n")
high_priority = [
    (name, data) for name, data in sorted_usage if not data.get("has_tests")
]
for name, data in high_priority[:15]:
    report_lines.append(f"- `{name}` (used in {data.get('usage_count', 0)} files)\n")
report_lines.append("\n")

report_lines.append("## Recommendations\n\n")
report_lines.append("### Immediate Actions\n\n")
report_lines.append("1. **Delete unused components** that provide no value\n")
report_lines.append(
    "2. **Consolidate duplicate components** by choosing the best implementation\n"
)
report_lines.append("3. **Add tests** for the top 20 most-used components\n")
report_lines.append(
    "4. **Integrate valuable unused components** into the application\n\n"
)

out_file = analysis_dir / "COMPONENT_RESEARCH_REPORT.md"
with open(out_file, "w", encoding="utf-8") as f:
    f.writelines(report_lines)

print("=" * 80)
print("COMPREHENSIVE REPORT GENERATED")
print("=" * 80)
print("Report saved to:", out_file)
