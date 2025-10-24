import re
from pathlib import Path

files = [
    'backend/routes/enhanced_api.py',
    'backend/routes/production_health_routes.py',
    'backend/routes/unified_api.py',
]

route_pattern = re.compile(r'@router\.(get|post|put|delete|patch)\s*\([^)]*\)\s*\n\s*(?:async\s+)?def\s+(\w+)', re.MULTILINE)
response_model_pattern = re.compile(r'response_model\s*=')

for fp in files:
    p = Path(fp)
    text = p.read_text(encoding='utf-8')
    print('\n===', fp)
    for m in route_pattern.finditer(text):
        method, func = m.group(1), m.group(2)
        start = m.start()
        decorator_start = text.rfind('@router', 0, start)
        decorator_end = m.end()
        decorator_section = text[decorator_start:decorator_end]
        found = bool(response_model_pattern.search(decorator_section))
        print(f'Function {func} (method={method}) at line {text[:start].count("\n") + 1}: found_response_model={found}')
        if not found:
            print('DECORATOR SECTION:')
            print(decorator_section)
            print('-----')

print('\nDone')
