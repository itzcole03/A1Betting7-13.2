import os
import subprocess
import sys

out_path = "pytest_full_capture.txt"
cmd = [sys.executable, "-m", "pytest", "--verbose", "--tb=short"]
print("Running:", " ".join(cmd))
res = subprocess.run(cmd, capture_output=True, text=True)
with open(out_path, "w", encoding="utf-8") as f:
    f.write("RETURN CODE: " + str(res.returncode) + "\n\n")
    f.write("STDOUT:\n")
    f.write(res.stdout)
    f.write("\n\nSTDERR:\n")
    f.write(res.stderr)

print("Wrote", out_path)
sys.exit(res.returncode)
