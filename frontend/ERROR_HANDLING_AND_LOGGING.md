# Error Handling and Logging System

## Overview

A1Betting uses a centralized error handling and logging system for all backend and frontend operations, including database, API, and ML predictions. This ensures robust diagnostics, easier debugging, and production-grade reliability.

## Logger

- **Location:** `frontend/utils/logger.js`
- **Library:** Winston
- **Log Files:** Written to Electron's userData path (`error.log` for errors, `combined.log` for all logs)
- **Log Format:** Timestamp, log level, component, error code, message, stack trace, user/session ID, input data
- **Levels:** error, warn, info, debug

## Database Error Handling

- **Location:** `frontend/utils/dbErrorHandler.js`
- **Usage:** All Knex/SQLite DB operations are wrapped with try/catch and errors are passed to `handleDbError`, which logs the error and returns a structured error object.
- **Best Practices:** Retry logic for transient errors, log failed queries and constraint violations, close connections properly.

## API Error Handling

- **Location:** `frontend/main-sportsbook-api.js`
- **Usage:** All API calls are wrapped with try/catch. Errors are logged with full context (userId, sport, stack trace).
- **Best Practices:** Log warnings for missing API keys, log all API errors, return structured error responses.

## ML Prediction Error Handling

- **Location:** `frontend/main-prediction-ipc.js`
- **Usage:** All prediction calls are wrapped with try/catch. Successes and errors are logged with input, model names, latency, memory, and aggregated results.
- **Best Practices:** Log prediction errors with input data and model version, monitor for data drift and model failures.

## How to View Logs

- Run the Electron app in production mode.
- Log files are generated in the Electron userData directory (platform-specific).
- Check `error.log` for errors and `combined.log` for all logs.

## Onboarding/Help

- All new modules should use the centralized logger and error handler.
- For new DB/API/ML code, wrap operations in try/catch and log errors using the provided utilities.
- For questions, see this document or contact the lead developer.
