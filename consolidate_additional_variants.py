#!/usr/bin/env python3
"""Consolidate additional high-priority variants."""

import shutil
from pathlib import Path
import json

backend = Path("/home/ubuntu/A1Betting7-13.2/backend")
actions = []

print("=" * 80)
print("Consolidating Additional Variants")
print("=" * 80)

# 1. Ensemble Engine (2 variants)
print("\n[1/5] Consolidating ensemble_engine...")
if (backend / "enhanced_ensemble_engine.py").exists():
    target = backend / "deprecated/enhanced_ensemble_engine.py"
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(backend / "enhanced_ensemble_engine.py"), str(target))
    actions.append({'module': 'ensemble_engine', 'deprecated': 'enhanced_ensemble_engine.py'})
    print("  ✓ Deprecated enhanced_ensemble_engine.py")

# 2. Production Integration (2 variants)
print("\n[2/5] Consolidating production_integration...")
if (backend / "enhanced_production_integration.py").exists():
    target = backend / "deprecated/enhanced_production_integration.py"
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(backend / "enhanced_production_integration.py"), str(target))
    actions.append({'module': 'production_integration', 'deprecated': 'enhanced_production_integration.py'})
    print("  ✓ Deprecated enhanced_production_integration.py")

# 3. Revolutionary API (2 variants)
print("\n[3/5] Consolidating revolutionary_api...")
if (backend / "enhanced_revolutionary_api.py").exists():
    target = backend / "deprecated/enhanced_revolutionary_api.py"
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(backend / "enhanced_revolutionary_api.py"), str(target))
    actions.append({'module': 'revolutionary_api', 'deprecated': 'enhanced_revolutionary_api.py'})
    print("  ✓ Deprecated enhanced_revolutionary_api.py")

# 4. Risk Management (2 variants)
print("\n[4/5] Consolidating risk_management...")
if (backend / "enhanced_risk_management.py").exists():
    target = backend / "deprecated/enhanced_risk_management.py"
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(backend / "enhanced_risk_management.py"), str(target))
    actions.append({'module': 'risk_management', 'deprecated': 'enhanced_risk_management.py'})
    print("  ✓ Deprecated enhanced_risk_management.py")

# 5. Simple main (2 variants)
print("\n[5/5] Consolidating main...")
if (backend / "simple_main.py").exists():
    target = backend / "deprecated/simple_main.py"
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(backend / "simple_main.py"), str(target))
    actions.append({'module': 'main', 'deprecated': 'simple_main.py'})
    print("  ✓ Deprecated simple_main.py")

print("\n" + "=" * 80)
print(f"✓ Consolidated {len(actions)} additional variants")
print("=" * 80)

# Save actions
with open("/home/ubuntu/A1Betting7-13.2/PHASE3_ADDITIONAL_CONSOLIDATION.json", 'w') as f:
    json.dump({'actions': actions, 'total': len(actions)}, f, indent=2)
