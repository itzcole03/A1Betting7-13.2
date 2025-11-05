#!/usr/bin/env bash
set -euo pipefail
# Run Playwright E2E in a "lean" mode suitable for local/dev runs where
# backend infra may be missing. This exports env flags to avoid hard
# failures during global-setup.

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT/frontend"

export APP_DEV_LEAN_MODE=true
export DISABLE_STARTUP_HOOKS=true
export SKIP_PROXY_CHECK=true

echo "Running Playwright E2E (lean) — Playwright may still download browsers if needed"
npm run test:e2e
