import importlib, sys, inspect
import backend

try:
    mod = importlib.import_module('backend.routes.feedback')
    print('backend.routes.feedback module:', mod)
    print('__file__:', getattr(mod, '__file__', None))
    # try show first 80 chars of source if available
    try:
        import pathlib
n        p = pathlib.Path(mod.__file__)
        text = p.read_text(encoding='utf-8')
        print('\n--- feedback.py source (first 400 chars) ---')
        print(text[:400])
    except Exception as e:
        print('could not read source:', e)
    # show the _feedback_stub module info
    try:
        stub = importlib.import_module('backend.routes._feedback_stub')
        print('\n_feedback_stub __file__:', getattr(stub, '__file__', None))
        try:
            p = pathlib.Path(stub.__file__)
            print('\n--- _feedback_stub source (first 400 chars) ---')
            print(p.read_text(encoding='utf-8')[:400])
        except Exception as e:
            print('could not read stub source:', e)
    except Exception as e:
        print('import _feedback_stub failed:', e)
except Exception as e:
    import traceback
    traceback.print_exc()
    sys.exit(1)
else:
    print('\nImported successfully')
