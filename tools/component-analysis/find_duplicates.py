import json
import re
from difflib import SequenceMatcher
from pathlib import Path

repo_root = Path(r"C:/Users/bcmad/Downloads/A1Betting7-13.2")
analysis_dir = repo_root / "tmp" / "component_analysis"
analysis_dir.mkdir(parents=True, exist_ok=True)

comp_file = analysis_dir / "component_analysis_full.json"
if not comp_file.exists():
    print("component_analysis_full.json not found in", analysis_dir)
    raise SystemExit(1)

with open(comp_file, "r", encoding="utf-8") as f:
    components = json.load(f)


# Helper to normalize MSYS paths to Windows paths if present
def normalize_path(raw):
    s = str(raw)
    m = re.match(r"^/([a-zA-Z])/(.*)", s)
    if m:
        s = f"{m.group(1).upper()}:/{m.group(2)}"
    # normalize backslashes
    s = s.replace("\\\\", "\\")
    return s


def read_file_safe(path):
    try:
        p = Path(path)
        # If path doesn't exist as-is, try normalizing
        if not p.exists():
            norm = normalize_path(path)
            p = Path(norm)
        return p.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return ""


def extract_component_signature(file_path):
    content = read_file_safe(file_path)
    if not content:
        return {"props": "", "jsx": "", "content_sample": ""}

    # Remove JS/TS comments
    content_clean = re.sub(
        r"//.*?$|/\*.*?\*/", "", content, flags=re.MULTILINE | re.DOTALL
    )
    # Collapse whitespace
    content_clean = re.sub(r"\s+", " ", content_clean).strip()

    # Extract props interface/type (approximate)
    props_pattern = re.compile(
        r"(?:interface|type)\s+\w*Props\w*\s*=?\s*{([^}]*)}", re.M
    )
    props_match = props_pattern.search(content)
    props_signature = props_match.group(1).strip() if props_match else ""

    # Extract simplified JSX from return
    jsx_pattern = re.compile(r"return\s*\((.*?)\)\s*;", re.DOTALL)
    jsx_match = jsx_pattern.search(content_clean)
    jsx_structure = jsx_match.group(1)[:500].strip() if jsx_match else ""

    return {
        "props": props_signature,
        "jsx": jsx_structure,
        "content_sample": content_clean[:2000],
    }


def similarity(a, b):
    return SequenceMatcher(None, a, b).ratio()


def find_similar_components(components, threshold=0.7):
    duplicates = []
    n = len(components)
    for i in range(n):
        comp1 = components[i]
        for j in range(i + 1, n):
            comp2 = components[j]
            sig1 = extract_component_signature(comp1.get("path"))
            sig2 = extract_component_signature(comp2.get("path"))
            if not sig1["content_sample"] or not sig2["content_sample"]:
                continue
            sim = similarity(sig1["content_sample"], sig2["content_sample"])
            if sim >= threshold:
                duplicates.append(
                    {
                        "component1": comp1.get("name"),
                        "path1": comp1.get("path"),
                        "component2": comp2.get("name"),
                        "path2": comp2.get("path"),
                        "similarity": round(sim, 3),
                    }
                )
    return duplicates


if __name__ == "__main__":
    print("Analyzing for duplicate components (this may take a while)...")
    duplicates = find_similar_components(components, threshold=0.72)

    out = analysis_dir / "duplicate_components.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump(duplicates, f, indent=2)

    print("=" * 80)
    print("DUPLICATE COMPONENT DETECTION")
    print("=" * 80)
    print(f"Potential duplicate pairs found: {len(duplicates)}")
    print()
    sorted_dupes = sorted(duplicates, key=lambda x: x["similarity"], reverse=True)
    print("Top 10 most similar component pairs:")
    for i, dupe in enumerate(sorted_dupes[:10], 1):
        print(
            f"  {i}. {dupe['component1']} ↔ {dupe['component2']} ({dupe['similarity']*100:.1f}% similar)"
        )
    print()
    print("Full duplicate analysis saved to:", out)
    print("=" * 80)
