## Backend Logging and Developer Experience

As of v4.0.1 (2025-07-14), all backend print statements have been replaced with logger.info for consistent logging. Log message style is now standardized (no emojis, concise informative text). Backend API endpoints and router registration are clean and developer-friendly.

# Legacy Endpoints & Migration

## Legacy Endpoints Catalog

Legacy endpoints are maintained for backward compatibility and are marked for migration/removal. Each legacy endpoint now issues a deprecation warning when accessed.

### Catalog (as of v4.0.0)

- `/api/v1/unified-data` [GET]: Unified feed combining all data sources (mock implementation)
- `/api/v1/sr/games` [GET]: SportRadar games API integration (legacy)
- `/api/v1/odds/{event_id}` [GET]: Odds API integration for specific event (legacy)
- `/api/v4/predict/ultra-accuracy` [GET, POST]: Ultra-accuracy prediction (deprecated, use `/api/v1/ultra-accuracy`)

**Note:** Accessing any legacy endpoint will trigger a deprecation warning in logs. Migrate clients to new endpoints as soon as possible.

## Migration Instructions

- Audit usage of legacy endpoints in client applications.
- Update integrations to use new route structure and endpoints.
- Remove legacy endpoints after confirming no active clients depend on them.

## Technical Debt

- Inline documentation and endpoint catalog added for maintainability.
- See `backend/main.py` for details and migration status.
<!--- AI_CONTEXT_BLOCK_START --->

```json
{
  "project": "A1Betting7-13.2",
  "last_updated": "2025-07-14 11:50 UTC",
  "directory": [
    "\u2514\u2500\u2500 itzcole03-a1betting7-13.2/",
    "    \u251c\u2500\u2500 README.md",
    "    \u251c\u2500\u2500 ADMIN_MODE_FEATURES.md",
    "    \u251c\u2500\u2500 API_DOCUMENTATION.md",
    "    \u251c\u2500\u2500 CHANGELOG.md",
    "    \u251c\u2500\u2500 cookies.txt",
    "    \u251c\u2500\u2500 FEATURE_INTEGRATION_ROADMAP.md",
    "    \u251c\u2500\u2500 Inventory.md",
    "    \u251c\u2500\u2500 prizepicks_data.db",
    "    \u251c\u2500\u2500 roadmap.md",
    "    \u251c\u2500\u2500 test_enhanced_service.py",
    "    \u251c\u2500\u2500 test_output.txt",
    "    \u251c\u2500\u2500 users.db",
    "    \u251c\u2500\u2500 backend/",
    "    \u2502   \u251c\u2500\u2500 README.md",
    "    \u2502   \u251c\u2500\u2500 __init__.py",
    "    \u2502   \u251c\u2500\u2500 a1betting_fallback.db",
    "    \u2502   \u251c\u2500\u2500 admin_api.py",
    "    \u2502   \u251c\u2500\u2500 advanced_best_practices_manager.py",
    "    \u2502   \u251c\u2500\u2500 ADVANCED_BEST_PRACTICES_REPORT_20250701_151152.json",
    "    \u2502   \u251c\u2500\u2500 advanced_feature_engineering.py",
    "    \u2502   \u251c\u2500\u2500 agent_planner.py",
    "    \u2502   \u251c\u2500\u2500 api_integration.py",
    "    \u2502   \u251c\u2500\u2500 arbitrage_engine.py",
    "    \u2502   \u251c\u2500\u2500 auth.py",
    "    \u2502   \u251c\u2500\u2500 auth_service.py",
    "    \u2502   \u251c\u2500\u2500 autonomous_project_development_handler.py",
    "    \u2502   \u251c\u2500\u2500 autonomous_recursive_orchestrator.py",
    "    \u2502   \u251c\u2500\u2500 autonomous_system.py",
    "    \u2502   \u251c\u2500\u2500 backend_8001.py",
    "    \u2502   \u251c\u2500\u2500 BACKEND_FILE_USAGE_ANALYSIS.md",
    "    \u2502   \u251c\u2500\u2500 background_agents.py",
    "    \u2502   \u251c\u2500\u2500 betting_opportunity_service.py",
    "    \u2502   \u251c\u2500\u2500 cache_optimizer.py",
    "    \u2502   \u251c\u2500\u2500 cleanup_console_statements.py",
    "    \u2502   \u251c\u2500\u2500 command_registry.py",
    "    \u2502   \u251c\u2500\u2500 complete_stub_endpoints.py",
    "    \u2502   \u251c\u2500\u2500 config.py",
    "    \u2502   \u251c\u2500\u2500 config_manager.py",
    "    \u2502   \u251c\u2500\u2500 data_pipeline.py"
  ],
  "api_endpoints": [
    "backend/admin_api.py: @router.get(\"/admin/logs\", response_model=List[LogEntry])",
    "backend/admin_api.py: @router.post(\"/admin/logs\")",
    "backend/admin_api.py: @router.get(\"/admin/users\", response_model=List[User])",
    "backend/admin_api.py: @router.get(\"/admin/health\")",
    "backend/api_integration.py: @app.get(\"/health\")",
    "backend/backend_8001.py: @app.get(\"/\")",
    "backend/backend_8001.py: @app.get(\"/health\")",
    "backend/backend_8001.py: @app.get(\"/api/prizepicks/props\")",
    "backend/betting_opportunity_service.py: @router.get(\"/opportunities\")",
    "backend/betting_opportunity_service.py: @router.get(\"/status\")"
  ],
  "file_types": {
    ".py": 229,
    ".md": 54,
    ".txt": 16,
    ".json": 11,
    ".js": 9,
    ".db": 6,
    ".bat": 5,
    ".html": 5,
    ".ps1": 4,
    "(no ext)": 3,
    ".sh": 3,
    ".cjs": 3,
    ".example": 2,
    ".ini": 1,
    ".pkl": 1,
    ".backup": 1,
    ".code-workspace": 1
  },
  "health": {
    "backend": "present",
    "frontend": "present",
    "api_health": "/api/health"
  }
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
   ```
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
   ```
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
   ```
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

## 🚨 DO NOT EDIT BELOW THIS LINE: AUTO-GENERATED BY extract_digest_for_docs.py 🚨

---

## **Last Updated:** 2025-07-14 11:50 UTC

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
```

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
