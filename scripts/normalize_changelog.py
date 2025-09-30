#!/usr/bin/env python
"""
Changelog normalizer (safe, idempotent).

Features:
- Converts leading "*" list markers to "-" (MD004)
- Trims trailing whitespace (MD009)
- Collapses >2 consecutive blank lines to max 2 (configurable)
- Optional: append " (Archived)" to dated release headings without it
- Skips:
  * Fenced code blocks (``` or ~~~)
  * Existing lines already using '-' correctly
  * [Unreleased] section (left exactly as-is)
- Dry-run by default: prints concise diff-like preview and summary
- Exits non‑zero if --write not supplied but changes detected (optional CI gating with --strict)

Usage:
  Dry run (preview):
    python scripts/normalize_changelog.py --file CHANGELOG.md
  Apply changes:
    python scripts/normalize_changelog.py --file CHANGELOG.md --write
  Also mark date headings as archived:
    python scripts/normalize_changelog.py --file CHANGELOG.md --write --archive-headings
  Strict mode (fail CI if changes would occur):
    python scripts/normalize_changelog.py --file CHANGELOG.md --strict
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from typing import List, Tuple

LIST_ASTERISK_RE = re.compile(r'^(\s*)\*\s+')
# Support both bracketed and unbracketed date headings used in this repo
DATE_HEADING_RE = re.compile(r'^##\s+(?:\[\d{4}-\d{2}(?:-\d{2})?.*?\]|\d{4}-\d{2}(?:-\d{2})?.*)$')
UNRELEASED_HEADING_RE = re.compile(r'^##\s+\[Unreleased\]', re.IGNORECASE)
FENCE_RE = re.compile(r'^(```|~~~)')


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Normalize CHANGELOG formatting.")
    p.add_argument("--file", required=True, help="Path to CHANGELOG.md")
    p.add_argument("--write", action="store_true", help="Apply changes (otherwise dry-run)")
    p.add_argument("--archive-headings", action="store_true",
                   help='Append " (Archived)" to dated release headings missing it')
    p.add_argument("--max-blank", type=int, default=2, help="Maximum consecutive blank lines to retain")
    p.add_argument("--strict", action="store_true",
                   help="Exit code 1 if changes needed and --write not used")
    p.add_argument("--no-color", action="store_true", help="Disable ANSI colors in output")
    return p.parse_args()


class Normalizer:
    def __init__(self,
                 lines: List[str],
                 archive_headings: bool,
                 max_blank: int):
        self.original = lines
        self.archive_headings = archive_headings
        self.max_blank = max_blank
        self.modified: List[str] = []
        self.changes: List[Tuple[int, str, str]] = []
        self._in_code_fence = False
        self._in_unreleased = False

    def normalize(self):
        blank_run = 0
        for idx, raw in enumerate(self.original):
            line = raw.rstrip('\n')
            orig_line = line

            # Track code fences
            if FENCE_RE.match(line.strip()):
                self._in_code_fence = not self._in_code_fence

            # Detect Unreleased section boundaries
            if UNRELEASED_HEADING_RE.match(line):
                self._in_unreleased = True
            elif self._in_unreleased and line.startswith("## ") and not UNRELEASED_HEADING_RE.match(line):
                # Next heading starts: leave unreleased
                self._in_unreleased = False

            if self._in_code_fence or self._in_unreleased:
                # Preserve exactly
                pass
            else:
                # Normalize list markers
                line = self._convert_asterisk(line)
                # Archive heading mark
                if self.archive_headings:
                    line = self._archive_heading(line)

                # Trim trailing spaces
                trimmed = line.rstrip()
                line = trimmed

            # Collapse blank lines
            if line.strip() == "":
                blank_run += 1
                if blank_run > self.max_blank:
                    # Skip adding extra blank
                    continue
            else:
                blank_run = 0

            if line != orig_line:
                self.changes.append((idx + 1, orig_line, line))
            self.modified.append(line)

    def _convert_asterisk(self, line: str) -> str:
        m = LIST_ASTERISK_RE.match(line)
        if not m:
            return line
        indent = m.group(1)
        return LIST_ASTERISK_RE.sub(f"{indent}- ", line, count=1)

    def _archive_heading(self, line: str) -> str:
        m = DATE_HEADING_RE.match(line)
        if not m:
            return line
        if "(Archived)" in line:
            return line
        return f"{line} (Archived)"

    def result_text(self) -> str:
        return "\n".join(self.modified) + ("\n" if self.modified and not self.modified[-1].endswith("\n") else "")


def color(s: str, code: str, enable: bool) -> str:
    if not enable:
        return s
    return f"\x1b[{code}m{s}\x1b[0m"


def main():
    args = parse_args()
    path = Path(args.file)
    if not path.exists():
        print(f"ERROR: File not found: {path}", file=sys.stderr)
        return 2

    lines = path.read_text(encoding="utf-8").splitlines()
    normalizer = Normalizer(lines, archive_headings=args.archive_headings, max_blank=args.max_blank)
    normalizer.normalize()

    if not normalizer.changes:
        print("No changes needed. ✅")
        return 0

    # Dry-run preview
    use_color = not args.no_color and sys.stdout.isatty()
    print(f"Detected {len(normalizer.changes)} change(s).")

    # Show up to first 30 changes
    preview_limit = 30
    for i, (ln, before, after) in enumerate(normalizer.changes[:preview_limit], 1):
        print(
            f"{color('@@', '36', use_color)} line {ln}\n"
            f"  {color('-', '31', use_color)} {before}\n"
            f"  {color('+', '32', use_color)} {after}"
        )
    if len(normalizer.changes) > preview_limit:
        remaining = len(normalizer.changes) - preview_limit
        print(f"... ({remaining} more changes)")

    if args.write:
        path.write_text(normalizer.result_text(), encoding="utf-8")
        print(f"Changes written to {path} ✍️")
        return 0

    print("Dry run complete (no changes written). Use --write to apply.")
    if args.strict:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
