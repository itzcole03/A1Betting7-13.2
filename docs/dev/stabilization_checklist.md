# Stabilization Checklist

> **Document Version**: 1.0  
> **Created**: August 14, 2025  
> **Purpose**: Validation checklist for stabilization patch deployment and testing

## Overview

This checklist ensures all stabilization features are working correctly after deployment. Use this checklist before marking stabilization as complete or deploying to production.

## 🏥 Health Endpoints Validation

### Core Health Endpoints
- [ ] **Primary Health Endpoint**: `GET /api/health` returns **200 OK**
- [ ] **Health Alias 1**: `GET /health` returns **200 OK** 
- [ ] **Health Alias 2**: `GET /api/v2/health` returns **200 OK**
- [ ] **HEAD Method Support**: `HEAD /api/health` returns **200 OK** (no body)
- [ ] **HEAD Method Support**: `HEAD /health` returns **200 OK** (no body)
- [ ] **HEAD Method Support**: `HEAD /api/v2/health` returns **200 OK** (no body)

### Health Response Format
- [ ] **Consistent Envelope**: All health endpoints return `{success, data, error, meta}` format
- [ ] **Response Time**: All health endpoints respond within 500ms
- [ ] **Status Code Consistency**: All health endpoints return identical status codes

**Validation Commands:**
```bash
curl -i http://localhost:8000/api/health
curl -i http://localhost:8000/health  
curl -i http://localhost:8000/api/v2/health
curl -I http://localhost:8000/api/health
```

## 🌐 CORS Preflight Validation

### OPTIONS Method Support
- [ ] **OPTIONS Returns 204/200**: `OPTIONS /api/health` returns **204** or **200** (not 405)
- [ ] **OPTIONS with CORS Headers**: Contains `Access-Control-Allow-Methods` header
- [ ] **OPTIONS with CORS Headers**: Contains `Access-Control-Allow-Headers` header
- [ ] **OPTIONS with CORS Headers**: Contains `Access-Control-Max-Age` header
- [ ] **No 405 Method Not Allowed**: OPTIONS requests don't return 405 errors

### CORS Headers Validation
- [ ] **Access-Control-Allow-Origin**: Present in CORS responses
- [ ] **Access-Control-Allow-Methods**: Includes GET, POST, OPTIONS, HEAD
- [ ] **Access-Control-Allow-Headers**: Includes Content-Type, Authorization
- [ ] **Access-Control-Allow-Credentials**: Set to true if needed

**Validation Commands:**
```bash
curl -i -X OPTIONS -H "Origin: http://localhost:3000" http://localhost:8000/api/health
curl -i -X OPTIONS -H "Access-Control-Request-Method: POST" http://localhost:8000/api/v2/sports/list
```

## 🔌 WebSocket Configuration Validation

### WebSocket URL Derivation
- [ ] **No ws://localhost:8173 attempts**: Logs show no connection attempts to wrong port
- [ ] **Proper WebSocket URL**: Uses `ws://localhost:8000/ws` or configured WS_URL
- [ ] **Environment Variable Respect**: `WS_URL` environment variable takes precedence
- [ ] **Fallback Derivation**: Correctly derives from host/port when WS_URL not set
- [ ] **Protocol Validation**: Uses `ws://` for HTTP and `wss://` for HTTPS

### WebSocket Connection Testing
- [ ] **WebSocket Check Script**: `node scripts/check_ws_url.cjs` passes
- [ ] **Frontend WebSocket Config**: No hardcoded incorrect ports in frontend
- [ ] **Connection Logs**: WebSocket connections show correct URL in logs

**Validation Commands:**
```bash
node scripts/check_ws_url.cjs
grep -r "8173" frontend/src/ || echo "No 8173 references found"
grep -r "ws://" frontend/src/ | grep -v "8000"
```

## 📊 Performance Metrics Validation

### Performance Timing
- [ ] **No Negative Performance Metrics**: All timing values are positive (≥0)
- [ ] **Response Time Tracking**: Server response times are properly measured
- [ ] **Performance Endpoint**: `/api/performance/metrics` returns valid timing data
- [ ] **Memory Usage**: Memory metrics are positive and reasonable
- [ ] **CPU Usage**: CPU metrics are within expected ranges

### Core Web Vitals
- [ ] **LCP < 1200ms (warm)**: Largest Contentful Paint under 1200ms after warmup
- [ ] **LCP Logged Once**: LCP metrics logged only once per session (no spam)
- [ ] **First Load Performance**: Initial page load meets performance targets
- [ ] **Navigation Performance**: Page transitions meet performance targets

**Validation Commands:**
```bash
curl http://localhost:8000/api/performance/metrics | jq '.timing'
# Check logs for negative timing values
grep -E "timing.*-[0-9]" backend/logs/propollama.log || echo "No negative timings"
```

## 🔄 Reliability & Logging Validation

### Log Quality
- [ ] **No Reliability Spam Logs**: Reliability checks don't flood logs unnecessarily
- [ ] **Structured Logging**: All logs follow JSON structure where applicable
- [ ] **Log Level Appropriateness**: Info/Debug/Error levels used correctly
- [ ] **No Excessive WebSocket Errors**: WebSocket connection errors are handled gracefully
- [ ] **Performance Log Frequency**: Performance metrics logged at appropriate intervals

### Error Handling
- [ ] **Graceful Degradation**: System works when optional components fail
- [ ] **Error Recovery**: System recovers from transient failures
- [ ] **User-Friendly Errors**: Error messages are clear and actionable
- [ ] **Error Monitoring**: Critical errors are properly logged and monitored

**Validation Commands:**
```bash
# Check for log spam patterns
tail -100 backend/logs/propollama.log | grep -E "(reliability|health)" | wc -l
# Should be reasonable count, not hundreds of lines

# Check log structure
tail -20 backend/logs/propollama.log | head -5
```

## 🛠️ Lean Development Mode Validation

### Lean Mode Functionality
- [ ] **Environment Variable**: `APP_DEV_LEAN_MODE=true` activates lean mode
- [ ] **Query Parameter**: `?lean=true` activates lean mode when env not set
- [ ] **Status Endpoint**: `/dev/mode` returns current lean mode status
- [ ] **Middleware Loading**: Heavy middleware disabled in lean mode
- [ ] **Performance Impact**: Lean mode shows improved startup/response times

### Lean Mode Features
- [ ] **Prometheus Disabled**: Prometheus metrics middleware not loaded in lean mode
- [ ] **PayloadGuard Disabled**: Payload validation middleware not loaded in lean mode  
- [ ] **RateLimit Disabled**: Rate limiting middleware not loaded in lean mode
- [ ] **SecurityHeaders Disabled**: Security headers middleware not loaded in lean mode
- [ ] **Core Functionality**: Essential API functionality still works in lean mode

**Validation Commands:**
```bash
export APP_DEV_LEAN_MODE=true
# Restart server and check /dev/mode
curl http://localhost:8000/dev/mode
```

## 🧪 Automated Testing Validation

### Stabilization Tests
- [ ] **pytest @stabilization passes**: All tests marked with `@pytest.mark.stabilization` pass
- [ ] **Test Coverage**: Stabilization tests cover all key features
- [ ] **Test Performance**: Tests complete within reasonable time (< 60 seconds)
- [ ] **Test Isolation**: Tests don't interfere with each other
- [ ] **Test Cleanup**: Tests properly clean up after themselves

### Validation Scripts
- [ ] **verify_stabilization.sh passes**: Bash validation script completes successfully
- [ ] **verify_stabilization.ps1 passes**: PowerShell validation script completes successfully  
- [ ] **check_ws_url.cjs passes**: WebSocket URL validation script completes successfully
- [ ] **All validation exit codes**: Scripts return 0 for success, 1 for failure

**Validation Commands:**
```bash
# Run stabilization tests
python -m pytest tests/stabilization/ -v -m stabilization

# Run validation scripts
./scripts/verify_stabilization.sh
# OR on Windows:
.\scripts\verify_stabilization.ps1
```

## 🔧 UnifiedDataService Validation

### Service Methods
- [ ] **cacheData() Method**: `cacheData(key, data)` method exists and works
- [ ] **getCachedData() Method**: `getCachedData(key, default)` method exists and works
- [ ] **Backward Compatibility**: All existing UnifiedDataService methods still work
- [ ] **Error Prevention**: No runtime errors from missing methods
- [ ] **Cache Functionality**: Caching methods properly store and retrieve data

### Integration Testing
- [ ] **Frontend Integration**: Frontend code that calls UnifiedDataService works
- [ ] **API Integration**: Backend APIs that use UnifiedDataService work
- [ ] **Cache Performance**: Cache operations complete within reasonable time
- [ ] **Memory Management**: Cache doesn't cause memory leaks

**Validation Commands:**
```bash
# Test cache methods work (check logs for errors)
curl http://localhost:8000/api/v2/sports/list
# Should not show errors about missing cacheData/getCachedData methods
```

## 🎯 Integration Testing

### Full Stack Validation
- [ ] **Frontend Connects**: Frontend successfully connects to backend
- [ ] **API Calls Work**: All major API endpoints return expected responses
- [ ] **WebSocket Connects**: WebSocket connections establish successfully
- [ ] **Error Handling**: Errors are handled gracefully across stack
- [ ] **Performance**: End-to-end performance meets requirements

### User Experience
- [ ] **Page Load Speed**: Pages load quickly and smoothly
- [ ] **Navigation**: All navigation works without errors
- [ ] **Data Display**: Sports data displays correctly
- [ ] **Interactive Features**: All interactive features function properly
- [ ] **Mobile Compatibility**: Features work on mobile devices

## 📋 Pre-Production Checklist

### Deployment Readiness
- [ ] **All Core Tests Pass**: No failing tests in critical areas
- [ ] **Performance Benchmarks**: All performance targets met
- [ ] **Security Validation**: Security features working correctly
- [ ] **Error Monitoring**: Error monitoring and alerting configured
- [ ] **Rollback Plan**: Rollback procedures tested and documented

### Documentation
- [ ] **CHANGELOG Updated**: Stabilization changes documented in CHANGELOG.md
- [ ] **Architecture Notes**: Architecture documentation updated
- [ ] **Rollback Instructions**: Complete rollback procedures documented
- [ ] **Team Notification**: Team informed of changes and new features

## 📊 Success Criteria Summary

### Critical (Must Pass)
- ✅ All health endpoints return 200
- ✅ OPTIONS returns 204/200 with CORS headers  
- ✅ No ws://localhost:8173 connection attempts
- ✅ No negative performance metrics
- ✅ LCP < 1200ms (warm) and logged appropriately
- ✅ No reliability spam in logs
- ✅ `verify_stabilization.sh` passes completely
- ✅ All `@pytest.mark.stabilization` tests pass

### Important (Should Pass)
- ⚠️ Lean mode functions correctly
- ⚠️ UnifiedDataService methods work properly
- ⚠️ WebSocket URL derivation works correctly
- ⚠️ Full stack integration successful

### Optional (Nice to Have)
- 💡 Performance improvements measurable
- 💡 Log quality improvements visible
- 💡 Developer experience improvements confirmed

---

## 📝 Checklist Completion

**Date Completed**: ___________  
**Completed By**: ___________  
**Environment Tested**: ___________  
**Notes/Issues**: ___________

**Overall Status**: 
- [ ] ✅ **PASSED** - All critical criteria met, ready for production
- [ ] ⚠️ **PASSED WITH WARNINGS** - Core features work, minor issues noted  
- [ ] ❌ **FAILED** - Critical issues prevent deployment

**Next Steps**: ___________
