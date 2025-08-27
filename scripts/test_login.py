import httpx

def try_login(port):
    url = f'http://127.0.0.1:{port}/api/auth/login'
    try:
        r = httpx.post(url, json={'email': 'ncr@a1betting.com', 'password': 'A1Betting1337!'}, timeout=5)
        print(port, r.status_code)
        print(r.text)
    except Exception as e:
        print(port, 'error', e)

if __name__ == '__main__':
    try_login(8000)
    try_login(8002)
