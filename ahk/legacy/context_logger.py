import subprocess
import json
import os
import sys
from datetime import datetime
from typing import Optional

def get_git_diff() -> str:
    try:
        result = subprocess.run(['git', 'diff', '--cached'], capture_output=True, text=True, check=True)
        return result.stdout.strip()
    except Exception as e:
        print(f"[ERROR] Failed to get git diff: {e}")
        return ""

def save_log(round_num: str, context: str, prompt: Optional[str] = None, response: Optional[str] = None) -> str:
    os.makedirs('logs', exist_ok=True)
    timestamp: str = datetime.now().strftime('%Y%m%d_%H%M%S')
    log_data: dict[str, Optional[str]] = {
        'timestamp': timestamp,
        'round': round_num,
        'context': context,
        'prompt': prompt,
        'response': response
    }
    log_path: str = os.path.join('logs', f'session_{round_num}_{timestamp}.json')
    with open(log_path, 'w', encoding='utf-8') as f:
        json.dump(log_data, f, indent=2)
    return log_path

def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: context_logger.py <round>")
        sys.exit(1)
    round_num: str = sys.argv[1]
    diff: str = get_git_diff()
    log_path: str = save_log(round_num, diff)
    print(diff)
    print(f"[INFO] Git diff context saved to {log_path}")

if __name__ == "__main__":
    main() 