import sys
from pathlib import Path
sys.path.insert(0, str(Path('.').resolve()))

try:
    import scripts.check_aggregates as ca
    print('check_aggregates imported successfully')
    # If the script exposes a function, call it; otherwise importing may have executed it
except Exception as e:
    print('Error running check_aggregates:', e)
    raise
