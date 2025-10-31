#!/usr/bin/env bash
set -euo pipefail

# Simple seed script used by CI to populate backend with deterministic test data.
# Usage: ./scripts/seed_test_data.sh http://localhost:8000

BASE_URL=${1:-http://localhost:8000}

echo "Seeding test data to ${BASE_URL}..."

PAYLOAD=$(cat <<'JSON'
{
  "props": [
    {"player": "Alice Example", "stat_type": "points", "confidence": 72},
    {"player": "Bob Sample", "stat_type": "rebounds", "confidence": 55}
  ],
  "predictions": [
    {"player": "Alice Example", "confidence": 72, "source": "seed"}
  ]
}
JSON
)

curl -sSf -X POST "${BASE_URL}/internal/test/seed" -H "Content-Type: application/json" -d "$PAYLOAD" || {
  echo "Failed to seed test data to ${BASE_URL}" >&2
  exit 2
}

echo "Seed successful"
