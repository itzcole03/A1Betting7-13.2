---
title: "Test Environment Compatibility: API URL Parsing Fails in Jest Tests"
labels: ["testing", "ci", "bug"]
---

## Context

`apiVersionCompatibility.test.ts` fails due to fetch errors on relative URLs in the Node.js/Jest environment.

## Root Cause

Node.js does not support relative URLs in fetch; a base URL is required.

## Resolution

- [x] Update `httpFetch` to prepend a base URL in test mode (`NODE_ENV === 'test'`).
- [x] Adjusted Jest test mocks to return Response-like objects.
- [x] Updated test to expect the correct backend response shape (`status` property).

**Status:** Resolved in August 2025. All related tests now pass.

---

title: "Test Environment Compatibility: PropOllamaUnified Test Fails (DOM Structure/Content Mismatch)"
labels: ["testing", "ci", "bug"]

---

## Context

Tests expect player names (e.g., 'Aaron Judge') and specific DOM nodes, but these are not found during test execution.

## Root Cause

- Mocked data may not be injected or awaited correctly.
- DOM structure or test selectors may be out of sync with the component.

## Resolution

[x] PropOllamaUnified.test.tsx: DOM/content mismatch (cards not rendered, selectors fail) — **RESOLVED**. Mocked /mlb/todays-games endpoint and aligned test data with component filters. All tests now pass.

- Update test selectors to match the current DOM.
