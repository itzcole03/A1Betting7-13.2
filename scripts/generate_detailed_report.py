"""
Generate a focused detailed Markdown report for up to N representative folders
from frontend/test-results/correlation-findings.json.

Writes: frontend/test-results/correlation-detailed-report.md
"""

import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(r"c:/Users/bcmad/Downloads/A1Betting7-13.2")
INPUT = ROOT / "frontend" / "test-results" / "correlation-findings.json"
OUT = ROOT / "frontend" / "test-results" / "correlation-detailed-report.md"

MAX_EXAMPLES = 10

if not INPUT.exists():
    print("Missing", INPUT)
    raise SystemExit(1)

data = json.loads(INPUT.read_text(encoding="utf-8"))

# Group by classification
by_class = defaultdict(list)
for item in data:
    cls = item.get("classification", "unknown")
    by_class[cls].append(item)

# Select up to MAX_EXAMPLES, preferring variety
selected = []
classes = list(by_class.keys())
i = 0
while len(selected) < MAX_EXAMPLES and any(by_class.values()):
    for c in classes:
        if by_class[c]:
            selected.append(by_class[c].pop(0))
            if len(selected) >= MAX_EXAMPLES:
                break
    i += 1

md = []
md.append("# Detailed correlation findings")
md.append(
    "This report shows up to {n} representative failing folders with proxy and backend evidence.".format(
        n=MAX_EXAMPLES
    )
)
md.append("")
md.append("## Summary counts")
for k, v in sorted(((k, len(v)) for k, v in by_class.items()), key=lambda x: x[0]):
    md.append(f"- {k}: {v}")
md.append("")

for item in selected:
    md.append("---")
    md.append(f"## {item.get('folder')}")
    md.append(f"- classification: {item.get('classification')}")
    md.append(f"- earliest_trace_time: {item.get('earliest_trace_time')}")
    md.append(f"- proxy_matches_count: {item.get('proxy_matches_count')}")
    md.append("")
    md.append("### Proxy matches (sample)")
    for pm in item.get("proxy_matches", [])[:5]:
        md.append(f"- {pm.get('raw')}")
        if pm.get("responses"):
            for r in pm.get("responses"):
                md.append(
                    f"  - proxy response: status={r.get('status')} ts={r.get('ts')}"
                )
    md.append("")
    md.append("### Backend matches (sample)")
    if item.get("backend_matches"):
        for be in item.get("backend_matches")[:5]:
            md.append(
                f"- {be.get('file')}:{be.get('line_no')} ts={be.get('ts')} -> {be.get('line')[:300]}"
            )
    else:
        md.append("- (no backend matches found)")
    md.append("")
    md.append("### Recommended immediate action for this folder")
    # heuristic recommendation
    cls = item.get("classification")
    if cls == "backend_ok_but_client_abort":
        md.append(
            "- Likely client/browser abort. Add a short readiness wait in Playwright global-setup and consider client-side retry for early requests."
        )
    elif cls == "proxy_ok_backend_missing":
        md.append(
            "- Proxy forwarded but backend missing. Extract proxy.log slice ±10s and inspect proxy upstream lines and server logs."
        )
    elif cls == "backend_error":
        md.append(
            "- Backend error: inspect backend stack traces and request lifecycle for this path."
        )
    elif cls == "no_proxy_entries":
        md.append(
            "- No proxy evidence: request may have been aborted before reaching proxy (service worker or client abort). Inspect trace.zip network entries."
        )
    else:
        md.append(
            "- Investigate proxy and backend lines around the timestamp; increase logging if necessary."
        )
    md.append("")

OUT.write_text("\n".join(md), encoding="utf-8")
print("Wrote", OUT)
print("Selected", len(selected), "folders for detailed report")
