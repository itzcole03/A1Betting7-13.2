# Extensibility

## Features

- Modular architecture: add new features via IPC, utils, and UI modules.
- Easy integration of new sportsbook APIs, ML models, analytics, notifications, etc.
- Documented extension points for backend, frontend, and UI.

## How to Extend

- Add new IPC handlers in main process for new features.
- Create new utils modules for business logic.
- Update UI to call new IPC handlers and display new features.
- Document all extensions in CHANGELOG.md and onboarding/help docs.

## Maintenance

- Review extension points before every major release.
- Keep documentation up to date for all new features.
