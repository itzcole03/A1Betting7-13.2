import hashlib
import os
import py_compile
import traceback

p = r"c:\Users\bcmad\Downloads\A1Betting7-13.2\backend\routes\enhanced_ml_routes.py"
out = r"c:\Users\bcmad\Downloads\A1Betting7-13.2\scripts\dump_enhanced_py313_output.txt"
with open(out, "w", encoding="utf-8") as o:
    o.write(f"path: {p}\n")
    try:
        py_compile.compile(p, doraise=True)
        o.write("py_compile OK\n")
    except Exception as e:
        o.write("py_compile ERR: " + repr(e) + "\n")
        traceback.print_exc(file=o)
    try:
        b = open(p, "rb").read()
        o.write("size: " + str(len(b)) + "\n")
        o.write("sha256: " + hashlib.sha256(b).hexdigest() + "\n\n")
        text = b.decode("utf-8", "replace")
        lines = text.splitlines()
        o.write("-- lines 236..260 --\n")
        for i in range(236, 260):
            if i < len(lines):
                o.write(f"{i+1}: {repr(lines[i])}\n")
            else:
                o.write(f"{i+1}: <MISSING>\n")
        o.write("\n-- tail 400 bytes repr --\n")
        o.write(repr(b[-400:]))
        o.write("\n")
    except Exception as e:
        o.write("READ ERR: " + repr(e) + "\n")
        traceback.print_exc(file=o)

# Also attempt to import under this interpreter to get module.__file__ (may execute module code)
try:
    import importlib
    import importlib.util

    spec = importlib.util.find_spec("backend.routes.enhanced_ml_routes")
    out_exists = spec is not None and getattr(spec, "origin", None) is not None
    with open(out, "a", encoding="utf-8") as o:
        o.write("\nfind_spec returned: " + repr(spec) + "\n")
        if out_exists:
            o.write("spec.origin: " + repr(spec.origin) + "\n")
        try:
            m = importlib.import_module("backend.routes.enhanced_ml_routes")
            with open(out, "a", encoding="utf-8") as o2:
                o2.write(
                    "\nimport OK; module file: "
                    + repr(getattr(m, "__file__", None))
                    + "\n"
                )
        except Exception as e:
            with open(out, "a", encoding="utf-8") as o2:
                o2.write("\nimport ERR: " + repr(e) + "\n")
                import traceback

                traceback.print_exc(file=o2)
except Exception as e:
    with open(out, "a", encoding="utf-8") as o:
        o.write("\nFIND_SPEC ERR: " + repr(e) + "\n")
        import traceback

        traceback.print_exc(file=o)
print("Wrote diagnostics to", out)
