# Step 6 Security Headers - Deferrals and TODOs

| File:Line | Description | Target Phase | Priority |
|-----------|-------------|--------------|----------|
| backend/middleware/security_headers.py:45 | Consider adding CSP nonce generation for inline scripts | Step 8 | Medium |
| backend/routes/csp_report.py:150 | Add CSP violation rate limiting to prevent DoS attacks | Step 8 | High |
| tests/security/headers/test_security_headers_basic.py:200+ | Refactor test file if exceeds 250 lines | Maintenance | Low |
| backend/config/settings.py:150 | Add CSP template system for environment-specific policies | Future | Low |
| backend/middleware/security_headers.py:200 | Implement CSP violation analysis ML integration | Phase 2 | Medium |
| backend/routes/csp_report.py:75 | Add CSP report aggregation and trending analysis | Phase 2 | Medium |

## Current TODO Count: 6 (within architect requirement of max 6)

## Priority Distribution:
- High: 1 (Rate limiting for CSP reports)
- Medium: 3 (Nonce generation, ML integration, report analysis)  
- Low: 2 (Test refactoring, CSP templates)

## Target Phase Distribution:
- Step 8: 2 items
- Phase 2: 2 items  
- Future: 1 item
- Maintenance: 1 item
