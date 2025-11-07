import json
import os
import re
from pathlib import Path

# Location of the component list created earlier
repo_root = Path(r"C:/Users/bcmad/Downloads/A1Betting7-13.2")
analysis_dir = repo_root / "tmp" / "component_analysis"
analysis_dir.mkdir(parents=True, exist_ok=True)
component_list = analysis_dir / "all_components.txt"
if not component_list.exists():
    # fallback to /tmp path if present
    alt = Path("/tmp/component_analysis/all_components.txt")
    if alt.exists():
        component_list = alt
    else:
        print("ERROR: component list not found at", component_list)
        raise SystemExit(1)

with open(component_list, "r", encoding="utf-8") as f:
    component_files = [line.strip() for line in f if line.strip()]

results = []

hooks = [
    "useState",
    "useEffect",
    "useContext",
    "useReducer",
    "useCallback",
    "useMemo",
    "useRef",
    "useImperativeHandle",
    "useLayoutEffect",
    "useDebugValue",
]

for file_path in component_files:
    try:
        # Normalize MSYS/Posix-style paths like /c/Users/... to Windows form C:/Users/...
        raw = file_path
        m = re.match(r"^/([a-zA-Z])/(.*)", raw)
        if m:
            raw = f"{m.group(1).upper()}:/{m.group(2)}"
        m2 = re.match(r"^\\\\([a-zA-Z])\\\\(.*)", raw)
        if m2:
            raw = f"{m2.group(1).upper()}:\\{m2.group(2)}"
        p = Path(raw)
        content = p.read_text(encoding="utf-8", errors="ignore")
        imports = re.findall(
            r"import\s+(?:{[^}]+}|[\w\s,]+)\s+from\s+['\"]([^'\"]+)['\"]", content
        )
        exports = re.findall(
            r"export\s+(?:default\s+)?(?:function|const|class)\s+(\w+)", content
        )
        hooks_used = [h for h in hooks if h in content]
        complexity = (
            len(imports) * 2
            + len(hooks_used) * 3
            + content.count("if ")
            + content.count("else ")
            + content.count("switch ") * 2
            + content.count("map(")
            + content.count("filter(")
            + content.count("reduce(")
            + content.count("async ") * 2
        )
        test_file = str(p).replace(".tsx", ".test.tsx").replace(".jsx", ".test.jsx")
        has_tests = Path(test_file).exists()
        component_imports = [
            imp
            for imp in imports
            if "components" in imp or imp.startswith("./") or imp.startswith("../")
        ]
        results.append(
            {
                "path": str(p),
                "name": p.stem,
                "lines": len(content.split("\n")),
                "imports": imports,
                "exports": exports,
                "hooks_used": hooks_used,
                "has_tests": has_tests,
                "complexity_score": complexity,
                "dependencies": component_imports,
                "is_functional": ("function" in content)
                or (("const" in content) and ("=>" in content)),
                "is_class": ("class" in content and "extends" in content),
                "has_state": ("useState" in content) or ("this.state" in content),
                "has_effects": ("useEffect" in content)
                or ("componentDidMount" in content),
                "typescript": str(p).endswith(".tsx"),
            }
        )
    except Exception as e:
        print("Error reading", file_path, e)

out_full = analysis_dir / "component_analysis_full.json"
with open(out_full, "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)

sorted_by_complexity = sorted(
    results, key=lambda x: x["complexity_score"], reverse=True
)
print("=" * 80)
print("COMPONENT ANALYSIS SUMMARY")
print("=" * 80)
print("Total components analyzed:", len(results))
print("Functional components:", sum(1 for r in results if r["is_functional"]))
print("Class components:", sum(1 for r in results if r["is_class"]))
print("Components with tests:", sum(1 for r in results if r["has_tests"]))
print("TypeScript components:", sum(1 for r in results if r["typescript"]))
print("Components using hooks:", sum(1 for r in results if r["hooks_used"]))
print("Components with state:", sum(1 for r in results if r["has_state"]))
print()
print("Top 10 most complex components:")
for i, comp in enumerate(sorted_by_complexity[:10], 1):
    print(
        f"  {i}. {comp['name']} (score: {comp['complexity_score']}, lines: {comp['lines']})"
    )
print("=" * 80)

no_tests = [r for r in results if not r["has_tests"]]
print("\nComponents without tests:", len(no_tests))
with open(analysis_dir / "components_without_tests.txt", "w", encoding="utf-8") as f:
    for comp in no_tests:
        f.write(comp["path"] + "\n")

print("\nWrote:", out_full)
print("Wrote:", analysis_dir / "components_without_tests.txt")
print("\nFiles in analysis dir:", analysis_dir)
for p in analysis_dir.iterdir():
    print(" -", p.name)
