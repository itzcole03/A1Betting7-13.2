import ast
import sys
from pathlib import Path
p = Path('backend/routes/propfinder_routes.py')
if not p.exists():
    print('File not found:', p)
    sys.exit(1)
source = p.read_text(encoding='utf-8')
module = ast.parse(source)
issues = []
for node in ast.walk(module):
    if isinstance(node, ast.Try):
        has_handlers = bool(node.handlers)
        has_finally = bool(node.finalbody)
        has_else = bool(node.orelse)
        if not (has_handlers or has_finally):
            # Report this try as problematic
            issues.append((node.lineno, node.end_lineno if hasattr(node, 'end_lineno') else None, has_handlers, has_finally, has_else))

if not issues:
    print('No problematic try blocks found (all have except/finally).')
else:
    print('Found try blocks missing except/finally:')
    for lineno, end_lineno, handlers, finally_, orelse in issues:
        print(f'  try at line {lineno} (end {end_lineno}) handlers={handlers} finally={finally_} orelse={orelse}')
        # print snippet
        start = max(1, lineno-6)
        end = lineno+8
        lines = source.splitlines()
        for i in range(start-1, min(end, len(lines))):
            mark = '->' if i+1==lineno else '  '
            print(f'{mark} {i+1:4}: {lines[i]}')
        print('---')
