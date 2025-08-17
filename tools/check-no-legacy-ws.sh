#!/usr/bin/env bash
set -euo pipefail

echo "[Guard] Checking for legacy WebSocket pattern 'client_/ws' ..."

# Define allowed files that can contain legacy patterns for documentation
ALLOWED_FILES=(
  "CHANGELOG.md"
  "docs/websockets/LEGACY_MIGRATION_NOTICE.md"
)

# Search for violations, excluding allowed files
violations=""
for allowed_file in "${ALLOWED_FILES[@]}"; do
  if [ -f "$allowed_file" ]; then
    # Build grep exclusion pattern
    EXCLUDE_PATTERN="${EXCLUDE_PATTERN:-}${EXCLUDE_PATTERN:+ --exclude=}$allowed_file"
  fi
done

# Perform the search with exclusions
if [ -n "${EXCLUDE_PATTERN:-}" ]; then
  violations=$(grep -R "client_/ws" --line-number . $EXCLUDE_PATTERN || true)
else
  violations=$(grep -R "client_/ws" --line-number . || true)
fi

if [ -n "$violations" ]; then
  echo "❌ ERROR: Legacy WebSocket pattern found:"
  echo "$violations"
  echo ""
  echo "SOLUTION:"
  echo "1. Replace 'client_/ws' with canonical URL builder: buildWebSocketUrl()"
  echo "2. Use query parameters: /ws/client?client_id=<id>&version=1&role=frontend"
  echo "3. See docs/websockets/LEGACY_MIGRATION_NOTICE.md for migration guide"
  echo ""
  echo "If this is legitimate documentation, add the file to ALLOWED_FILES in this script."
  exit 1
fi

echo "✅ No legacy WebSocket patterns found. Build can proceed."
echo "   Canonical pattern '/ws/client?client_id=...' is enforced."