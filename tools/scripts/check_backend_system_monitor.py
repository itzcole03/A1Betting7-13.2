import importlib
import sys

try:
    import backend
    print('backend.__file__=', getattr(backend, '__file__', None))
    print('has system_monitor (attr):', hasattr(backend, 'system_monitor'))
    # Force reload
    importlib.invalidate_caches()
    backend = importlib.reload(backend)
    print('after reload has system_monitor:', hasattr(backend, 'system_monitor'))
    try:
        import backend.system_monitor as sm
        print('import backend.system_monitor succeeded, module:', sm)
    except Exception as e:
        print('import backend.system_monitor failed:', repr(e))
except Exception as e:
    print('Import backend failed:', repr(e))
    sys.exit(1)
