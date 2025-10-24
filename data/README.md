# Local Data Storage Guidelines

This directory is reserved for developer-only datasets, SQLite snapshots, and other generated data that should **not** be committed to version control. Store local copies under clearly named subfolders (for example, `local/`, `mlflow/`, or `backups/`) and ensure that all files remain covered by the repository `.gitignore` patterns (e.g., `*.db`, `mlruns/`).

Recommended hygiene steps:

1. Keep only the minimal data required for your current task. Remove or archive obsolete snapshots regularly.
2. Never commit real user data, API responses containing credentials, or session cookies. Rotate secrets immediately if accidental exposure occurs.
3. When sharing reproducible examples, provide sanitized fixtures or scripts that regenerate the data instead of the raw files.
4. If you add new data subdirectories, update `.gitignore` as needed and document the purpose here so future contributors know what belongs in each location.

For the broader remediation plan, see `SECURITY_ACTIONS.md` and `PROJECT_GLOBAL_AUDIT.md`.
