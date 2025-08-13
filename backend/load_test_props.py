import threading
import time

import requests

URL = "http://localhost:8000/api/props?sport=MLB"
NUM_REQUESTS = 100
CONCURRENT = 10
results = []


def worker():
    for _ in range(NUM_REQUESTS // CONCURRENT):
        try:
            start = time.time()
            r = requests.get(URL)
            elapsed = time.time() - start
            results.append((r.status_code, elapsed))
        except Exception as e:
            results.append(("ERR", str(e)))


threads = [threading.Thread(target=worker) for _ in range(CONCURRENT)]
for t in threads:
    t.start()
for t in threads:
    t.join()

success = sum(1 for code, _ in results if code == 200)
fail = sum(1 for code, _ in results if code != 200)
avg_time = sum(float(t) for code, t in results if code == 200) / max(success, 1)
print(f"Success: {success}, Fail: {fail}, Avg response time: {avg_time:.3f}s")
