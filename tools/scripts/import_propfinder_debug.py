import traceback
import importlib
import os
import sys

# Ensure repo root is on sys.path so `backend` package can be imported when
# running this script from the `scripts/` directory.
repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)

print('PWD:', os.getcwd())
print('Inserted repo_root on sys.path:', repo_root)
print('sys.path[0]:', sys.path[0])

try:
    importlib.import_module('backend.routes.propfinder_routes')
    print('IMPORT_OK')
except Exception:
    traceback.print_exc()
    print('IMPORT_FAIL')
