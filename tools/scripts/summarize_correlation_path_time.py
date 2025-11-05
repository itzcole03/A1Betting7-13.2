"""
Summarize correlation-path-time.json into a human-readable Markdown findings report.
Writes frontend/test-results/correlation-path-time-summary.md and prints a short summary.
"""

import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(r"c:/Users/bcmad/Downloads/A1Betting7-13.2")
INPUT = ROOT / "frontend" / "test-results" / "correlation-path-time.json"
OUT = ROOT / "frontend" / "test-results" / "correlation-path-time-summary.md"

if not INPUT.exists():
    print("Missing input:", INPUT)
    raise SystemExit(1)

data = json.loads(INPUT.read_text(encoding="utf-8"))

# group by classification
by_class = defaultdict(list)
for item in data:
    cls = item.get("classification", "unknown")
    by_class[cls].append(item)

# pick up to 5 from backend_matched and up to 5 from backend_no_match (or however available)
sample = []
sample += by_class.get("backend_matched", [])[:8]
sample += by_class.get("backend_no_match", [])[:2]

lines = []
lines.append("# Correlation path+time findings")
lines.append("Generated from frontend/test-results/correlation-path-time.json")
lines.append("")
lines.append("## Summary")
lines.append(f"- Total folders analyzed: {len(data)}")
lines.append(f'- backend_matched: {len(by_class.get("backend_matched", []))}')
lines.append(f'- backend_no_match: {len(by_class.get("backend_no_match", []))}')
lines.append("")
lines.append("## Representative examples (up to 10)")

for item in sample:
    lines.append(f"### {item['folder']}")
    lines.append(f"- earliest_trace_time: {item.get('earliest_trace_time')}")
    lines.append(f"- proxy_matches_count: {item.get('proxy_matches_count')}")
    lines.append(f"- unique_paths: {item.get('unique_paths')}")
    lines.append(f"- classification: {item.get('classification')}")
    lines.append("")
    lines.append("#### Sample proxy → backend matches")
    count = 0
    for pb in item.get("proxy_to_backend", [])[:5]:
        lines.append(f"- proxy: {pb.get('proxy_raw')}")
        bm = pb.get("backend_matches", [])
        if not bm:
            lines.append("  - backend_matches: NONE")
        else:
            for be in bm[:3]:
                lines.append(
                    f"  - backend: {be.get('file')}:{be.get('line_no')} ts={be.get('ts')} -> {be.get('line')[:200]}"
                )
        count += 1
        lines.append("")
    lines.append("---")

lines.append("\n## Observations & Hypotheses")
lines.append(
    "- Majority of failing folders show proxied requests that also appear in backend logs within ±5s. This points to client/browser aborts or timing-related aborts rather than requests being dropped by the proxy or not reaching the backend."
)
lines.append(
    "- A small number of folders show no backend matches for proxied requests; these should be inspected individually (proxy forwarding failure or timestamp mismatch)."
)
lines.append("\n## Recommended remediations")
lines.append(
    "1. Add a short readiness/wait in Playwright global-setup before running tests to ensure frontend requests are sent after startup probes succeed."
)
lines.append(
    "2. Where requests are critical early, add idempotent retries with exponential backoff in client code for transient net::ERR_ABORTED cases."
)
lines.append(
    "3. Extend proxy logging to correlate request/response pairs (correlate by proxied path and x-request-id if possible) and include upstream status codes in the correlation artifact."
)
lines.append(
    "4. For the folders with no backend matches, collect full proxy.log slices (±10s) and the trace.zip contents to see whether requests came from the browser or were blocked earlier (serviceworker/navigation)."
)

OUT.write_text("\n".join(lines), encoding="utf-8")
print("Wrote", OUT)
print(
    "Summary:",
    {
        "total": len(data),
        "backend_matched": len(by_class.get("backend_matched", [])),
        "backend_no_match": len(by_class.get("backend_no_match", [])),
    },
)
