import importlib
import sys

# Ensure repo root is on sys.path so package imports succeed when run from any cwd
sys.path.insert(0, r"c:\Users\bcmad\Downloads\A1Betting7-13.2")
try:
    importlib.import_module("backend.services.ticketing.ticket_service")
    print("IMPORT_OK")
except Exception as e:
    print("IMPORT_ERROR", type(e).__name__, str(e))
    raise
