from pathlib import Path
p=Path('backend/routes/propfinder_routes.py')
lines=p.read_text(encoding='utf-8').splitlines()
start=1036
end=1076
for i in range(start-1,end):
    print(f"{i+1:4}: {repr(lines[i])}")
