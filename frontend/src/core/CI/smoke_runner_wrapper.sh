#!/usr/bin/env bash
# Minimal wrapper to run the core shim smoke checks in a consistent order.
# Usage: ./smoke_runner_wrapper.sh
# Optional environment variables:
#   RUN_TS_SMOKE=1          -> execute the ts-node smoke runner when available
#   RUN_TSC=1               -> execute the focused TypeScript compile gate
#   RUN_METRICS_CHECK=1     -> run the metrics checker after report generation (default skips until checker lands)
#   DISABLE_LEGACY_FORWARDING=true -> exported for downstream scripts to disable legacy middleware

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(cd "${SCRIPT_DIR}/../../../.." && pwd)
FRONTEND_DIR="${ROOT_DIR}/frontend"
SMOKE_DIR="${FRONTEND_DIR}/src/core/tests/smoke"
REPORT_DIR="${ROOT_DIR}/reports/shims_quickcheck"
METRICS_CHECKER="${FRONTEND_DIR}/src/core/metrics/ci_metrics_checker.js"
SMOKE_TS_CONFIG="${FRONTEND_DIR}/src/core/tsconfig.smoke.json"

mkdir -p "${REPORT_DIR}"

export DISABLE_LEGACY_FORWARDING="${DISABLE_LEGACY_FORWARDING:-true}"
export NODE_ENV="${NODE_ENV:-test}"

SHORT_SHA=$(cd "${ROOT_DIR}" && git rev-parse --short HEAD 2>/dev/null || echo "working-tree")
TIMESTAMP_UTC=$(date -u '+%Y-%m-%dT%H:%M:%SZ')

JS_STATUS=0
JS_DURATION=0
TS_STATUS=-1
TS_DURATION=0
TSC_STATUS=-1
TSC_DURATION=0
METRICS_STATUS=-1
METRICS_DURATION=0

pushd "${SMOKE_DIR}" >/dev/null

printf '\n[smoke-runner] Running CommonJS quickcheck...\n'
JS_START=$(date +%s)
set +e
node unified_shims_runner.js
JS_STATUS=$?
set -e
JS_DURATION=$(( $(date +%s) - JS_START ))

if [[ "${RUN_TS_SMOKE:-0}" == "1" ]]; then
  printf '\n[smoke-runner] Running TypeScript quickcheck (ts-node)...\n'
  TS_START=$(date +%s)
  set +e
  npx --yes ts-node --transpile-only unified_shims_runner.ts
  TS_STATUS=$?
  set -e
  TS_DURATION=$(( $(date +%s) - TS_START ))
else
  TS_STATUS=-1
fi

popd >/dev/null

if [[ "${RUN_TSC:-0}" == "1" ]]; then
  printf '\n[smoke-runner] Running focused TypeScript compile (tsconfig.smoke) ...\n'
  TSC_START=$(date +%s)
  set +e
  (cd "${FRONTEND_DIR}" && npx --yes tsc -p src/core/tsconfig.smoke.json --pretty false)
  TSC_STATUS=$?
  set -e
  TSC_DURATION=$(( $(date +%s) - TSC_START ))
else
  TSC_STATUS=-1
fi

REPORT_FILE="${REPORT_DIR}/${SHORT_SHA}.json"
NODE_VERSION=$(node -v 2>/dev/null || echo unknown)
NPM_VERSION=$(npm -v 2>/dev/null || echo unknown)

export REPORT_FILE SHORT_SHA TIMESTAMP_UTC JS_STATUS JS_DURATION TS_STATUS TS_DURATION
export TSC_STATUS TSC_DURATION METRICS_STATUS METRICS_DURATION ROOT_DIR NODE_VERSION NPM_VERSION

write_report() {
  python - <<'PY'
import json
import os
import pathlib

def optional(status_var: str, duration_var: str):
    status = int(os.environ[status_var])
    duration = int(os.environ[duration_var])
    if status < 0:
        return None
    return {"exitCode": status, "durationSeconds": duration}

report = {
    "sha": os.environ["SHORT_SHA"],
    "timestamp": os.environ["TIMESTAMP_UTC"],
    "results": {
        "js_quickcheck": {
            "exitCode": int(os.environ["JS_STATUS"]),
            "durationSeconds": int(os.environ["JS_DURATION"]),
        },
        "ts_quickcheck": optional("TS_STATUS", "TS_DURATION"),
        "tsc_smoke": optional("TSC_STATUS", "TSC_DURATION"),
        "metrics_checker": optional("METRICS_STATUS", "METRICS_DURATION"),
    },
    "environment": {
        "node": os.environ["NODE_VERSION"],
        "npm": os.environ["NPM_VERSION"],
        "cwd": os.environ["ROOT_DIR"],
    },
}

path = pathlib.Path(os.environ["REPORT_FILE"])
path.parent.mkdir(parents=True, exist_ok=True)
path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
PY
}

write_report

if [[ "${RUN_METRICS_CHECK:-0}" == "1" && -f "${METRICS_CHECKER}" ]]; then
  printf '\n[smoke-runner] Running metrics checker...\n'
  METRICS_START=$(date +%s)
  set +e
  node "${METRICS_CHECKER}" --report "${REPORT_FILE}"
  METRICS_STATUS=$?
  set -e
  METRICS_DURATION=$(( $(date +%s) - METRICS_START ))
  export METRICS_STATUS METRICS_DURATION
  write_report
fi

printf '\n[smoke-runner] Wrote report to %s\n' "${REPORT_FILE}"

OVERALL_STATUS=${JS_STATUS}
if [[ ${OVERALL_STATUS} -eq 0 && ${TS_STATUS} -gt 0 ]]; then
  OVERALL_STATUS=${TS_STATUS}
fi
if [[ ${OVERALL_STATUS} -eq 0 && ${TSC_STATUS} -gt 0 ]]; then
  OVERALL_STATUS=${TSC_STATUS}
fi
if [[ ${OVERALL_STATUS} -eq 0 && ${METRICS_STATUS} -gt 0 ]]; then
  OVERALL_STATUS=${METRICS_STATUS}
fi

if [[ ${OVERALL_STATUS} -eq 0 ]]; then
  printf '[smoke-runner] All selected checks completed successfully.\n'
else
  printf '[smoke-runner] One or more checks failed (exit %s). See logs above.\n' "${OVERALL_STATUS}"
fi

exit "${OVERALL_STATUS}"
