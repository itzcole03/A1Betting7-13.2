import importlib
import pathlib
import sys
import traceback

out_path = pathlib.Path("reports/feedback_inspect.txt")
try:
    mod = importlib.import_module("backend.routes.feedback")
    with out_path.open("w", encoding="utf-8") as f:
        f.write("MODULE_FILE: " + repr(getattr(mod, "__file__", None)) + "\n")
        try:
            p = pathlib.Path(mod.__file__)
            f.write("EXISTS: " + str(p.exists()) + "\n")
            f.write("\n--- SOURCE ---\n")
            f.write(p.read_text(encoding="utf-8"))
        except Exception as e:
            f.write("COULD NOT READ SOURCE: " + repr(e) + "\n")
    print("WROTE", out_path)
except Exception:
    with out_path.open("w", encoding="utf-8") as f:
        traceback.print_exc(file=f)
    print("WROTE", out_path)
