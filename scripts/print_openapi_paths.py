import urllib.request, json, sys

url = 'http://127.0.0.1:8000/openapi.json'
try:
    with urllib.request.urlopen(url, timeout=10) as r:
        data = json.load(r)
        paths = sorted(data.get('paths', {}).keys())
        if not paths:
            print('No paths found in openapi.json or empty response')
            sys.exit(0)
        for p in paths:
            print(p)
except Exception as e:
    print('ERROR:', e)
    sys.exit(1)
