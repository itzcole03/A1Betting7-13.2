# Backend Directory Documentation

This document provides a comprehensive breakdown of all files in the `backend` directory. Each entry is based on direct analysis of the file contents and includes purpose, usage, notes, and status.

---

## Table of Contents

- [Overview](#overview)
- [File Breakdown](#file-breakdown)

---

## Overview

This directory contains the backend services, APIs, feature engineering, and analytics logic for the application. It includes FastAPI endpoints, advanced betting opportunity analysis, feature engineering, caching, and supporting modules for prediction and monitoring.

---

# Backend File-by-File Breakdown (Initial Set)

## backend/README.md
- **Purpose:** Provides an overview of the backend directory, describing each module and subdirectory.
- **Usage:** Reference for developers to understand backend structure and module responsibilities.
- **Notes:** Auto-generated. Should be updated as modules evolve.
- **Status:** Actively used; not a candidate for removal.

---

## backend/admin_api.py
- **Purpose:** Defines FastAPI routes for admin-related endpoints (logs, users, health checks).
- **Usage:** Used for backend management, retrieving logs, user info, and health status.
- **Notes:** Uses in-memory log store for demonstration; should use persistent logging in production.
- **Status:** Active; not a candidate for removal.

---

## backend/betting_opportunity_service.py
- **Purpose:** Core service for identifying and managing betting opportunities using advanced analytics, feature engineering, and risk assessment.
- **Usage:** Integrates with ML models and feature engineering; provides main logic for betting opportunity detection.
- **Notes:** Contains large, complex class (`BettingOpportunityService`) and supporting data structures; global instance at end.
- **Status:** Central to backend; not a candidate for removal.

---

## backend/feature_cache.py
- **Purpose:** Implements an in-memory cache for feature data, with TTL support.
- **Usage:** Used by other modules to cache feature data and avoid redundant computation.
- **Notes:** Simple, utility class. No external dependencies beyond standard library.
- **Status:** Utility; not a candidate for removal.

---

## backend/feature_engineering.py
- **Purpose:** Provides feature extraction, transformation, selection, and engineering logic for ML models.
- **Usage:** Used by services like `BettingOpportunityService` to preprocess and engineer features for prediction.
- **Notes:** Integrates with several ML/statistics libraries (numpy, sklearn, statsmodels); contains a large `FeatureEngineering` class.
- **Status:** Critical for ML pipeline; not a candidate for removal.

---

## backend/feature_flags.py
- **Purpose:** Manages feature flags and experiment variants for backend logic and A/B testing.
- **Usage:** Singleton pattern; used to enable/disable features and manage experiments across the backend.
- **Notes:** Adapted from a TypeScript implementation; thread-safe; supports user context and rollout logic.
- **Status:** Important for controlled feature rollout; not a candidate for removal.

---

## backend/feature_logger.py
- **Purpose:** Logging utility for feature processing and pipeline events.
- **Usage:** Used by other modules to log information, warnings, errors, and debug messages.
- **Notes:** Wraps Python logging with a custom class; can be extended for persistent logging.
- **Status:** Utility; not a candidate for removal.

---

## backend/feature_monitor.py
- **Purpose:** Tracks feature processing metrics and performance.
- **Usage:** Used to record metrics (feature count, processing time) for monitoring and diagnostics.
- **Notes:** Stores metrics in-memory; could be extended for persistent or external monitoring.
- **Status:** Utility; not a candidate for removal.

---

## backend/feature_registry.py
- **Purpose:** Registry for feature configurations and metadata.
- **Usage:** Used to register, retrieve, list, and remove feature configurations.
- **Notes:** Simple in-memory registry; can be extended for persistent storage.
- **Status:** Utility; not a candidate for removal.

---

## backend/feature_selector.py
- **Purpose:** Selects a subset of features for ML models.
- **Usage:** Used to select the top-k features from a feature dictionary.
- **Notes:** Simple implementation; currently selects the first k features. Can be extended for more advanced selection.
- **Status:** Utility; not a candidate for removal.

---

## backend/feature_transformation.py
- **Purpose:** Transforms and normalizes feature values.
- **Usage:** Used to normalize numeric features and leave non-numeric features unchanged.
- **Notes:** Example normalization logic; can be extended for more advanced transformations.
- **Status:** Utility; not a candidate for removal.

---

## backend/feature_validator.py
- **Purpose:** Validates feature data for completeness and correctness.
- **Usage:** Checks that all feature values are not None.
- **Notes:** Basic validation logic; can be extended for more complex validation rules.
- **Status:** Utility; not a candidate for removal.

---

## backend/filtered_prediction_api.py
- **Purpose:** FastAPI router for filtered prediction endpoints.
- **Usage:** Provides a POST endpoint to filter predictions based on minimum confidence and maximum risk.
- **Notes:** Integrates with prediction engine; adds filtering logic to API responses.
- **Status:** Active; not a candidate for removal.

---

## backend/main.py
- **Purpose:** Main FastAPI application entrypoint for the backend.
- **Usage:** Initializes the FastAPI app, configures services, and registers API endpoints.
- **Notes:** Includes endpoints for feature extraction, prediction, feature flags, and experiment variants. Imports and initializes all major backend modules.
- **Status:** Critical entrypoint; not a candidate for removal.

---

## backend/monitoring_service.py
- **Purpose:** Monitors and aggregates model/system performance metrics.
- **Usage:** Service for recording, aggregating, and alerting on backend performance using async database interface.
- **Notes:** Contains abstract async database interface and monitoring logic. Singleton instance at end.
- **Status:** Important for monitoring; not a candidate for removal.

---

## backend/prediction_engine.py
- **Purpose:** Unified prediction engine with ensemble, SHAP explainability, and API endpoints.
- **Usage:** Provides FastAPI router for predictions, ensemble model logic, and integrates with feature engineering and SHAP explainer.
- **Notes:** Contains dummy models for demonstration; ready for extension with real models.
- **Status:** Central to prediction flow; not a candidate for removal.

---

## backend/shap_explainer.py
- **Purpose:** Integrates SHAP explainability for model predictions.
- **Usage:** Provides a class for explaining model predictions using SHAP values.
- **Notes:** Uses a dummy model for demonstration; should be replaced with real model in production.
- **Status:** Utility for explainability; not a candidate for removal.

---

## backend/unified_feature_service.py
- **Purpose:** Unified pipeline for feature validation, transformation, selection, caching, monitoring, and logging.
- **Usage:** Provides a service class for processing features through all pipeline stages.
- **Notes:** Integrates with all feature utility modules; extensible and modular.
- **Status:** Utility; not a candidate for removal.

---

## backend/ws.py
- **Purpose:** WebSocket endpoints for real-time prediction updates.
- **Usage:** Manages WebSocket connections and broadcasts messages to clients.
- **Notes:** Includes connection manager for handling multiple clients; logs connection events.
- **Status:** Active; not a candidate for removal.

---

## backend/src/auth.py
- **Purpose:** Handles authentication endpoints and logic.
- **Usage:** Provides FastAPI router for login and token issuance; uses a stub user database.
- **Notes:** Uses hardcoded secret and plain-text passwords for demonstration; should use secure storage and environment variables in production.
- **Status:** Active but requires security improvements for production.

---

## backend/tests/__init__.py
- **Purpose:** Marks the tests directory as a Python package.
- **Usage:** Allows test discovery by pytest and other test runners.
- **Notes:** Typically empty; standard for Python test directories.
- **Status:** Utility; not a candidate for removal.
