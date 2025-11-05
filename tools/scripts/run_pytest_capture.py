#!/usr/bin/env python3
"""Run pytest with given mode and write output to a file under reports/.

Usage:
  python scripts/run_pytest_capture.py collect reports/pytest_collect_after_stubs.txt
  python scripts/run_pytest_capture.py full    reports/pytest_full_after_stubs.txt
"""
import os
import subprocess
import sys


def main(argv):
    if len(argv) < 3:
        print("Usage: run_pytest_capture.py <collect|full> <output-path>")
        return 2
    mode = argv[1]
    out_path = argv[2]
    os.makedirs(os.path.dirname(out_path), exist_ok=True)

    if mode == "collect":
        args = [sys.executable, "-m", "pytest", "--collect-only", "-q"]
    elif mode == "full":
        args = [sys.executable, "-m", "pytest", "--verbose", "--tb=short"]
    else:
        print("Unknown mode:", mode)
        return 2

    print("Running:", " ".join(args))
    p = subprocess.Popen(
        args, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True
    )
    out, _ = p.communicate()
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(out)
    print("Wrote output to", out_path)
    return p.returncode


if __name__ == "__main__":
    sys.exit(main(sys.argv))
import subprocess
import sys

with open("pytest_run_capture.txt", "w", encoding="utf-8") as f:
    p = subprocess.Popen(
        [sys.executable, "-m", "pytest", "--verbose", "--tb=short"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    out = ""
    for line in p.stdout:
        out += line
        print(line, end="")
    ret = p.wait()
    f.write(out)
    print("\n=== EXIT CODE ===")
    print(ret)
    sys.exit(ret)
