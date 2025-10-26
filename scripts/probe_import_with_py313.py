import importlib
import inspect
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
out = ROOT / "reports" / "probe_py313.txt"
try:
    m = importlib.import_module("backend.routes.propollama")
    src = inspect.getsource(m)
    with out.open("w", encoding="utf-8") as fh:
        fh.write(f'MODULE_FILE: {getattr(m, "__file__", None)}\n')
        fh.write(f"SOURCE_LINES: {len(src.splitlines())}\n\n")
        fh.write(src)
    print("WROTE", out)
except Exception as e:
    with out.open("w", encoding="utf-8") as fh:
        fh.write("ERROR: " + repr(e) + "\n")
    print("ERROR", e)
