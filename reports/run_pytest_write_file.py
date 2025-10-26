import pathlib
import subprocess
import sys

out = pathlib.Path(__file__).resolve().parents[0] / "pytest_run_latest2.txt"
cmd = [sys.executable, "-m", "pytest", "--verbose", "--tb=short"]
with subprocess.Popen(
    cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True
) as p:
    out_lines = []
    for line in p.stdout or []:
        out_lines.append(line)
    p.wait()
    with open(out, "w", encoding="utf-8") as fh:
        fh.write("".join(out_lines))
    print("WROTE", out)
    sys.exit(p.returncode)
