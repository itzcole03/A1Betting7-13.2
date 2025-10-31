import datetime
import subprocess
import sys

p = subprocess.Popen(
    [sys.executable, "-m", "pytest", "--verbose", "--tb=short"],
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True,
)
out, _ = p.communicate()
path = "reports/pytest_run_local.txt"
with open(path, "w", encoding="utf-8") as f:
    f.write("RUN AT: " + datetime.datetime.now(timezone.utc).isoformat().replace("+00:00", "Z") + "Z\n")
    f.write("EXIT CODE: " + str(p.returncode) + "\n\n")
    f.write(out)
print("wrote", path)
