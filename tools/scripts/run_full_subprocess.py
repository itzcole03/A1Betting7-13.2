import subprocess
import sys
from pathlib import Path

out = Path("reports/pytest_full_after_stubs.txt")
cmd = [sys.executable, "-m", "pytest", "--verbose", "--tb=short"]
print("Running:", " ".join(cmd))
try:
    res = subprocess.run(cmd, capture_output=True, text=True, check=False)
    out.write_text(res.stdout + "\n" + res.stderr, encoding="utf-8")
    print("Exit code:", res.returncode)
    sys.exit(res.returncode)
except Exception as e:
    out.write_text(f"Exception: {e}\n")
    raise
