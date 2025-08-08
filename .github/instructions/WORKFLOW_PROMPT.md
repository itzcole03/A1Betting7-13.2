### 📋 Project Context & Coding Guidelines

This repository uses strict workflow and coding standards to ensure consistency, reliability, and maintainability across all development and automation activities.

**Key Guidelines:**

- Always run backend commands from the project root (`A1Betting7-13.2/`).
- Always run frontend commands from the `frontend/` subdirectory.
- Use unified backend services (`unified_data_fetcher`, `unified_cache_service`, etc.) for all new features.
- Access frontend services via `MasterServiceRegistry.getInstance().getService('data')`.
- Prefer modular container/component architecture and extract state to hooks.
- Virtualize lists with more than 100 items.
- Use try/except import patterns for ML/LLM integration to ensure robust fallbacks.
- Integrate health checks and performance monitoring in all services.
- Use explicit TypeScript types and interfaces.
- Run backend tests with `pytest`, Alembic; frontend tests with Jest, Playwright, ESLint, Prettier, and type-check.
- Use structured logging and unified error handling.

**For full details, see:**

- `.github/instructions/copilot-instructions.md`
- `.github/instructions/setup.instructions.instructions.md`
