#!/usr/bin/env python3
"""Scan local log directories for potential secret leakage.

The script walks the provided directories (or a default set) and inspects any
text-like files (``*.log``, ``*.jsonl``, ``*.txt``) for keywords that typically
signal sensitive content (``authorization``, ``token``, ``cookie`` and so on).

It emits a JSON summary by default plus a human-readable table so that security
runs can be captured as evidence for the log redaction policy.
"""

from __future__ import annotations

import argparse
import json
import pathlib
import re
from dataclasses import dataclass
from typing import Dict, Iterable, List, Sequence, Tuple

DEFAULT_PATHS: Tuple[pathlib.Path, ...] = (
    pathlib.Path("logs"),
    pathlib.Path("backend/logs"),
    pathlib.Path("frontend/logs"),
)
TEXT_EXTENSIONS = {".log", ".jsonl", ".json", ".txt", ".out"}
SUSPICIOUS_PATTERNS: Tuple[re.Pattern[str], ...] = (
    re.compile(r"authorization\s*[:=]", re.IGNORECASE),
    re.compile(r"bearer\s+[a-z0-9\-_.=]+", re.IGNORECASE),
    re.compile(r"api[_-]?key\s*[:=]", re.IGNORECASE),
    re.compile(r"secret\s*[:=]", re.IGNORECASE),
    re.compile(r"token\s*[:=]", re.IGNORECASE),
    re.compile(r"set-cookie", re.IGNORECASE),
    re.compile(r"session(id)?\s*[:=]", re.IGNORECASE),
    re.compile(r"password\s*[:=]", re.IGNORECASE),
    re.compile(r"csrftoken", re.IGNORECASE),
)
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MiB


@dataclass
class Finding:
    path: pathlib.Path
    line_number: int
    preview: str
    keyword: str


@dataclass
class ScanResult:
    scanned_files: int
    findings: List[Finding]
    skipped_files: int
    missing_paths: List[pathlib.Path]


def is_text_candidate(path: pathlib.Path) -> bool:
    if path.suffix.lower() in TEXT_EXTENSIONS:
        return True
    # Allow scanning files without extension if they live under logs/
    return "logs" in path.parts and path.is_file()


def iter_files(base_paths: Sequence[pathlib.Path]) -> Iterable[pathlib.Path]:
    for raw_path in base_paths:
        if not raw_path.exists():
            continue
        path = raw_path.resolve()
        if path.is_file():
            yield path
        else:
            for child in path.rglob("*"):
                if child.is_file():
                    yield child


def scan_files(paths: Sequence[pathlib.Path]) -> ScanResult:
    findings: List[Finding] = []
    scanned_files = 0
    skipped_files = 0
    missing_paths = [p for p in paths if not p.exists()]

    for file_path in iter_files(paths):
        if not is_text_candidate(file_path):
            continue
        try:
            if file_path.stat().st_size > MAX_FILE_SIZE_BYTES:
                skipped_files += 1
                continue
        except OSError:
            skipped_files += 1
            continue

        try:
            with file_path.open("r", encoding="utf-8", errors="ignore") as handle:
                for line_number, line in enumerate(handle, start=1):
                    for pattern in SUSPICIOUS_PATTERNS:
                        match = pattern.search(line)
                        if match:
                            preview = line.strip()
                            findings.append(
                                Finding(
                                    path=file_path,
                                    line_number=line_number,
                                    preview=preview[:200],
                                    keyword=pattern.pattern,
                                )
                            )
                            break
        except (OSError, UnicodeDecodeError):
            skipped_files += 1
            continue
        scanned_files += 1

    return ScanResult(
        scanned_files=scanned_files,
        findings=findings,
        skipped_files=skipped_files,
        missing_paths=missing_paths,
    )


def serialize_report(result: ScanResult) -> Dict[str, object]:
    return {
        "scanned_files": result.scanned_files,
        "skipped_files": result.skipped_files,
        "missing_paths": [str(p) for p in result.missing_paths],
        "finding_count": len(result.findings),
        "findings": [
            {
                "path": str(f.path),
                "line_number": f.line_number,
                "preview": f.preview,
                "keyword": f.keyword,
            }
            for f in result.findings
        ],
    }


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Scan log files for possible secrets.")
    parser.add_argument(
        "paths",
        nargs="*",
        type=pathlib.Path,
        help="Log directories or files to scan (defaults to logs/, backend/logs, frontend/logs).",
    )
    parser.add_argument(
        "--json",
        type=pathlib.Path,
        help="Optional path to write the JSON report",
    )
    args = parser.parse_args(argv)

    target_paths = tuple(args.paths) if args.paths else DEFAULT_PATHS
    result = scan_files(target_paths)

    if args.json:
        args.json.parent.mkdir(parents=True, exist_ok=True)
        with args.json.open("w", encoding="utf-8") as handle:
            json.dump(serialize_report(result), handle, indent=2)
            handle.write("\n")

    print(f"Scanned files: {result.scanned_files}")
    if result.skipped_files:
        print(f"Skipped files: {result.skipped_files}")
    if result.missing_paths:
        print("Missing paths:")
        for path in result.missing_paths:
            print(f"  - {path}")

    if not result.findings:
        print("No suspicious log entries found.")
        return 0

    print("\nPotential findings:")
    for finding in result.findings:
        print(
            f"- {finding.path}:{finding.line_number} [{finding.keyword}] -> {finding.preview}"
        )

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
