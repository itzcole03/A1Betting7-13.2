#!/bin/bash
# Delete duplicate base UI components from shared/ui/ after imports have been consolidated
# This script removes files that have been migrated to base/

set -e

echo "========================================="
echo "Deleting Duplicate Base UI Components"
echo "========================================="
echo ""

# Arrays of files to delete
COMPONENTS_TO_DELETE=(
  "alert.tsx"
  "alert.d.ts"
  "badge.tsx"
  "badge.d.ts"
  "button.tsx"
  "button.d.ts"
  "card.tsx"
  "card.d.ts"
  "input.tsx"
  "input.d.ts"
  "label.tsx"
  "label.d.ts"
  "progress.tsx"
  "progress.d.ts"
  "select.tsx"
  "select.d.ts"
  "slider.tsx"
  "slider.d.ts"
  "switch.tsx"
  "switch.d.ts"
  "tabs.tsx"
  "tabs.d.ts"
  "tabs-simple.tsx"
  "tabs-simple.d.ts"
  "Skeleton.tsx"
  "Skeleton.d.ts"
  "Tooltip.tsx"
  "Tooltip.d.ts"
)

UI_DIR="frontend/src/components/shared/ui"
DELETED_COUNT=0

echo "Deleting from: $UI_DIR"
echo ""

for file in "${COMPONENTS_TO_DELETE[@]}"; do
  filepath="$UI_DIR/$file"
  if [ -f "$filepath" ]; then
    echo "✓ Deleting: $file"
    rm -f "$filepath"
    ((DELETED_COUNT++))
  else
    echo "  (Skipped: $file - not found)"
  fi
done

echo ""
echo "========================================="
echo "Deleted $DELETED_COUNT duplicate files"
echo "========================================="
echo ""
echo "Next steps:"
echo "  1. Run: cd frontend && npm run type-check"
echo "  2. Run: npm test"
echo "  3. Run: npm run build"
echo ""
echo "If all pass, consolidation is complete!"
