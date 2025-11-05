import ast, linecache
p='backend/core/app.py'
s=open(p,'r',encoding='utf-8').read()
try:
    ast.parse(s)
    print('OK')
except SyntaxError as e:
    print('SyntaxError', e.lineno, e.msg)
    print('LINE:', linecache.getline(p,e.lineno).rstrip())
    for i in range(max(1,e.lineno-6), e.lineno+3):
        print(f'{i:5}:', linecache.getline(p,i).rstrip())
