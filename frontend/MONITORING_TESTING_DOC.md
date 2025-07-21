# Monitoring, Error Handling, and Testing Setup

## Error Monitoring & Logging

- Uses OpenTelemetry and SigNoz for distributed tracing and error logging.
- All errors are captured via ErrorBoundary and sent to SigNoz.
- See `src/utils/tracing.ts` for tracing setup.

## Test Suite

- Uses Jest with ts-jest and babel-jest for TypeScript/React support.
- All test files must contain at least one `describe` or `test` block.
- Empty/type-only test files are removed for reliability.
- `@/` imports are resolved via moduleNameMapper in Jest config.
- `import.meta.env` is mocked in `src/setupTests.ts` for compatibility.
- Run tests with `npm run test`.

## Accessibility & Robustness

- Main UI components use ARIA roles, labels, and keyboard navigation.
- Error boundaries provide accessible fallback UI.

## Best Practices

- Keep dependencies up to date.
- Remove empty or misconfigured test files.
- Document all monitoring and testing procedures for maintainers.

---

For further details, see:

- `src/utils/tracing.ts` (OpenTelemetry setup)
- `ErrorBoundary.tsx` (error handling)
- `package.json` (Jest config)
- `src/setupTests.ts` (test setup)
