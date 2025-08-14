# Security Headers Middleware Documentation

## Overview

The Security Headers Middleware provides comprehensive HTTP security protection for the A1Betting API by applying modern browser security headers to all responses. The middleware implements security best practices with configurable enforcement modes suitable for development and production environments.

**Key Features:**
- Content Security Policy (CSP) with report-only/enforce modes
- HTTP Strict Transport Security (HSTS)
- Cross-origin isolation (COOP/COEP/CORP)
- Anti-clickjacking and content-sniffing protection
- Configurable permissions policies
- Prometheus metrics integration
- CSP violation reporting endpoint

## Header Matrix

| Header | Default Value | Purpose | Configurable |
|--------|---------------|---------|-------------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Force HTTPS connections | ✅ `ENABLE_HSTS` |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME confusion attacks | ❌ Always applied |
| `X-Frame-Options` | `DENY` | Prevent clickjacking | ✅ `X_FRAME_OPTIONS` |
| `Referrer-Policy` | `no-referrer` | Control referrer information | ❌ Always applied |
| `Cross-Origin-Opener-Policy` | `same-origin` | Isolate browsing context | ✅ `ENABLE_COOP` |
| `Cross-Origin-Resource-Policy` | `same-origin` | Control cross-origin resource access | ❌ Always applied |
| `Cross-Origin-Embedder-Policy` | `require-corp` | Enable cross-origin isolation | ✅ `ENABLE_COEP` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Block dangerous APIs | ✅ `PERMISSIONS_POLICY_APPEND` |
| `Content-Security-Policy[-Report-Only]` | Comprehensive CSP directives | Prevent XSS and injection attacks | ✅ Multiple CSP settings |

## Configuration Table

| Environment Variable | Default | Type | Description |
|---------------------|---------|------|-------------|
| `SECURITY_HEADERS_ENABLED` | `true` | boolean | Master toggle for all security headers |
| `SECURITY_STRICT_MODE` | `false` | boolean | Force production-grade security settings |
| `ENABLE_HSTS` | `true` | boolean | Enable HTTP Strict Transport Security |
| `CSP_ENABLED` | `true` | boolean | Enable Content Security Policy |
| `CSP_REPORT_ONLY` | `true` | boolean | Use CSP report-only mode (safe rollout) |
| `CSP_EXTRA_CONNECT_SRC` | `""` | string | Additional domains for connect-src (comma-separated) |
| `CSP_ENABLE_UPGRADE_INSECURE` | `true` | boolean | Enable upgrade-insecure-requests directive |
| `CSP_REPORT_ENDPOINT_ENABLED` | `true` | boolean | Enable CSP violation reporting |
| `X_FRAME_OPTIONS` | `"DENY"` | string | X-Frame-Options value (`DENY` or `SAMEORIGIN`) |
| `ENABLE_COOP` | `true` | boolean | Enable Cross-Origin-Opener-Policy |
| `ENABLE_COEP` | `true` | boolean | Enable Cross-Origin-Embedder-Policy |
| `PERMISSIONS_POLICY_APPEND` | `""` | string | Additional permissions policy directives |

## CSP Modes

### Report-Only Mode (Default)
```http
Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self'; ...
```

**Use for:**
- Initial CSP deployment
- Testing policy changes
- Development environments
- Gradual rollout

**Benefits:**
- No functionality breaking
- Violation data collection
- Safe policy validation

### Enforce Mode
```http
Content-Security-Policy: default-src 'self'; script-src 'self'; ...
```

**Use for:**
- Production deployment
- Maximum security protection
- After report-only validation

**Benefits:**
- Active attack prevention
- Strict security enforcement
- Production-grade protection

### Security Strict Mode
When `SECURITY_STRICT_MODE=true`:
- Forces `CSP_REPORT_ONLY=false` (enforcement mode)
- Recommended for production environments
- Overrides individual CSP report settings

## CSP Directives Reference

| Directive | Default Value | Purpose |
|-----------|---------------|---------|
| `default-src` | `'self'` | Fallback for all resource types |
| `script-src` | `'self'` | JavaScript execution sources |
| `style-src` | `'self' 'unsafe-inline'` | CSS sources (allows inline for frameworks) |
| `img-src` | `'self' data:` | Image sources (allows data URLs) |
| `font-src` | `'self'` | Font sources |
| `object-src` | `'none'` | Plugin content (blocked for security) |
| `frame-ancestors` | `'none'` | Embedding permissions (blocks all frames) |
| `base-uri` | `'self'` | Base tag restrictions |
| `form-action` | `'self'` | Form submission targets |
| `connect-src` | `'self' + extra sources` | XHR/fetch/WebSocket targets |
| `upgrade-insecure-requests` | (directive flag) | Force HTTPS for all resources |
| `report-uri` | `/csp/report` | Violation reporting endpoint |

## CSP Violation Report Payload Example

```json
{
  "csp-report": {
    "document-uri": "https://example.com/page",
    "referrer": "https://example.com/",
    "violated-directive": "script-src 'self'",
    "effective-directive": "script-src",
    "original-policy": "default-src 'self'; script-src 'self'; report-uri /csp/report",
    "disposition": "report",
    "blocked-uri": "https://malicious.com/script.js",
    "line-number": 42,
    "column-number": 15,
    "source-file": "https://example.com/page",
    "sample": "alert('xss')"
  }
}
```

## Operational Guidance

### Deployment Steps

1. **Initial Deployment (Report-Only)**
   ```bash
   export SECURITY_HEADERS_ENABLED=true
   export CSP_ENABLED=true
   export CSP_REPORT_ONLY=true
   export CSP_REPORT_ENDPOINT_ENABLED=true
   ```

2. **Monitor Violations**
   ```bash
   # Check CSP report stats
   curl http://your-api/csp/report/stats
   
   # Monitor Prometheus metrics
   curl http://your-api/metrics | grep csp_violation_reports_total
   ```

3. **Validate Policy**
   - Review violation reports for 7-14 days
   - Identify legitimate vs malicious violations
   - Adjust `CSP_EXTRA_CONNECT_SRC` if needed

4. **Enable Enforcement**
   ```bash
   export CSP_REPORT_ONLY=false
   # OR enable strict mode for production
   export SECURITY_STRICT_MODE=true
   ```

### Common Configuration Scenarios

**Development Environment:**
```bash
export SECURITY_HEADERS_ENABLED=true
export ENABLE_HSTS=false  # No HTTPS requirement in dev
export CSP_ENABLED=true
export CSP_REPORT_ONLY=true
export CSP_EXTRA_CONNECT_SRC="http://localhost:3000,ws://localhost:3000"
```

**Production Environment:**
```bash
export SECURITY_HEADERS_ENABLED=true
export SECURITY_STRICT_MODE=true  # Forces CSP enforcement
export ENABLE_HSTS=true
export CSP_ENABLED=true
export CSP_EXTRA_CONNECT_SRC="https://api.company.com,wss://ws.company.com"
export X_FRAME_OPTIONS=DENY
```

### Troubleshooting CSP Issues

**Script Violations:**
```
CSP Violation: script-src 'self' blocked inline script
Solution: Use nonces, hashes, or move scripts to external files
```

**Style Violations:**
```
CSP Violation: style-src blocked inline style
Solution: Already allows 'unsafe-inline', check for data: URLs
```

**Connect Violations:**
```
CSP Violation: connect-src blocked XHR to api.external.com
Solution: Add to CSP_EXTRA_CONNECT_SRC="https://api.external.com"
```

### Monitoring and Metrics

**Prometheus Metrics:**
- `security_headers_applied_total{header_type}` - Headers applied by type
- `csp_violation_reports_total{directive,violated_directive}` - CSP violations

**Health Endpoints:**
- `GET /csp/report/health` - CSP reporting system status
- `GET /csp/report/stats` - CSP configuration and metrics

## Future Hardening Checklist

### Phase 2 Enhancements
- [ ] Implement CSP nonce generation for inline scripts
- [ ] Add CSP hash-based script allowlisting
- [ ] Implement Content-Security-Policy-Report-URI v3
- [ ] Add Certificate Transparency monitoring
- [ ] Implement Expect-CT header

### Advanced Security Headers
- [ ] Feature-Policy (deprecated, use Permissions-Policy)
- [ ] Cross-Origin-Opener-Policy: same-origin-allow-popups
- [ ] Referrer-Policy: strict-origin-when-cross-origin
- [ ] X-Permitted-Cross-Domain-Policies: none

### CSP v3 Features
- [ ] `'strict-dynamic'` for script-src
- [ ] `'trusted-types'` directive
- [ ] Navigation directives (navigate-to)
- [ ] Worker directives (worker-src, child-src)

## Compatibility / Migration

### Legacy Endpoint Support
The system maintains backwards compatibility:
- **Canonical endpoint:** `POST /csp/report`
- **Alias endpoint:** `POST /api/security/csp-report`

Both endpoints accept identical payloads and provide identical functionality. The alias will be maintained during migration periods.

### Framework Compatibility
The CSP policy is designed for compatibility with common frameworks:
- **React/Vue:** `'unsafe-inline'` allowed for style-src
- **jQuery/Bootstrap:** Data URLs allowed for img-src
- **WebSocket APIs:** Configurable via `CSP_EXTRA_CONNECT_SRC`

---

## Quick Reference

**Enable security headers:**
```bash
export SECURITY_HEADERS_ENABLED=true
```

**Test CSP report:**
```bash
curl -X POST http://localhost:8000/csp/report \
  -H "Content-Type: application/csp-report+json" \
  -d '{"csp-report": {...}}'
```

**Check current policy:**
```bash
curl -I http://localhost:8000/api/health | grep -i content-security-policy
```

**Monitor violations:**
```bash
curl http://localhost:8000/metrics | grep csp_violation_reports_total
```

For additional support and configuration details, refer to the [A1Betting Security Documentation](../security/).
