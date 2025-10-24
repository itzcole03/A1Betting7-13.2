import re
from pathlib import Path

files = [
    'backend/routes/enhanced_api.py',
    'backend/routes/production_health_routes.py',
    'backend/routes/unified_api.py',
    'backend/routes/optimized_api_routes.py',
]

patterns = [
    r'return\s+[^\n]*"error"\s*:\s*[^}]+',
    r'return\s+[^\n]*"status"\s*:\s*"error"',
    r'JSONResponse\([^)]*status_code\s*=\s*\d+[^)]*"error"',
]

for fp in files:
    p = Path(fp)
    if not p.exists():
        continue
    text = p.read_text(encoding='utf-8')
    for pat in patterns:
        for m in re.finditer(pat, text, re.MULTILINE | re.DOTALL):
            snippet = m.group()
            start_line = text[:m.start()].count('\n') + 1
            print(f"{fp}:{start_line}: pattern={pat}\n  {snippet[:400].replace('\n','\\n')}\n")
print('\nScan complete')
