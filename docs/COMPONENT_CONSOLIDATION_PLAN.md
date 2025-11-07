# Component Consolidation Plan

## Executive Summary
The frontend has **30+ duplicate base UI components** spread across multiple directories:
- `frontend/src/components/base/` (PascalCase: Alert.tsx, Badge.tsx, Button.tsx, etc.)
- `frontend/src/components/shared/ui/` (lowercase: alert.tsx, badge.tsx, button.tsx, etc.)
- `frontend/src/components/shared/common/` (various locations)
- `frontend/src/components/` (root level: scattered duplicates)

**Action**: Consolidate to single canonical locations and update all imports.

## Identified Duplicates

### Base UI Components (Consolidate to `frontend/src/components/base/`)
These exist in BOTH `base/` and `shared/ui/` with different casing:
- **Alert**: `base/Alert.tsx` + `shared/ui/alert.tsx`
- **Badge**: `base/Badge.tsx` + `shared/ui/badge.tsx`
- **Button**: `base/Button.tsx` + `shared/ui/button.tsx`
- **Card**: `base/Card.tsx` + `shared/ui/card.tsx`
- **Input**: `base/Input.tsx` + `shared/ui/input.tsx`
- **Label**: `base/Label.tsx` + `shared/ui/label.tsx`
- **Progress**: `base/Progress.tsx` + `shared/ui/progress.tsx`
- **Select**: `base/Select.tsx` + `shared/ui/select.tsx`
- **Skeleton**: `base/Skeleton.tsx` + `shared/ui/Skeleton.tsx`
- **SkeletonLoader**: `base/SkeletonLoader.tsx` + `shared/common/loading/SkeletonLoader.tsx`
- **Slider**: Likely in `shared/ui/slider.tsx` and `base/Slider.tsx`
- **Switch**: `base/Switch.tsx` + `shared/ui/switch.tsx`
- **Tabs**: `base/Tabs.tsx` + `shared/ui/tabs.tsx`
- **Toast**: `base/Toast.tsx` + `shared/ui/feedback/Toast.tsx` + `shared/common/ToastProvider.tsx`
- **Toaster**: `base/Toaster.tsx` + `shared/common/notifications/Toaster.tsx`
- **Tooltip**: `base/Tooltip.tsx` + `shared/ui/Tooltip.tsx`

### Other Duplicates
- **LoadingOverlay**: `base/` and `shared/ui/`
- **Grid**: Might exist in multiple locations
- **ErrorBoundary**: Various versions

## Consolidation Strategy

### Phase 1: Base UI Components
Keep: `frontend/src/components/base/` versions (PascalCase, cleaner)
Delete: All versions in `shared/ui/`, `shared/common/`, root

Update imports pattern:
```
Old: import { Alert } from '../shared/ui/alert'
New: import { Alert } from '../base/Alert'
```

### Phase 2: Export Barrel Files
Create `frontend/src/components/base/index.ts` that exports all base components for easy imports

### Phase 3: Context and Providers
Move to dedicated locations:
- **Contexts**: `frontend/src/contexts/`
  - AuthContext.tsx
  - ToastContext.tsx
  - Others
- **Providers**: `frontend/src/providers/`
  - AuthProvider.tsx
  - ThemeProvider.tsx
  - ToastProvider.tsx
  - Others

### Phase 4: Feature Components
Ensure these are organized:
- `frontend/src/components/features/betting/`
- `frontend/src/components/features/analytics/`
- `frontend/src/components/features/predictions/`
- etc.

### Phase 5: Clean Up
Delete empty and redundant directories:
- `frontend/src/components/shared/ui/` (merge into `base/`)
- `frontend/src/components/shared/common/` (reorganize)
- `frontend/src/components/core/` (if empty)
- `frontend/src/components/modern/` (if exists)

## Implementation Steps

1. **Create missing directories**:
   ```bash
   mkdir -p frontend/src/contexts
   mkdir -p frontend/src/providers
   ```

2. **Consolidate base UI components**:
   - Compare versions and keep the better one
   - Update all imports across the codebase
   - Delete duplicates

3. **Create barrel exports** in `frontend/src/components/base/index.ts`:
   ```typescript
   export { Alert } from './Alert';
   export { Badge } from './Badge';
   // ... etc
   ```

4. **Consolidate contexts** to `frontend/src/contexts/`

5. **Consolidate providers** to `frontend/src/providers/`

6. **Update import paths** in all files

7. **Run tests** and build to verify

## Testing Strategy
- `npm run type-check` - Verify all imports are correct
- `npm run build` - Ensure no broken imports
- `npm test` - Verify functionality
- Component count: Should reduce from 810+ to ~500-600

## Success Criteria
✅ No duplicate component names across directories
✅ All imports updated to canonical locations
✅ Tests pass
✅ Build succeeds
✅ Component count reduced by 30%+
