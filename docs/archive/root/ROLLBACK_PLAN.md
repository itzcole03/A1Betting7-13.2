# Schema & Cache Rollback Plan

## Overview
This document provides a comprehensive rollback plan for the schema finalization and cache population changes implemented in the A1Betting7-13.2 system.

## Summary of Changes Made

### ✅ Completed Changes
1. **Schema Finalization**
   - Created `provider_states` table (28 rows populated)
   - Created `portfolio_rationales` table (25 cache entries)
   - Uncommented SQLAlchemy models in `backend/models/streaming.py`
   - Added model imports to `backend/models/all_models.py`

2. **Provider States Backfill**
   - Populated 28 provider entries across 4 sports (NBA, MLB, NFL, NHL)
   - 7 providers per sport: stub, draftkings, fanduel, prizepicks, betmgm, theodds, sportsradar
   - Configuration: 3 enabled providers per sport (stub, draftkings, fanduel)

3. **Cache Warming**
   - 15 correlation cache entries (5 per sport for NBA/MLB/NFL)
   - 4 factor model cache entries (1 per sport)
   - 6 player performance cache entries (top players across sports)
   - All entries stored in `portfolio_rationales` table with appropriate TTL

## Rollback Procedures

### 🔴 Emergency Rollback (< 5 minutes)

If immediate rollback is required due to critical issues:

```bash
# 1. Stop all services
cd "c:\Users\bcmad\Downloads\A1Betting7-13.2"
# Stop backend FastAPI server (Ctrl+C or close terminal)
cd frontend
npm run stop  # or close development server

# 2. Quick database rollback
sqlite3 a1betting.db "DROP TABLE IF EXISTS provider_states;"
sqlite3 a1betting.db "DROP TABLE IF EXISTS portfolio_rationales;"
sqlite3 a1betting.db "DELETE FROM alembic_version WHERE version_num='b1573a5e9618';"
```

### 🟡 Standard Rollback (10-15 minutes)

For controlled rollback with proper verification:

#### Step 1: Backup Current State
```bash
# Create backup before rollback
cp a1betting.db a1betting_backup_$(date +%Y%m%d_%H%M%S).db
```

#### Step 2: Remove Database Tables
```bash
# Connect to database and remove new tables
sqlite3 a1betting.db << 'EOF'
-- Remove provider_states table and data
DROP TABLE IF EXISTS provider_states;

-- Remove portfolio_rationales table and cache data
DROP TABLE IF EXISTS portfolio_rationales;

-- Reset Alembic version (optional - only if migration conflicts)
-- DELETE FROM alembic_version WHERE version_num='b1573a5e9618';

-- Verify tables are removed
.tables
EOF
```

#### Step 3: Revert Code Changes
```bash
# Revert SQLAlchemy model changes
cd backend/models

# Comment out model imports in all_models.py
sed -i 's/^from \.streaming import ProviderState, PortfolioRationale/#&/' all_models.py

# Comment out models in streaming.py  
python << 'EOF'
import re

with open('streaming.py', 'r') as f:
    content = f.read()

# Comment out SQLAlchemy imports
content = re.sub(r'^(from sqlalchemy)', r'# \1', content, flags=re.MULTILINE)
content = re.sub(r'^(from \.)', r'# \1', content, flags=re.MULTILINE)

# Comment out model classes
content = re.sub(r'^(class Provider.*?(?=\n\n|\n#|\nclass|\Z))', r'# \1', content, flags=re.MULTILINE | re.DOTALL)
content = re.sub(r'^(class Portfolio.*?(?=\n\n|\n#|\nclass|\Z))', r'# \1', content, flags=re.MULTILINE | re.DOTALL)

with open('streaming.py', 'w') as f:
    f.write(content)
EOF
```

#### Step 4: Remove Rollback Scripts
```bash
# Remove scripts created for this migration
rm -f backend/backfill_provider_states.py
rm -f backend/create_schema_tables.py
rm -f backend/simple_cache_warmer.py
rm -f backend/cache_warming_service.py
rm -f backend/verify_*.py
rm -f backend/check_*.py
```

#### Step 5: Verify Rollback
```bash
# Restart backend and verify
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload &

# Test API health
curl http://127.0.0.1:8000/health

# Verify no provider_states references
curl http://127.0.0.1:8000/api/debug/status
```

### 🟢 Gradual Rollback (30+ minutes)

For staged rollback with comprehensive testing:

#### Phase 1: Disable Features (Dark Mode)
```bash
# Modify configuration to disable new features
cd backend/services
python << 'EOF'
import json

# Update unified_config.py to disable cache warming
with open('unified_config.py', 'r') as f:
    config = f.read()

# Disable cache warming
config = config.replace('cache_warming_enabled: bool = True', 
                       'cache_warming_enabled: bool = False')

with open('unified_config.py', 'w') as f:
    f.write(config)
EOF
```

#### Phase 2: Shadow Mode (Data Collection Only)
```bash
# Keep tables but mark as deprecated
sqlite3 a1betting.db << 'EOF'
-- Add deprecation markers to provider_states
UPDATE provider_states SET is_enabled = 0 WHERE provider_name != 'stub';

-- Add deprecation context to cache entries
UPDATE portfolio_rationales 
SET context_data = json_insert(context_data, '$.deprecated', 'true')
WHERE rationale_type LIKE 'CACHE_%';
EOF
```

#### Phase 3: Complete Removal
Follow Standard Rollback procedure above.

## Risk Assessment

### 🔴 High Risk Operations
- Database table drops (provider_states, portfolio_rationales)
- Model class commenting in streaming.py
- Alembic version manipulation

### 🟡 Medium Risk Operations  
- Configuration changes (unified_config.py)
- Script file removal
- Service restarts

### 🟢 Low Risk Operations
- Cache entry expiration (natural TTL)
- Provider state disabling
- Backup creation

## Validation Procedures

### Pre-Rollback Validation
```bash
# 1. Verify current state
python backend/verify_provider_states.py
python backend/verify_cache_entries.py

# 2. Test API functionality
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/api/debug/status

# 3. Check database integrity
sqlite3 a1betting.db "PRAGMA integrity_check;"
```

### Post-Rollback Validation
```bash
# 1. Verify tables are removed
sqlite3 a1betting.db ".tables" | grep -E "(provider_states|portfolio_rationales)"

# 2. Verify API still functions
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/mlb/todays-games

# 3. Check for import errors
python -c "from backend.models.all_models import *; print('✅ Imports successful')"

# 4. Verify no cache warnings
tail -f backend/logs/propollama.log | grep -i cache | head -10
```

## Recovery Procedures

### If Rollback Fails

#### Database Recovery
```bash
# 1. Restore from backup
cp a1betting_backup_YYYYMMDD_HHMMSS.db a1betting.db

# 2. Or recreate database from scratch
rm a1betting.db
python backend/init_database.py  # if available
```

#### Code Recovery
```bash
# 1. Reset to git state (if under version control)
git checkout -- backend/models/streaming.py
git checkout -- backend/models/all_models.py
git checkout -- backend/services/unified_config.py

# 2. Or restore from original
# (Restore from backup or manual recreation)
```

## Testing Strategy

### Automated Testing
```bash
# Run after rollback to verify functionality
cd backend
python -m pytest tests/

# Frontend testing
cd ../frontend
npm test

# Integration testing
curl http://127.0.0.1:8000/api/diagnostics/health
```

### Manual Testing Checklist
- [ ] Backend starts without errors
- [ ] Frontend connects to backend
- [ ] API endpoints respond correctly
- [ ] No SQLAlchemy model import errors
- [ ] Database queries execute successfully
- [ ] Logs show no cache-related errors

## Contact Information

**Primary Contact:** System Administrator  
**Secondary Contact:** Database Administrator  
**Emergency Contact:** Development Team Lead

## Rollback Decision Matrix

| Severity | Impact | Timeline | Procedure |
|----------|--------|----------|-----------|
| Critical | System Down | < 5 min | Emergency Rollback |
| High | Features Broken | 10-15 min | Standard Rollback |
| Medium | Performance Issues | 30+ min | Gradual Rollback |
| Low | Minor Issues | Next Release | Patch Forward |

## Appendix A: File Locations

### Created Files (Safe to Remove)
- `backend/backfill_provider_states.py`
- `backend/create_schema_tables.py` 
- `backend/simple_cache_warmer.py`
- `backend/cache_warming_service.py`
- `backend/verify_provider_states.py`
- `backend/verify_cache_entries.py`
- `backend/check_schema.py`
- `backend/check_db_schema.py`
- `backend/check_correlation_data.py`

### Modified Files (Requires Careful Rollback)
- `backend/models/streaming.py` - Uncommented SQLAlchemy models
- `backend/models/all_models.py` - Added model imports

### Database Changes
- Table: `provider_states` (28 rows)
- Table: `portfolio_rationales` (25 cache entries)
- Alembic: May have version entry `b1573a5e9618`

## Appendix B: SQL Commands Reference

### Quick Database Inspection
```sql
-- Check provider_states
SELECT COUNT(*) FROM provider_states;
SELECT sport, COUNT(*) FROM provider_states GROUP BY sport;

-- Check cache entries  
SELECT rationale_type, COUNT(*) FROM portfolio_rationales WHERE rationale_type LIKE 'CACHE_%' GROUP BY rationale_type;

-- Check table existence
SELECT name FROM sqlite_master WHERE type='table' AND name IN ('provider_states', 'portfolio_rationales');
```

### Emergency Cleanup
```sql
-- Remove all new data
DROP TABLE IF EXISTS provider_states;
DROP TABLE IF EXISTS portfolio_rationales;
DELETE FROM alembic_version WHERE version_num='b1573a5e9618';
```

---

**Document Version:** 1.0  
**Created:** 2025-08-17  
**Last Updated:** 2025-08-17  
**Next Review:** Before next major release