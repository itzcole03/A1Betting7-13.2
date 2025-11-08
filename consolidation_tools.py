#!/usr/bin/env python3.11
"""
Automated tools for A1Betting codebase consolidation
"""

import os
import shutil
import re
from pathlib import Path
from typing import List, Dict, Tuple
import json

class CodebaseConsolidator:
    def __init__(self, repo_path: str):
        self.repo_path = Path(repo_path)
        self.backend_path = self.repo_path / "backend"
        self.frontend_path = self.repo_path / "frontend"
        self.migration_log = []
        
    def analyze_imports(self, file_path: Path) -> List[str]:
        """Extract all import statements from a Python file"""
        imports = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line.startswith('import ') or line.startswith('from '):
                        imports.append(line)
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
        return imports
    
    def find_references(self, module_name: str, search_path: Path) -> List[Tuple[Path, int]]:
        """Find all references to a module in Python files"""
        references = []
        for root, dirs, files in os.walk(search_path):
            for file in files:
                if file.endswith('.py'):
                    file_path = Path(root) / file
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            for line_num, line in enumerate(f, 1):
                                if module_name in line and ('import' in line or 'from' in line):
                                    references.append((file_path, line_num))
                    except Exception:
                        pass
        return references
    
    def create_domain_structure(self, domain_name: str):
        """Create standard domain directory structure"""
        domain_path = self.backend_path / "domains" / domain_name
        domain_path.mkdir(parents=True, exist_ok=True)
        
        # Create standard files
        files_to_create = [
            "__init__.py",
            "router.py",
            "schemas.py",
            "models.py",
            "service.py",
            "dependencies.py",
            "exceptions.py"
        ]
        
        for file_name in files_to_create:
            file_path = domain_path / file_name
            if not file_path.exists():
                file_path.touch()
                
        return domain_path
    
    def categorize_root_files(self) -> Dict[str, List[str]]:
        """Categorize root-level backend files"""
        categories = {
            "auth": [],
            "betting": [],
            "propfinder": [],
            "analytics": [],
            "arbitrage": [],
            "predictions": [],
            "ml": [],
            "cache": [],
            "database": [],
            "scripts": [],
            "temporary": [],
            "config": [],
            "unknown": []
        }
        
        root_files = [f for f in os.listdir(self.backend_path) if f.endswith('.py')]
        
        for file in root_files:
            file_lower = file.lower()
            
            if any(x in file_lower for x in ['auth', 'security', 'login']):
                categories["auth"].append(file)
            elif any(x in file_lower for x in ['bet', 'kelly', 'stake']):
                categories["betting"].append(file)
            elif any(x in file_lower for x in ['prop', 'prizepicks']):
                categories["propfinder"].append(file)
            elif any(x in file_lower for x in ['analytic', 'stats']):
                categories["analytics"].append(file)
            elif 'arbitrage' in file_lower:
                categories["arbitrage"].append(file)
            elif any(x in file_lower for x in ['predict', 'forecast', 'ml_', 'model']):
                categories["predictions"].append(file)
            elif any(x in file_lower for x in ['cache', 'redis']):
                categories["cache"].append(file)
            elif 'database' in file_lower or 'db' in file_lower:
                categories["database"].append(file)
            elif any(x in file_lower for x in ['check_', 'debug_', 'analyze_', 'convert_', 'migrate_', 'tmp_', 'temp_']):
                categories["scripts"].append(file)
            elif 'config' in file_lower:
                categories["config"].append(file)
            else:
                categories["unknown"].append(file)
        
        return categories
    
    def generate_migration_plan(self) -> Dict:
        """Generate detailed migration plan"""
        categories = self.categorize_root_files()
        
        plan = {
            "summary": {
                "total_files": sum(len(files) for files in categories.values()),
                "by_category": {k: len(v) for k, v in categories.items()}
            },
            "migrations": []
        }
        
        # Domain migrations
        for domain in ["auth", "betting", "propfinder", "analytics", "arbitrage", "predictions"]:
            for file in categories[domain]:
                plan["migrations"].append({
                    "source": f"backend/{file}",
                    "target": f"backend/domains/{domain}/{file}",
                    "category": domain,
                    "priority": "high"
                })
        
        # Service migrations
        for service in ["ml", "cache", "database"]:
            for file in categories[service]:
                plan["migrations"].append({
                    "source": f"backend/{file}",
                    "target": f"backend/services/{service}/{file}",
                    "category": service,
                    "priority": "medium"
                })
        
        # Script migrations
        for file in categories["scripts"]:
            if file.startswith('check_') or file.startswith('analyze_'):
                target_dir = "scripts/analysis"
            elif file.startswith('convert_') or file.startswith('migrate_'):
                target_dir = "scripts/migration"
            else:
                target_dir = "scripts/maintenance"
            
            plan["migrations"].append({
                "source": f"backend/{file}",
                "target": f"backend/{target_dir}/{file}",
                "category": "scripts",
                "priority": "low"
            })
        
        # Config migrations
        for file in categories["config"]:
            if file != "settings.py":  # Keep only settings.py
                plan["migrations"].append({
                    "source": f"backend/{file}",
                    "target": f"backend/config/deprecated/{file}",
                    "category": "config",
                    "priority": "high",
                    "note": "Consolidate into settings.py"
                })
        
        return plan
    
    def identify_duplicates(self) -> List[Dict]:
        """Identify enhanced/advanced/simple variants"""
        duplicates = []
        
        # Find all Python files
        all_files = []
        for root, dirs, files in os.walk(self.backend_path):
            for file in files:
                if file.endswith('.py'):
                    all_files.append(Path(root) / file)
        
        # Group by base name
        base_names = {}
        for file_path in all_files:
            file_name = file_path.name
            
            # Extract base name
            base = file_name
            prefix = None
            
            if file_name.startswith('enhanced_'):
                base = file_name.replace('enhanced_', '')
                prefix = 'enhanced'
            elif file_name.startswith('advanced_'):
                base = file_name.replace('advanced_', '')
                prefix = 'advanced'
            elif file_name.startswith('simple_'):
                base = file_name.replace('simple_', '')
                prefix = 'simple'
            
            if prefix:
                if base not in base_names:
                    base_names[base] = []
                base_names[base].append({
                    "path": str(file_path.relative_to(self.repo_path)),
                    "prefix": prefix,
                    "size": file_path.stat().st_size
                })
        
        # Find groups with multiple variants
        for base, variants in base_names.items():
            if len(variants) > 1:
                duplicates.append({
                    "base_name": base,
                    "variants": variants,
                    "count": len(variants)
                })
        
        return sorted(duplicates, key=lambda x: x["count"], reverse=True)
    
    def save_report(self, output_path: str):
        """Save comprehensive consolidation report"""
        report = {
            "categorization": self.categorize_root_files(),
            "migration_plan": self.generate_migration_plan(),
            "duplicates": self.identify_duplicates()
        }
        
        with open(output_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        return report

if __name__ == "__main__":
    consolidator = CodebaseConsolidator("/home/ubuntu/A1Betting7-13.2")
    
    print("Generating consolidation report...")
    report = consolidator.save_report("/home/ubuntu/consolidation_report.json")
    
    print("\n=== FILE CATEGORIZATION ===")
    for category, files in report["categorization"].items():
        if files:
            print(f"{category}: {len(files)} files")
    
    print(f"\n=== MIGRATION PLAN ===")
    print(f"Total migrations: {report['migration_plan']['summary']['total_files']}")
    for category, count in report['migration_plan']['summary']['by_category'].items():
        if count > 0:
            print(f"  {category}: {count}")
    
    print(f"\n=== DUPLICATES ===")
    print(f"Found {len(report['duplicates'])} duplicate groups")
    for dup in report['duplicates'][:10]:
        print(f"\n{dup['base_name']} ({dup['count']} variants):")
        for variant in dup['variants']:
            print(f"  - {variant['prefix']}: {variant['path']}")
    
    print(f"\nFull report saved to: /home/ubuntu/consolidation_report.json")
