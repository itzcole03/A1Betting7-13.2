# Deprecated Backend Entry Points

**IMPORTANT: As of August 13, 2025, the following entry points are DEPRECATED.**

## Canonical Entry Point (USE THIS)

**✅ CANONICAL:** `backend.core.app.create_app()` or `backend.core.app.app`
- Single source of truth for the A1Betting application
- All new features should be added here
- Centralized exception handling
- Standardized response envelopes with `ok()` and `fail()` helpers
- Used by pytest for consistent testing

```python
# Correct way to import the app
from backend.core.app import app

# Or create a new instance
from backend.core.app import create_app
app = create_app()
```

## Deprecated Entry Points (DO NOT USE)

### ❌ backend.main:app
- **Status:** Deprecated (provides compatibility redirect only)
- **Migration:** Use `backend.core.app` instead
- **Removal:** Planned for next major version

### ❌ Production Integration Modules
The following modules are deprecated and should not be used:
- `backend.optimized_production_integration`
- `backend.enhanced_production_integration` 
- `backend.production_integration`
- **Migration:** All functionality consolidated into `backend.core.app`

### ❌ Requirements Files
The following requirements files are deprecated:
- `backend/requirements.txt` → Use root `requirements.txt`
- `backend/requirements-dev.txt` → Use root `requirements-dev.txt` 
- `backend/requirements_unified*.txt` → **REMOVED**
- `backend/enhanced_requirements.txt` → **REMOVED**
- `requirements-test.txt` → Use `requirements-dev.txt`
- `requirements-prod.txt` → Use `requirements.txt`

## CI/CD Configuration

To prevent fragmentation, exclude deprecated entry points from CI:

```yaml
# In your CI configuration, use only:
uvicorn: backend.core.app:app
pytest: backend/tests/ (automatically uses canonical app via conftest.py)
requirements: requirements.txt, requirements-dev.txt
```

## Testing

All tests now use the canonical app factory via `backend/tests/conftest.py`:

```python
@pytest.fixture(scope="session")
def test_app():
    from backend.core.app import create_app
    return create_app()
```

This eliminates 404s and fixture drift by ensuring tests run against the same app as production.

## Migration Checklist

- [ ] Update all imports to use `backend.core.app`
- [ ] Update CI/CD configurations  
- [ ] Update deployment scripts to use canonical entry point
- [ ] Remove references to deprecated modules
- [ ] Use root-level requirements files only
- [ ] Test that all functionality works with canonical entry point

---

*This deprecation is part of establishing a safe, testable baseline for the A1Betting application.*
