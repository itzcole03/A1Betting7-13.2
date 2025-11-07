#!/bin/bash
echo "Starting automated component consolidation..."

set -e

bash ./automated_plan_phase1_delete.sh
git add -A
git commit -m 'Phase 1: Automated deletion of duplicate components'

bash ./automated_plan_phase2_update_imports.sh
git add -A
git commit -m 'Phase 2: Automated update of component imports'

bash ./automated_plan_phase3_create_registry.sh
git add -A
git commit -m 'Phase 3: Create central component registry'

echo "Automated consolidation complete!"
