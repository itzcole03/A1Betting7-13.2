from pathlib import Path

p = Path("backend/routes/propollama.py")
out = Path("reports/propollama_lines.txt")
if not p.exists():
    out.write_text("MISSING FILE")
else:
    lines = p.read_text(encoding="utf-8").splitlines()
    with out.open("w", encoding="utf-8") as fh:
        for i, l in enumerate(lines, start=1):
            fh.write(f"{i:04d}: {l}\n")
print("WROTE", out)
