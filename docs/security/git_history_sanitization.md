# Git History Sanitization Runbook

Date: 2025-09-25

Legacy commits contain sensitive artifacts (PrizePicks cookies, SQLite databases, logs). This runbook outlines the procedure to scrub history, rotate credentials, and force a clean state for collaborators.

## Scope

### Known sensitive commits

- `8992545c9a0b31d4836cac1d3378f6e3f01ab7ac` — Introduced `backend/prizepicks_cookies.json`, multiple SQLite databases, and large test dumps.
- `c8823b4bb0bea8344f9671f010b1aed937df9513` — Added `frontend/prizepicks_data.db`, `frontend/users.db`, and dozens of generated reports.
- `cdbf31f4d6c9584b390bf2e27c0685b994cc10a6` — Persisted `users.db` updates and other SQLite artifacts.
- Additional commits may contain `chat_history.db`, `backend_server.log`, or other logs. Use automated secret scanning to capture stragglers before the rewrite.

### Target files for removal

```
prizepicks_cookies.json
**/prizepicks_cookies.json
*.db
*.sqlite
*.sqlite3
backend_server.log
chat_history.db
users.db
user_auth.db
mlflow.db
*.jsonl
```

## Pre-work

1. **Rotate credentials**: Coordinate with the integrations team to invalidate all exposed PrizePicks sessions and regenerate API credentials. Update deployment secrets and local `.env` files.
2. **Notify stakeholders**: Alert contributors that a force-push is planned. Freeze the default branch during the operation.
3. **Automated scanning**: Run TruffleHog (`.github/workflows/secret-scan.yml`) and review artifacts to ensure the ignore list covers future issues.

## History scrub procedure

> These commands should be executed in a clean clone with the latest `main` (or the branch being sanitized).

```bash
# 1. Create a backup clone (optional but recommended)
mkdir ../A1Betting7-13.2-backup
cp -R . ../A1Betting7-13.2-backup

# 2. Use git filter-repo to remove sensitive files
pip install git-filter-repo  # if not already available

python -m git_filter_repo \
  --path prizepicks_cookies.json \
  --path backend/prizepicks_cookies.json \
  --path frontend/prizepicks_cookies.json \
  --path backend/prizepicks_data.db \
  --path backend/real_training_data.db \
  --path backend/users.db \
  --path frontend/prizepicks_data.db \
  --path frontend/users.db \
  --path chat_history.db \
  --path backend_server.log \
  --path-rename "data/:data/" \
  --invert-paths

# 3. Remove lingering patterns by extension
python -m git_filter_repo \
  --strip-blobs-with-ids sensitive-blob-list.txt
```

- Generate `sensitive-blob-list.txt` using `git rev-list --objects` + `grep` for `*.db`, `*.sqlite`, `*.jsonl`, etc., or leverage TruffleHog's JSON output.
- If multiple file patterns need removal, consider using a `--path` glob for `*.db` and `*.jsonl`. Validate carefully to avoid deleting legitimate source files.

## Post-rewrite steps

1. **Force-push sanitized history**:

   ```bash
   git push --force origin main
   ```

   Coordinate with branch owners before pushing other branches.

2. **Have collaborators re-clone** or run `git fetch --all` followed by `git reset --hard origin/main`. Emphasize that old clones may still contain sensitive blobs.

3. **Invalidate caches**: If CI/CD systems cached artifacts (e.g., GitHub Actions, Docker registries), purge or rotate them.

4. **Update documentation**: Record completion in `SECURITY_ACTIONS.md` and add any lessons learned.

5. **Verify with secret scanners**: Re-run TruffleHog and GitHub secret scanning to ensure history is clean.

## Incident tracking

- Log rotation and history scrub tasks in the security ticketing system.
- Capture timestamps, responsible engineers, and the exact commands executed.
- If legal/compliance notification is required, coordinate with the appropriate stakeholders.

## References

- [git-filter-repo documentation](https://github.com/newren/git-filter-repo)
- GitHub Docs — [Removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- Internal docs: `SECURITY_ACTIONS.md`, `docs/security/secret_scanning_plan.md`, `PROJECT_GLOBAL_AUDIT.md`
