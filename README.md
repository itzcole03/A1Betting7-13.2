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
1. Clone the repo
   ```
   git clone https://github.com/itzcole03/A1Betting7-13.2.git
   cd A1Betting7-13.2
   ```
2. Install dependencies
   ```
   cd frontend && npm install
   cd ../backend && pip install -r requirements.txt
   ```
3. Start the backend
   ```
   python main.py
   ```
4. Start the frontend
   ```
   cd ../frontend && npm run dev
   ```
5. Open the app
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
- For live status, run the backend and visit http://localhost:8000/api/health/all
---
---
## 📝 Changelog (Latest)
---
# A1Betting Platform Changelog

## [Latest] - 2024-12-19

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
**Last Updated:** 2025-07-14 11:50 UTC
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
````markdown
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
    │   ├── README.md
    │   ├── __init__.py
    │   ├── a1betting_fallback.db
    │   ├── admin_api.py
    │   ├── advanced_best_practices_manager.py
    │   ├── ADVANCED_BEST_PRACTICES_REPORT_20250701_151152.json
    │   ├── advanced_feature_engineering.py
    │   ├── agent_planner.py
    │   ├── api_integration.py
    │   ├── arbitrage_engine.py
    │   ├── auth.py
    │   ├── auth_service.py
    │   ├── autonomous_project_development_handler.py
    │   ├── autonomous_recursive_orchestrator.py
    │   ├── autonomous_system.py
    │   ├── backend_8001.py
    │   ├── BACKEND_FILE_USAGE_ANALYSIS.md
    │   ├── background_agents.py
    │   ├── betting_opportunity_service.py
    │   ├── cache_optimizer.py
    │   ├── cleanup_console_statements.py
    │   ├── command_registry.py
    │   ├── complete_stub_endpoints.py
    │   ├── config.py
    │   ├── config_manager.py
    │   ├── data_pipeline.py
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
- backend/admin_api.py: @router.get("/admin/logs", response_model=List[LogEntry])
- backend/admin_api.py: @router.post("/admin/logs")
- backend/admin_api.py: @router.get("/admin/users", response_model=List[User])
- backend/admin_api.py: @router.get("/admin/health")
- backend/api_integration.py: @app.get("/health")
- backend/backend_8001.py: @app.get("/")
- backend/backend_8001.py: @app.get("/health")
- backend/backend_8001.py: @app.get("/api/prizepicks/props")
- backend/betting_opportunity_service.py: @router.get("/opportunities")
- backend/betting_opportunity_service.py: @router.get("/status")
- ...

## Example Code
```python
class LogEntry(BaseModel):
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
A1Betting7-13.2 aims to be the most robust, powerful, and beautifully designed sports intelligence platform for professionals and enthusiasts alike.
---
---
## 📄 License and Attribution
---
This project is licensed under the MIT License.
See LICENSE file for details.
---
