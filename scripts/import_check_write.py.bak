import os
import sys
import traceback
from datetime import datetime

# Ensure repo root is on sys.path so package imports like `backend.*` work
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

out_path = "scripts/import_check_output.txt"
try:
    from backend.core.app import create_app

    app = create_app()
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(f"OK: create_app imported and executed. routes={len(app.routes)}\n")
except Exception as e:
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("ERROR during import:\n")
        traceback.print_exc(file=f)
    raise
