#!/usr/bin/env python3
"""Run a targeted PrizePicks pytest file and save output to reports/pytest_prizepicks.txt"""
import os
import subprocess
import sys


def main(argv=None):
    argv = list(argv or sys.argv[1:])
    out_dir = os.path.join(os.getcwd(), "reports")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "pytest_prizepicks.txt")
    # Default target file; allow overriding via args
    target = argv or ["backend/tests/test_prizepicks_routes.py", "-q", "--tb=short"]
    cmd = [sys.executable, "-m", "pytest"] + target
    print("Running:", " ".join(cmd))
    with open(out_path, "w", encoding="utf-8") as f:
        proc = subprocess.Popen(
            cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True
        )
        for line in proc.stdout:
            f.write(line)
            sys.stdout.write(line)
        ret = proc.wait()
    print(f"pytest exitcode: {ret}; saved output to {out_path}")
    return ret


if __name__ == "__main__":
    raise SystemExit(main())
