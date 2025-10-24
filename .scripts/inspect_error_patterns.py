import re
p=r'c:/Users/bcmad/Downloads/A1Betting7-13.2/backend/routes/production_health_routes.py'
s=open(p,'r',encoding='utf-8').read()
patterns=[r'return\s+.*"error":\s*[^}]+', r'return\s+.*"status":\s*"error"', r'JSONResponse\([^)]*status_code=\d+.*"error"']
for pat in patterns:
    m=list(re.finditer(pat,s,re.MULTILINE|re.DOTALL))
    print(pat, 'matches:', len(m))
    for mm in m:
        print('start', mm.start(), 'line', s[:mm.start()].count('\n')+1, 'snippet:', s[mm.start():mm.start()+200])
