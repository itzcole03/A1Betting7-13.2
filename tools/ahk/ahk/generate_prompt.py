"""
A script to generate a development-focused prompt using a local LM Studio server (or compatible API),
copy it to the clipboard, and optionally insert it using AutoHotKey automation.

- Default: Uses LM Studio server endpoint (API_URL) and copies prompt to clipboard.
- Optional: Add --ahk flag to run AutoHotKey script for prompt insertion.
"""

import json
import os
import subprocess
import sys
import time

import pyperclip
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# === CONFIGURATION ===
# LM Studio server endpoint (default)
API_URL = "http://localhost:1234"
MODEL_NAME = "deepseek-coder-6.7b"

# Path to your AHK script (if using AHK automation)
AHK_SCRIPT_PATH = os.path.join(os.getcwd(), "AFKToggle.ahk")

# === LOGGING CONFIGURATION ===
from datetime import datetime

LOGS_DIR = r"C:\Users\bcmad\Downloads\A1Betting7-13.2\logs"
os.makedirs(LOGS_DIR, exist_ok=True)
LOG_FILE = os.path.join(
    LOGS_DIR, f"prompt_output_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
)

# === USAGE ===
# By default, this script only copies the generated prompt to clipboard.
# If you want to use AutoHotKey automation to insert the prompt into VS Code/Cursor Copilot chat, add the --ahk flag.
# Example: python generate_prompt.py <round> <context> --ahk
# Ensure AFKToggle.ahk is configured to target the correct window and chat input.


def get_available_model(preferred_model: str = None) -> str:
    try:
        log_info(
            f"Checking model availability at {API_URL}/v1/models for model '{preferred_model or MODEL_NAME}'"
        )
        response = requests.get(f"{API_URL}/v1/models", timeout=5)
        response.raise_for_status()
        log_info(f"/v1/models response: {response.text}")
        data = response.json().get("data", [])
        log_info(f"Raw data from /v1/models: {data}")
        models = [m["id"] for m in data if "id" in m]
        log_info(f"Available models: {models}")
        if not models:
            log_error("No models available in LM Studio. Please load a model.")
            return None
        if preferred_model and preferred_model in models:
            log_info(f"Selected preferred model: {preferred_model}")
            return preferred_model
        # Try to find a close match (case-insensitive substring)
        if preferred_model:
            for m in models:
                if (
                    preferred_model.lower() in m.lower()
                    or m.lower() in preferred_model.lower()
                ):
                    log_info(f"Using closest match model: {m}")
                    return m
        # Fallback: use the first available model
        log_info(f"Preferred model not found. Using first available model: {models[0]}")
        return models[0]
    except Exception as e:
        log_error(f"Failed to check model availability: {e}")
        return None


def call_model(prompt: str, model_name: str) -> str:
    try:
        endpoint = f"{API_URL}/v1/chat/completions"
        payload = {
            "model": model_name,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 512,
            "temperature": 0.7,
            "stream": False,
        }
        log_info(
            f"Calling model '{model_name}' at {endpoint} with payload: {json.dumps(payload)[:500]}"
        )
        if not prompt.strip():
            log_error("Prompt is empty before completion call!")
        session = requests.Session()
        retries = Retry(
            total=3, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504]
        )
        adapter = HTTPAdapter(max_retries=retries)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        response = session.post(
            endpoint,
            json=payload,
            timeout=120,
        )
        response.raise_for_status()
        log_info("Model response received, parsing JSON...")
        log_info(f"/v1/chat/completions response: {response.text}")
        result = (
            response.json()
            .get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
            .strip()
        )
        if not result:
            log_error("Completion result is empty!")
        return result
    except Exception as e:
        log_error(f"Failed to call model: {e}")
        sys.exit(2)


def build_prompt(round_num: str, context: str) -> str:
    return f"""You are an autonomous developer assistant inside a VS Code plugin.
Current round: {round_num}
Code context: {context}

Generate a high-quality, professional, development-focused prompt for GitHub Copilot or Cursor to follow during this phase. Include clear reasoning, goals, and best practices."""


def insert_with_ahk():
    if not os.path.exists(AHK_SCRIPT_PATH):
        log_error(f"AutoHotKey script not found at {AHK_SCRIPT_PATH}")
        sys.exit(3)
    try:
        subprocess.Popen(["AutoHotKey.exe", AHK_SCRIPT_PATH], shell=True)
        log_info("AutoHotKey script launched to insert the prompt.")
    except Exception as e:
        log_error(f"Failed to run AutoHotKey script: {e}")
        sys.exit(4)


def main():
    # Ensure log file exists at the very start
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        pass
    print(f"[DEBUG] Log file path: {LOG_FILE}")
    log_info(f"[DEBUG] Log file path: {LOG_FILE}")
    # Parse args and check for --ahk flag
    log_info(f"Script called with arguments: {sys.argv}")
    if len(sys.argv) < 3:
        log_error("Usage: generate_prompt.py <round> <context> [--ahk]")
        sys.exit(1)

    # Check for --ahk flag and optional model argument
    use_ahk = False
    model_arg = None
    args = sys.argv[1:]
    if "--ahk" in args:
        use_ahk = True
        args.remove("--ahk")
    # If a model is specified as the last argument with --model <model_name>
    if "--model" in args:
        idx = args.index("--model")
        if idx + 1 < len(args):
            model_arg = args[idx + 1]
            del args[idx : idx + 2]

    if len(args) < 2:
        log_error(
            "Usage: generate_prompt.py <round> <context> [--ahk] [--model <model_name>]"
        )
        sys.exit(1)

    round_num = args[0]
    context = " ".join(args[1:])
    log_info(f"Parsed round_num: {round_num}, context: {context}")

    preferred_model = model_arg if model_arg else MODEL_NAME
    model_name = get_available_model(preferred_model)
    if not model_name:
        log_error("No usable model found in LM Studio. Exiting.")
        sys.exit(1)
    if model_name != preferred_model:
        log_info(f"Using fallback model: {model_name}")

    prompt = build_prompt(round_num, context)
    log_info(f"Built prompt: {prompt}")
    if not prompt.strip():
        log_error("Prompt is empty after build_prompt!")
    log_info(f"Using model for completion: {model_name}")
    result = call_model(prompt, model_name)

    # Only print the prompt to stdout for AHK
    print(result)

    # Copy to clipboard for manual use/debugging
    try:
        pyperclip.copy(result)
        # Clipboard verification and fallback
        retries = 0
        while pyperclip.paste() != result and retries < 3:
            pyperclip.copy(result)
            time.sleep(0.1)
            retries += 1
        if pyperclip.paste() != result:
            log_error("Clipboard copy failed after retries!")
    except Exception as e:
        log_error(f"Failed to copy to clipboard: {e}")

    # Log output to file for debugging
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"[{datetime.now()}]\n{result}\n{'='*60}\n")

    if use_ahk:
        insert_with_ahk()


def log_error(msg):
    sys.stderr.write(f"[ERROR] {msg}\n")
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"[ERROR] {msg}\n")


def log_info(msg):
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"[INFO] {msg}\n")


if __name__ == "__main__":
    main()
