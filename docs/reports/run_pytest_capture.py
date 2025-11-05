import pathlib
import subprocess
import sys

out = pathlib.Path(__file__).resolve().parents[0] / "pytest_capture_programmatic.txt"
cmd = [sys.executable, "-m", "pytest", "--verbose", "--tb=short"]
with subprocess.Popen(
    cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True
) as p:
    out_text = ""
    for line in p.stdout:
        out_text += line
    p.wait()
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(out_text)
    print("WROTE", out)
    sys.exit(p.returncode)
