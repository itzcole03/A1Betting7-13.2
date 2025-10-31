import json
import os
from pathlib import Path

cov_path = Path("frontend/coverage/coverage-final.json")
if not cov_path.exists():
    print("coverage-final.json not found at", cov_path)
    raise SystemExit(1)

with cov_path.open("r", encoding="utf-8") as f:
    data = json.load(f)

rows = []
for file_key, entry in data.items():
    path = entry.get("path") or file_key
    # only consider frontend src TypeScript/TSX files
    if not ("frontend" in path and path.endswith((".ts", ".tsx"))):
        continue
    s = entry.get("s", {})
    total_statements = len(s)
    if total_statements == 0:
        line_cov = None
    else:
        covered = sum(1 for v in s.values() if v and v > 0)
        pct = covered / total_statements * 100
        line_cov = pct
    # also use lines info if present via entry.get('l') but coverage-final may not have l
    rows.append(
        (
            path.replace("\\", "/"),
            line_cov,
            covered if total_statements else 0,
            total_statements,
        )
    )

# sort by None last, then by ascending coverage
rows = sorted(
    rows, key=lambda r: (1 if r[1] is None else 0, 100 if r[1] is None else r[1])
)

print(f"Found {len(rows)} frontend TS/TSX files in coverage-final.json\n")
print(f"Top 30 files with lowest statement coverage (covered/total, percent):\n")
for p, pct, covered, total in rows[:30]:
    pct_str = "N/A" if pct is None else f"{pct:.2f}%"
    print(f"{pct_str}\t{covered}/{total}\t{p}")

# write a CSV for convenience
out = Path("frontend/coverage/coverage-lowest.csv")
with out.open("w", encoding="utf-8") as f:
    f.write("percent,covered,total,path\n")
    for p, pct, covered, total in rows:
        f.write(f"{'' if pct is None else round(pct,2)},{covered},{total},{p}\n")
print("\nCSV written to", out)
