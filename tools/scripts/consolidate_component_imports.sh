#!/bin/bash
# Consolidate all duplicate component imports to canonical locations
# This script updates imports to use the canonical component locations

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Component Import Consolidation ===${NC}\n"

# Define consolidation mappings: old_import_pattern => new_import_location
declare -A CONSOLIDATIONS=(
    ["from.*shared/ui/alert"]="from '../base/Alert'"
    ["from.*shared/ui/badge"]="from '../base/Badge'"
    ["from.*shared/ui/button"]="from '../base/Button'"
    ["from.*shared/ui/card"]="from '../base/Card'"
    ["from.*shared/ui/input"]="from '../base/Input'"
    ["from.*shared/ui/label"]="from '../base/Label'"
    ["from.*shared/ui/progress"]="from '../base/Progress'"
    ["from.*shared/ui/select"]="from '../base/Select'"
    ["from.*shared/ui/slider"]="from '../base/Slider'"
    ["from.*shared/ui/switch"]="from '../base/Switch'"
    ["from.*shared/ui/tabs"]="from '../base/Tabs'"
    ["from.*shared/ui/Tooltip"]="from '../base/Tooltip'"
)

# Find all component files to update
COMPONENT_FILES=$(find frontend/src -name "*.tsx" -o -name "*.ts" | grep -v node_modules | grep -v test | grep -v spec)

echo -e "${YELLOW}Updating imports...${NC}"

for old_pattern in "${!CONSOLIDATIONS[@]}"; do
    new_import="${CONSOLIDATIONS[$old_pattern]}"
    count=0
    
    for file in $COMPONENT_FILES; do
        if grep -q "$old_pattern" "$file" 2>/dev/null; then
            echo -e "${YELLOW}Processing: $file${NC}"
            sed -i.bak "s/$old_pattern/$new_import/g" "$file"
            ((count++))
        fi
    done
    
    if [ $count -gt 0 ]; then
        echo -e "${GREEN}✓ Updated $count files for pattern: $old_pattern${NC}"
    fi
done

echo -e "\n${YELLOW}Cleaning up backup files...${NC}"
find frontend/src -name "*.bak" -delete

echo -e "\n${GREEN}=== Import Consolidation Complete ===${NC}"
echo -e "Next steps:"
echo -e "  1. Run: npm run type-check"
echo -e "  2. Review changes in git"
echo -e "  3. Delete duplicate component files in shared/ui/"
echo -e "  4. Run tests: npm test"
