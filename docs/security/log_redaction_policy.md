# Log Redaction & Retention Policy

Date: 2025-09-25

This policy defines how the A1Betting7-13.2 project handles application and operational logs to ensure no secrets, PII, or regulated data are committed to source control or retained beyond their useful lifetime.

## Objectives

1. Prevent sensitive values (tokens, cookies, user data) from appearing in logs.
2. Ensure logs are stored only in developer-local locations or secure observability backends, not in git.
3. Provide guidance for rotating logs, sanitizing historical archives, and validating redaction routines.

## Redaction Rules

Logs **must not** include:

- Authentication headers, session cookies, JWTs, API keys, or OAuth tokens.
- Personally identifiable information (PII) such as email, phone numbers, addresses, payment data.
- Raw request/response payloads from third-party APIs unless sanitized.
- Stack traces that include secrets or environment values.

### Recommended masking patterns

Implement centralized logging helpers (e.g., `unified_logging`) to mask values:

- Replace detected tokens with `***REDACTED***`.
- Hash identifiers (user IDs, bet IDs) when correlation is required.
- For dictionaries/JSON payloads, recursively strip known sensitive keys (`token`, `cookie`, `authorization`, `password`, `api_key`).

## Storage & Retention

- **Local development:** Logs should be written to `./logs/` (git-ignored) or system temp directories. Developers must delete outdated logs regularly.
- **CI pipelines:** Capture logs as workflow artifacts with limited retention (≤ 30 days). Artifacts must not be uploaded to the repository.
- **Production:** Forward logs to the approved observability stack (e.g., CloudWatch, Datadog) with access controls. Apply retention per compliance requirements (default 14 days).

## Verification Checklist

Use the helper script `python scripts/security/audit_logs_for_secrets.py --json reports/security/log_redaction_report.json` to collect evidence before marking the monthly spot-check complete. The script scans the standard `logs/` directories for keywords such as `authorization`, `token`, or `set-cookie` and produces both console output and a gitignored JSON report.

| Task                                                                                                                                | Cadence   | Owner    | Status          |
| ----------------------------------------------------------------------------------------------------------------------------------- | --------- | -------- | --------------- |
| Confirm `.gitignore` blocks `logs/`, `*.log`, `*.jsonl`, and similar artefacts.                                                     | Quarterly | DevX     | ✅ (2025-09-25) |
| Review logging middleware (`backend/core/app.py`, `unified_logging`) for masking and silence optional imports.                      | Quarterly | Backend  | ☐               |
| Spot-check archived logs / artifacts for secrets using TruffleHog or regex scanners (`scripts/security/audit_logs_for_secrets.py`). | Monthly   | Security | ☑ (2025-09-26)  |
| Purge/stub any committed historical logs after history rewrite (`docs/security/git_history_sanitization.md`).                       | Once-off  | Security | ☐               |

## Incident Response

1. **Detection:** If a secret slips into logs, immediately rotate the credential and purge the offending log files from storage.
2. **Notification:** Inform the security distribution list and log a ticket referencing the affected component.
3. **Remediation:** Update redaction filters or logging statements to avoid recurrence. Document changes in this policy or the relevant service README.
4. **Follow-up:** Verify remediation via automated secret scanning and peer code review.

## References

- `SECURITY_ACTIONS.md` — Current remediation checklist.
- `docs/security/secret_scanning_plan.md` — Automated detection plan (GitHub secret scanning + TruffleHog).
- `docs/security/git_history_sanitization.md` — Procedure for removing sensitive artifacts from git history.
- `PROJECT_GLOBAL_AUDIT.md` — Audit narrative tracking progress.
