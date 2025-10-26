"""Run pytest from Python and write output to an absolute path file to avoid shell redirection quirks."""

import os
import subprocess
import sys

repo = r"c:\Users\bcmad\Downloads\A1Betting7-13.2"
out = os.path.join(repo, "reports", "pytest_after_cache_clear_absolute.txt")

cmd = [sys.executable, "-m", "pytest", "--verbose", "--tb=short"]

with open(out, "w", encoding="utf-8") as f:
    f.write("Running: " + " ".join(cmd) + "\n\n")
    p = subprocess.Popen(
        cmd, cwd=repo, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True
    )
    if p.stdout is None:
        f.write("No stdout available from subprocess\n")
    else:
        for ln in p.stdout:
            f.write(ln)
    p.wait()
    f.write(f"\n=== EXIT CODE === {p.returncode}\n")

print("Wrote:", out)
