#!/usr/bin/env python3
"""Run pytest via subprocess and write combined stdout/stderr to reports/pytest_full.txt
This is cross-platform and uses the current Python interpreter when executed with
`python scripts/run_pytest_wrapper.py` or `python -u`.
"""
import os
import subprocess
import sys


def main(argv=None):
    argv = list(argv or sys.argv[1:])
    # Determine repository root (one level up from scripts/)
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out_dir = os.path.join(repo_root, "reports")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "pytest_full.txt")
    cmd = [sys.executable, "-m", "pytest"] + argv
    # Print to console so CI/VS Code shows progress; also capture to file
    print("Running:", " ".join(cmd))
    with open(out_path, "w", encoding="utf-8") as f:
        env = os.environ.copy()
        # Force UTF-8 for pytest subprocess output (prevents UnicodeEncodeError on Windows)
        env["PYTHONIOENCODING"] = env.get("PYTHONIOENCODING", "utf-8")
        # Enable lightweight "lean" dev/test mode by default for pytest runs.
        # This short-circuits heavy initialization paths during tests and keeps
        # timing-sensitive tests deterministic. Tests can opt-out by setting
        # APP_DEV_LEAN_MODE in their environment explicitly.
        if "APP_DEV_LEAN_MODE" not in env:
            env["APP_DEV_LEAN_MODE"] = "true"
        print(f"Starting pytest in repo root: {repo_root}")
        # Ensure we read subprocess output as UTF-8 to avoid decoding errors
        # on Windows consoles that default to a legacy code page. Use
        # errors='replace' to avoid crashing on unexpected bytes.
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",
            env=env,
            cwd=repo_root,
        )
        # Stream output both to stdout and file. On Windows the console may not
        # accept some Unicode characters; encode/decode with replacement to
        # prevent UnicodeEncodeError crashes while still preserving output in
        # the saved file.
        for line in proc.stdout:
            f.write(line)
            try:
                sys.stdout.write(line)
            except UnicodeEncodeError:
                # Fallback: encode using stdout encoding with replace, then
                # decode back to string and write.
                enc = getattr(sys.stdout, "encoding", "utf-8") or "utf-8"
                safe = line.encode(enc, errors="replace").decode(enc, errors="replace")
                sys.stdout.write(safe)
        ret = proc.wait()
    print(f"pytest exitcode: {ret}; saved output to {out_path}")
    return ret


if __name__ == "__main__":
    raise SystemExit(main())
