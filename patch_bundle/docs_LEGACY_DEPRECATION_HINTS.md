LEGACY_DEPRECATION_HINTS

This repository introduces an opt-in environment flag, LEGACY_DEPRECATION_HINTS,
which controls whether legacy health alias endpoints return legacy-shaped
metadata (deprecated/forward fields) or the canonical envelope.

Usage

- Default behavior (flag unset or falsy): legacy health aliases return the
  canonical envelope (no deprecated/forward fields), ensuring schema parity
  across tests and clients.
- To enable legacy-shaped responses for compatibility testing or staged rollouts,
  set LEGACY_DEPRECATION_HINTS=1 (or true/yes).

Truthiness

- Values considered truthy: "1", "true", "yes" (case-insensitive)

Motivation

- Many tests and legacy clients expect the older envelope with explicit
  `deprecated` and `forward` fields. To maintain deterministic behavior in
  CI and tests we default to canonical envelopes and provide an opt-in to
  emit the legacy hints only when explicitly required.
