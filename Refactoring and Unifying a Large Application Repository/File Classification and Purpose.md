# File Classification and Purpose

This section classifies the files within the A1Betting7-13.2 repository based on their type and intended purpose. This classification is crucial for understanding the codebase, identifying areas for refactoring, and streamlining the development process.

## 1. Source Code Files

These files contain the core logic and functionality of the application.

### Frontend Source Code (TypeScript/JavaScript/React)

-   **Location:** `frontend/src/` and its subdirectories.
-   **Purpose:** Implements the user interface, handles user interactions, displays data, and manages frontend state.
-   **Examples:**
    -   `.tsx` files (e.g., `PropOllamaContainer.tsx`, `PropList.tsx`): React components.
    -   `.ts` files: TypeScript utility functions, types, and hooks.
    -   `.js` files (e.g., `jest.setup.js`, `vite.config.js`): Configuration and build-related JavaScript files.

### Backend Source Code (Python)

-   **Location:** `backend/` and its subdirectories (e.g., `backend/routes/`, `backend/services/`, `backend/models/`).
-   **Purpose:** Implements the API endpoints, business logic, data processing, AI/ML models, and database interactions.
-   **Examples:**
    -   `.py` files (e.g., `main.py`, `prediction_engine.py`, `user_service.py`): Core Python modules for various functionalities.

## 2. Configuration Files

These files define settings, parameters, and environment variables for the application.

-   **Location:** Scattered throughout the repository, including `config/`, root directories, and specific component directories.
-   **Purpose:** Configure application behavior, database connections, API keys, build processes, and development environments.
-   **Examples:**
    -   `.env` files (e.g., `postgres_dev.env`): Environment variables.
    -   `.json` files (e.g., `builder.config.json`, `package.json`, `tsconfig.json`): Project configuration, dependencies, and compiler options.
    -   `.yaml` files (e.g., `business_rules.yaml`, `prompt_templates.yaml`): Application-specific configurations.
    -   `.cjs`, `.mjs`, `.js`, `.ts` files (e.g., `babel.config.cjs`, `eslint.config.mjs`, `postcss.config.js`, `vite.config.js`): JavaScript/TypeScript-based configuration files for various tools.

## 3. Documentation Files

These files provide information about the project, its features, usage, and development guidelines.

-   **Location:** Primarily in the root directory and `docs/`.
-   **Purpose:** Explain the project, its architecture, setup instructions, roadmaps, and specific feature details.
-   **Examples:**
    -   `.md` files (e.g., `README.md`, `ARCHITECTURAL_ROADMAP_2025.md`, `API_DOCUMENTATION.md`): Markdown documents.
    -   `.txt` files (e.g., `Attached HTML and CSS Context.txt`, `A1Betting7-13.2_digest.txt`): Plain text documents.

## 4. Test Files

These files contain automated tests to ensure the correctness and reliability of the application.

-   **Location:** `frontend/test/`, `backend/test/`, `backend/tests/`, and various `test_*.py` or `jest.*.js` files.
-   **Purpose:** Unit, integration, and end-to-end testing for both frontend and backend components.
-   **Examples:**
    -   `test_*.py` files (e.g., `test_endpoints.py`, `test_propollama_api.py`): Backend Python tests.
    -   `jest.*.js` files (e.g., `jest.setup.js`, `jest.config.cjs`): Frontend JavaScript testing configurations and setup.

## 5. Deployment and CI/CD Related Files

These files are used for building, deploying, and managing the application in various environments.

-   **Location:** Root directory, `helm/`, `k8s/`, and `automation/`.
-   **Purpose:** Define Docker images, orchestrate containers, manage Kubernetes deployments, and automate deployment workflows.
-   **Examples:**
    -   `Dockerfile.*`: Docker build instructions for backend and frontend.
    -   `docker-compose.*.yml`: Docker Compose configurations for development and optimized environments.
    -   Shell scripts (e.g., `deploy_etl_production.sh`, `run_deploy.sh`): Automation scripts.
    -   `helm/`, `k8s/`: Kubernetes and Helm charts for orchestration.

## 6. Data Files

These files contain data used by the application, including raw data, processed data, and database files.

-   **Location:** Various directories, including `logs/`, `data/`, and directly in `backend/`.
-   **Purpose:** Store application logs, raw data dumps, processed data, and database files.
-   **Examples:**
    -   `.json` files (e.g., `mlb_odds_raw_dump.json`, `event_mappings.json`): JSON data.
    -   `.csv` files (e.g., `mlb_team_alias_table.csv`, `prizepicks_props.csv`): CSV data.
    -   `.db` files (e.g., `a1betting.db.bak`, `real_training_data.db`): SQLite database files.
    -   `.pkl` files (e.g., `win_probability_model.pkl`): Python pickle files, likely containing serialized machine learning models.

## 7. Build and Dependency Management Files

These files manage project dependencies and build configurations.

-   **Location:** Root directory, `frontend/`, and `backend/`.
-   **Purpose:** Define project dependencies, manage package versions, and configure build processes.
-   **Examples:**
    -   `package.json`, `package-lock.json`: Node.js project dependencies.
    -   `requirements.txt`, `requirements-dev.txt`, `requirements-prod.txt`, `requirements-test.txt`: Python project dependencies.

## 8. Assets

These files include images and other media assets used in the application or documentation.

-   **Location:** `screenshots/`, `ahk/`, and potentially within `frontend/src/assets/`.
-   **Purpose:** Visual elements for the UI, documentation, or specific scripts.
-   **Examples:**
    -   `.png` files (e.g., `prizepicks_debug_initial.png`, `copilot_ready.png`): Image files.
    -   `.svg` files (e.g., `backend-dependency-graph.svg`, `frontend-dependency-graph.svg`): Scalable Vector Graphics.

## 9. Obsolete/Archive Files

These files are likely old versions, backups, or experimental code that is no longer in active use.

-   **Location:** `cleanup_archive/` and its subdirectories.
-   **Purpose:** Historical reference, but should not be part of the active codebase.
-   **Examples:** Numerous files within `cleanup_archive/backend_obsolete/`, `cleanup_archive/backend_services_backup/`, etc.

## 10. Miscellaneous Files

Files that don't fit neatly into the above categories.

-   **Examples:**
    -   `.ahk` files (e.g., `AFKToggle.ahk`): AutoHotkey scripts.
    -   `gitingest.txt`: The provided file for this analysis.
    -   `function_index.json`, `SYMBOL_CROSSREF.md`: Potentially generated or internal analysis files.


