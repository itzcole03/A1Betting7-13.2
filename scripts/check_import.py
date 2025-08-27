import importlib
import traceback
try:
    importlib.import_module('backend.core.app')
    print('imported OK')
except Exception:
    traceback.print_exc()
    raise