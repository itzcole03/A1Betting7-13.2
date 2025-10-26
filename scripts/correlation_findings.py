"""
Produce detailed correlation findings combining proxy request/response info and backend logs.

Outputs:
 - frontend/test-results/correlation-findings.json
 - frontend/test-results/correlation-findings.md

Usage: python scripts/correlation_findings.py
"""

import datetime
import json
import os
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(r"c:/Users/bcmad/Downloads/A1Betting7-13.2")
CT = ROOT / "frontend" / "test-results" / "correlation-path-time.json"
PROXY = ROOT / "frontend" / "test-results" / "proxy.log"
BACKEND = ROOT / "backend" / "logs"
OUT_JSON = ROOT / "frontend" / "test-results" / "correlation-findings.json"
OUT_MD = ROOT / "frontend" / "test-results" / "correlation-findings.md"


def load_json(p):
    return json.loads(Path(p).read_text(encoding="utf-8"))


def load_proxy_lines(path):
    lines = []
    if not Path(path).exists():
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
                if ts.tzinfo is None:
                    ts = ts.replace(tzinfo=datetime.timezone.utc)
            except Exception:
                ts = None
            lines.append({"raw": ln, "ts": ts, "body": m.group(2)})
    return lines


def find_proxy_response(proxy_lines, req_raw, req_ts, path, window_after=3):
    """Find a proxy upstream response line that corresponds to the request within +window_after seconds."""
    matches = []
    for p in proxy_lines:
        if not p["ts"] or not req_ts:
            continue
        delta = (p["ts"] - req_ts).total_seconds()
        if 0 <= delta <= window_after:
            # response lines look like '<- upstream localhost:8000/api/health status=200'
            if "<- upstream" in p["body"] and path and path in p["body"]:
                # try to extract status
                m = re.search(r"status=(\d{3})", p["body"])
                status = int(m.group(1)) if m else None
                matches.append(
                    {"raw": p["raw"], "ts": p["ts"].isoformat(), "status": status}
                )
    return matches


def index_backend_by_path(backend_root, paths_of_interest):
    index = defaultdict(list)
    iso_rx = re.compile(
        r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:[.,]\d+)?(?:Z|[+-]\d{2}:?\d{2})?"
    )
    reqid_rx = re.compile(r'"request_id"\s*:\s*"([0-9a-fA-F\-]+)"')
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
                                        if ts.tzinfo is None:
                                            ts = ts.replace(
                                                tzinfo=datetime.timezone.utc
                                            )
                                    except Exception:
                                        ts = None
                                reqid = None
                                m2 = reqid_rx.search(line)
                                if m2:
                                    reqid = m2.group(1)
                                # note if started/completed/errors
                                started = "Request started" in line
                                completed = "Request completed" in line
                                error_like = ("ERROR" in line.upper()) or (
                                    "Traceback" in line
                                )
                                index[path].append(
                                    {
                                        "file": os.path.relpath(p, ROOT),
                                        "line_no": i,
                                        "line": line.strip(),
                                        "ts": ts,
                                        "request_id": reqid,
                                        "started": started,
                                        "completed": completed,
                                        "error": error_like,
                                    }
                                )
            except Exception:
                continue
    return index


def classify_folder(proxy_matches, proxy_responses, backend_entries):
    # heuristics
    any_backend_completed = any(be.get("completed") for be in backend_entries)
    any_backend_error = any(be.get("error") for be in backend_entries)
    any_proxy_success = any(
        (r.get("status") is not None and 200 <= r.get("status") < 300)
        for r in proxy_responses
    )
    if any_backend_error:
        return "backend_error"
    if any_proxy_success and any_backend_completed:
        return "backend_ok_but_client_abort"
    if any_proxy_success and not backend_entries:
        return "proxy_ok_backend_missing"
    if not proxy_matches:
        return "no_proxy_entries"
    # fallback
    if backend_entries:
        return "backend_matched_low_confidence"
    return "unknown"


def main():
    if not CT.exists():
        print("Missing", CT)
        raise SystemExit(1)
    data = load_json(CT)
    proxy_lines = load_proxy_lines(PROXY)
    print(f"Loaded {len(proxy_lines)} proxy log lines")

    # collect all paths
    all_paths = set()
    for item in data:
        for m in item.get("proxy_to_backend", []):
            p = m.get("path")
            if p:
                all_paths.add(p)

    print(f"Indexing backend for {len(all_paths)} paths")
    backend_index = index_backend_by_path(str(BACKEND), list(all_paths))
    print("Backend index ready")

    findings = []
    for item in data:
        folder = item.get("folder")
        pf = {
            "folder": folder,
            "earliest_trace_time": item.get("earliest_trace_time"),
            "proxy_matches": [],
            "backend_matches": [],
            "classification": None,
        }
        for pm in item.get("proxy_to_backend", []):
            raw = pm.get("proxy_raw")
            path = pm.get("path")
            ts = None
            try:
                ts = (
                    datetime.datetime.fromisoformat(pm.get("ts").replace("Z", "+00:00"))
                    if pm.get("ts")
                    else None
                )
                if ts and ts.tzinfo is None:
                    ts = ts.replace(tzinfo=datetime.timezone.utc)
            except Exception:
                ts = None
            # find proxy response lines
            responses = find_proxy_response(proxy_lines, raw, ts, path)
            # find backend entries for path
            backend_entries = backend_index.get(path, [])
            # filter backend entries within ±5s
            matched_backend = []
            for be in backend_entries:
                be_ts = be.get("ts")
                if be_ts and ts:
                    if abs((be_ts - ts).total_seconds()) <= 5:
                        matched_backend.append(be)
                else:
                    # keep entries without ts as possible matches
                    matched_backend.append(be)

            pf["proxy_matches"].append(
                {"raw": raw, "ts": pm.get("ts"), "path": path, "responses": responses}
            )
            pf["backend_matches"].extend(matched_backend)

        pf["classification"] = classify_folder(
            item.get("proxy_to_backend", []),
            [
                r
                for pm in item.get("proxy_to_backend", [])
                for r in find_proxy_response(
                    proxy_lines,
                    pm.get("proxy_raw"),
                    (
                        datetime.datetime.fromisoformat(
                            pm.get("ts").replace("Z", "+00:00")
                        )
                        if pm.get("ts")
                        else None
                    ),
                    pm.get("path"),
                )
            ],
            pf["backend_matches"],
        )
        findings.append(pf)

    # serialize datetimes
    def _serialize(o):
        if isinstance(o, datetime.datetime):
            return o.isoformat()
        raise TypeError

    OUT_JSON.write_text(
        json.dumps(findings, indent=2, default=_serialize), encoding="utf-8"
    )
    print("Wrote", OUT_JSON)

    # write markdown summary with recommendations
    md = []
    md.append("# Correlation Findings")
    md.append(f"- analyzed folders: {len(findings)}")
    counts = defaultdict(int)
    for f in findings:
        counts[f["classification"]] += 1
    md.append("")
    md.append("## Classification counts")
    for k, v in counts.items():
        md.append(f"- {k}: {v}")
    md.append("")
    md.append("## Actions & Recommendations")
    md.append(
        "1. For folders classified `backend_ok_but_client_abort`: likely Playwright/browser aborts — add readiness waits in global-setup and consider short retries in client for early requests."
    )
    md.append(
        "2. For folders classified `proxy_ok_backend_missing`: inspect proxy logs around the request (±10s) for errors and check proxy timeouts/config."
    )
    md.append(
        "3. For any `backend_error`: inspect backend logs for stack traces; increase logging around request lifecycle."
    )
    md.append("")
    md.append("## Representative examples")
    for f in findings[:10]:
        md.append(f"### {f['folder']}")
        md.append(f"- classification: {f['classification']}")
        md.append(f"- earliest_trace_time: {f['earliest_trace_time']}")
        md.append(f"- proxy_matches: {len(f['proxy_matches'])}")
        md.append("- proxy samples:")
        for pm in f["proxy_matches"][:3]:
            md.append(f"  - {pm['raw']}")
            for r in pm.get("responses", []):
                md.append(f"    - response: status={r.get('status')} ts={r.get('ts')}")
        md.append("- backend matches (sample):")
        for be in f["backend_matches"][:3]:
            md.append(
                f"  - {be.get('file')}:{be.get('line_no')} ts={be.get('ts')} -> {be.get('line')[:200]}"
            )
        md.append("")

    OUT_MD.write_text("\n".join(md), encoding="utf-8")
    print("Wrote", OUT_MD)


if __name__ == "__main__":
    main()
