# A1Betting Backend Roadmap (2025)

## Next Features

- User Management & Authentication (**JWT**; see unified section below)
- Betting Logic (place bets, odds, results, risk management)
- ML-Powered Features (real models, training, evaluation)
- Data Integration (live APIs, ETL)
- Monitoring & Reporting (health, metrics, dashboards)
- Frontend Integration (React/Electron)

## Best Practices

- Pydantic for validation
- **JWT for authentication** (all new endpoints; legacy endpoints may use basic auth, see migration section)
- SQLAlchemy ORM
- Modular code, docstrings
- Automated tests (Jest/RTL for frontend, pytest for backend)
- OpenAPI/Swagger docs
- CI/CD

## Recent Improvements (2025-07)

- **PerformanceAnalyticsDashboard**: Modern React dashboard with virtualization, lazy loading, Suspense, and memoization for optimal performance.
- **AnalyticsWidget**: Modular analytics component with snapshot tests and error boundary support.
- **ErrorBoundary**: Robust error handling for React components.
- **Testing**: Added snapshot and integration tests for new analytics components. Legacy tests require further cleanup.
- **CI/CD**: Automated pipelines for build, test, lint, and documentation updates.
- **Continuous Improvement**: Backend and frontend support recursive, autonomous improvement cycles with monitoring and reporting.

## Best Practices

- Use `useMemo` and `useCallback` for memoization.
- Use `React.lazy` and `Suspense` for code splitting.
- Use virtualization (`react-window`) for large lists.
- Integrate error boundaries for robust error handling.
- Maintain comprehensive test coverage and CI/CD automation.

## Next Steps

- Clean up legacy test and service imports (see Legacy Test Cleanup section below).
- Expand accessibility and edge case testing (see Testing & Accessibility section).
- Continue recursive improvement cycles and reporting.

## Backend Logging and Developer Experience

As of v4.0.1 (2025-07-14), all backend print statements have been replaced with logger.info for consistent logging. Log message style is now standardized (no emojis, concise informative text). Backend API endpoints and router registration are clean and developer-friendly.

## ⚠️ Legacy Endpoints & Migration (Deprecated)

> **Deprecated Endpoints:**
>
> - `/api/v1/unified-data` [GET]: Unified feed combining all data sources (mock implementation)
> - `/api/v1/sr/games` [GET]: SportRadar games API integration (legacy)
> - `/api/v1/odds/{event_id}` [GET]: Odds API integration for specific event (legacy)
> - `/api/v4/predict/ultra-accuracy` [GET, POST]: Ultra-accuracy prediction (deprecated, use `/api/v1/ultra-accuracy`)

**Note:** Accessing any legacy endpoint will trigger a deprecation warning in logs. Migrate clients to new endpoints as soon as possible. See inline comments in `backend/main.py` for details and migration guidance.

### Migration Instructions

- Audit usage of legacy endpoints in client applications.
- Update integrations to use new route structure and endpoints.
- Remove legacy endpoints after confirming no active clients depend on them.

### Technical Debt

- Inline documentation and endpoint catalog added for maintainability.
- See `backend/main.py` for details and migration status.
<!--- AI_CONTEXT_BLOCK_START --->

````json
{

## 🚀 Quick Start

### 1. Clone the repo
```bash
git clone https://github.com/itzcole03/A1Betting7-13.2.git
cd A1Betting7-13.2
````

### 2. Install dependencies

```bash
cd frontend && npm install
cd ../backend && pip install -r requirements.txt
```

### 3. Configure API Keys & Endpoint Audit

> **Required:** The backend will not start or endpoints will fail unless valid API keys are present in a `.env` file in the `backend/` directory. Use these exact variable names:

```env
SPORTRADAR_API_KEY=your_sportradar_key_here
ODDS_API_KEY=your_odds_api_key_here
```

> **Never commit your `.env` file to version control.**

### 4. Start the backend

```bash
python -m backend.main
# or, from backend/ directory:
cd backend
python main.py
```

### 5. Start the frontend

```bash
cd ../frontend && npm run dev
```

### 6. Open the app

- Web: http://localhost:8173
- Desktop: Run the Electron app

### 7. Run tests (frontend)

```bash
cd frontend
npm test # Runs all Jest/RTL tests
```

### 8. Run tests (backend)

```bash
cd backend
pytest
```

### 9. E2E/Integration Testing

- See `frontend/jest.setup.e2e.js` for global mocks and E2E setup.
- Use Playwright or Cypress for browser-based E2E if needed.

### 10. Monitoring, Profiling, and CI/CD

- Backend: OpenTelemetry/SigNoz for monitoring, see backend/README.md.
- Frontend: Sentry for error tracking, web-vitals for performance (see `frontend/src/webVitals.ts`).
- CI/CD: Automated via GitHub Actions/GitLab CI. See `.github/workflows/` or `.gitlab-ci.yml`.

## 🧪 Testing & Accessibility

- All new tests should use Jest and React Testing Library (RTL) for frontend, pytest for backend.
- Use `frontend/jest.setup.e2e.js` for global mocks and robust test isolation.
- Expand accessibility and edge case coverage (keyboard, screen reader, high contrast, error boundaries).
- Remove or refactor legacy tests in `frontend/` that do not use Jest/RTL or are not isolated.
- See [Legacy Test Cleanup](#legacy-test-cleanup) below.

## 🗑️ Legacy Test Cleanup

The following test files are legacy, non-isolated, or obsolete and should be removed or refactored:

- `frontend/test_api.js`
- `frontend/test-sportsradar.js`
- `frontend/test_backup_beast.js`
- `frontend/test_ipc_security_beast.js`
- `frontend/test_ipc_handlers.js`
- `frontend/test_ipc_api_failures.js`
- `frontend/test_error_handling.js`
- `frontend/test_notifications_update_beast.js`
- `frontend/test_onboarding_help_beast.js`
- `frontend/test_performance_beast.js`
- `frontend/test_settings_offline_beast.js`
- `frontend/test_settings_offline.js`

**Action:**

- Remove empty or obsolete files.
- Refactor any useful tests to use Jest/RTL and global mocks.
- Ensure all tests are robust, isolated, and follow best practices.

## 🔐 Authentication (Unified)

- **All new endpoints use JWT authentication.**
- Legacy endpoints may use basic auth; these are deprecated and will be removed.
- See backend/README.md and API_DOCUMENTATION.md for details.

## 🛠️ Frontend Development & Workflow

- All frontend code is in `frontend/`.
- Use `npm run dev` to start the dev server.
- Use `npm test` to run Jest/RTL tests.
- Use `jest.setup.e2e.js` for global mocks and E2E setup.
- For E2E browser tests, use Playwright or Cypress (optional).
- See `src/components/__tests__` for modern test examples.

## 🛠️ Backend Development & Workflow

- All backend code is in `backend/`.
- Use `python -m backend.main` or `python backend/main.py` to start the API server.
- Use `pytest` to run backend tests.
- See `backend/README.md` for Alembic migration and integration details.

## 🩺 Monitoring, Profiling, and CI/CD (Actionable)

- Backend: OpenTelemetry/SigNoz for monitoring, see backend/README.md.
- Frontend: Sentry for error tracking, web-vitals for performance (see `frontend/src/webVitals.ts`).
- CI/CD: Automated via GitHub Actions/GitLab CI. See `.github/workflows/` or `.gitlab-ci.yml`.
- To update docs after code changes, run: `python scripts/extract_digest_for_docs.py`.
  }

```

<!--- AI_CONTEXT_BLOCK_END --->

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Python](https://img.shields.io/badge/python-3.8%2B-blue) ![TypeScript](https://img.shields.io/badge/typescript-%5E5.0-blue) ![Build](https://img.shields.io/badge/build-passing-brightgreen) ![Code Size](https://img.shields.io/github/languages/code-size/itzcole03/A1Betting7-13.2) ![Repo Size](https://img.shields.io/github/repo-size/itzcole03/A1Betting7-13.2)

# A1Betting7-13.2

**Professional Desktop Sports Intelligence Platform**

---

## 📑 Table of Contents

1. [AI Agent Quick Start](#ai-agent-quick-start-copilotllmauto-mode)
2. [Copilot/AI Agent Integration](#copilotai-agent-integration)
3. [Context for LLMs](#context-for-llms)
4. [Manual Narrative Section](#manual-narrative-section-human-written)
5. [Quick Start](#quick-start)
6. [FAQ / Troubleshooting](#faq--troubleshooting)
7. [Related Resources](#related-resources)
8. [Project Health](#project-health)
9. [Changelog](#changelog-latest)
10. [Contributing as an AI Agent](#contributing-as-an-ai-agent)
11. [AI Self-Test](#ai-self-test)
12. [Data Provenance & Usage Policy](#data-provenance--usage-policy)
13. [Streaming/Partial Update](#streamingpartial-update)
14. [Continuous Doc Health](#continuous-doc-health)
15. [LLM Prompt Engineering Tips](#llm-prompt-engineering-tips)
16. [AI/LLM Usage Policy](#aillm-usage-policy)
17. [Features](#features)
18. [Directory Structure](#directory-structure)
19. [Architecture Diagram](#architecture-diagram)
20. [Technology Stack](#technology-stack)
21. [API Endpoints](#api-endpoints)
22. [How to Contribute](#how-to-contribute)
23. [Vision](#vision)
24. [License and Attribution](#license-and-attribution)

---

## 🤖 AI Agent Quick Start (Copilot/LLM/Auto Mode)

---

This project is designed for seamless use with AI copilots and LLM-based agents (e.g., Copilot, Cursor, GPT-4, etc.).

- **All auto-generated sections are clearly marked.**
- **To update documentation, run:**
```

python scripts/extract_digest_for_docs.py

```
- **Copilots should use the auto-generated sections for context, code search, and code generation.**
- **Manual narrative sections are for human onboarding, tutorials, and conceptual docs.**
- **Copilots should preserve manual narrative sections and only regenerate auto-generated blocks.**
- **All diagrams are in Mermaid format for easy parsing and visualization.**
- **Last Updated:** 2025-07-14 11:50 UTC

---

---

## 🤖 Copilot/AI Agent Integration

---

- Use the auto-generated sections for code search, refactoring, and onboarding.
- Use the directory tree and architecture diagrams for project navigation.
- Use the API docs for endpoint discovery and code generation.
- Use the roadmap for feature planning and TODO tracking.
- To keep docs in sync, always run the extraction script after code changes.
- Manual narrative sections are for human context and should be preserved.

---

---

## 🤖 Context for LLMs

---

- Use only the auto-generated sections for code search and context.
- Do not hallucinate features or endpoints not present in the docs.
- Always preserve the Manual Narrative Section.
- If you update code, rerun the extraction script to keep docs in sync.

---

---

## 📝 Manual Narrative Section (Human-Written)

---

_Add onboarding, tutorials, conceptual explanations, and human context here.
Copilots and AI agents should **not** overwrite this section!_

---

---

## 🚀 Quick Start

---

1. **Clone the repo**
```

git clone https://github.com/itzcole03/A1Betting7-13.2.git
cd A1Betting7-13.2

```
2. **Install dependencies**
```

cd frontend && npm install
cd ../backend && pip install -r requirements.txt

````
3. **Configure API Keys & Endpoint Audit**

> **⚠️ Required:** The backend will not start or endpoints will fail unless valid API keys are present in a `.env` file in the `backend/` directory. Use these exact variable names:

> **.env Setup (Required for Backend):** 2. Fill in your real API keys:
>
> ```
> SPORTRADAR_API_KEY=your_sportradar_key_here
> ```
>
> 3. **Never commit your `.env` file to version control.**

***

> - **`/api/prizepicks/props`** (PrizePicks, all sports, live data)
> - **`/api/v1/sr/games`** (SportRadar, live games data, robust error handling, defensive parsing for missing fields)
>   ```
>   cd backend
>   ```

> **Audit practices:**
>
> - If you add or modify endpoints, **document their data source, error handling, and edge case coverage** in the code and update this README.

> **Technical Debt Notice:**
> Legacy endpoints in the backend are now clearly marked with inline comments explaining their deprecated status and migration recommendations.
> These endpoints exist for backward compatibility and should not be used for new development. Audit usage before removal to avoid breaking integrations.
>
> - See inline comments in `backend/main.py` for details on legacy endpoints and migration guidance.
>
> - For details, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md).

> See `backend/README.md` for integration details. Dependencies (e.g., `httpx`, `fastapi`) are listed in `backend/requirements.txt`.

***

> - **`/api/v1/odds/{event_id}`** (Odds API, live odds data, robust error handling, defensive parsing for missing bookmakers/markets/outcomes)
>   **Backend Logging Best Practices:**
>
> - Use lazy `%` formatting in logger calls for performance and safety (avoid f-strings).
> - Mock methods (e.g., `authenticate`) should not include unused arguments.
> - See CHANGELOG for backend refactor details.

4. **Start the backend**
> **💡 Recommended:** Start from the project root for best compatibility:
````

python -m backend.main

```
> If you see `ModuleNotFoundError: No module named 'backend'`, ensure your working directory is the project root and that `backend/__init__.py` exists.
> For automation/CI, you may need to set the Python path:
```

export PYTHONPATH=$(pwd)
python -m backend.main

```
> Or (from backend/ directory, if imports are local):
```

cd backend
python main.py

```
> The backend now uses real sportsbook and odds APIs. Mock endpoints have been removed.
> For endpoint details, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md).
5. **Start the frontend**
```

cd ../frontend && npm run dev

````
6. **Open the app**
- Web: http://localhost:8173
- Desktop: Run the Electron app

---

---

## ❓ FAQ / Troubleshooting

---

- **Q: I get a port in use error when starting the frontend?**
- A: The dev server will try the next available port. Check the terminal for the new port.
- **Q: Backend won't start, missing dependencies?**
- A: Run `pip install -r requirements.txt` in the backend directory.
- **Q: Backend endpoints return 503 or 502 errors?**
- A: Make sure you have a valid `.env` file in the backend directory with correct `SPORTRADAR_API_KEY` and `ODDS_API_KEY` values. Without these, real sportsbook and odds endpoints will not work.
- **Q: How do I regenerate documentation?**
- A: Run `python scripts/extract_digest_for_docs.py` from the project root.
- **Q: Where do I add onboarding or tutorials?**
- A: In the Manual Narrative Section of the README.

---

---

## 🔗 Related Resources

---

- [API Documentation](API_DOCUMENTATION.md)
- [Roadmap](roadmap.md)
- [Changelog](CHANGELOG.md)
- [Feature Integration Roadmap](FEATURE_INTEGRATION_ROADMAP.md)

---

---

## 🩺 Project Health

---

- All core services present.
- Health API available at `/api/health` (see backend).
- For live status, run the backend and visit:
- http://localhost:8000/api/health (basic health)
- http://localhost:8000/api/health/status (comprehensive health)
- http://localhost:8000/api/health/all (if implemented)

---

---

## 📝 Changelog (Latest)

---

# A1Betting Platform Changelog

## [2025-07-20] - AuthContext Refactoring

### 🚀 IMPROVED: Authentication Context

- **REMOVED**: Redundant `checkAdminStatus` function from `AuthContext.tsx`.
- **SIMPLIFIED**: Direct usage of `isAdmin` state for checking admin status in `AuthContext`.
- **UPDATED**: `AuthContext.test.tsx` to reflect the removal of `checkAdminStatus` and use `isAdmin` directly.
- **IMPROVED**: Code readability and maintainability by removing duplicate logic.

## [2025-07-14] - Backend Refactor & Real Sportsbook API Integration

### 🚀 MAJOR: Real Sportsbook & Odds API Integration

- **REMOVED**: All mock endpoints for PrizePicks, projections, and test data from backend/main.py.
- **INTEGRATED**: Real SportRadar and Odds API endpoints with robust error handling and rate limiting.
- **UPDATED**: `/api/v1/sr/games` and `/api/v1/odds/{event_id}` now use live data from external APIs.
- **ENHANCED**: PrizePicks endpoints now served exclusively from `backend/routes/prizepicks.py`.
- **IMPROVED**: Inline documentation and comments for endpoint sources and integration status.
- **REQUIRED**: API keys for SportRadar and Odds API must be set in `.env` (see Quick Start above).
- **DOCS**: Updated setup and integration instructions for developers and automation.

## [2024-12-19]

### 🚀 MAJOR: Real-Time Multi-Sport Analysis System

#### 🎯 New Real-Time Analysis Engine

- **ADDED**: Comprehensive on-demand analysis across ALL sports (NBA, NFL, MLB, NHL, Soccer, Tennis, Golf, UFC, Boxing, eSports, Cricket, Rugby)
- **ADDED**: 47+ ML model ensemble for maximum prediction accuracy
- **ADDED**: Multi-sportsbook integration (DraftKings, FanDuel, BetMGM, Caesars, Pinnacle, PrizePicks + more)
- **ADDED**: Cross-sport optimization for 6-bet and 10-bet optimal lineups
- **ADDED**: Smart rate limiting to respect API provider limits while maximizing data freshness
- **ADDED**: Real-time progress monitoring with live status updates

#### Backend Infrastructure

- **CREATED**: `real_time_analysis_engine.py` - Core analysis engine processing thousands of bets
- **CREATED**: `real_time_analysis.py` - API endpoints for analysis management
- **ADDED**: `/api/analysis/start` - Trigger comprehensive analysis

---

---

## 🤖 Contributing as an AI Agent

---

- Open a pull request with a clear description of your changes.
- Tag your PR with `[AI]` in the title.
- If you are an LLM, summarize your reasoning and cite relevant code sections.
- Respect the Manual Narrative Section and do not overwrite it.
- If you are unsure, ask for human review.

---

---

## 🤖 AI Self-Test

---

To verify documentation and code are in sync, copilots/LLMs should:

1. Parse the AI_CONTEXT_BLOCK at the top of this README.
2. Compare directory and endpoints to the current codebase.
3. If drift is detected, run `python scripts/extract_digest_for_docs.py` to update docs.
4. Report pass/fail in PRs or issues.

---

---

## 📜 Data Provenance & Usage Policy

---

All code and data in this repo are original or properly attributed.
AI agents must cite this repo and relevant files when generating new content.
For external data, see the LICENSE and attribution files.

---

---

## 🔄 Streaming/Partial Update

---

For large repos, you can update only specific sections:

- To update only API docs: run the extraction script with the `--api` flag (future).
- To update only the roadmap: run with the `--roadmap` flag (future).
- For now, the script updates all docs at once.

---

---

## 🩺 Continuous Doc Health

---

- Last doc update: 2025-07-14 11:50 UTC
- Last code update: (see git log)
- If doc/code drift is detected, run the extraction script.

---

---

## 🧠 LLM Prompt Engineering Tips

---

- Use the AI_CONTEXT_BLOCK for instant context loading.
- Ask for code samples, API endpoints, or directory structure as needed.
- Use the roadmap and changelog for planning and history.
- Always cite sources and preserve manual narrative.

---

---

## 🤖 AI/LLM Usage Policy

---

- AI agents may open PRs, refactor code, and generate tests.
- All major changes should be reviewed by a human.
- Manual narrative and license sections must be preserved.
- Cite this repo and relevant files in all AI-generated content.

---

---

# Project Feature & Architecture Summary (2025)

# Native Modules Integration (Node-API, Rust/NAPI-RS, C/C++)

### Best Practices (2025)

- Use Node-API for cross-version compatibility and future-proofing.
- For Rust, use napi-rs (napi, napi-derive) and @napi-rs/cli for building and packaging. No node-gyp required.
- For C/C++, use node-gyp and rebuild native modules for Electron using @electron/rebuild.
- On Windows, set `win_delay_load_hook: true` in binding.gyp for Electron compatibility.
- Always rebuild native modules after upgrading Electron.
- Unpack native modules from Electron asar archive for runtime loading.
- Use prebuild or node-pre-gyp for distributing binaries, but prefer building from source for maximum compatibility.

### Example: Rust/NAPI-RS Integration

1. Create a Rust crate with `crate-type = ["cdylib"]` in Cargo.toml.
2. Add `napi` and `napi-derive` as dependencies.
3. Use `@napi-rs/cli` to build and package the native module.
4. Require the resulting `.node` file in Electron/React code.
5. Rebuild with @electron/rebuild after Electron upgrades.

### Example: C/C++ Integration

1. Use node-gyp and set up binding.gyp.
2. Set `win_delay_load_hook: true` for Windows/Electron.
3. Rebuild with @electron/rebuild after Electron upgrades.

### Unpacking Native Modules

- Unpack native modules from Electron asar archive to allow dynamic loading at runtime.
- See Electron docs for details: https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules

## Monitoring & Profiling

Production monitoring uses OpenTelemetry/SigNoz for backend and Sentry for frontend error tracking. Performance profiling is done using Chrome DevTools, React DevTools, and automated Core Web Vitals reporting via the web-vitals library (see `frontend/src/webVitals.ts`).

### Core Web Vitals Integration

The frontend integrates the latest web-vitals (v5.x, 2025) using the recommended API (`onCLS`, `onINP`, `onLCP`, `onTTFB`). Metrics are logged to the console and can be sent to analytics/monitoring endpoints. See `webVitals.ts` for details and extension points.

#### How to use:

1. Import and call `initWebVitals()` in your app entry point.
2. Metrics will be logged to the console and can be sent to any endpoint for further analysis.

#### Findings:

- All onboarding, update, and settings flows are profiled and optimized for Core Web Vitals.
- No runtime errors detected in metrics reporting.

## Backend

- Full async DB integration (SQLModel, AsyncSession)
- Dependency Injection for DB/session/service management
- Robust error handling and custom exception handlers
- OpenTelemetry/SigNoz monitoring and observability
- Structured logging for all major events and errors
- CORS, GZip, health endpoints, and rate limiting for production readiness
- Legacy endpoint migration and deprecation warnings

## Frontend

- Electron/React with context isolation and IPC security
- Multi-step onboarding and update flows (personalized, gamified, interactive)
- Accessibility and edge case testing (keyboard, screen reader, high contrast)
- Performance optimization: profiling, code splitting, lazy loading, virtualization, memoization
- Continuous profiling and monitoring (React DevTools, Chrome DevTools, Web Vitals)

## ML Explainability & Monitoring

- SHAP/LIME integration for model explainability
- Explanations exposed via API and frontend (JSON, charts, summaries)
- Automated model monitoring (data drift, performance, error logging)

## CI/CD & Testing

- Automated build, test, and deployment pipelines (GitHub Actions/GitLab CI)
- Model and API versioning (semantic versioning, artifact tagging)
- Automated unit, integration, and E2E tests (pytest, httpx, Playwright/Cypress)
- Automated database migrations and environment setup
- Deployment monitoring and rollback

## Documentation

- Inline documentation and endpoint catalog for maintainability
- Updated roadmap and feature integration summary

---

## Features

- Native Electron desktop app (Windows, macOS, Linux)
- FastAPI backend with health monitoring
- Real-time sports data, analytics, and predictions
- Secure local storage (SQLite, encrypted)
- Auto-updates, system tray, and notifications
- Modular, extensible architecture
- Professional packaging and distribution
- Comprehensive test suite
- Modern UI/UX
- And more!

---

## Directory Structure

```markdown
└── itzcole03-a1betting7-13.2/
├── README.md
├── ADMIN_MODE_FEATURES.md
├── API_DOCUMENTATION.md
├── CHANGELOG.md
├── cookies.txt
├── FEATURE_INTEGRATION_ROADMAP.md
├── Inventory.md
├── prizepicks_data.db
├── roadmap.md
├── test_enhanced_service.py
├── test_output.txt
├── users.db
├── backend/
│ ├── README.md
│ ├── **init**.py
│ ├── a1betting_fallback.db
│ ├── admin_api.py
│ ├── advanced_best_practices_manager.py
│ ├── ADVANCED_BEST_PRACTICES_REPORT_20250701_151152.json
│ ├── advanced_feature_engineering.py
│ ├── agent_planner.py
│ ├── api_integration.py
│ ├── arbitrage_engine.py
│ ├── auth.py
│ ├── auth_service.py
│ ├── autonomous_project_development_handler.py
│ ├── autonomous_recursive_orchestrator.py
│ ├── autonomous_system.py
│ ├── backend_8001.py
│ ├── BACKEND_FILE_USAGE_ANALYSIS.md
│ ├── background_agents.py
│ ├── betting_opportunity_service.py
│ ├── cache_optimizer.py
│ ├── cleanup_console_statements.py
│ ├── command_registry.py
│ ├── complete_stub_endpoints.py
│ ├── config.py
│ ├── config_manager.py
│ ├── data_pipeline.py
...
````

---

## Visual Directory Tree

```mermaid
graph TD
    itzcole03-a1betting7-13.2[itzcole03-a1betting7-13.2]
    ____README.md[README.md]
    ____ADMIN_MODE_FEATURES.md[ADMIN_MODE_FEATURES.md]
    ____API_DOCUMENTATION.md[API_DOCUMENTATION.md]
    ____CHANGELOG.md[CHANGELOG.md]
    ____cookies.txt[cookies.txt]
    ____FEATURE_INTEGRATION_ROADMAP.md[FEATURE_INTEGRATION_ROADMAP.md]
    ____Inventory.md[Inventory.md]
    ____prizepicks_data.db[prizepicks_data.db]
    ____roadmap.md[roadmap.md]
    ____test_enhanced_service.py[test_enhanced_service.py]
    ____test_output.txt[test_output.txt]
    ____users.db[users.db]
    ____backend[backend]
    ____│   README.md[│   README.md]
    ____│   __init__.py[│   __init__.py]
    ____│   a1betting_fallback.db[│   a1betting_fallback.db]
    ____│   admin_api.py[│   admin_api.py]
    ____│   advanced_best_practices_manager.py[│   advanced_best_practices_manager.py]
    ____│   ADVANCED_BEST_PRACTICES_REPORT_20250701_151152.json[│   ADVANCED_BEST_PRACTICES_REPORT_20250701_151152.json]
```

---

## Architecture Diagram

```mermaid
graph LR
Frontend[Frontend (Electron/React)] --> Backend[Backend (FastAPI/Python)]
Backend --> DB[(SQLite/Encrypted)]
Backend --> APIs[External APIs]
Frontend --> User[User]
```

---

## Technology Stack

- .py: 229 files
- .md: 54 files
- .txt: 16 files
- .json: 11 files
- .js: 9 files
- .db: 6 files
- .bat: 5 files
- .html: 5 files
- .ps1: 4 files
- (no ext): 3 files
- .sh: 3 files
- .cjs: 3 files
- .example: 2 files
- .ini: 1 files
- .pkl: 1 files
- .backup: 1 files
- .code-workspace: 1 files

---

## API Endpoints

Health endpoints provide system status, performance metrics, model status, API metrics, and fallback/degraded state for all core services.

- backend/admin_api.py: @router.get("/admin/users", response_model=List[User])

Returns overall system health, performance, model status, and API metrics.
Now includes a `fallback_services` field showing which services are in fallback mode. If any service is degraded, status will be `degraded`.
Response is a plain dict (not a strict pydantic model) for flexibility and automation.

- backend/backend_8001.py: @app.get("/health")

Returns a comprehensive health check with autonomous system integration.
Includes `fallback_services` and all autonomous system metrics.

- ...

Returns a comprehensive database health check.
Includes `fallback_services` to indicate database or other service fallback state.

```python
- Health endpoints now always report fallback state for visibility and automation.
- Response models are omitted to allow extra fields in responses.
- See inline comments in `backend/main.py` for details.
```

```python
class User(BaseModel):
```

```python
def get_logs():
```

```python
class AdvancedSupervisorCoordinator:
```

```python
class AdvancedBestPracticesManager:
```

...

---

## Detailed API Reference

---

## How to Contribute

1. Fork the repo and create a feature branch.
2. Add your feature or fix.
3. Submit a pull request with a clear description.

---

## Vision

## A1Betting7-13.2 aims to be the most robust, powerful, and beautifully designed sports intelligence platform for professionals and enthusiasts alike.

---

## 📄 License and Attribution

---

This project is licensed under the MIT License.
See LICENSE file for details.

---

## Supported API Endpoints

As of v4.0.1 (2025-07-14), only production-ready endpoints are exposed. Legacy and deprecated endpoints have been removed:

- `/api/v1/unified-data` (removed)
- `/api/v1/sr/games` (removed)
- `/api/v1/odds/{event_id}` (removed)
- `/api/v4/predict/ultra-accuracy` (removed)

Refer to `backend/main.py` and `backend/routes/` for the current API surface.

## Migration Notes

- If you previously depended on legacy endpoints, migrate to the new unified, analytics, or PrizePicks endpoints as described in the API documentation.
- All mock and stub endpoints have been removed for clarity and security.

## Developer Instructions

- Start the backend from the project root: `python -m backend.main`
- Ensure your working directory is correct and PYTHONPATH is set if you encounter import errors.
- API keys for SportRadar and Odds must be set in `.env` for production use.
- See inline comments in `main.py` for further details on initialization and background tasks.

## Dependencies

- FastAPI
- Uvicorn
- Pydantic
- httpx
- See `enhanced_requirements.txt` for full dependency list.

## Changelog

See `CHANGELOG.md` for details on recent changes.

---

## PropOllama Error Handling & Troubleshooting

### Backend

- All errors in `/api/propollama/chat` are logged to both console and `backend/logs/propollama.log`.
- Stack traces are printed for every exception.
- Validation errors (missing/invalid fields) return HTTP 422 with details.
- Internal errors return HTTP 500 with structured JSON: `{ error, message, trace }`.
- Health check endpoint: `/api/propollama/health` returns `{ status: "ok", message: "PropOllama API is healthy." }`.

### Frontend

- Error messages from backend are displayed in the chat UI, including stack traces and details.
- Health check button in PropOllama UI verifies backend status.
- If you see an error, check browser console and backend logs for details.

### Testing

- Backend: See `backend/tests/test_propollama_api.py` for unit tests covering valid, invalid, and error cases.
- Frontend: See `frontend/src/components/user-friendly/__tests__/PropOllama.test.tsx` for error display and health check tests.

### Troubleshooting Steps

1. If you get HTTP 500, check `backend/logs/propollama.log` for stack trace.
2. If frontend shows error, check browser console and backend logs.
3. Use health check button to verify backend status.
4. Run backend and frontend tests to confirm error handling works.

### Best Practices

- Always validate input before sending to backend.
- Monitor logs for recurring errors and address root causes.
- Keep backend and frontend error handling in sync for best UX.

---

## Dependency Graphs

Visualize and understand project dependencies using the auto-generated SVGs:

- **Frontend:** `frontend-dependency-graph.svg` (generated by madge)
- **Backend:** `backend-dependency-graph.svg` (generated by pydeps)

### How to Regenerate

**Frontend:**

```bash
npx madge --image frontend-dependency-graph.svg frontend/src/
```

**Backend:**

```bash
pydeps backend/main.py -o backend-dependency-graph.svg --show-deps --max-bacon=2
```

Both SVGs are committed to the repo for maintainers. View them in your browser or VS Code.

---

## Onboarding for New Contributors

Welcome to A1Betting7-13.2! To get started:

1. **Clone the repo and install dependencies** (see Quick Start above).
2. **Review the dependency graphs** (`frontend-dependency-graph.svg`, `backend-dependency-graph.svg`) for project structure and module relationships.
3. **Check the README and API docs** for endpoint details and integration notes.
4. **Run audits and tests** before submitting changes:
   - File usage/incompleteness audits are automated in CI (`.github/workflows/audit.yml`).
   - Regenerate dependency graphs after major refactors.
5. **Document new endpoints and features** in code and README.
6. **Ask for help** in issues or discussions if onboarding is unclear.

For more, see the Manual Narrative Section and FAQ above.

---

## ML Explainability: SHAP & LIME Integration (v4.1+)

### API Response Fields

All prediction API responses now include:

- `shap_values`: Feature importance scores from SHAP for each prediction.
- `lime_values`: Local feature explanations from LIME for each prediction.

Example response:

```json
{
  "prediction_id": "...",
  "sport": "basketball",
  "event": "TeamA vs TeamB",
  "prediction": 0.72,
  "confidence": 0.85,
  "expected_value": 0.12,
  "recommendation": "BUY",
  "features_used": ["home_strength", "away_strength"],
  "model_version": "ensemble-v1.0",
  "timestamp": "2025-07-20T12:34:56Z",
  "shap_values": { "home_strength": 0.1, "away_strength": -0.05 },
  "lime_values": { "home_strength": 0.08, "away_strength": -0.03 }
}
```

### How It Works

- SHAP values are computed using the ensemble engine for each prediction request.
- LIME values provide local explanations for the same input features.
- Both are available for all supported sports and markets.

### Usage

- Integrate these fields in your frontend to display model transparency and feature impact.
- See `backend/ensemble_engine.py` for implementation details.

---
