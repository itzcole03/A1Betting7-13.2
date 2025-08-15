# Legacy Endpoint Deprecation Plan

## Overview

This document outlines the systematic deprecation plan for legacy API endpoints in the A1Betting platform. All non-`/api/v2/*` endpoints are considered legacy and subject to the deprecation timeline outlined below.

**Objective**: Provide a controlled, transparent migration path from legacy endpoints to modern `/api/v2/*` equivalents while maintaining system reliability and giving operators confidence through quantified usage metrics.

## Scope

### Legacy Endpoints

All endpoints **NOT** matching `/api/v2/*` are considered legacy, including:

**Core API Endpoints:**
- `/api/health` → `/api/v2/diagnostics/health`
- `/health` → `/api/v2/diagnostics/health`  
- `/api/metrics/summary` → `/api/v2/meta/cache-stats`
- `/api/props` → `/api/v2/ml/predictions`
- `/api/predictions` → `/api/v2/ml/predictions`
- `/api/analytics` → `/api/v2/ml/analytics`

**Enhanced ML Endpoints:**
- `/api/enhanced-ml/*` → `/api/v2/ml/*`

**Monitoring & Debug Endpoints:**
- `/metrics` → `/api/v2/meta/cache-stats`
- `/performance/stats` → `/api/v2/diagnostics/system`
- `/dev/mode` → `/api/v2/diagnostics/system`

**Production Integration Endpoints:**
- `/api/betting-opportunities` → `/api/v2/ml/predictions`
- `/api/arbitrage-opportunities` → `/api/v2/ml/predictions`
- `/api/prizepicks/*` → `/api/v2/prizepicks/*`
- `/api/propollama/*` → *[evaluate for deprecation or modernization]*
- Various `/debug/*`, `/v1/*`, `/cache/*` endpoints

### Excluded from Deprecation

- **Current Standard**: `/api/v2/*` endpoints (modern API)
- **WebSocket Endpoints**: `/ws/*` endpoints (different protocol)
- **CSP Reporting**: `/csp/report` (security infrastructure)
- **Internal Paths**: Paths starting with `/_` (internal/system)

## Implementation Architecture

### Telemetry System

**Legacy Registry Service** (`backend/services/legacy_registry.py`)
- In-memory usage tracking with optional Prometheus integration
- Per-endpoint counters, timestamps, and forwarding mappings
- Migration readiness scoring algorithm

**Legacy Middleware** (`backend/middleware/legacy_middleware.py`)  
- Intercepts all requests before routing
- Enforces feature flags (A1_LEGACY_ENABLED)
- Returns 410 Gone when disabled
- Annotates requests for downstream logging

**Meta API Endpoints** (`/api/v2/meta/legacy-*`)
- `/api/v2/meta/legacy-usage`: Comprehensive usage statistics
- `/api/v2/meta/migration-readiness`: Migration readiness assessment
- `/api/v2/meta/legacy-config`: Current configuration status

### Frontend Integration

**Legacy Usage Hook** (`frontend/src/legacy/useLegacyUsage.ts`)
- Polls backend telemetry with configurable intervals
- Provides loading states and error handling
- TypeScript interfaces for all data structures

**Diagnostics Panel** (`frontend/src/diagnostics/LegacyUsagePanel.tsx`)
- Color-coded usage warnings and migration readiness
- Expandable endpoint details with forwarding information
- Real-time refresh capabilities

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `A1_LEGACY_ENABLED` | `true` (dev), `false` (prod) | Enable/disable legacy endpoints |
| `A1_LEGACY_SUNSET` | `null` | ISO8601 sunset date for planning |

### Feature Flag Behavior

**When `A1_LEGACY_ENABLED=true` (Default in Development):**
- Legacy endpoints function normally
- Usage counters increment on each access
- Response headers include deprecation warnings:
  - `X-Legacy-Endpoint: true`
  - `X-Forward-To: /api/v2/...`
  - `X-Deprecated-Warning: Use ... instead`

**When `A1_LEGACY_ENABLED=false` (Recommended for Production):**
- Legacy endpoints return **HTTP 410 Gone**
- JSON response includes migration guidance
- No usage counters increment (blocked before execution)

### 410 Gone Response Format

```json
{
  "error": "deprecated",
  "message": "Legacy endpoint /api/health has been deprecated and disabled",
  "forward": "/api/v2/diagnostics/health",
  "sunset": "2025-12-31T23:59:59Z",
  "docs": "/docs/migration/legacy_deprecation_plan.md",
  "timestamp": "2025-08-15T12:00:00.000Z"
}
```

## Migration Phases

### Phase 1: Telemetry & Awareness (Current - PR7)

**Duration**: 4-8 weeks  
**Status**: ✅ **IMPLEMENTED**

**Objectives:**
- Deploy usage telemetry across all legacy endpoints
- Establish baseline usage metrics
- Provide migration guidance documentation
- Enable feature flag infrastructure

**Deliverables:**
- ✅ Legacy registry service with usage tracking
- ✅ Middleware for endpoint interception and flagging
- ✅ Meta API endpoints for telemetry exposure
- ✅ Frontend diagnostics integration
- ✅ Comprehensive test coverage
- ✅ Migration documentation

**Success Criteria:**
- [ ] All legacy endpoints identified and tracked
- [ ] Usage data visible in diagnostics dashboards
- [ ] Feature flag toggles working correctly
- [ ] Zero regression in existing functionality

### Phase 2: Deprecation Notices (Target: Q4 2025)

**Duration**: 6-12 weeks

**Objectives:**
- Send formal deprecation notices to API consumers
- Begin phased sunset warnings in responses
- Monitor usage patterns for migration readiness
- Provide migration tooling and support

**Planned Deliverables:**
- Deprecation headers in all legacy endpoint responses
- Email notifications to registered API consumers
- Migration readiness dashboard for operators
- Automated migration tooling where feasible
- Client library updates with modern endpoint support

**Success Criteria:**
- Legacy endpoint usage declining week-over-week
- Migration readiness score >0.8 for critical endpoints
- Support ticket volume manageable
- No critical system dependencies on legacy endpoints

### Phase 3: Enforcement & Transition (Target: Q1 2026)

**Duration**: 4-8 weeks

**Objectives:**
- Enable 410 Gone responses for low-usage endpoints
- Monitor system stability during transition
- Provide rapid rollback capability
- Support remaining high-usage endpoint migrations

**Planned Deliverables:**
- Gradual 410 enforcement based on usage thresholds
- Real-time monitoring and alerting
- Emergency rollback procedures
- Enhanced error messages with migration guidance

**Success Criteria:**
- <5% of total API traffic on legacy endpoints
- No critical system outages during enforcement
- All high-priority integrations successfully migrated
- Rollback procedures tested and verified

### Phase 4: Complete Removal (Target: Q2 2026)

**Duration**: 2-4 weeks

**Objectives:**
- Remove legacy endpoint handlers from codebase
- Clean up middleware and telemetry infrastructure
- Archive usage data for historical analysis
- Validate system performance improvements

**Planned Deliverables:**
- Legacy endpoint code removal
- Middleware simplification
- Performance metrics comparison
- Post-migration validation testing

**Success Criteria:**
- 0% legacy endpoint traffic
- Codebase simplified and maintainability improved
- System performance metrics stable or improved
- Documentation updated for modern API only

## Migration Readiness Assessment

### Scoring Algorithm

Migration readiness score calculated as:
```
score = 1.0 - min(1.0, (total_calls_last_24h / threshold_per_hour))
```

**Readiness Levels:**
- **Score ≥ 0.8**: ✅ **Ready** - Safe to proceed with deprecation
- **Score ≥ 0.5**: ⚠️ **Caution** - Monitor closely, gradual approach
- **Score < 0.5**: 🚫 **Not Ready** - Focus on client migration first

### Thresholds & Recommendations

| Readiness Level | Calls/Hour Threshold | Recommended Action |
|-----------------|---------------------|-------------------|
| **Ready** | < 10 | Proceed with deprecation notices |
| **Caution** | 10-50 | 2-4 week monitoring period |
| **Not Ready** | > 50 | Client migration required first |

### Monitoring Metrics

**Usage Patterns:**
- Total calls per endpoint per time period
- Unique client IPs/user agents accessing legacy endpoints
- Peak usage hours and patterns
- Geographic distribution of legacy usage

**Migration Progress:**
- Week-over-week usage trend analysis
- Endpoint migration completion percentage
- Client library adoption rates
- Support ticket volume related to migration

## Rollback Procedures

### Emergency Rollback

If critical issues arise during enforcement:

1. **Immediate**: Set `A1_LEGACY_ENABLED=true` via environment variables
2. **Restart Services**: Rolling restart to pick up configuration changes
3. **Verify**: Confirm legacy endpoints responding with 200 OK
4. **Monitor**: Check system stability and usage patterns
5. **Investigate**: Root cause analysis of enforcement issues

### Gradual Rollback

For planned rollbacks during transition:

1. **Selective Re-enable**: Target specific high-impact endpoints
2. **Usage Monitoring**: Track rollback impact on system stability
3. **Client Communication**: Notify affected integrations
4. **Timeline Adjustment**: Revise deprecation schedule as needed

### Rollback Verification

- [ ] All previously-working integrations functional
- [ ] No 410 responses for critical endpoints
- [ ] Usage telemetry still operational
- [ ] Forward compatibility maintained

## Client Migration Guide

### Discovery

1. **Check Current Usage**:
   ```bash
   curl http://your-api-host/api/v2/meta/legacy-usage
   ```

2. **Review Response Headers**: Look for deprecation warnings in API responses
   ```
   X-Legacy-Endpoint: true
   X-Forward-To: /api/v2/diagnostics/health
   X-Deprecated-Warning: Use /api/v2/diagnostics/health instead
   ```

### Migration Steps

1. **Audit Integration Code**: Search for legacy endpoint references
2. **Review Modern Equivalents**: Check forwarding mappings in usage data
3. **Update Endpoint URLs**: Replace with `/api/v2/*` equivalents
4. **Test Thoroughly**: Validate functionality with new endpoints
5. **Deploy Incrementally**: Gradual rollout with monitoring
6. **Monitor**: Confirm reduced legacy usage in telemetry

### Testing Migration

```bash
# Test legacy endpoint (will include deprecation headers)
curl -v http://localhost:8000/api/health

# Test modern equivalent
curl -v http://localhost:8000/api/v2/diagnostics/health

# Compare response formats and functionality
```

## Support & Resources

### Documentation
- **API Reference**: `/docs` (OpenAPI/Swagger)
- **Health Endpoint Migration**: `docs/migration/health_endpoint_migration.md`
- **Modern API Guide**: *[To be created in Phase 2]*

### Monitoring Tools
- **Legacy Usage Dashboard**: `/api/v2/meta/legacy-usage`
- **Migration Readiness**: `/api/v2/meta/migration-readiness`
- **Diagnostics Panel**: Available in frontend admin interface

### Support Channels
1. **GitHub Issues**: For bug reports and feature requests
2. **Migration Assistance**: *[Contact information TBD]*
3. **Emergency Support**: *[Emergency procedures TBD]*

### Migration Timeline Summary

| Phase | Target Date | Duration | Key Milestone |
|-------|-------------|----------|---------------|
| **Phase 1** | ✅ **Q3 2025** | 4-8 weeks | Telemetry & tooling deployed |
| **Phase 2** | Q4 2025 | 6-12 weeks | Deprecation notices active |
| **Phase 3** | Q1 2026 | 4-8 weeks | 410 enforcement begins |
| **Phase 4** | Q2 2026 | 2-4 weeks | Legacy endpoints removed |

---

**Document Version**: 1.0  
**Last Updated**: 2025-08-15  
**Next Review**: 2025-10-15