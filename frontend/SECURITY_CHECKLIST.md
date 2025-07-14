# Security Checklist

## IPC Security

- Validate and sanitize all IPC inputs.
- Restrict IPC handlers to known, safe actions.
- Log all suspicious or failed IPC calls.

## Dependency Audit

- Run `npm audit` and address vulnerabilities.
- Keep dependencies up to date.

## Secure Storage

- Use AES-256-GCM for sensitive data (API keys, user secrets).
- Store secrets in encrypted SQLite or OS keychain.

## Code Signing

- Sign Electron app for production releases.
- Verify signatures in CI/CD pipeline.

## Other Best Practices

- Disable Node integration in renderer unless required.
- Use contextIsolation for all windows.
- Regularly review and update security policies.

## Maintenance

- Review this checklist before every release.
- Document all security changes in CHANGELOG.md.
