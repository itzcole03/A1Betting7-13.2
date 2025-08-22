import ast
import linecache
import sys

p = 'backend/routes/propollama.py'
src = open(p, 'r', encoding='utf-8').read()
try:
    ast.parse(src)
    print('AST parse OK')
except SyntaxError as e:
    print('SyntaxError:', e)
    print('Line:', e.lineno)
    print(linecache.getline(p, e.lineno).rstrip())
    sys.exit(1)
