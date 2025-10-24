import re
from pathlib import Path

files = [
    'backend/routes/enhanced_api.py',
    'backend/routes/production_health_routes.py',
    'backend/routes/unified_api.py',
    'backend/routes/optimized_api_routes.py',
]

route_pattern = re.compile(r'@router\.(get|post|put|delete|patch)\s*\([^)]*\)\s*\n\s*(?:async\s+)?def\s+(\w+)', re.MULTILINE)
response_model_pattern = re.compile(r'response_model\s*=')

for fp in files:
    p = Path(fp)
    if not p.exists():
        print('MISSING FILE:', fp)
        continue
    text = p.read_text(encoding='utf-8')
    print('\n---', fp)
    found = False
    for m in route_pattern.finditer(text):
        found = True
        method = m.group(1)
        func = m.group(2)
        start = m.start()
        decorator_start = text.rfind('@router', 0, start)
        decorator_end = m.end()
        decorator_section = text[decorator_start:decorator_end]
        has = bool(response_model_pattern.search(decorator_section))
        print(f'{func} (method={method}) at line {text[:start].count("\n") + 1} has_response_model={has}')
    if not found:
        print('No @router decorators matched in file')

    # context checks
    if 'simple-test' in text:
        idx = text.find('simple-test')
        print('\ncontext around simple-test:')
        print(text[max(0, idx-120):idx+120])
    if '/health/comprehensive' in text:
        idx = text.find('/health/comprehensive')
        print('\ncontext around /health/comprehensive:')
        print(text[max(0, idx-120):idx+120])
    if '/analysis' in text and 'unified_api' in fp:
        idx = text.find('/analysis')
        print('\ncontext around /analysis:')
        print(text[max(0, idx-120):idx+120])

print('\nScan complete')
