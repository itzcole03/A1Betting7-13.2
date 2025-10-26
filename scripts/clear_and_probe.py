import importlib
import inspect
import pathlib
import shutil
import subprocess
import sys
import traceback

ROOT = pathlib.Path(__file__).resolve().parents[1]
# Ensure project root is on sys.path so 'backend' package imports work when running this script
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

ROOT = pathlib.Path(__file__).resolve().parents[1]
backend = ROOT / "backend"
reports = ROOT / "reports"
reports.mkdir(exist_ok=True)

# Clear caches
for d in backend.rglob("__pycache__"):
    try:
        shutil.rmtree(d)
    except Exception:
        pass
for f in backend.rglob("*.pyc"):
    try:
        f.unlink()
    except Exception:
        pass
print("CLEARED: __pycache__ and .pyc files under backend")

# Probe import
probe_file = reports / "which_performance_after_clear.txt"
try:
    importlib.invalidate_caches()
    perf = importlib.import_module("backend.routes.performance")
    src = inspect.getsource(perf)
    with probe_file.open("w", encoding="utf-8") as fh:
        fh.write(f'MODULE_FILE: {getattr(perf, "__file__", None)}\n\n')
        fh.write(src)
    print("WROTE PROBE:", probe_file)
except Exception as e:
    with probe_file.open("w", encoding="utf-8") as fh:
        fh.write("ERROR during import probe:\n")
        traceback.print_exc(file=fh)
    print("WROTE PROBE ERROR:", probe_file)

# Run pytest and capture output
py_out = reports / "pytest_after_clear.txt"
try:
    print("Running pytest... this may take a while")
    p = subprocess.run(
        [sys.executable, "-m", "pytest", "--verbose", "--tb=short"],
        capture_output=True,
        text=True,
    )
    with py_out.open("w", encoding="utf-8") as fh:
        fh.write(p.stdout)
        fh.write("\n\nSTDERR:\n")
        fh.write(p.stderr)
    print("WROTE PYTEST OUTPUT:", py_out)
    # Exit with pytest exit code so run_in_terminal shows status
    sys.exit(p.returncode)
except Exception:
    with py_out.open("w", encoding="utf-8") as fh:
        fh.write("ERROR running pytest:\n")
        traceback.print_exc(file=fh)
    print("WROTE PYTEST ERROR:", py_out)
    sys.exit(1)
