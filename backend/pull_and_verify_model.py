import sys
import time

import httpx

OLLAMA_BASE = "http://localhost:11434"
MODEL = "llama3:8b"
TIMEOUT = 600  # seconds
POLL_INTERVAL = 5  # seconds


def check_ollama_running():
    try:
        resp = httpx.get(f"{OLLAMA_BASE}/api/version", timeout=5)
        if resp.status_code == 200:
            print(f"Ollama is running. Version: {resp.json().get('version')}")
            return True
        else:
            print(f"Ollama version check failed: {resp.text}")
            return False
    except Exception as e:
        print(f"Ollama is not running or not reachable: {e}")
        return False


def pull_model(model_name):
    print(f"Requesting pull for model: {model_name}")
    try:
        with httpx.stream(
            "POST", f"{OLLAMA_BASE}/api/pull", json={"model": model_name}, timeout=300
        ) as resp:
            if resp.status_code != 200:
                print(f"Failed to pull model: {resp.text}")
                return False
            for line in resp.iter_lines():
                if not line.strip():
                    continue
                try:
                    data = httpx.Response(200, content=line).json()
                except Exception:
                    import json

                    data = json.loads(line)
                status = data.get("status")
                print(f"Model pull status: {status}")
                if status == "success":
                    print(f"Model '{model_name}' pulled successfully.")
                    return True
            print(f"Model pull did not complete successfully.")
            return False
    except Exception as e:
        print(f"Exception during model pull: {e}")
        return False


def model_available(model_name):
    try:
        resp = httpx.get(f"{OLLAMA_BASE}/api/tags", timeout=10)
        if resp.status_code == 200:
            models = [m["name"] for m in resp.json().get("models", [])]
            return model_name in models
        else:
            print(f"Failed to list local models: {resp.text}")
            return False
    except Exception as e:
        print(f"Exception checking local models: {e}")
        return False


def model_loaded(model_name):
    try:
        resp = httpx.get(f"{OLLAMA_BASE}/api/ps", timeout=10)
        if resp.status_code == 200:
            running = [m["model"] for m in resp.json().get("models", [])]
            return model_name in running
        else:
            print(f"Failed to list running models: {resp.text}")
            return False
    except Exception as e:
        print(f"Exception checking running models: {e}")
        return False


def load_model(model_name):
    # Load model into memory by sending an empty prompt (per Ollama API)
    try:
        resp = httpx.post(
            f"{OLLAMA_BASE}/api/generate",
            json={"model": model_name, "prompt": ""},
            timeout=60,
        )
        if resp.status_code == 200:
            print(f"Model '{model_name}' loaded into memory.")
            return True
        else:
            print(f"Failed to load model: {resp.text}")
            return False
    except Exception as e:
        print(f"Exception loading model: {e}")
        return False


def wait_for_model_ready(model_name, timeout=TIMEOUT):
    print(f"Waiting for model '{model_name}' to be available and loaded...")
    start = time.time()
    while time.time() - start < timeout:
        if not model_available(model_name):
            print(f"Model '{model_name}' not yet available locally. Retrying...")
            time.sleep(POLL_INTERVAL)
            continue
        if not model_loaded(model_name):
            print(f"Model '{model_name}' not loaded. Attempting to load...")
            load_model(model_name)
            time.sleep(POLL_INTERVAL)
            continue
        print(f"Model '{model_name}' is available and loaded!")
        return True
    print(f"Timeout: Model '{model_name}' not ready after {timeout} seconds.")
    return False


def main():
    if not check_ollama_running():
        print("Ollama is not running. Please start the Ollama server.")
        sys.exit(1)
    if not pull_model(MODEL):
        print("Model pull failed. Check network, model name, or Ollama version.")
        sys.exit(2)
    if not wait_for_model_ready(MODEL):
        print("Model readiness check failed.")
        sys.exit(3)
    print("Model pull and readiness check complete.")


if __name__ == "__main__":
    main()
