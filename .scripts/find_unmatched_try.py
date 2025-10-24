from pathlib import Path
p = Path('backend/routes/propfinder_routes.py')
if not p.exists():
    print('File not found')
    raise SystemExit(1)
lines = p.read_text(encoding='utf-8').splitlines()
max_line = min(len(lines), 1100)
stack = []
unmatched = []
for i in range(max_line):
    l = lines[i]
    stripped = l.lstrip('\t ')
    indent = len(l) - len(stripped)
    s = stripped
    # ignore comments
    if s.strip().startswith('#'):
        continue
    # detect try:
    if s.startswith('try:') or s.startswith('try ('):
        stack.append((i+1, indent))
    # detect except or finally
    if s.startswith('except') or s.startswith('finally'):
        # find last try with indent <= current indent
        for j in range(len(stack)-1, -1, -1):
            try_line, try_indent = stack[j]
            if try_indent == indent:
                stack.pop(j)
                break
        else:
            unmatched.append((i+1, 'handler_without_try', s.strip()))

print('Stack size (unclosed tries):', len(stack))
if stack:
    for ln, ind in stack:
        print('Unclosed try at line', ln, 'indent', ind)
        start = max(0, ln-6)
        end = min(len(lines), ln+8)
        for k in range(start, end):
            mark = '->' if k+1==ln else '  '
            print(f"{mark} {k+1:4}: {lines[k]}")
        print('---')

if unmatched:
    print('Handlers without matching try:')
    for ln, kind, text in unmatched:
        print(ln, kind, text)
