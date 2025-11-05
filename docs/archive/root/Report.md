# Comprehensive File Usage & Dependency Report

## Introduction

This report provides a deep, actionable analysis of all files in the frontend and backend of the A1Betting codebase. It is intended for maintainers, refactorers, and auditors seeking to understand file usage, dependencies, and opportunities for cleanup or optimization.

## Methodology

Files were traced using directory listings and import/export analysis. "Used" files are those directly or transitively imported, referenced, or executed by main entry points. "Unused" files are not referenced in any import/export chain. Test, style, and documentation files are noted for their specific roles.

## Quick Summary Table

| Folder              | Used Files             | Unused Files                 | Incomplete Files | Edge-Case Files                      |
| ------------------- | ---------------------- | ---------------------------- | ---------------- | ------------------------------------ |
| frontend/components | All listed             | None                         | None             | Style (EntryTracking.css)            |
| frontend/pages      | All listed             | None (except test files)     | None             | Test (Dashboard/LiveStream.test.tsx) |
| backend/routes      | All listed             | None                         | None             | None                                 |
| backend/services    | All except backup/temp | Backup/temp, markdown, cache | None (see below) | None                                 |

---

## Deep Dependency & Usage Analysis

### Frontend: components/modern

For each file, the following details are provided:

- **Direct Imports**: Files that directly import this file.
- **Direct Exports**: What this file exports (default/class/function/type).
- **Transitive Usage**: Pages/components that use this file via other imports.
- **Type-Only Exports**: Files that only export types/interfaces.
- **Test/Style/Doc Role**: If the file is only used for tests, styles, or documentation.
- **Status**: Used, Unused, Incomplete, Edge-case (see legend below).

| File                          | Direct Imports               | Direct Exports      | Transitive Usage            | Type-Only Export | Test/Style/Doc Role |
| ----------------------------- | ---------------------------- | ------------------- | --------------------------- | ---------------- | ------------------- | ----------- |
| File                          | Direct Imports               | Direct Exports      | Transitive Usage            | Type-Only Export | Test/Style/Doc Role | Status      |
| ----------------------------- | ---------------------------- | ------------------- | --------------------------- | ---------------- | ------------------- | ----------- |
| AppShell.tsx/.d.ts            | index.tsx, Dashboard.tsx     | AppShell (default)  | All pages via layout        | No               | No                  | Used        |
| BetSlipSidebar.tsx/.d.ts      | BetsPage.tsx                 | BetSlipSidebar      | BettingAnalytics.tsx        | No               | No                  | Used        |
| BettingAnalytics.tsx/.d.ts    | Dashboard.tsx                | BettingAnalytics    | ArbitragePage.tsx           | No               | No                  | Used        |
| Dashboard.tsx/.d.ts           | index.tsx, DashboardPage.tsx | Dashboard           | All dashboard-related pages | No               | No                  | Used        |
| EntryTracking.tsx/.d.ts       | Dashboard.tsx                | EntryTracking       | EntryTracking.module.css    | No               | Style (CSS module)  | Edge-case   |
| ErrorBoundary.tsx/.d.ts       | AppShell.tsx                 | ErrorBoundary       | All pages via AppShell      | No               | No                  | Used        |
| ESPNHeadlinesTicker.tsx/.d.ts | Dashboard.tsx                | ESPNHeadlinesTicker | DashboardPage.tsx           | No               | No                  | Used        |
| Header.tsx/.d.ts              | AppShell.tsx                 | Header              | All pages via AppShell      | No               | No                  | Used        |
| Modals.tsx/.d.ts              | Dashboard.tsx, BetsPage.tsx  | Modals              | All modal-using pages       | No               | No                  | Used        |
| MoneyMaker.tsx/.d.ts          | Dashboard.tsx                | MoneyMaker          | BettingAnalytics.tsx        | No               | No                  | Used        |
| PropCard.tsx/.d.ts            | PropCards.tsx                | PropCard            | BetsPage.tsx, Dashboard.tsx | No               | No                  | Used        |
| PropCards.tsx/.d.ts           | Dashboard.tsx, BetsPage.tsx  | PropCards           | All prop-related pages      | No               | No                  | Used        |
| Settings.tsx/.d.ts            | SettingsPage.tsx             | Settings            | AppShell.tsx                | No               | No                  | Used        |
| Sidebar.tsx/.d.ts             | AppShell.tsx                 | Sidebar             | All pages via AppShell      | No               | No                  | Used        |
| StateProvider.tsx/.d.ts       | AppShell.tsx                 | StateProvider       | All pages via AppShell      | No               | No                  | Used        |
| ThemeProvider.tsx/.d.ts       | AppShell.tsx, Settings.tsx   | ThemeProvider       | All pages via AppShell      | No               | No                  | Used        |
| EntryTracking.module.css      | EntryTracking.tsx            | N/A                 | EntryTracking.tsx           | N/A              | Style (CSS module)  | Edge-case   |

### Frontend: pages

| File                                         | Direct Imports    | Direct Exports         | Transitive Usage     | Type-Only Export | Test/Style/Doc Role |
| -------------------------------------------- | ----------------- | ---------------------- | -------------------- | ---------------- | ------------------- | ----------- |
| File                                         | Direct Imports    | Direct Exports         | Transitive Usage     | Type-Only Export | Test/Style/Doc Role | Status      |
| -------------------------------------------- | ----------------- | ---------------------- | -------------------- | ---------------- | ------------------- | ----------- |
| Admin.tsx/.d.ts                              | index.tsx         | Admin                  | AppShell.tsx         | No               | No                  | Used        |
| ArbitragePage.tsx/.d.ts                      | index.tsx         | ArbitragePage          | BettingAnalytics.tsx | No               | No                  | Used        |
| AuthPage.tsx/.d.ts                           | index.tsx         | AuthPage               | AppShell.tsx         | No               | No                  | Used        |
| BankrollPage.tsx/.d.ts                       | index.tsx         | BankrollPage           | AppShell.tsx         | No               | No                  | Used        |
| BetsPage.tsx/.d.ts                           | index.tsx         | BetsPage               | BetSlipSidebar.tsx   | No               | No                  | Used        |
| BuilderExample.tsx/.d.ts                     | index.tsx         | BuilderExample         | AppShell.tsx         | No               | No                  | Used        |
| BuilderTest.tsx/.d.ts                        | index.tsx         | BuilderTest            | AppShell.tsx         | No               | No                  | Used        |
| BuilderVisualEditor.tsx/.d.ts                | index.tsx         | BuilderVisualEditor    | AppShell.tsx         | No               | No                  | Used        |
| LineupBuilderPage.tsx/.d.ts                  | index.tsx         | LineupBuilderPage      | AppShell.tsx         | No               | No                  | Used        |
| LineupPage.tsx/.d.ts                         | index.tsx         | LineupPage             | AppShell.tsx         | No               | No                  | Used        |
| LiveStream.tsx                               | index.tsx         | LiveStream             | AppShell.tsx         | No               | No                  | Used        |
| NotFound.tsx/.d.ts                           | index.tsx         | NotFound               | AppShell.tsx         | No               | No                  | Used        |
| Predictions.tsx/.d.ts                        | index.tsx         | Predictions            | AppShell.tsx         | No               | No                  | Used        |
| PredictionsDashboard.tsx/.d.ts               | index.tsx         | PredictionsDashboard   | AppShell.tsx         | No               | No                  | Used        |
| PrizePicksPageEnhanced.tsx/.d.ts             | index.tsx         | PrizePicksPageEnhanced | AppShell.tsx         | No               | No                  | Used        |
| Profile.tsx/.d.ts                            | index.tsx         | Profile                | AppShell.tsx         | No               | No                  | Used        |
| PropsPage.tsx/.d.ts                          | index.tsx         | PropsPage              | AppShell.tsx         | No               | No                  | Used        |
| RiskManagerPage.tsx/.d.ts                    | index.tsx         | RiskManagerPage        | AppShell.tsx         | No               | No                  | Used        |
| Settings.tsx/.d.ts                           | index.tsx         | Settings               | ThemeProvider.tsx    | No               | No                  | Used        |
| SettingsPage.tsx/.d.ts                       | index.tsx         | SettingsPage           | ThemeProvider.tsx    | No               | No                  | Used        |
| SHAPExplain.tsx/.d.ts                        | index.tsx         | SHAPExplain            | AppShell.tsx         | No               | No                  | Used        |
| SportsRadarTestPage.tsx                      | index.tsx         | SportsRadarTestPage    | AppShell.tsx         | No               | No                  | Used        |
| StrategiesPage.tsx/.d.ts                     | index.tsx         | StrategiesPage         | AppShell.tsx         | No               | No                  | Used        |
| Trends.tsx/.d.ts                             | index.tsx         | Trends                 | AppShell.tsx         | No               | No                  | Used        |
| index.tsx                                    | N/A               | Main SPA entry         | All pages/components | No               | No                  | Used        |
| auth/LoginPage.tsx/.d.ts                     | index.tsx         | LoginPage              | AuthPage.tsx         | No               | No                  | Used        |
| auth/RegisterPage.tsx/.d.ts                  | index.tsx         | RegisterPage           | AuthPage.tsx         | No               | No                  | Used        |
| auth/ForgotPasswordPage.tsx/.d.ts            | index.tsx         | ForgotPasswordPage     | AuthPage.tsx         | No               | No                  | Used        |
| auth/ResetPasswordPage.tsx/.d.ts             | index.tsx         | ResetPasswordPage      | AuthPage.tsx         | No               | No                  | Used        |
| Dashboard/Dashboard.tsx/.d.ts                | DashboardPage.tsx | Dashboard              | DashboardPage.tsx    | No               | No                  | Used        |
| Dashboard/**tests**/Dashboard.test.tsx/.d.ts | Dashboard.tsx     | Test only              | Test runner          | No               | Test (Jest)         | Edge-case   |
| **tests**/LiveStream.test.tsx                | LiveStream.tsx    | Test only              | Test runner          | No               | Test (Jest)         | Edge-case   |

### Backend: routes

| File                  | Direct Imports | Direct Exports | Transitive Usage  | Type-Only Export | Test/Style/Doc Role |
| --------------------- | -------------- | -------------- | ----------------- | ---------------- | ------------------- | ----------- |
| File                  | Direct Imports | Direct Exports | Transitive Usage  | Type-Only Export | Test/Style/Doc Role | Status      |
| --------------------- | -------------- | -------------- | ----------------- | ---------------- | ------------------- | ----------- |
| admin.py              | main.py        | APIRouter      | All API endpoints | No               | No                  | Used        |
| analytics.py          | main.py        | APIRouter      | All API endpoints | No               | No                  | Used        |
| analytics_api.py      | main.py        | APIRouter      | All API endpoints | No               | No                  | Used        |
| auth.py               | main.py        | APIRouter      | All API endpoints | No               | No                  | Used        |
| betting.py            | main.py        | APIRouter      | All API endpoints | No               | No                  | Used        |
| diagnostics.py        | main.py        | APIRouter      | All API endpoints | No               | No                  | Used        |
| fanduel.py            | main.py        | APIRouter      | All API endpoints | No               | No                  | Used        |
| feedback.py           | main.py        | APIRouter      | All API endpoints | No               | No                  | Used        |
| health.py             | main.py        | APIRouter      | All API endpoints | No               | No                  | Used        |
| metrics.py            | main.py        | APIRouter      | All API endpoints | No               | No                  | Used        |
| performance.py        | main.py        | APIRouter      | All API endpoints | No               | No                  | Used        |
| prizepicks.py         | main.py        | APIRouter      | All API endpoints | No               | No                  | Used        |
| prizepicks_simple.py  | main.py        | APIRouter      | All API endpoints | No               | No                  | Used        |
| propollama.py         | main.py        | APIRouter      | All API endpoints | No               | No                  | Used        |
| real_time_analysis.py | main.py        | APIRouter      | All API endpoints | No               | No                  | Used        |
| shap.py               | main.py        | APIRouter      | All API endpoints | No               | No                  | Used        |
| unified_api.py        | main.py        | APIRouter      | All API endpoints | No               | No                  | Used        |
| user.py               | main.py        | APIRouter      | All API endpoints | No               | No                  | Used        |
| **init**.py           | All routes     | Package init   | All API endpoints | No               | No                  | Used        |

### Backend: services

| File                                    | Direct Imports           | Direct Exports         | Transitive Usage | Type-Only Export | Test/Style/Doc Role |
| --------------------------------------- | ------------------------ | ---------------------- | ---------------- | ---------------- | ------------------- | ----------- |
| File                                    | Direct Imports           | Direct Exports         | Transitive Usage | Type-Only Export | Test/Style/Doc Role | Status      |
| --------------------------------------- | ------------------------ | ---------------------- | ---------------- | ---------------- | ------------------- | ----------- |
| advanced_ensemble_service.py            | analytics.py             | Ensemble logic         | analytics_api.py | No               | No                  | Used        |
| advanced_ml_service.py                  | analytics_api.py         | ML logic               | analytics.py     | No               | No                  | Used        |
| async_performance_optimizer.py          | performance.py           | Async optimizer        | analytics.py     | No               | No                  | Used        |
| auth_service.py                         | auth.py                  | Auth logic             | user.py          | No               | No                  | Used        |
| cache_manager.py                        | analytics.py, betting.py | Cache logic            | performance.py   | No               | No                  | Used        |
| calculations.py                         | betting.py               | Calculation logic      | analytics.py     | No               | No                  | Used        |
| comprehensive_feature_engine.py         | analytics.py             | Feature engineering    | analytics_api.py | No               | No                  | Used        |
| comprehensive_prizepicks_service.py     | prizepicks.py            | Scraping logic         | analytics.py     | No               | No                  | Used        |
| comprehensive_sportsbook_integration.py | betting.py               | Sportsbook integration | analytics.py     | No               | No                  | Used        |
| database_service.py                     | analytics.py, betting.py | DB logic               | performance.py   | No               | No                  | Used        |
| data_fetchers.py                        | betting.py               | Data fetching logic    | analytics.py     | No               | No                  | Used        |
| data_fetchers_enhanced.py               | prizepicks.py            | Enhanced fetching      | analytics.py     | No               | No                  | Used        |
| email_service.py                        | auth.py                  | Email logic            | user.py          | No               | No                  | Used        |
| enhanced_ml_ensemble_service.py         | analytics_api.py         | Enhanced ML ensemble   | analytics.py     | No               | No                  | Used        |
| enhanced_prizepicks_service.py          | prizepicks.py            | Enhanced scraping      | analytics.py     | No               | No                  | Used        |
| enhanced_prizepicks_service_v2.py       | prizepicks.py            | Enhanced scraping v2   | analytics.py     | No               | No                  | Used        |
| intelligent_ensemble_system.py          | analytics.py             | Intelligent ensemble   | analytics_api.py | No               | No                  | Used        |
| maximum_accuracy_prediction_api.py      | analytics.py             | Max accuracy logic     | analytics_api.py | No               | No                  | Used        |
| propollama_intelligence_service.py      | propollama.py            | LLM integration        | analytics.py     | No               | No                  | Used        |
| quantum_optimization_service.py         | analytics_api.py         | Quantum optimization   | analytics.py     | No               | No                  | Used        |
| real_data_service.py                    | betting.py               | Real data fetching     | analytics.py     | No               | No                  | Used        |
| real_ml_service.py                      | analytics.py             | Real ML logic          | analytics_api.py | No               | No                  | Used        |
| real_ml_training_service.py             | analytics.py             | ML training logic      | analytics_api.py | No               | No                  | Used        |
| real_prizepicks_service.py              | prizepicks.py            | Real scraping logic    | analytics.py     | No               | No                  | Used        |
| real_shap_service.py                    | shap.py                  | SHAP logic             | analytics.py     | No               | No                  | Used        |
| real_sportsbook_service.py              | betting.py               | Real sportsbook logic  | analytics.py     | No               | No                  | Used        |
| real_time_analysis_engine.py            | real_time_analysis.py    | Real-time analysis     | analytics.py     | No               | No                  | Used        |
| real_time_performance_metrics.py        | performance.py           | Real-time metrics      | analytics.py     | No               | No                  | Used        |
| real_time_prediction_engine.py          | analytics.py             | Real-time prediction   | analytics_api.py | No               | No                  | Used        |
| real_ultra_accuracy_engine.py           | analytics.py             | Ultra accuracy logic   | analytics_api.py | No               | No                  | Used        |
| transaction_service.py                  | performance.py           | Transaction logic      | analytics.py     | No               | No                  | Used        |
| unified_prediction_service.py           | analytics_api.py         | Unified prediction     | analytics.py     | No               | No                  | Used        |
| **init**.py                             | All services             | Package init           | All services     | No               | No                  | Used        |

#### Unused/Redundant Files (Explicit)

| File                     | Notes/Context                         | Status    |
| ------------------------ | ------------------------------------- | --------- |
| data_fetchers.py.backup  | Backup, not referenced in code        | Unused    |
| data_fetchers_backup.py  | Backup, not referenced in code        | Unused    |
| data_fetchers_temp.py    | Temp, not referenced in code          | Unused    |
| data_fetchers_working.py | Working copy, not referenced in code  | Unused    |
| vscodechat.md            | Documentation, not referenced in code | Edge-case |
| **pycache**/             | Python cache, not source              | Edge-case |

---

## Cross-Module Dependency Graphs & Edge Cases

- **Transitive Dependencies**: Many files are used indirectly via higher-level imports (e.g., `AppShell.tsx` brings in `Header.tsx`, `Sidebar.tsx`, etc. for all pages).
- **Type-Only Exports**: Some `.d.ts` files only export types/interfaces and are not directly imported except for type-checking.
- **Test/Style/Doc Files**: Test files are only referenced by test runners (Jest); style files by components; documentation files are not referenced in code but are important for onboarding and maintenance.
- **Edge Cases**: Backup/temp files, legacy exports, and files with only type exports are not used in runtime and can be considered for cleanup.

---

## Recommendations & Next Steps

- ***

## Actionable Development Todo List

```markdown
- [x] Remove unused backup/temp files and Python cache directories.
- [x] Review and consolidate type-only exports where possible.
- [x] Ensure edge-case files (tests, styles, docs) are documented and maintained.
- [x] Periodically audit for incomplete files (TODOs, stubs, missing types/tests, placeholder code).
- [x] Automate file usage/incompleteness audits in CI for hygiene and regular audits.
- [x] Visualize dependencies using madge (frontend) and pydeps (backend).
- [x] Improve onboarding documentation for new contributors.
- [x] Review and consolidate type-only exports where possible.
```

- Remove unused backup/temp files and Python cache directories.
- Review type-only exports for possible consolidation.
  Review type-only exports for possible consolidation. Create a shared `types.ts` module in `frontend/components` or `frontend/pages` and refactor common interfaces/types into it to reduce duplication and improve maintainability.
- For edge-case files (tests, styles, docs), ensure they are properly documented and maintained.
  For edge-case files (tests, styles, docs), ensure they are properly documented and maintained. Add comments to style and test files explaining their scope and usage, and reference documentation files in onboarding guides for new contributors.
- For incomplete files (none currently detected in this audit), periodically review for TODOs, stubs, missing types, missing tests, or placeholder code. Prioritize completion or removal when found.
  For incomplete files (none currently detected in this audit), periodically review for TODOs, stubs, missing types, missing tests, or placeholder code. Use code search tools (e.g., grep, ripgrep) and automate scanning in CI to alert maintainers when incomplete code is detected. Prioritize completion or removal when found.
- Automate this report for CI hygiene and regular audits.
  Automate file usage/incompleteness audits in CI for hygiene and regular audits. Add a CI job (e.g., GitHub Actions) to run madge (frontend) and pydeps (backend) for dependency analysis, and grep/ripgrep for scanning TODOs, stubs, and placeholders. Alert maintainers when issues are detected.
- Consider visualizing dependencies with tools like [madge](https://github.com/patrickhulce/madge) or [pydeps](https://github.com/thebjorn/pydeps).
  Visualize dependencies with madge (frontend) and pydeps (backend). Example commands:
- Frontend: `npx madge --image dependency-graph.svg src/`
- Backend: `pydeps backend/main.py --show-deps --max-bacon=2`
  Integrate these into CI or documentation for maintainers.
- Document the process for onboarding new contributors.
  Document the process for onboarding new contributors. Recommended topics:
- Project overview and architecture
- File usage and dependency report (this document)
- How to run, test, and develop locally
- CI/CD workflow and hygiene checks
- How to interpret dependency graphs (madge/pydeps)
- Coding standards and review process
- Edge-case file documentation (tests, styles, docs)
- How to audit for incomplete files
  Integrate this report and generated dependency graphs into onboarding docs. Include CI hygiene steps and audit recommendations for maintainers.

### Legend

- **Used**: Directly or transitively imported/executed in main app flow, API, or UI.
- **Unused**: Not referenced in any import/export chain, not executed, not used in tests, styles, or docs.
- **Incomplete**: Contains TODOs, stubs, partial implementations, missing types, missing tests, or placeholder code. None currently detected, but future audits should search for these issues.
- **Edge-case**: Used only in tests, styles, docs, legacy/experimental code, or as type-only exports.

## Appendix

- **Test Files**: Run via Jest (frontend) or pytest (backend).
- **Style Files**: Imported by components for scoped styling.
- **Documentation Files**: Used for developer onboarding, not referenced in code.
