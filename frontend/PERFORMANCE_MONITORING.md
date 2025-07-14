# Performance Monitoring

## Features

- Monitors app performance (CPU, memory, latency) in real time.
- IPC handlers expose performance metrics to renderer/UI.
- Logs performance data for audit and troubleshooting.
- UI can display performance stats and alerts.

## IPC Example

- `getPerformanceStats`: Returns current CPU, memory, and latency stats.

## Beast Mode Test Coverage

- Performance stats retrieval, logging, error handling.
- UI integration for real-time monitoring.

## Onboarding/Help

- Use IPC handler to fetch performance stats from renderer/UI.
- Check logs for detailed performance data.
- For troubleshooting, review this file and `ERROR_HANDLING_AND_LOGGING.md`.
