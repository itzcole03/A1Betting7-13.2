#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DELEGATE_SCRIPT="${ROOT_DIR}/frontend/src/core/CI/smoke_runner_wrapper.sh"

if [[ ! -f "${DELEGATE_SCRIPT}" ]]; then
  echo "[smoke_runner] delegate script not found at ${DELEGATE_SCRIPT}" >&2
  exit 1
fi

if [[ ! -x "${DELEGATE_SCRIPT}" ]]; then
  chmod +x "${DELEGATE_SCRIPT}" || true
fi

exec "${DELEGATE_SCRIPT}" "$@"
