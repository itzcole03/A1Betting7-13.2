# Phase 1 Backend Cleanup Plan

# Generated: August 3, 2025

## Current State Analysis

- **Total Python files**: 12,759 (excessive)
- **Main entry points**: 5 different main.py variants
- **Backend entry points**: 10 different backend.py variants
- **Route duplicates**: Multiple analytics routes
- **Active production entry**: main.py → production_integration.py

## Phase 1.1: Code Organization & Cleanup (SAFE APPROACH)

### Step 1: Identify and Document Current Usage

- [x] main.py - ACTIVE PRODUCTION (uses production_integration.py)
- [ ] main_complete.py - Used by start_cloud_integration.py
- [ ] main_enhanced_prod.py - Self-contained reference only
- [ ] main_integrated.py - Purpose unclear
- [ ] main_minimal.py - Development/testing

### Step 2: Backend Entry Point Consolidation

**Files to evaluate:**

- backend_8001.py - Port-specific variant
- minimal_backend.py - Development
- quick_backend.py - Development
- real_prizepicks_backend.py - Component-specific
- run_backend.py - Runner script
- simple_backend.py - Development
- simple_healthy_backend.py - Health check variant
- simple_propollama_backend.py - Component-specific
- test_backend.py - Testing
- working_backend.py - Development

### Step 3: Route Consolidation

**Analytics routes to merge:**

- routes/analytics.py
- routes/analytics_api.py
- routes/analytics_routes.py

## Phase 1.2: Infrastructure Fixes

### Step 1: Redis Configuration Fix

- Add proper Redis URL to configuration
- Update fallback logic
- Test Redis connectivity

### Step 2: Environment Configuration

- Standardize .env setup
- Add environment-specific configs
- Document required environment variables

### Step 3: Data Pipeline Fix

- Investigate Statcast player_id mapping issue
- Fix data ingestion pipeline
- Validate ML model training

## Phase 1.3: Technical Debt Cleanup

### Step 1: Security TODOs

- Replace authentication stubs
- Implement proper admin checks
- Add API key validation

### Step 2: Critical TODOs

- Complete missing implementations
- Remove test stubs from production
- Add proper error handling

## Success Criteria

- [ ] Reduced file count by removing duplicates
- [ ] Clear file organization structure
- [ ] Redis properly configured and working
- [ ] Data pipeline functional
- [ ] Critical security TODOs resolved
- [ ] No broken functionality
- [ ] Comprehensive documentation updated
