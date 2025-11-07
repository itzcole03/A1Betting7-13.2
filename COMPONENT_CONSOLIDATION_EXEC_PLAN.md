# Component Consolidation Execution Plan

## Overview
This document provides the complete step-by-step commands and instructions to consolidate 170+ redundant components across the frontend codebase.

## Status Summary
- ✅ Phase 1: Duplication analysis complete
- ✅ Phase 2: Consolidation strategy mapped
- 🔄 Phase 3: Base UI component consolidation (8 files manually updated, bulk consolidation ready)
- ⏳ Phase 4-7: Pending

## What Has Been Done
1. **Created analysis documentation**:
   - `docs/COMPONENT_CONSOLIDATION_PLAN.md` - Full consolidation strategy
   - `docs/IMPORT_CONSOLIDATION_GUIDE.md` - Detailed import migration guide
   - `tools/scripts/consolidate_component_imports.sh` - Bash script for automated updates

2. **Manually Updated** (8 files):
   - AutoPilot.tsx
   - InjuryTracker.tsx
   - BankrollManager.tsx
   - NewsHub.tsx
   - QuantumAI.tsx
   - SocialIntelligence.tsx
   - SHAPAnalysis.tsx
   - WeatherStation.tsx

## Next Steps to Complete

### STEP 1: Run TypeScript Type Check (to identify broken imports)
```bash
cd frontend
npm run type-check 2>&1 | tee type-check-errors.log
```
This will identify any remaining files with broken imports.

### STEP 2: Consolidate Base UI Component Imports
Run one import consolidation for each component type:

```bash
# Badge imports
find frontend/src -type f \( -name "*.tsx" -o -name "*.ts" \) ! -path "*/node_modules/*" ! -path "*/shared/ui/*" -exec sed -i 's|from ['"'"'"'"'"'"].*shared/ui/badge['"'"'"'"'"'"]|from '"'"'"'"'"'../base/Badge'"'"'"'"'"'|g' {} +

# Button imports
find frontend/src -type f \( -name "*.tsx" -o -name "*.ts" \) ! -path "*/node_modules/*" ! -path "*/shared/ui/*" -exec sed -i 's|from ['"'"'"'"'"'"].*shared/ui/button['"'"'"'"'"'"]|from '"'"'"'"'"'../base/Button'"'"'"'"'"'|g' {} +

# Card imports
find frontend/src -type f \( -name "*.tsx" -o -name "*.ts" \) ! -path "*/node_modules/*" ! -path "*/shared/ui/*" -exec sed -i 's|from ['"'"'"'"'"'"].*shared/ui/card['"'"'"'"'"'"]|from '"'"'"'"'"'../base/Card'"'"'"'"'"'|g' {} +

# Input imports
find frontend/src -type f \( -name "*.tsx" -o -name "*.ts" \) ! -path "*/node_modules/*" ! -path "*/shared/ui/*" -exec sed -i 's|from ['"'"'"'"'"'"].*shared/ui/input['"'"'"'"'"'"]|from '"'"'"'"'"'../base/Input'"'"'"'"'"'|g' {} +

# Progress imports
find frontend/src -type f \( -name "*.tsx" -o -name "*.ts" \) ! -path "*/node_modules/*" ! -path "*/shared/ui/*" -exec sed -i 's|from ['"'"'"'"'"'"].*shared/ui/progress['"'"'"'"'"'"]|from '"'"'"'"'"'../base/Progress'"'"'"'"'"'|g' {} +

# Select imports
find frontend/src -type f \( -name "*.tsx" -o -name "*.ts" \) ! -path "*/node_modules/*" ! -path "*/shared/ui/*" -exec sed -i 's|from ['"'"'"'"'"'"].*shared/ui/select['"'"'"'"'"'"]|from '"'"'"'"'"'../base/Select'"'"'"'"'"'|g' {} +

# Switch imports
find frontend/src -type f \( -name "*.tsx" -o -name "*.ts" \) ! -path "*/node_modules/*" ! -path "*/shared/ui/*" -exec sed -i 's|from ['"'"'"'"'"'"].*shared/ui/switch['"'"'"'"'"'"]|from '"'"'"'"'"'../base/Switch'"'"'"'"'"'|g' {} +

# Tabs imports
find frontend/src -type f \( -name "*.tsx" -o -name "*.ts" \) ! -path "*/node_modules/*" ! -path "*/shared/ui/*" -exec sed -i 's|from ['"'"'"'"'"'"].*shared/ui/tabs['"'"'"'"'"'"]|from '"'"'"'"'"'../base/Tabs'"'"'"'"'"'|g' {} +

# Alert imports
find frontend/src -type f \( -name "*.tsx" -o -name "*.ts" \) ! -path "*/node_modules/*" ! -path "*/shared/ui/*" -exec sed -i 's|from ['"'"'"'"'"'"].*shared/ui/alert['"'"'"'"'"'"]|from '"'"'"'"'"'../base/Alert'"'"'"'"'"'|g' {} +
```

**Alternative for Windows PowerShell**:
```powershell
# Run this from project root
Get-ChildItem -Path "frontend\src" -Recurse -Include "*.tsx","*.ts" -Exclude "*shared*","*node_modules*" | ForEach-Object {
    (Get-Content $_.FullName) -replace 'from [''"].*shared/ui/badge[''"]', "from '../base/Badge'" | Set-Content $_.FullName
}
```

### STEP 3: Delete Duplicate Component Files
After imports are updated, delete the duplicates in shared/ui/:

```bash
# Remove duplicate component files from shared/ui/
rm -f frontend/src/components/shared/ui/alert.tsx
rm -f frontend/src/components/shared/ui/badge.tsx
rm -f frontend/src/components/shared/ui/button.tsx
rm -f frontend/src/components/shared/ui/card.tsx
rm -f frontend/src/components/shared/ui/input.tsx
rm -f frontend/src/components/shared/ui/label.tsx
rm -f frontend/src/components/shared/ui/progress.tsx
rm -f frontend/src/components/shared/ui/select.tsx
rm -f frontend/src/components/shared/ui/slider.tsx
rm -f frontend/src/components/shared/ui/switch.tsx
rm -f frontend/src/components/shared/ui/tabs.tsx
rm -f frontend/src/components/shared/ui/Tooltip.tsx
rm -f frontend/src/components/shared/ui/Skeleton.tsx

# Remove type definition files too
rm -f frontend/src/components/shared/ui/*.d.ts
```

### STEP 4: Remove Lowercase Type Definition Files
```bash
# Remove lowercase .d.ts files that correspond to deleted components
rm -f frontend/src/components/shared/ui/alert.d.ts
rm -f frontend/src/components/shared/ui/badge.d.ts
rm -f frontend/src/components/shared/ui/button.d.ts
rm -f frontend/src/components/shared/ui/card.d.ts
rm -f frontend/src/components/shared/ui/input.d.ts
rm -f frontend/src/components/shared/ui/label.d.ts
rm -f frontend/src/components/shared/ui/progress.d.ts
rm -f frontend/src/components/shared/ui/select.d.ts
rm -f frontend/src/components/shared/ui/slider.d.ts
rm -f frontend/src/components/shared/ui/switch.d.ts
rm -f frontend/src/components/shared/ui/tabs.d.ts
```

### STEP 5: Type Check & Fix Remaining Issues
```bash
cd frontend
npm run type-check
# Fix any remaining broken imports found
```

### STEP 6: Run Tests
```bash
cd frontend
npm test -- --passWithNoTests
```

### STEP 7: Build Verification
```bash
cd frontend
npm run build
```

### STEP 8: Clean Up Index Files
Update `frontend/src/components/shared/ui/index.ts` to remove deleted exports:

```bash
# Show current exports to verify
head -30 frontend/src/components/shared/ui/index.ts
```

Then manually remove or comment out exports for deleted components.

## Recommended Execution Order

1. ✅ Create documentation (DONE)
2. ✅ Manually update critical files (DONE - 8 files)
3. ⏳ Run type-check to identify remaining issues
4. ⏳ Execute import consolidation sed commands
5. ⏳ Delete duplicate files
6. ⏳ Verify types and tests
7. ⏳ Clean up empty directories

## Risk Mitigation

Before running bulk changes:
1. **Commit current work**: `git add . && git commit -m "Phase 3: Manual base UI consolidation (8 files)"`
2. **Create backup branch**: `git checkout -b consolidation-backup`
3. **Run changes on main branch**: `git checkout <original-branch>`
4. **Execute consolidation**
5. **Test thoroughly**
6. **Delete backup branch if successful**

## Troubleshooting

### Issue: Type errors after consolidation
**Solution**: Run `npm run type-check` and manually fix remaining imports

### Issue: Tests fail after consolidation
**Solution**: Check import paths in test files, ensure they use base/ paths

### Issue: Component not found errors
**Solution**: Verify the component exists in base/ directory with correct casing

## Post-Consolidation Cleanup

After all base UI components are consolidated:

1. **Delete empty shared/ui/ directory**:
   ```bash
   rm -rf frontend/src/components/shared/ui/
   ```

2. **Delete empty shared/ directory if no other content**:
   ```bash
   rm -rf frontend/src/components/shared/
   ```

3. **Update any remaining index.ts files** that reference deleted components

4. **Create clean barrel exports** in `frontend/src/components/base/index.ts`

5. **Final commit**:
   ```bash
   git add -A
   git commit -m "Phase 3: Complete base UI component consolidation - 30+ duplicates merged into base/"
   ```

## Expected Outcomes

After completion:
- ✅ All base UI components in single location: `frontend/src/components/base/`
- ✅ All imports use canonical paths
- ✅ No duplicate component files
- ✅ Tests pass
- ✅ Build succeeds
- ✅ Type checking clean
- ✅ Component count reduced ~200-300 files

## Questions or Issues?

If you encounter issues during consolidation:
1. Check the import paths are correct (relative vs absolute)
2. Verify component names are PascalCase in base/
3. Check that shared/ui/ component is actually deleted
4. Run `npm run type-check` to identify the exact error location
