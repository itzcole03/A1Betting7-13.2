#!/usr/bin/env python3
"""Update imports after Phase 3 consolidation."""

from pathlib import Path
import json

backend = Path("/home/ubuntu/A1Betting7-13.2/backend")
updates = []

# Import mappings for Phase 3
mappings = {
    # Feature engineering
    "from backend.services.enhanced_feature_engineering import": "from backend.services.ml.feature_engineering import",
    "from backend.services.ml.enhanced_feature_engineering import": "from backend.services.ml.feature_engineering import",
    "from backend.services.ml.advanced_feature_engineering import": "from backend.services.ml.feature_engineering import",
    "import backend.services.enhanced_feature_engineering": "import backend.services.ml.feature_engineering",
    "import backend.services.ml.enhanced_feature_engineering": "import backend.services.ml.feature_engineering",
    "import backend.services.ml.advanced_feature_engineering": "import backend.services.ml.feature_engineering",
    
    # ML Service
    "from backend.services.enhanced_ml_service import": "from backend.services.ml.ml_service import",
    "from backend.services.advanced_ml_service import": "from backend.services.ml.ml_service import",
    "import backend.services.enhanced_ml_service": "import backend.services.ml.ml_service",
    "import backend.services.advanced_ml_service": "import backend.services.ml.ml_service",
    
    # Data Pipeline
    "from backend.enhanced_data_pipeline import": "from backend.services.data_pipeline import",
    "from backend.services.enhanced_data_pipeline import": "from backend.services.data_pipeline import",
    "import backend.enhanced_data_pipeline": "import backend.services.data_pipeline",
    "import backend.services.enhanced_data_pipeline": "import backend.services.data_pipeline",
    
    # Database
    "from backend.enhanced_database import": "from backend.services.database.database import",
    "import backend.enhanced_database": "import backend.services.database.database",
    
    # OpenAPI
    "from backend.config.enhanced_openapi import": "from backend.config.openapi import",
    "from backend.docs.enhanced_openapi import": "from backend.config.openapi import",
    "import backend.config.enhanced_openapi": "import backend.config.openapi",
    "import backend.docs.enhanced_openapi": "import backend.config.openapi",
}

print("Updating imports for Phase 3 consolidation...")
total_updates = 0

for py_file in backend.rglob("*.py"):
    if "deprecated" in str(py_file) or "__pycache__" in str(py_file):
        continue
    
    try:
        content = py_file.read_text(encoding='utf-8')
        original = content
        
        for old, new in mappings.items():
            if old in content:
                content = content.replace(old, new)
                total_updates += content.count(new) - original.count(new)
        
        if content != original:
            py_file.write_text(content, encoding='utf-8')
            updates.append(str(py_file.relative_to(Path("/home/ubuntu/A1Betting7-13.2"))))
    except Exception as e:
        print(f"Warning: {py_file}: {e}")

print(f"✓ Updated {total_updates} import statements in {len(updates)} files")

# Save report
with open("/home/ubuntu/A1Betting7-13.2/PHASE3_IMPORT_UPDATES.json", 'w') as f:
    json.dump({'total_updates': total_updates, 'files_updated': updates}, f, indent=2)
