# Secret Scanning & Credential Monitoring Plan

Date: 2025-09-25

This document captures the remediation steps required to provide automated detection for sensitive artifacts (cookies, tokens, databases, logs) across the A1Betting7-13.2 repository.

## Objectives

1. **Enable GitHub-native secret scanning** to catch common token formats in pushes and pull requests.
2. **Add TruffleHog scanning to CI** for repository-wide pattern detection (API keys, JWTs, base64 blobs, etc.).
3. **Integrate pre-commit safeguards** so local commits fail fast when sensitive files are staged.
4. **Establish rotation & escalation procedures** for any findings.

## Checklist

| Task                                                                                                     | Owner    | Status         | Notes                                                                                                                                                             |
| -------------------------------------------------------------------------------------------------------- | -------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Enable GitHub Advanced Security (Secret Scanning + Push Protection) for the repository.                  | Platform | ☐              | Requires repository admin to toggle under **Settings → Code security and analysis**. Push Protection should block secrets before they land on the default branch. |
| Configure `secret_scanning_push_protection` on protected branches via GitHub CLI (`gh secret-scanning`). | Platform | ☐              | Verify push-protection exemptions are minimized; document any allowed patterns.                                                                                   |
| Add scheduled TruffleHog scan workflow (`.github/workflows/secret-scan.yml`) covering full git history.  | DevX     | ☑ (2025-09-25) | Implemented with pip-installed TruffleHog (3.66.0), nightly cron, PR runs, and artifact upload; monitor findings via workflow logs.                               |
| Wire TruffleHog workflow outputs to Slack/email notifications for the security distribution list.        | DevX     | ☐              | Store webhook secrets in GitHub Actions secrets (`SECURITY_ALERT_WEBHOOK`).                                                                                       |
| Document remediation process in `SECURITY_ACTIONS.md` and incident runbook.                              | Security | ☐              | Include how to rotate PrizePicks tokens, purge cookies, and scrub git history with `git filter-repo`.                                                             |
| Review `block-sensitive-artifacts` pre-commit hook patterns quarterly.                                   | DevX     | ☐              | Update forbidden names/extensions as new services are onboarded.                                                                                                  |

## Implementation Notes

- **GitHub CLI** helper to enable push protection once Advanced Security is available:

  ```bash
  gh api \
    --method PATCH \
    -H "Accept: application/vnd.github+json" \
    /repos/itzcole03/A1Betting7-13.2 \
    -f security_and_analysis.status=enabled

  gh api \
    --method PUT \
    -H "Accept: application/vnd.github+json" \
    /repos/itzcole03/A1Betting7-13.2/secret-scanning/advanced-security/enable
  ```

  Follow GitHub documentation if organization policy requires approval.

- **TruffleHog Workflow Skeleton** (to add later):

  ```yaml
  name: Secret Scan

  on:
    push:
      branches: [main]
    pull_request:
    schedule:
      - cron: "0 5 * * *" # Daily 05:00 UTC

  jobs:
    trufflehog:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
          with:
            fetch-depth: 0
        - uses: trufflesecurity/trufflehog@v3
          with:
            extra_args: >-
              filesystem --only-verified --max-filesize 262144 --no-update
  ```

- **Alerting**: Route findings to a dedicated Slack channel (`#a1betting-security-alerts`) or email list. Track incidents in the security ticketing queue.

- **Remediation window**: Targets should be rotated within 24 hours of detection. Update `SECURITY_ACTIONS.md` with completion notes.

- **History scrub**: If verified secrets exist in history, run `git filter-repo` or BFG Repo-Cleaner. Coordinate with maintainers to force-push sanitized branches and invalidate tokens.

## References

- GitHub Docs — [About secret scanning](https://docs.github.com/code-security/secret-scanning/about-secret-scanning)
- TruffleHog — [GitHub Action](https://github.com/trufflesecurity/trufflehog)
- Internal — `SECURITY_ACTIONS.md`, `PROJECT_GLOBAL_AUDIT.md`
