"""
Simple helper to read a JSON file (API response) and pretty-print first N opportunities.
Usage:
    python scripts/print_ops.py path/to/ops.json 10
"""
import sys
import json


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/print_ops.py <file.json> [limit]")
        return

    path = sys.argv[1]
    limit = int(sys.argv[2]) if len(sys.argv) >= 3 else 25

    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    ops = data.get('data', {}).get('opportunities', [])
    for o in ops[:limit]:
        player = o.get('player')
        provider = o.get('provider_id') or ','.join(o.get('tags', []))
        conf = o.get('confidence')
        print(f"{player} | {provider} | conf={conf}")


if __name__ == '__main__':
    main()
