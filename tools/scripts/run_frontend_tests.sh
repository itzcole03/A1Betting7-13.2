#!/usr/bin/env bash
set -euo pipefail
# Run frontend Jest in a "lean" test mode that avoids heavy startup hooks.
# Usage: ./scripts/run_frontend_tests.sh

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT/frontend"

export APP_DEV_LEAN_MODE=true
export DISABLE_STARTUP_HOOKS=true
export SKIP_PROXY_CHECK=true

echo "Running frontend Jest (CI-lean) with APP_DEV_LEAN_MODE and DISABLE_STARTUP_HOOKS"
npm run test:ci
