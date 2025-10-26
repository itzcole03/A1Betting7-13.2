# LEGACY_DEPRECATION_HINTS

## Purpose

LEGACY_DEPRECATION_HINTS is an opt-in environment variable that controls whether
the legacy middleware will include deprecation metadata in legacy health alias
responses. This metadata is intended to help legacy clients discover the
modern forwarding path during a migration window.

## Usage

- To enable deprecation hints in a local run or CI step set:

```bash
export LEGACY_DEPRECATION_HINTS=1
# or on Windows (PowerShell)
$env:LEGACY_DEPRECATION_HINTS = '1'
```

## Behavior

- When enabled: `/api/health`, `/health`, and `/api/v2/health` responses (via
  the legacy middleware) will include `data.deprecated: true` and
  `data.forward: <path>` in the response envelope.
- When disabled (default): the middleware preserves the canonical envelope
  (no `deprecated`/`forward` keys), so aliases return identical schema.

## Motivation

Tests in the repository expressed two divergent expectations: identical
canonical envelopes across aliases, and a single test expecting a deprecation
hint. Making the hints opt-in preserves canonical behaviour by default while
allowing targeted tests or deployments to enable legacy hints.
