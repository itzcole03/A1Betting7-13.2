from pathlib import Path
import zipfile
import sys

zip_path = Path(r'C:/Users/bcmad/Downloads/A1Betting7-13.2/tests/e2e/tests/e2e/test-results/navigation-Navigation-and--27fed-avigate-to-matchup-analysis-chromium/trace.zip')
dest = Path(r'C:/Users/bcmad/Downloads/A1Betting7-13.2/tests/e2e/tmp/trace-unpacked-1')

if not zip_path.exists():
    print('ZIP not found:', zip_path)
    sys.exit(1)

if dest.exists():
    import shutil
    shutil.rmtree(dest)

with zipfile.ZipFile(zip_path, 'r') as z:
    z.extractall(dest)

print('Extracted to', dest)
for p in sorted(dest.rglob('*')):
    rel = p.relative_to(dest)
    print(rel)
