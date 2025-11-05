"""Run pytest using absolute paths so run_in_terminal cwd issues don't block execution.
Writes output to reports/pytest_after_performance_fix_abs.txt
"""

import os
import subprocess
import sys

repo_root = r"c:\Users\bcmad\Downloads\A1Betting7-13.2"
outpath = os.path.join(repo_root, "reports", "pytest_after_performance_fix_abs.txt")
cmd = [sys.executable, "-m", "pytest", "--verbose", "--tb=short"]

with open(outpath, "w", encoding="utf-8") as f:
    f.write("Running: " + " ".join(cmd) + "\n\n")
    proc = subprocess.Popen(
        cmd, cwd=repo_root, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True
    )
    for line in proc.stdout:
        f.write(line)
    proc.wait()
    f.write(f"\n=== EXIT CODE === {proc.returncode}\n")

print("Wrote pytest output to:", outpath)
