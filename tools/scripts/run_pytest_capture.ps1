# Run pytest and capture a short summary
python -m pytest -q --maxfail=1 | Select-String -Pattern "=+" -Context 0,3