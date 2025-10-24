"""
Simple helper: read JSON from stdin or file and print player | provider/tags | confidence lines.
Usage:
  cat response.json | python scripts/print_opportunities.py
  python scripts/print_opportunities.py response.json
"""
import sys
import json

def print_ops(ops):
    for o in ops:
        player = o.get('player') or o.get('player_name') or '<unknown>'
        provider = o.get('provider_id') or ','.join(o.get('tags', []))
        conf = o.get('confidence')
        print(f"{player} | {provider} | conf={conf}")


def main():
    if len(sys.argv) > 1:
        path = sys.argv[1]
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    else:
        data = json.load(sys.stdin)

    ops = data.get('data', {}).get('opportunities', []) if isinstance(data, dict) else []
    print_ops(ops[:50])

if __name__ == '__main__':
    main()
