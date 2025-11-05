import hashlib
import py_compile
import traceback

p = "c:\\Users\\bcmad\\Downloads\\A1Betting7-13.2\\backend\\routes\\enhanced_ml_routes.py"
print("path:", p)
try:
    print("py_compile...")
    py_compile.compile(p, doraise=True)
    print("py_compile OK")
except Exception as e:
    print("py_compile ERR", type(e).__name__, e)
    traceback.print_exc()

with open(p, "rb") as f:
    b = f.read()
print("size:", len(b))
print("SHA256:", hashlib.sha256(b).hexdigest())
print("\n-- bytes around lines 240-256 --")
text = b.decode("utf-8", errors="replace")
lines = text.splitlines()
for i in range(236, 260):
    print(i + 1, repr(lines[i]))

print("\n-- tail bytes repr --")
print(repr(b[-400:]))

print("\nAttempt builtin compile:")
try:
    compile(text, p, "exec")
    print("builtin compile OK")
except Exception as e:
    print("builtin compile ERR", type(e).__name__, e)
    traceback.print_exc()
