"""
Correlate proxied request paths (from frontend/test-results/proxy.log) with backend logs
using ±5 second windows around each proxy request timestamp.

Writes: frontend/test-results/correlation-path-time.json

Usage: python scripts/correlate_path_time.py
"""

import datetime
import json
import os
import re
from collections import defaultdict

ROOT = r"c:/Users/bcmad/Downloads/A1Betting7-13.2"
CT = os.path.join(ROOT, "frontend", "test-results", "correlation-times.json")
PROXY = os.path.join(ROOT, "frontend", "test-results", "proxy.log")
BACKEND = os.path.join(ROOT, "backend", "logs")
OUT = os.path.join(ROOT, "frontend", "test-results", "correlation-path-time.json")


def load_json(path):
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def load_proxy_lines(path):
    lines = []
    if not os.path.exists(path):
        return lines
    pattern = re.compile(r"\[proxy\]\s+(\S+)\s+(.*)")
    with open(path, "r", errors="ignore", encoding="utf-8") as fh:
        for ln in fh:
            ln = ln.rstrip("\n")
            m = pattern.match(ln)
            if not m:
                continue
            ts = None
            try:
                ts = datetime.datetime.fromisoformat(m.group(1).replace("Z", "+00:00"))
            except Exception:
                ts = None
            lines.append({"raw": ln, "ts": ts, "body": m.group(2)})
    return lines


def extract_request_from_body(body: str):
    """Return (method, path) or (None,None)"""
    # typical body: "--> GET /api/v2/diagnostics/health x-request-id=... forward-> http://..."
    m = re.search(r"-->\s*(\w+)\s+(\S+)", body)
    if m:
        return m.group(1), m.group(2)
    return None, None


def index_backend_by_path(backend_root: str, paths_of_interest):
    """Scan backend logs and index entries by path. Returns dict path -> list of entries with parsed ts."""
    index = defaultdict(list)
    iso_rx = re.compile(
        r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:[.,]\d+)?(?:Z|[+-]\d{2}:?\d{2})?"
    )
    for root, _, files in os.walk(backend_root):
        for fn in files:
            p = os.path.join(root, fn)
            try:
                with open(p, "r", errors="ignore", encoding="utf-8") as fh:
                    for i, line in enumerate(fh, 1):
                        for path in paths_of_interest:
                            if path in line:
                                ts = None
                                m = iso_rx.search(line)
                                if m:
                                    try:
                                        ts = datetime.datetime.fromisoformat(
                                            m.group(0)
                                            .replace(",", ".")
                                            .replace("Z", "+00:00")
                                        )
                                        # ensure tz-aware: if parsed ts has no tzinfo, treat as UTC
                                        if ts.tzinfo is None:
                                            ts = ts.replace(
                                                tzinfo=datetime.timezone.utc
                                            )
                                    except Exception:
                                        ts = None
                                index[path].append(
                                    {
                                        "file": os.path.relpath(p, ROOT),
                                        "line_no": i,
                                        "line": line.strip(),
                                        "ts": ts,
                                    }
                                )
            except Exception:
                continue
    return index


def main():
    if not os.path.exists(CT):
        print("Missing", CT)
        raise SystemExit(1)

    ct = load_json(CT)
    proxy_lines = load_proxy_lines(PROXY)
    print(f"Loaded {len(proxy_lines)} proxy log lines")

    # For each folder, find proxy request lines within ±5s of earliest_trace_time
    per_folder = []
    all_paths = set()
    for e in ct:
        folder = e.get("folder")
        earliest = e.get("earliest_trace_time")
        t0 = None
        try:
            t0 = datetime.datetime.fromisoformat(earliest.replace("Z", "+00:00"))
        except Exception:
            t0 = None
        matches = []
        if t0:
            for p in proxy_lines:
                if not p["ts"]:
                    continue
                if abs((p["ts"] - t0).total_seconds()) <= 5:
                    method, path = extract_request_from_body(p["body"])
                    matches.append(
                        {
                            "raw": p["raw"],
                            "ts": p["ts"].isoformat(),
                            "method": method,
                            "path": path,
                        }
                    )
                    if path:
                        all_paths.add(path)
        per_folder.append(
            {
                "folder": folder,
                "earliest_trace_time": earliest,
                "proxy_matches": matches,
            }
        )

    print(f"Found {len(all_paths)} unique proxied paths across folders")

    # index backend for these paths
    backend_index = index_backend_by_path(BACKEND, list(all_paths))
    print("Completed backend scan")

    # correlate per-folder
    report = []
    for pf in per_folder:
        matches = pf["proxy_matches"]
        backend_matches = []
        for m in matches:
            path = m.get("path")
            ts = None
            try:
                ts = datetime.datetime.fromisoformat(m["ts"].replace("Z", "+00:00"))
            except Exception:
                ts = None
            matched_entries = []
            if path and path in backend_index:
                for be in backend_index[path]:
                    if be["ts"] and ts and abs((be["ts"] - ts).total_seconds()) <= 5:
                        matched_entries.append(be)
                    # If backend entries have no timestamp, still keep them as possible matches
                    elif not be["ts"]:
                        matched_entries.append(be)
            backend_matches.append(
                {
                    "proxy_raw": m["raw"],
                    "path": path,
                    "ts": m.get("ts"),
                    "backend_matches": matched_entries,
                }
            )

        # classification
        any_backend = any(len(x["backend_matches"]) > 0 for x in backend_matches)
        classification = "backend_matched" if any_backend else "backend_no_match"

        report.append(
            {
                "folder": pf["folder"],
                "earliest_trace_time": pf["earliest_trace_time"],
                "proxy_matches_count": len(matches),
                "unique_paths": list({m.get("path") for m in matches if m.get("path")}),
                "backend_match_any": any_backend,
                "proxy_to_backend": backend_matches,
                "classification": classification,
            }
        )

    # make datetimes JSON serializable (convert backend entry ts to ISO strings)
    for r in report:
        for p in r.get("proxy_to_backend", []):
            for be in p.get("backend_matches", []):
                if isinstance(be.get("ts"), datetime.datetime):
                    be["ts"] = be["ts"].isoformat()

    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(report, fh, indent=2)

    print("Wrote", OUT)
    # brief summary
    counts = {"backend_matched": 0, "backend_no_match": 0}
    for r in report:
        counts[r["classification"]] += 1
    print("Summary:", counts)


if __name__ == "__main__":
    main()
