import py_compile
import sys
import traceback

p = r"c:\Users\bcmad\Downloads\A1Betting7-13.2\backend\routes\enhanced_ml_routes.py"
print("path:", p)
try:
    print("py_compile...")
    py_compile.compile(p, doraise=True)
    print("py_compile OK")
except Exception as e:
    print("py_compile ERR", type(e).__name__, e)
    traceback.print_exc()

print("\nreading bytes...")
with open(p, "rb") as f:
    b = f.read()
print("size:", len(b))
# print last 400 bytes repr
tail = b[-400:]
print("TAIL BYTES REPR:")
print(repr(tail))

print("\nDecode with utf-8 replace:")
text = b.decode("utf-8", errors="replace")
lines = text.splitlines()
for i in range(236, 260):
    print(i + 1, repr(lines[i]))

print("\nDecode with latin-1:")
text2 = b.decode("latin-1")
lines2 = text2.splitlines()
for i in range(236, 260):
    print(i + 1, repr(lines2[i]))

print("\nAttempt compile with builtin compile()")
try:
    compile(text, p, "exec")
    print("builtin compile OK")
except Exception as e:
    print("builtin compile ERR", type(e).__name__, e)
    traceback.print_exc()

print("\nDone")
