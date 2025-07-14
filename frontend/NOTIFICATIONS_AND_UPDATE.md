# Notifications & Auto-Update

## Notifications

- Show info, warning, and error notifications via IPC (`showNotification`).
- All notifications are logged to `logs/combined.log` and `logs/error.log`.
- Robust error handling for notification failures.
- UI can trigger notifications for any event (success, error, update, etc).

## Auto-Update

- Uses `electron-updater` for seamless updates.
- IPC handlers:
  - `checkForUpdate`: Checks for updates.
  - `quitAndInstall`: Installs downloaded update and restarts app.
- All update events and errors are logged for audit and troubleshooting.
- Handles edge cases: network loss, update server errors, download failures.

## Beast Mode Test Coverage

- Notifications: info, warning, error, error handling.
- Auto-update: check, install, event/error logging.
- All IPC handlers tested for correct responses and error handling.

## Onboarding/Help

- To use notifications and auto-update, call the IPC handlers from the renderer/UI.
- Check `logs/` directory for detailed logs and error reports.
- For troubleshooting, review this file and `ERROR_HANDLING_AND_LOGGING.md`.

## Maintenance

- All modules are robust, maintainable, and ready for production.
- Extend notifications.js and main-auto-update.js for additional features as needed.
