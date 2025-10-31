import os
import subprocess
import sys
from datetime import datetime

OUT_DIR = "reports"
OUT_FILE = os.path.join(OUT_DIR, "pytest_full_output.txt")
if not os.path.exists(OUT_DIR):
    os.makedirs(OUT_DIR)

cmd = [sys.executable, "-m", "pytest", "--verbose", "--tb=short"]
proc = subprocess.run(cmd, capture_output=True, text=True, check=False)
with open(OUT_FILE, "w", encoding="utf-8") as f:
    f.write(f"RUN AT: {datetime.utcnow().isoformat()}Z\n")
    f.write(f"EXIT CODE: {proc.returncode}\n\n")
    f.write(proc.stdout)
    if proc.stderr:
        f.write("\n--- STDERR ---\n")
        f.write(proc.stderr)

print(f"Wrote pytest output to {OUT_FILE} (exit code {proc.returncode})")
sys.exit(proc.returncode)
