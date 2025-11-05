import subprocess
import sys
from pathlib import Path

out = Path("reports/pytest_collect_after_stubs.txt")
cmd = [sys.executable, "-m", "pytest", "--collect-only", "-q"]
print("Running:", " ".join(cmd))
with out.open("w", encoding="utf-8") as f:
    p = subprocess.Popen(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True
    )
    for line in p.stdout:
        f.write(line)
        print(line, end="")
    ret = p.wait()
print("exit code", ret)
sys.exit(ret)
