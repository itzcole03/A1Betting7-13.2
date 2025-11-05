files = [
    "backend/routes/metrics_routes.py",
    "backend/routes/trends_routes.py",
    "backend/routes/betting.py",
    "backend/routes/consolidated_ml.py",
    "backend/routes/diagnostics.py",
    "backend/routes/streaming/streaming_api.py",
]
for f in files:
    print("---", f)
    try:
        with open(f, "r", encoding="utf-8") as fh:
            lines = fh.readlines()
        for i, line in enumerate(lines[:120], start=1):
            if i in (50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 76, 139, 200):
                print(i, line.rstrip("\n"))
    except Exception as e:
        print("ERROR reading", f, e)
