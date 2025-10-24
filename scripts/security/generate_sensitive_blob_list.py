#!/usr/bin/env python3
"""Utility for enumerating potentially sensitive blobs in git history.

The script scans every object in the repository using ``git rev-list --objects``
and filters the results against a set of glob patterns (for example ``*.db`` or
``**/prizepicks_cookies.json``).  For every match it records the blob id and the
commits that introduced or modified the file so the security team can plan a
history rewrite.

By default the tool writes a JSON report to ``reports/security/sensitive_blobs.json``
and prints a short summary to stdout so it can be run as part of an ad‑hoc
security sweep.
"""

from __future__ import annotations

import argparse
import datetime as _dt
import fnmatch
import json
import os
import pathlib
import subprocess
import sys
from collections import Counter
from typing import Iterable, List, Sequence, Tuple

DEFAULT_PATTERNS: Tuple[str, ...] = (
    "*.db",
    "*.sqlite",
    "*.sqlite3",
    "*.jsonl",
    "**/prizepicks_cookies.json",
    "backend_server.log",
    "chat_history.db",
    "users.db",
    "mlflow.db",
)

DEFAULT_OUTPUT = pathlib.Path("reports/security/sensitive_blobs.json")
MAX_COMMITS_PER_PATH = 20


class GitError(RuntimeError):
    pass


def _run_git(*args: str) -> str:
    """Run a git command and return stdout."""

    proc = subprocess.run(
        ["git", *args],
        check=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    if proc.returncode != 0:
        raise GitError(proc.stderr.strip() or f"git {' '.join(args)} failed")
    return proc.stdout


def _iter_git_objects() -> Iterable[Tuple[str, str]]:
    """Yield ``(blob_id, path)`` pairs for every object in the repository."""

    output = _run_git("rev-list", "--objects", "--all")
    for line in output.splitlines():
        try:
            blob_id, path = line.split(" ", 1)
        except ValueError:
            continue
        yield blob_id.strip(), path.strip()


def _matches(path: str, patterns: Sequence[str]) -> bool:
    return any(fnmatch.fnmatch(path, pattern) for pattern in patterns)


def _collect_commits(path: str, limit: int) -> List[str]:
    output = _run_git(
        "rev-list",
        "--all",
        "--max-count",
        str(limit),
        "--",
        path,
    )
    commits = [line.strip() for line in output.splitlines() if line.strip()]
    return commits


def build_report(patterns: Sequence[str], limit: int) -> dict:
    matches = []
    extension_counter: Counter[str] = Counter()

    for blob_id, path in _iter_git_objects():
        if not _matches(path, patterns):
            continue

        ext = pathlib.Path(path).suffix or "<no-ext>"
        extension_counter[ext] += 1

        commits = _collect_commits(path, limit)
        matches.append(
            {
                "path": path,
                "blob_id": blob_id,
                "commits": commits,
                "commit_count": len(commits),
            }
        )

    return {
        "generated_at": _dt.datetime.now(tz=_dt.timezone.utc).isoformat(),
        "patterns": list(patterns),
        "match_count": len(matches),
        "extension_summary": extension_counter.most_common(),
        "matches": matches,
    }


def write_report(report: dict, destination: pathlib.Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
        handle.write("\n")


def parse_args(argv: Sequence[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate a JSON report of potentially sensitive git blobs.",
    )
    parser.add_argument(
        "--pattern",
        "-p",
        action="append",
        dest="patterns",
        help="Glob pattern to flag (can be provided multiple times).",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=pathlib.Path,
        default=DEFAULT_OUTPUT,
        help=f"Destination file (default: {DEFAULT_OUTPUT})",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=MAX_COMMITS_PER_PATH,
        help="Maximum number of commit hashes to record per path (default: %(default)s)",
    )
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    patterns = tuple(args.patterns) if args.patterns else DEFAULT_PATTERNS

    try:
        report = build_report(patterns, args.limit)
    except GitError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    write_report(report, args.output)

    print(f"Generated report with {report['match_count']} matches → {args.output}")
    if report["match_count"]:
        print("Top extensions:")
        for ext, count in report["extension_summary"][:10]:
            print(f"  {ext}: {count}")
    else:
        print("No blobs matched the provided patterns.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
