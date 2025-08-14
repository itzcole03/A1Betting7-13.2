# Stabilization Rollback Instructions

> **Document Version**: 1.0  
> **Created**: August 14, 2025  
> **Purpose**: Complete rollback procedures for stabilization patch features

## Overview

This document provides comprehensive instructions for rolling back the stabilization patch that was implemented on August 14, 2025. The stabilization patch includes health endpoint aliases, lean development mode, WebSocket URL standardization, CORS preflight fixes, and UnifiedDataService enhancements.

## 🔄 Quick Rollback Summary

| Component | Action | Impact |
|-----------|--------|---------|
| **Lean Mode** | Unset `APP_DEV_LEAN_MODE` → restart server | Re-enables all middleware |
| **Health Aliases** | Remove alias routes | No impact if canonical `/api/health` retained |
| **WebSocket Config** | Revert URL derivation logic | Falls back to environment variables |
| **CORS Headers** | Remove enhanced OPTIONS handling | May affect preflight requests |
| **UnifiedDataService** | Remove `cacheData`/`getCachedData` methods | Prevents runtime errors |

## 📁 Files Modified During Stabilization

### Backend Core Files
```
backend/core/app.py                     # Lean mode implementation + health aliases
backend/middleware/cors_middleware.py   # Enhanced OPTIONS handling
backend/routes/health.py               # Health endpoint aliases
backend/services/unified_data_service.py # Added cacheData/getCachedData methods
backend/core/config.py                 # Lean mode configuration
```

### Frontend Configuration Files
```
frontend/src/config/websocket.ts       # WebSocket URL derivation logic
frontend/src/services/api/base.ts      # API base configuration updates
```

### Test Files
```
tests/stabilization/test_stabilization_matrix.py # Stabilization test suite
```

### Documentation Files
```
docs/dev/stabilization_lean_mode.md    # Lean mode documentation
docs/architecture/architecture_notes.md # Architecture updates (stabilization section)
CHANGELOG.md                           # Stabilization patch entry
README.md                             # Lean mode reference added
```

### Automation Scripts
```
scripts/verify_stabilization.sh        # Bash validation script
scripts/verify_stabilization.ps1       # PowerShell validation script
scripts/check_ws_url.cjs               # WebSocket URL validation
scripts/verify_stabilization.bat       # Windows batch wrapper
```

## 🔙 Complete Rollback Procedures

### Method 1: Git Revert (Recommended)

If the stabilization changes were committed as discrete commits, use git revert:

```bash
# Find stabilization commit hashes
git log --oneline --grep="stabilization\|health.*alias\|lean.*mode" --since="2025-08-14"

# Example revert commands (replace with actual commit hashes)
git revert <commit-hash-lean-mode>
git revert <commit-hash-health-aliases>
git revert <commit-hash-websocket-config>
git revert <commit-hash-unified-service>

# Or revert a range of commits
git revert <oldest-stabilization-commit>..<latest-stabilization-commit>
```

### Method 2: Manual File Reversion

#### 2.1 Backend Rollback

**Remove Lean Mode from `backend/core/app.py`:**
```python
# Remove or comment out these sections:
# - APP_DEV_LEAN_MODE environment variable handling
# - Conditional middleware loading (prometheus_middleware, etc.)
# - Lean mode status endpoint (/dev/mode)

# Restore original middleware loading:
app.add_middleware(PrometheusMiddleware)
app.add_middleware(PayloadGuardMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
```

**Remove Health Aliases from `backend/routes/health.py`:**
```python
# Remove these alias routes (keep canonical /api/health):
# @router.get("/health")
# @router.head("/health") 
# @router.get("/api/v2/health")
# @router.head("/api/v2/health")
```

**Revert CORS Middleware in `backend/middleware/cors_middleware.py`:**
```python
# Remove enhanced OPTIONS handling
# Restore original CORS implementation without special OPTIONS processing
```

**Remove UnifiedDataService Methods from `backend/services/unified_data_service.py`:**
```python
# Remove these methods:
# def cacheData(self, key: str, data: any) -> None
# def getCachedData(self, key: str, default=None) -> any
```

#### 2.2 Frontend Rollback

**Revert WebSocket Config in `frontend/src/config/websocket.ts`:**
```typescript
// Remove automatic URL derivation logic
// Restore original hardcoded or simple environment variable approach
export const WS_URL = process.env.VITE_WS_URL || 'ws://localhost:8000/ws';
```

**Revert API Base Config in `frontend/src/services/api/base.ts`:**
```typescript
// Remove any standardized WebSocket URL derivation
// Restore original configuration approach
```

#### 2.3 Configuration Rollback

**Remove Lean Mode Config from `backend/core/config.py`:**
```python
# Remove APP_DEV_LEAN_MODE configuration handling
# Remove lean_mode property from settings class
```

### Method 3: Environment Variable Rollback (Quickest)

For immediate rollback without code changes:

```bash
# Unset lean mode environment variable
unset APP_DEV_LEAN_MODE
# OR on Windows:
set APP_DEV_LEAN_MODE=

# Restart the backend server
# The lean mode will be disabled and all middleware will load normally
```

## 🔧 Service Restart Procedures

### Backend Server Restart
```bash
# Stop current server (Ctrl+C or kill process)
# Restart with normal configuration
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Development Server Restart
```bash
# Stop current dev server (Ctrl+C)
# Restart frontend
cd frontend && npm run dev
```

## ✅ Rollback Verification

After rollback, verify the system is working correctly:

### 1. Health Endpoint Verification
```bash
# Primary endpoint should still work
curl http://localhost:8000/api/health

# Aliases should return 404 (if removed)
curl http://localhost:8000/health           # Should return 404
curl http://localhost:8000/api/v2/health    # Should return 404
```

### 2. Middleware Verification
```bash
# Check that all middleware is loaded (logs should show):
# - Prometheus metrics active
# - Rate limiting active  
# - Security headers active
# - Payload validation active
```

### 3. WebSocket Verification
```javascript
// In browser console or Node.js:
// WebSocket connection should work with original URL format
const ws = new WebSocket('ws://localhost:8000/ws');
```

### 4. Lean Mode Verification
```bash
# This endpoint should return 404 after rollback
curl http://localhost:8000/dev/mode
```

## ⚠️ Safety Impact Assessment

### Low Risk Rollbacks
- **Health Endpoint Aliases Removal**: Safe if canonical `/api/health` is retained
- **Lean Mode Removal**: Fully safe - just re-enables all middleware
- **WebSocket URL Rollback**: Safe if environment variables are properly set

### Medium Risk Rollbacks
- **CORS Middleware Changes**: May affect frontend CORS requests - test thoroughly
- **UnifiedDataService Methods**: Ensure no frontend code calls the removed methods

### High Risk Rollbacks
- **Complete Git Revert**: May revert other unrelated changes - review carefully

## 🚨 Emergency Rollback (Production)

If stabilization features are causing production issues:

### Immediate Actions (< 2 minutes)
1. **Disable Lean Mode**: `unset APP_DEV_LEAN_MODE` + restart
2. **Health Check**: Verify `/api/health` is accessible
3. **Monitor Logs**: Check for error reduction

### Short-term Actions (< 15 minutes)
1. **Revert Health Aliases**: Remove alias routes, keep canonical endpoint
2. **Test Frontend**: Ensure frontend still connects properly
3. **Validate WebSocket**: Test WebSocket connections

### Complete Rollback (< 1 hour)
1. **Git Revert**: Use commit hashes to revert all stabilization changes
2. **Full Testing**: Run comprehensive test suite
3. **Documentation Update**: Update CHANGELOG.md with rollback entry

## 📋 Rollback Checklist

- [ ] **Backup Current State**: Create branch or commit before rollback
- [ ] **Identify Rollback Method**: Choose git revert, manual, or environment variable approach
- [ ] **Stop Services**: Gracefully stop backend and frontend services
- [ ] **Apply Rollback**: Execute chosen rollback method
- [ ] **Restart Services**: Start backend and frontend with rolled-back configuration
- [ ] **Verify Health Endpoints**: Test primary health endpoint functionality
- [ ] **Check Middleware**: Confirm all middleware is loading correctly
- [ ] **Test WebSocket**: Validate WebSocket connections work
- [ ] **Frontend Verification**: Ensure frontend connects and functions normally
- [ ] **Monitor Logs**: Watch for error reduction and normal operation
- [ ] **Update Documentation**: Record rollback in CHANGELOG.md if needed
- [ ] **Team Notification**: Inform team of rollback completion and current state

## 📞 Support Information

If rollback procedures fail or cause additional issues:

1. **Check Logs**: Backend logs in `backend/logs/` and console output
2. **Verify Configuration**: Ensure all environment variables are correctly set
3. **Test Individual Components**: Isolate and test each rolled-back component
4. **Gradual Rollback**: If complete rollback fails, try rolling back components individually

## 🔄 Re-enabling After Rollback

To re-enable stabilization features after successful rollback:

### Re-enable Lean Mode
```bash
export APP_DEV_LEAN_MODE=true
# Restart backend server
```

### Re-enable Health Aliases
```python
# Re-add alias routes to backend/routes/health.py
@router.get("/health")
@router.get("/api/v2/health")
```

### Re-enable Enhanced Features
- Restore WebSocket URL derivation logic
- Re-add UnifiedDataService methods
- Restore enhanced CORS handling

---

**Document Maintenance**: Update this document when stabilization features are modified or when rollback procedures are tested/improved.
