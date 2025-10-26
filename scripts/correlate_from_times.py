"""
correlate_from_times.py

Read frontend/test-results/correlation-times.json, find proxy.log entries near each
folder's earliest_trace_time (±5s), collect x-request-ids, then do a single-pass scan
of backend logs to map those xrids to backend structured log lines.

Writes: frontend/test-results/correlation-times-detailed.json
"""

import datetime
import json
import os
import re
from typing import Dict, List

ROOT = r"c:/Users/bcmad/Downloads/A1Betting7-13.2"
CT = os.path.join(ROOT, "frontend", "test-results", "correlation-times.json")
PROXY = os.path.join(ROOT, "frontend", "test-results", "proxy.log")
BACKEND = os.path.join(ROOT, "backend", "logs")
OUT = os.path.join(ROOT, "frontend", "test-results", "correlation-times-detailed.json")


def load_correlation_times(path: str) -> List[Dict]:
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def load_proxy_lines(path: str) -> List[Dict]:
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


def find_proxy_matches_for_folder(
    proxy_lines: List[Dict], earliest_iso: str, window_s: int = 5
) -> List[Dict]:
    t0 = datetime.datetime.fromisoformat(earliest_iso.replace("Z", "+00:00"))
    return [
        p
        for p in proxy_lines
        if p["ts"] and abs((p["ts"] - t0).total_seconds()) <= window_s
    ]


def extract_xrids_from_proxy_lines(lines: List[Dict]) -> List[str]:
    xrids = set()
    rx = re.compile(r"x-request-id=([0-9a-fA-F\-]+)")
    for l in lines:
        m = rx.search(l["raw"])
        if m:
            xrids.add(m.group(1))
    return list(xrids)


def scan_backend_for_xrids(
    backend_root: str, xrids: List[str]
) -> Dict[str, List[Dict]]:
    result = {xr: [] for xr in xrids}
    if not xrids:
        return result
    xrids_set = set(xrids)
    # Walk files
    for root, _, files in os.walk(backend_root):
        for fn in files:
            p = os.path.join(root, fn)
            try:
                with open(p, "r", errors="ignore", encoding="utf-8") as fh:
                    for i, line in enumerate(fh, 1):
                        # cheap check: does any xrid substring appear in the line
                        for xr in xrids_set:
                            if xr in line:
                                result[xr].append(
                                    {
                                        "file": os.path.relpath(p, ROOT),
                                        "line_no": i,
                                        "line": line.strip(),
                                    }
                                )
            except Exception:
                # ignore unreadable files
                continue
    return result


def main():
    if not os.path.exists(CT):
        print("Missing correlation-times.json at", CT)
        raise SystemExit(1)

    ct = load_correlation_times(CT)
    proxy_lines = load_proxy_lines(PROXY)
    print(f"Loaded {len(proxy_lines)} proxy log lines")

    report = []
    # first pass: find proxy matches and collect xrids
    all_xrids = set()
    for e in ct:
        folder = e.get("folder")
        earliest = e.get("earliest_trace_time")
        matches = find_proxy_matches_for_folder(proxy_lines, earliest)
        xrids = extract_xrids_from_proxy_lines(matches)
        all_xrids.update(xrids)
        report.append(
            {
                "folder": folder,
                "earliest_trace_time": earliest,
                "proxy_matches_count": len(matches),
                "proxy_sample": [m["raw"] for m in matches[:20]],
                "xrids": xrids,
            }
        )

    print(f"Collected {len(all_xrids)} unique xrids from proxy matches")

    # single-pass backend scan
    backend_map = scan_backend_for_xrids(BACKEND, list(all_xrids))

    # attach backend matches to report
    for r in report:
        xrids = r.get("xrids", [])
        r["backend_matches_by_xrid"] = {xr: backend_map.get(xr, []) for xr in xrids}

    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(report, fh, indent=2)

    print("Wrote", OUT)
    # print brief summary
    for r in report[:20]:
        print(
            r["folder"],
            "proxy_matches=",
            r["proxy_matches_count"],
            "xrids=",
            len(r["xrids"]),
        )
        if r["xrids"]:
            for xr in r["xrids"][:3]:
                print(
                    "  ",
                    xr,
                    "backend matches",
                    len(r["backend_matches_by_xrid"].get(xr, [])),
                )


if __name__ == "__main__":
    main()
