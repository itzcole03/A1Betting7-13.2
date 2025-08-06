# Contributing to A1Betting7-13.2

## Directory Discipline: Avoid Nested frontend/frontend

- **Always run frontend commands from the root-level `frontend/` directory.**
- If you find yourself in `frontend/frontend`, you are in the wrong directory. Go up one level!
- All scripts and tests will fail if run from a nested directory.

## Quick Start

```bash
# Always start from the project root!
cd ~/Downloads/A1Betting7-13.2
cd frontend
npm run test
```

## Pre-Script Guard

- The `check-dir.js` script will abort if you are in a nested frontend directory.
- `.gitignore` prevents accidental check-in of nested frontend directories.

## CI/CD and Automation

- All CI/CD and automation scripts must reference only the root-level `frontend/`.
- If a nested directory is detected, the workflow should fail.

## Questions?

Open an issue or ask in the project discussions if you are unsure about directory structure or workflow.
