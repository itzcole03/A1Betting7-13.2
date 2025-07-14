# UTILS_FILE_USAGE_ANALYSIS.md

## Table of Contents

- [Overview](#overview)
- [File-by-File Analysis](#file-by-file-analysis)
  - [TypeScript/TSX Utilities](#typescripttsx-utilities)
  - [Test Files](#test-files)
  - [Python Utilities](#python-utilities)
  - [Type Declarations](#type-declarations)
  - [Subdirectories](#subdirectories)

---

## Overview

This document provides a comprehensive, recursively generated analysis of every file in the `frontend/src/utils` directory, including all subdirectories and test/config files. For each file, you will find its purpose/usage, status (active/legacy/candidate for removal), and any special notes (test, config, utility, etc.).

---

## File-by-File Analysis

### TypeScript/TSX Utilities

- **AdvancedAnalysisEngine.ts**  
  _Purpose_: Core engine for advanced player and trend analysis, integrating data and risk/opportunity assessment.  
  _Status_: Active  
  _Notes_: Used by prediction and analytics modules.

- **AnalysisFramework.ts**  
  _Purpose_: Plugin-based analysis registry and context for extensible analytics.  
  _Status_: Active  
  _Notes_: Central to modular analytics.

- **analyticsHelpers.ts**  
  _Purpose_: User stats and performance chart calculation helpers.  
  _Status_: Active  
  _Notes_: Utility for user-facing analytics.

- **Analyzer.ts**  
  _Purpose_: Generic analyzer interface for analytics modules.  
  _Status_: Active  
  _Notes_: Used for type safety and extensibility.

- **animations.ts**  
  _Purpose_: Keyframe animation utilities for UI transitions.  
  _Status_: Active  
  _Notes_: UI/UX enhancement.

- **api.ts**  
  _Purpose_: Axios instance with interceptors for API requests and authentication.  
  _Status_: Active  
  _Notes_: Core API utility.

- **apiUtils.ts**  
  _Purpose_: Retry logic and helpers for Axios requests.  
  _Status_: Active  
  _Notes_: Used for robust API calls.

- **app.ts**  
  _Purpose_: Application singleton for unified service access and initialization.  
  _Status_: Active  
  _Notes_: Central app bootstrapper.

- **betting.ts**  
  _Purpose_: Interfaces for frontend betting strategies and opportunities.  
  _Status_: Active  
  _Notes_: Used in strategy modules.

- **browser.ts**  
  _Purpose_: Mock data and browser utilities for testing and development.  
  _Status_: Active  
  _Notes_: Used for MSW and mock APIs.

- **businessRules.ts**  
  _Purpose_: Centralized business logic and validation for betting rules.  
  _Status_: Active  
  _Notes_: Used for enforcing app rules.

- **cacheUtils.ts**  
  _Purpose_: Generic cache implementation with TTL and size limits.  
  _Status_: Active  
  _Notes_: Used for in-memory caching.

- **chart.ts**  
  _Purpose_: Chart.js registration utility.  
  _Status_: Active  
  _Notes_: Charting setup.

- **classNames.ts**  
  _Purpose_: Utility for merging and composing class names (Tailwind/clsx).  
  _Status_: Active  
  _Notes_: UI utility.

- **combinationsWorker.ts**  
  _Purpose_: Web worker for generating prop combinations.  
  _Status_: Active  
  _Notes_: Used for performance in prop selection.

- **common.ts**  
  _Purpose_: Common types and enums for sports, props, alerts, etc.  
  _Status_: Active  
  _Notes_: Shared across modules.

- **constants.ts**  
  _Purpose_: App-wide constants (app name, theme, max parlay legs, etc.).  
  _Status_: Active  
  _Notes_: Central config.

- **DailyFantasyAdapter.ts**  
  _Purpose_: Adapter for daily fantasy data integration.  
  _Status_: Active  
  _Notes_: Used by data integration hub.

- **DataIntegrationHub.ts**  
  _Purpose_: Aggregates and integrates data from multiple sources.  
  _Status_: Active  
  _Notes_: Core to analytics pipeline.

- **DataPipeline.ts**  
  _Purpose_: Data pipeline and caching utilities.  
  _Status_: Active  
  _Notes_: Used for streaming and batch data.

- **DataSource.ts**  
  _Purpose_: Data source interface and metrics.  
  _Status_: Active  
  _Notes_: Used by adapters and integration.

- **encryption.ts**  
  _Purpose_: AES encryption/decryption helpers.  
  _Status_: Active  
  _Notes_: Uses environment key.

- **errorHandler.ts**  
  _Purpose_: Centralized error handling, logging, and reporting.  
  _Status_: Active  
  _Notes_: Integrates with EventBus and monitoring.

- **errorLogger.ts**  
  _Purpose_: Singleton error logger with global error handling.  
  _Status_: Active  
  _Notes_: Used for error tracking.

- **errorUtils.ts**  
  _Purpose_: Error type guards and custom error classes.  
  _Status_: Active  
  _Notes_: Used for robust error handling.

- **ESPNAdapter.ts**  
  _Purpose_: Adapter for ESPN data (games, headlines).  
  _Status_: Active  
  _Notes_: Used by data integration.

- **FeatureComposition.ts**  
  _Purpose_: Composable feature processing and validation.  
  _Status_: Active  
  _Notes_: Used for feature engineering.

- **FeatureFlags.ts**  
  _Purpose_: Feature flag and experiment management.  
  _Status_: Active  
  _Notes_: Used for A/B testing and rollout.

- **formatters.ts**  
  _Purpose_: Date, currency, and percentage formatting utilities.  
  _Status_: Active  
  _Notes_: UI and reporting utility.

- **helpers.ts**  
  _Purpose_: Generic helper functions (sleep, unique ID, etc.).  
  _Status_: Active  
  _Notes_: Utility functions.

- **index.ts**  
  _Purpose_: (Node/Express) API and service entrypoint.  
  _Status_: Active  
  _Notes_: Not used in browser build; for server-side utilities.

- **lazyLoad.tsx**  
  _Purpose_: React lazy loading utility with Suspense.  
  _Status_: Active  
  _Notes_: UI performance utility.

- **odds.ts**  
  _Purpose_: Odds conversion, payout, and win probability calculations.  
  _Status_: Active  
  _Notes_: Used in betting modules.

- **PerformanceMonitor.ts**  
  _Purpose_: Singleton for performance tracing and measurement.  
  _Status_: Active  
  _Notes_: Used in analytics and monitoring.

- **performanceTracking.ts**  
  _Purpose_: Sentry-based performance and metric tracking utilities.  
  _Status_: Active  
  _Notes_: Observability and tracing.

- **PredictionEngine.ts**  
  _Purpose_: Core prediction engine integrating analytics, strategies, and data.  
  _Status_: Active  
  _Notes_: Central to prediction pipeline.

- **ProjectionAnalyzer.ts**  
  _Purpose_: Analyzer for player projections and confidence.  
  _Status_: Active  
  _Notes_: Used in analytics modules.

- **ProjectionBettingStrategy.ts**  
  _Purpose_: Strategy for betting based on player projections.  
  _Status_: Active  
  _Notes_: Used in strategy engine.

- **rateLimiter.ts**  
  _Purpose_: Rate limiter utility for API calls.  
  _Status_: Active  
  _Notes_: Used for throttling requests.

- **scheduler.ts**  
  _Purpose_: Job scheduling utility for periodic tasks.  
  _Status_: Active  
  _Notes_: Used for background jobs.

- **security.ts**  
  _Purpose_: CSRF token management and input sanitization.  
  _Status_: Active  
  _Notes_: Security utility.

- **SentimentEnhancedAnalyzer.ts**  
  _Purpose_: Analyzer combining projections with sentiment and market data.  
  _Status_: Active  
  _Notes_: Used in advanced analytics.

- **serviceWorker.ts**  
  _Purpose_: Service worker for caching and offline support.  
  _Status_: Active  
  _Notes_: PWA support.

- **setup.ts**  
  _Purpose_: Test setup for Vitest and DOM mocks.  
  _Status_: Active  
  _Notes_: Test utility.

- **setupE2ETests.ts**  
  _Purpose_: End-to-end test setup and mocks.  
  _Status_: Active  
  _Notes_: Test utility.

- **setupIntegrationTests.ts**  
  _Purpose_: Integration test setup and mocks.  
  _Status_: Active  
  _Notes_: Test utility.

- **setupTests.ts**  
  _Purpose_: Jest test setup and environment mocks.  
  _Status_: Active  
  _Notes_: Test utility.

- **shap.ts**  
  _Purpose_: SHAP value calculation for model explainability.  
  _Status_: Active  
  _Notes_: Used in ML explainability.

- **SocialSentimentAdapter.ts**  
  _Purpose_: Adapter for social sentiment data.  
  _Status_: Active  
  _Notes_: Used in analytics and integration.

- **strategy.ts**  
  _Purpose_: Types and interfaces for betting strategies and recommendations.  
  _Status_: Active  
  _Notes_: Used in strategy modules.

- **StrategyComposition.ts**  
  _Purpose_: Composable strategy components and results.  
  _Status_: Active  
  _Notes_: Used in strategy engine.

- **StrategyEngine.ts**  
  _Purpose_: Core engine for executing betting strategies.  
  _Status_: Active  
  _Notes_: Central to strategy execution.

- **theme.ts**  
  _Purpose_: MUI theme creation and customization.  
  _Status_: Active  
  _Notes_: UI theming utility.

- **TheOddsAdapter.ts**  
  _Purpose_: Adapter for odds data integration.  
  _Status_: Active  
  _Notes_: Used by data integration hub.

- **UnifiedAnalytics.ts**  
  _Purpose_: Singleton analytics event and metrics manager.  
  _Status_: Active  
  _Notes_: Used for analytics and reporting.

- **UnifiedBettingAnalytics-MyPC.ts**  
  _Purpose_: Local/experimental version of unified betting analytics.  
  _Status_: Candidate for removal  
  _Notes_: Redundant with UnifiedBettingAnalytics.ts.

- **UnifiedBettingAnalytics.ts**  
  _Purpose_: Singleton for unified betting analytics and strategy management.  
  _Status_: Active  
  _Notes_: Used in analytics and betting modules.

- **UnifiedBettingCore.ts**  
  _Purpose_: Singleton for core betting logic and performance metrics.  
  _Status_: Active  
  _Notes_: Used in unified betting modules.

- **UnifiedCache.ts**  
  _Purpose_: (Empty/placeholder)  
  _Status_: Candidate for removal  
  _Notes_: No implementation.

### Test Files

- **APIEndpoints.test.ts**  
  _Purpose_: Tests for API endpoints and service methods.  
  _Status_: Active  
  _Notes_: Jest test file.

- **StateSync.test.ts**  
  _Purpose_: Tests for state synchronization and context integration.  
  _Status_: Active  
  _Notes_: Jest test file.

- **UnifiedBettingCore.test.ts**  
  _Purpose_: Tests for unified betting core logic and caching.  
  _Status_: Active  
  _Notes_: Jest test file.

- \***\*tests**/cacheUtils.test.ts**  
  _Purpose_: Unit tests for cache utility.  
  _Status_: Active  
  _Notes_: Jest test file in **tests\*\* subdirectory.

### Python Utilities

- **config.py**  
  _Purpose_: Loads and manages YAML configuration for the system analysis tool.  
  _Status_: Active  
  _Notes_: Used for backend/config integration.

- **logging.py**  
  _Purpose_: Centralized logging configuration and management.  
  _Status_: Active  
  _Notes_: Used for backend/config integration.

### Type Declarations

- **env.d.ts**  
  _Purpose_: Type declarations for Vite environment variables.  
  _Status_: Active  
  _Notes_: Used for type safety in build and runtime.

### Subdirectories

- \***\*tests**/\*\*  
  _Purpose_: Contains test files for utilities.  
  _Status_: Active  
  _Notes_: All files are test-related.

---

_Last updated: June 12, 2025_
