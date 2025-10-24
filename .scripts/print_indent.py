from pathlib import Path
p=Path('backend/routes/propfinder_routes.py')
lines=p.read_text(encoding='utf-8').splitlines()
for i in range(760,1090):
    l=lines[i]
    leading=len(l)-len(l.lstrip('\t '))
    print(f"{i+1:4}: lead={leading:2} | {repr(l)}")
