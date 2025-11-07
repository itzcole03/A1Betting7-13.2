# Import Consolidation Migration Guide

## Completed So Far
✅ Updated 8 files to use canonical base/ imports:
- AutoPilot.tsx
- InjuryTracker.tsx
- BankrollManager.tsx
- NewsHub.tsx
- QuantumAI.tsx
- SocialIntelligence.tsx
- SHAPAnalysis.tsx
- WeatherStation.tsx

## Remaining Changes

### Pattern 1: shared/ui/input imports
Files identified:
- frontend/src/__tests__/ui_components_types.test.tsx

Action: Replace `from '../components/shared/ui/input'` with `from '../components/base/Input'`

### Pattern 2: shared/ui/label imports
Files identified:
- frontend/src/__tests__/ui_components_types.test.tsx

Action: Replace `from '../components/shared/ui/label'` with `from '../components/base/Label'`

### Pattern 3: All other shared/ui imports (lowercase naming)
Need to consolidate:
- alert.tsx → Alert.tsx (in base/)
- badge.tsx → Badge.tsx (in base/)
- button.tsx → Button.tsx (in base/)
- card.tsx → Card.tsx (in base/)
- input.tsx → Input.tsx (in base/)
- label.tsx → Label.tsx (in base/)
- progress.tsx → Progress.tsx (in base/)
- select.tsx → Select.tsx (in base/)
- slider.tsx → Slider.tsx (in base/)
- switch.tsx → Switch.tsx (in base/)
- tabs.tsx → Tabs.tsx (in base/)
- Tooltip.tsx → Keep in base/
- Skeleton.tsx → Keep in base/

## Sed Commands to Execute

```bash
# Alert consolidation
find frontend/src -type f \( -name "*.tsx" -o -name "*.ts" \) | xargs sed -i 's|from ['"'"'"].*shared/ui/alert['"'"'"]|from '"'"'../base/Alert'"'"'|g'

# Badge consolidation  
find frontend/src -type f \( -name "*.tsx" -o -name "*.ts" \) | xargs sed -i 's|from ['"'"'"].*shared/ui/badge['"'"'"]|from '"'"'../base/Badge'"'"'|g'

# Button consolidation
find frontend/src -type f \( -name "*.tsx" -o -name "*.ts" \) | xargs sed -i 's|from ['"'"'"].*shared/ui/button['"'"'"]|from '"'"'../base/Button'"'"'|g'

# Card consolidation
find frontend/src -type f \( -name "*.tsx" -o -name "*.ts" \) | xargs sed -i 's|from ['"'"'"].*shared/ui/card['"'"'"]|from '"'"'../base/Card'"'"'|g'

# Input consolidation
find frontend/src -type f \( -name "*.tsx" -o -name "*.ts" \) | xargs sed -i 's|from ['"'"'"].*shared/ui/input['"'"'"]|from '"'"'../base/Input'"'"'|g'

# Label consolidation
find frontend/src -type f \( -name "*.tsx" -o -name "*.ts" \) | xargs sed -i 's|from ['"'"'"].*shared/ui/label['"'"'"]|from '"'"'../base/Label'"'"'|g'

# Progress consolidation
find frontend/src -type f \( -name "*.tsx" -o -name "*.ts" \) | xargs sed -i 's|from ['"'"'"].*shared/ui/progress['"'"'"]|from '"'"'../base/Progress'"'"'|g'

# Select consolidation
find frontend/src -type f \( -name "*.tsx" -o -name "*.ts" \) | xargs sed -i 's|from ['"'"'"].*shared/ui/select['"'"'"]|from '"'"'../base/Select'"'"'|g'

# Slider consolidation
find frontend/src -type f \( -name "*.tsx" -o -name "*.ts" \) | xargs sed -i 's|from ['"'"'"].*shared/ui/slider['"'"'"]|from '"'"'../base/Slider'"'"'|g'

# Switch consolidation
find frontend/src -type f \( -name "*.tsx" -o -name "*.ts" \) | xargs sed -i 's|from ['"'"'"].*shared/ui/switch['"'"'"]|from '"'"'../base/Switch'"'"'|g'

# Tabs consolidation
find frontend/src -type f \( -name "*.tsx" -o -name "*.ts" \) | xargs sed -i 's|from ['"'"'"].*shared/ui/tabs['"'"'"]|from '"'"'../base/Tabs'"'"'|g'

# Tooltip consolidation
find frontend/src -type f \( -name "*.tsx" -o -name "*.ts" \) | xargs sed -i 's|from ['"'"'"].*shared/ui/Tooltip['"'"'"]|from '"'"'../base/Tooltip'"'"'|g'
```

## Next Steps

1. **Review** the import changes to ensure they're correct
2. **Type check**: Run `npm run type-check` to verify all imports resolve
3. **Delete** the duplicate files in `frontend/src/components/shared/ui/`
4. **Delete** redundant directories
5. **Test**: Run `npm test` to verify functionality
6. **Build**: Run `npm run build` to ensure production build works

## Files to Delete After Import Updates

After all imports are consolidated, delete:
- `frontend/src/components/shared/ui/alert.tsx`
- `frontend/src/components/shared/ui/badge.tsx`
- `frontend/src/components/shared/ui/button.tsx`
- `frontend/src/components/shared/ui/card.tsx`
- `frontend/src/components/shared/ui/input.tsx`
- `frontend/src/components/shared/ui/label.tsx`
- `frontend/src/components/shared/ui/progress.tsx`
- `frontend/src/components/shared/ui/select.tsx`
- `frontend/src/components/shared/ui/slider.tsx`
- `frontend/src/components/shared/ui/switch.tsx`
- `frontend/src/components/shared/ui/tabs.tsx`

And delete the empty directories:
- `frontend/src/components/shared/ui/`
- `frontend/src/components/shared/`
