"""Run pytest programmatically and write full output to a file for triage.

This script is safe to run repeatedly and writes to reports/pytest_after_performance_fix.txt
so the CI or debugging tooling can read the exact output.
"""

import os
import subprocess
import sys

root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
os.chdir(root)
outpath = os.path.join(root, "reports", "pytest_after_performance_fix.txt")

cmd = [sys.executable, "-m", "pytest", "--verbose", "--tb=short"]

with open(outpath, "w", encoding="utf-8") as f:
    f.write("Running: " + " ".join(cmd) + "\n\n")
    proc = subprocess.Popen(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True
    )
    for line in proc.stdout:
        f.write(line)
    proc.wait()
    f.write(f"\n=== EXIT CODE === {proc.returncode}\n")

print("Wrote pytest output to:", outpath)
