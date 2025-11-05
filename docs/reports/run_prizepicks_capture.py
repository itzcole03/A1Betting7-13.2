#!/usr/bin/env python3
"""Run the PrizePicks tests and write output to a file for debugging.
Usage: python reports/run_prizepicks_capture.py
"""
import subprocess
import sys
from pathlib import Path

repo_root = Path(__file__).resolve().parents[1]
out = repo_root / "reports" / "prizepicks_test_output.txt"
out.parent.mkdir(parents=True, exist_ok=True)

cmd = [
    sys.executable,
    "-m",
    "pytest",
    "backend/tests/test_prizepicks_routes.py",
    "-q",
    "--tb=short",
]
with out.open("w", encoding="utf-8") as f:
    f.write("Running: " + " ".join(cmd) + "\n")
    p = subprocess.Popen(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True
    )
    if p.stdout is not None:
        for line in p.stdout:
            f.write(line)
            f.flush()
        rc = p.wait()
    else:
        outp = p.communicate()[0]
        if outp:
            f.write(outp)
        rc = p.returncode
    f.write("\nEXIT CODE: " + str(rc) + "\n")

print("WROTE", out)
sys.exit(rc)
