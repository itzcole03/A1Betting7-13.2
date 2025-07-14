# Backup & Restore

## Features

- Backup SQLite DB and settings to user-selected location.
- Restore from backup file via UI/IPC.
- Logs all backup/restore actions and errors.
- IPC handlers for backup/restore operations.

## Beast Mode Test Coverage

- Backup creation, restore, error handling, edge cases.
- UI integration for backup/restore.

## Onboarding/Help

- Use IPC handlers to trigger backup/restore from renderer/UI.
- Check logs for detailed backup/restore actions and errors.
- For troubleshooting, review this file and `ERROR_HANDLING_AND_LOGGING.md`.
