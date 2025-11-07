#!/bin/bash
echo "Starting automated component consolidation..."

set -e

bash ./automated_plan_phase1_delete.sh
git add -A
git commit -m 'Phase 1: Automated deletion of duplicate components' || echo "(no changes to commit for phase 1)"

bash ./automated_plan_phase2_update_imports.sh
git add -A
git commit -m 'Phase 2: Automated update of component imports' || echo "(no changes to commit for phase 2)"

bash ./automated_plan_phase3_create_registry.sh
git add -A
git commit -m 'Phase 3: Create central component registry' || echo "(no changes to commit for phase 3)"

echo "Automated consolidation complete!"
