def test_debug_import():
    import importlib
    import importlib.util
    import sys

    print("\n=== debug pytest import info ===")
    print("python version:", sys.version)
    print("\nsys.path:")
    for p in sys.path[:10]:
        print("  ", p)
    print("\nfind_spec for backend.routes.enhanced_ml_routes:")
    spec = importlib.util.find_spec("backend.routes.enhanced_ml_routes")
    print("  spec:", spec)
    if spec:
        print("  origin:", getattr(spec, "origin", None))
    try:
        m = importlib.import_module("backend.routes.enhanced_ml_routes")
        print("  imported module file:", getattr(m, "__file__", None))
    except Exception as e:
        import traceback

        print("  import error:", type(e).__name__, e)
        traceback.print_exc()
    print("=== end debug info ===\n")
