# Offline Mode & Settings Management

## Offline Mode

- Automatically detects network status and switches to offline mode.
- Queues API/database requests while offline; syncs when back online.
- Uses local SQLite cache for odds, predictions, and user data.
- IPC handlers:
  - `getOfflineStatus`: Returns current offline status.
  - `setOfflineStatus`: Sets offline status (true/false).
  - `syncQueuedRequests`: Syncs all queued requests when online.
- All state changes and errors are logged to `logs/combined.log` and `logs/error.log`.

## Settings Management

- Persistent user/app settings stored in SQLite (`settings` table).
- IPC handlers:
  - `getSetting`: Reads a setting by key.
  - `setSetting`: Updates or creates a setting by key/value.
- Handles edge cases: missing keys, large values, invalid types, DB errors.
- All operations are logged for audit and debugging.

## Beast Mode Test Coverage

- Offline mode: toggling, queuing, syncing, error handling.
- Settings: set/get, missing key, large value, invalid type, DB error simulation.
- All IPC handlers tested for correct responses and error handling.

## Onboarding/Help

- To use offline mode and settings, call the IPC handlers from the renderer/UI.
- Check `logs/` directory for detailed logs and error reports.
- For troubleshooting, review `ERROR_HANDLING_AND_LOGGING.md` and this file.

## Maintenance

- All modules are robust, maintainable, and ready for production.
- Update logger path in `utils/logger.js` if log location needs to change.
- Extend offlineManager and settings.js for additional features as needed.
