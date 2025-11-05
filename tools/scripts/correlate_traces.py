"""
Correlation script for Playwright traces -> proxy.log -> backend logs.
Writes frontend/test-results/correlation-detailed.json

Usage: python scripts/correlate_traces.py
"""

import datetime
import json
import os
import re
import zipfile

ROOT = r"c:/Users/bcmad/Downloads/A1Betting7-13.2"
TEST_RESULTS = os.path.join(ROOT, "frontend", "test-results")
PROXY_LOG = os.path.join(TEST_RESULTS, "proxy.log")
BACKEND_LOG_DIR = os.path.join(ROOT, "backend", "logs")
OUT = os.path.join(TEST_RESULTS, "correlation-detailed.json")


# helper
def parse_iso(s):
    if not s:
        return None
    try:
        return datetime.datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        # try shorter
        try:
            return datetime.datetime.fromisoformat(s)
        except Exception:
            return None


# find failing folders (contain error-context.md)
all_folders = []
for name in sorted(os.listdir(TEST_RESULTS)):
    folder = os.path.join(TEST_RESULTS, name)
    if os.path.isdir(folder):
        if os.path.exists(os.path.join(folder, "error-context.md")) and os.path.exists(
            os.path.join(folder, "trace.zip")
        ):
            all_folders.append(name)

# limit
N = 10
selected = all_folders[:N]
print(
    f"Found {len(all_folders)} failing folders, selecting {len(selected)} for correlation"
)

# read proxy log once. The proxy now emits JSON Lines (one JSON object per line).
# Try parsing each line as JSON and extract ts/proxy_request_id; fall back to
# legacy plain-text parsing when JSON isn't available.
proxy_lines = []
if os.path.exists(PROXY_LOG):
    with open(PROXY_LOG, "r", errors="ignore") as fh:
        for ln in fh:
            ln = ln.rstrip("\n")
            if not ln:
                continue
            parsed_json = None
            try:
                parsed_json = json.loads(ln)
            except Exception:
                parsed_json = None

            if parsed_json and isinstance(parsed_json, dict):
                ts = None
                try:
                    ts = parse_iso(parsed_json.get("ts"))
                except Exception:
                    ts = None
                # keep body as the parsed JSON for easier downstream access
                proxy_lines.append({"raw": ln, "ts": ts, "body": parsed_json})
                continue

            # fallback: legacy plaintext parsing (matching lines like: [proxy] TIMESTAMP rest...)
            m = re.match(r"\[proxy\]\s+(\S+)\s+(.*)", ln)
            if m:
                ts = None
                try:
                    ts = parse_iso(m.group(1))
                except Exception:
                    ts = None
                proxy_lines.append({"raw": ln, "ts": ts, "body": m.group(2)})
            else:
                # unknown format - keep raw line only
                proxy_lines.append({"raw": ln, "ts": None, "body": ln})


# helper to search proxy lines by time window or request id
def find_proxy_by_reqid(reqid):
    if not reqid:
        return []
    out = []
    for L in proxy_lines:
        if reqid in L["raw"]:
            out.append(L)
    return out


def find_proxy_by_path_and_time(path, center, window_sec=5):
    out = []
    for L in proxy_lines:
        if L["ts"] is None:
            continue
        if abs((L["ts"] - center).total_seconds()) <= window_sec and path in L["body"]:
            out.append(L)
    return out


# backend search
def search_backend_for_reqid(reqid):
    if not reqid:
        return []
    out = []
    for root, _, files in os.walk(BACKEND_LOG_DIR):
        for fn in files:
            p = os.path.join(root, fn)
            try:
                with open(p, "r", errors="ignore") as fh:
                    for i, l in enumerate(fh, 1):
                        if reqid in l:
                            out.append(
                                {
                                    "file": os.path.relpath(p, ROOT),
                                    "line_no": i,
                                    "line": l.strip(),
                                }
                            )
            except Exception:
                pass
    return out


def search_backend_by_path_and_time(path, center, window_sec=10):
    out = []
    low = center - datetime.timedelta(seconds=window_sec)
    high = center + datetime.timedelta(seconds=window_sec)
    # naive: search lines for path and try to parse timestamp in the JSON-like prefix
    ts_regex = re.compile(r'"timestamp"\s*:\s*"([^"]+)"')
    for root, _, files in os.walk(BACKEND_LOG_DIR):
        for fn in files:
            p = os.path.join(root, fn)
            try:
                with open(p, "r", errors="ignore") as fh:
                    for i, l in enumerate(fh, 1):
                        if path in l:
                            m = ts_regex.search(l)
                            if m:
                                ts = parse_iso(m.group(1))
                                if ts and low <= ts <= high:
                                    out.append(
                                        {
                                            "file": os.path.relpath(p, ROOT),
                                            "line_no": i,
                                            "line": l.strip(),
                                            "ts": m.group(1),
                                        }
                                    )
                            else:
                                # include without timestamp if cannot parse
                                out.append(
                                    {
                                        "file": os.path.relpath(p, ROOT),
                                        "line_no": i,
                                        "line": l.strip(),
                                        "ts": None,
                                    }
                                )
            except Exception:
                pass
    return out


report = []
for folder in selected:
    entry = {"folder": folder, "trace_picks": []}
    zpath = os.path.join(TEST_RESULTS, folder, "trace.zip")
    if not os.path.exists(zpath):
        entry["error"] = "trace.zip missing"
        report.append(entry)
        continue
    # read 0-trace.network if present
    try:
        with zipfile.ZipFile(zpath) as z:
            if "0-trace.network" in z.namelist():
                data = z.read("0-trace.network").decode("utf-8")
                lines = [l for l in data.splitlines() if l.strip()]
            else:
                lines = []
    except Exception as e:
        entry["error"] = f"failed to read trace.zip: {e}"
        report.append(entry)
        continue
    # parse all entries
    parsed = []
    all_xrids = set()
    for L in lines:
        try:
            o = json.loads(L)
        except Exception:
            continue
        sd = o.get("startedDateTime") or o.get("started")
        t = None
        if sd:
            t = parse_iso(sd)
        # extract any x-request-id from headers
        req = o.get("request", {})
        headers = {}
        for h in req.get("headers", []):
            headers[h.get("name", "").lower()] = h.get("value")
        if headers.get("x-request-id"):
            all_xrids.add(headers.get("x-request-id"))
        parsed.append({"obj": o, "t": t})

    # compute earliest timestamp across the trace
    times = [p["t"] for p in parsed if p["t"]]
    earliest = min(times) if times else None

    # choose canonical picks: prefer explicit failures, otherwise use earliest few entries (for context)
    picks = []
    for p in parsed:
        o = p["obj"]
        if o.get("_failureText"):
            picks.append(p)
    if not picks:
        # take the first 3 entries that have request/response info or timestamps
        rich = [p for p in parsed if p.get("t") or p["obj"].get("request")]
        picks = rich[:3]
        if not picks:
            picks = parsed[:3]

    # If picks ended up without timestamps and we have an earliest timestamp, use earliest as a synthetic pick
    if earliest and not any(p.get("t") for p in picks):
        picks.insert(0, {"obj": {}, "t": earliest})

    # for each pick, extract request info (if any) and also include the trace-level earliest and xrids
    for pick in picks:
        o = pick.get("obj", {})
        t = pick.get("t")
        req = o.get("request", {})
        res = o.get("response", {})
        headers = {}
        for h in req.get("headers", []):
            headers[h.get("name", "").lower()] = h.get("value")
        xrid = headers.get("x-request-id")
        url = req.get("url") or ""
        # path fragment
        path = ""
        try:
            m = re.search(r"https?://[^/]+(/[^\s\?]*)", url)
            if m:
                path = m.group(1)
            else:
                path = url
        except Exception:
            path = url

        pick_info = {
            "time": (
                t.isoformat() if t else (earliest.isoformat() if earliest else None)
            ),
            "method": req.get("method"),
            "url": url,
            "path": path,
            "x-request-id": xrid,
            "trace_level_xrids": list(all_xrids)[:10],
            "response_status": res.get("status") if isinstance(res, dict) else None,
            "_failureText": o.get("_failureText"),
        }

        # search proxy: first by xrid if present; then by any trace-level xrids; then by time window
        proxy_matches = []
        if xrid:
            proxy_matches = find_proxy_by_reqid(xrid)
        if not proxy_matches:
            for xr in list(all_xrids)[:5]:
                if xr:
                    proxy_matches += find_proxy_by_reqid(xr)
        if not proxy_matches and pick_info["time"]:
            center = parse_iso(pick_info["time"])
            if center:
                # broaden search: include any /api calls in window
                for L in proxy_lines:
                    if L["ts"] is None:
                        continue
                    if (
                        abs((L["ts"] - center).total_seconds()) <= 5
                        and "/api" in L["body"]
                    ):
                        proxy_matches.append(L)
        pick_info["proxy_matches"] = [
            {"ts": p["ts"].isoformat() if p["ts"] else None, "raw": p["raw"]}
            for p in proxy_matches
        ]

        # search backend
        backend_matches = []
        if xrid:
            backend_matches = search_backend_for_reqid(xrid)
        if not backend_matches:
            for xr in list(all_xrids)[:5]:
                backend_matches += search_backend_for_reqid(xr)
        if not backend_matches and path and pick_info["time"]:
            center = parse_iso(pick_info["time"])
            backend_matches = search_backend_by_path_and_time(
                path, center, window_sec=10
            )

        pick_info["backend_matches"] = backend_matches[:50]
        entry["trace_picks"].append(pick_info)
    report.append(entry)

# write report
with open(OUT, "w") as fh:
    json.dump(report, fh, indent=2, default=str)

# summary
total = len(report)
have_proxy = sum(
    1 for e in report if any(p["proxy_matches"] for p in e.get("trace_picks", []))
)
have_backend = sum(
    1 for e in report if any(p["backend_matches"] for p in e.get("trace_picks", []))
)
print(
    f"Wrote {OUT} for {total} folders; folders with any proxy match: {have_proxy}; any backend match: {have_backend}"
)
