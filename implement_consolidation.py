#!/usr/bin/env python3
"""
Automated consolidation implementation for A1Betting7-13.2
Implements Phase 2 of the consolidation plan: Backend root-level cleanup
"""

import os
import shutil
import re
from pathlib import Path
from typing import List, Dict, Set
import json

class ConsolidationImplementer:
    def __init__(self, repo_path: str, dry_run: bool = False):
        self.repo_path = Path(repo_path)
        self.backend_path = self.repo_path / "backend"
        self.dry_run = dry_run
        self.migration_log = []
        self.import_updates = []
        
    def create_domain_directories(self):
        """Create missing domain directories with standard structure."""
        domains = [
            "auth",
            "betting", 
            "propfinder",
            "analytics",
            "arbitrage",
            "predictions"
        ]
        
        standard_files = [
            "__init__.py",
            "router.py",
            "schemas.py",
            "models.py",
            "service.py",
            "dependencies.py",
            "exceptions.py"
        ]
        
        for domain in domains:
            domain_path = self.backend_path / "domains" / domain
            
            if not self.dry_run:
                domain_path.mkdir(parents=True, exist_ok=True)
                
                # Create __init__.py with basic content
                init_file = domain_path / "__init__.py"
                if not init_file.exists():
                    init_file.write_text(f'"""Domain module for {domain}."""\n')
            
            self.migration_log.append({
                "action": "create_domain",
                "domain": domain,
                "path": str(domain_path.relative_to(self.repo_path))
            })
            
        print(f"✓ Created {len(domains)} domain directories")
    
    def create_service_directories(self):
        """Create service directories for shared functionality."""
        services = {
            "cache": ["cache_optimizer.py", "cache_warming_service.py", "simple_cache_warmer.py", 
                     "redis_rate_limiter.py", "feature_cache.py"],
            "database": ["database.py", "enhanced_database.py", "database_health_checker.py",
                        "analyze_database.py"],
            "ml": ["model_service.py", "enhanced_model_service.py", "feature_engineering.py",
                  "enhanced_feature_engineering.py", "advanced_feature_engineering.py"],
            "external": ["api_integration.py", "sports_expert_api.py"]
        }
        
        for service, _ in services.items():
            service_path = self.backend_path / "services" / service
            
            if not self.dry_run:
                service_path.mkdir(parents=True, exist_ok=True)
                init_file = service_path / "__init__.py"
                if not init_file.exists():
                    init_file.write_text(f'"""Service module for {service}."""\n')
            
            self.migration_log.append({
                "action": "create_service",
                "service": service,
                "path": str(service_path.relative_to(self.repo_path))
            })
        
        print(f"✓ Created {len(services)} service directories")
    
    def create_script_directories(self):
        """Create script directories for operational scripts."""
        script_dirs = ["analysis", "migration", "maintenance", "debug"]
        
        for script_dir in script_dirs:
            script_path = self.backend_path / "scripts" / script_dir
            
            if not self.dry_run:
                script_path.mkdir(parents=True, exist_ok=True)
                init_file = script_path / "__init__.py"
                if not init_file.exists():
                    init_file.write_text(f'"""Scripts for {script_dir}."""\n')
            
            self.migration_log.append({
                "action": "create_script_dir",
                "directory": script_dir,
                "path": str(script_path.relative_to(self.repo_path))
            })
        
        print(f"✓ Created {len(script_dirs)} script directories")
    
    def migrate_domain_files(self):
        """Migrate domain-specific files from root to domains."""
        migrations = {
            "auth": [
                "security_config.py",
                "security_hardening.py", 
                "security_scanner.py",
                "seed_admin.py"
            ],
            "betting": [
                "betting_opportunity_service.py",
                "check_bet_details.py",
                "check_bets_table.py",
                "check_recorded_bets.py"
            ],
            "propfinder": [
                "enhanced_propollama_engine.py",
                "load_test_props.py"
            ],
            "analytics": [
                "apply_analytics_migration.py",
                "analytics_migration.sql"
            ],
            "arbitrage": [
                "arbitrage_engine.py",
                "real_arbitrage_engine.py"
            ],
            "predictions": [
                "prediction_engine.py",
                "enhanced_prediction_engine.py",
                "model_service.py",
                "enhanced_model_service.py",
                "ultra_accuracy_engine.py",
                "revolutionary_accuracy_engine.py"
            ]
        }
        
        migrated_count = 0
        for domain, files in migrations.items():
            for file_name in files:
                source = self.backend_path / file_name
                target = self.backend_path / "domains" / domain / file_name
                
                if source.exists():
                    if not self.dry_run:
                        target.parent.mkdir(parents=True, exist_ok=True)
                        shutil.move(str(source), str(target))
                    
                    self.migration_log.append({
                        "action": "migrate",
                        "type": "domain",
                        "source": str(source.relative_to(self.repo_path)),
                        "target": str(target.relative_to(self.repo_path)),
                        "domain": domain
                    })
                    migrated_count += 1
        
        print(f"✓ Migrated {migrated_count} files to domain directories")
        return migrated_count
    
    def migrate_service_files(self):
        """Migrate service files from root to services."""
        migrations = {
            "cache": [
                "cache_optimizer.py",
                "cache_warming_service.py",
                "simple_cache_warmer.py",
                "redis_rate_limiter.py",
                "feature_cache.py"
            ],
            "database": [
                "database_health_checker.py",
                "analyze_database.py"
            ],
            "ml": [
                "feature_engineering.py",
                "enhanced_feature_engineering.py",
                "advanced_feature_engineering.py",
                "feature_selector.py",
                "feature_validator.py",
                "feature_transformation.py"
            ],
            "external": [
                "api_integration.py",
                "sports_expert_api.py"
            ]
        }
        
        migrated_count = 0
        for service, files in migrations.items():
            for file_name in files:
                source = self.backend_path / file_name
                target = self.backend_path / "services" / service / file_name
                
                if source.exists():
                    if not self.dry_run:
                        target.parent.mkdir(parents=True, exist_ok=True)
                        shutil.move(str(source), str(target))
                    
                    self.migration_log.append({
                        "action": "migrate",
                        "type": "service",
                        "source": str(source.relative_to(self.repo_path)),
                        "target": str(target.relative_to(self.repo_path)),
                        "service": service
                    })
                    migrated_count += 1
        
        print(f"✓ Migrated {migrated_count} files to service directories")
        return migrated_count
    
    def migrate_script_files(self):
        """Migrate script files from root to scripts."""
        script_patterns = {
            "analysis": ["check_", "analyze_", "find_"],
            "migration": ["convert_", "migrate_", "backfill_"],
            "debug": ["debug_", "tmp_", "temp_"],
            "maintenance": ["cleanup_", "fix_"]
        }
        
        migrated_count = 0
        root_files = [f for f in os.listdir(self.backend_path) if f.endswith('.py')]
        
        for file_name in root_files:
            for category, patterns in script_patterns.items():
                if any(file_name.startswith(pattern) for pattern in patterns):
                    source = self.backend_path / file_name
                    target = self.backend_path / "scripts" / category / file_name
                    
                    if source.exists():
                        if not self.dry_run:
                            target.parent.mkdir(parents=True, exist_ok=True)
                            shutil.move(str(source), str(target))
                        
                        self.migration_log.append({
                            "action": "migrate",
                            "type": "script",
                            "source": str(source.relative_to(self.repo_path)),
                            "target": str(target.relative_to(self.repo_path)),
                            "category": category
                        })
                        migrated_count += 1
                        break
        
        print(f"✓ Migrated {migrated_count} script files")
        return migrated_count
    
    def deprecate_config_files(self):
        """Move deprecated config files to config/deprecated."""
        deprecated_configs = [
            "config.py",
            "config_manager.py",
            "config_shim.py"
        ]
        
        deprecated_count = 0
        for file_name in deprecated_configs:
            source = self.backend_path / file_name
            target = self.backend_path / "config" / "deprecated" / file_name
            
            if source.exists():
                if not self.dry_run:
                    target.parent.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(source), str(target))
                
                self.migration_log.append({
                    "action": "deprecate",
                    "type": "config",
                    "source": str(source.relative_to(self.repo_path)),
                    "target": str(target.relative_to(self.repo_path))
                })
                deprecated_count += 1
        
        print(f"✓ Deprecated {deprecated_count} config files")
        return deprecated_count
    
    def update_imports_in_file(self, file_path: Path, old_import: str, new_import: str):
        """Update import statements in a single file."""
        if not file_path.exists() or not file_path.suffix == '.py':
            return False
        
        try:
            content = file_path.read_text(encoding='utf-8')
            updated_content = content.replace(old_import, new_import)
            
            if content != updated_content:
                if not self.dry_run:
                    file_path.write_text(updated_content, encoding='utf-8')
                
                self.import_updates.append({
                    "file": str(file_path.relative_to(self.repo_path)),
                    "old": old_import,
                    "new": new_import
                })
                return True
        except Exception as e:
            print(f"Warning: Could not update imports in {file_path}: {e}")
        
        return False
    
    def generate_import_mapping(self) -> Dict[str, str]:
        """Generate mapping of old imports to new imports."""
        mapping = {}
        
        for entry in self.migration_log:
            if entry["action"] == "migrate":
                source_path = Path(entry["source"])
                target_path = Path(entry["target"])
                
                # Convert file paths to import paths
                source_module = str(source_path.with_suffix('')).replace('/', '.')
                target_module = str(target_path.with_suffix('')).replace('/', '.')
                
                mapping[source_module] = target_module
        
        return mapping
    
    def save_migration_report(self):
        """Save detailed migration report."""
        report = {
            "summary": {
                "total_migrations": len([e for e in self.migration_log if e["action"] == "migrate"]),
                "domains_created": len([e for e in self.migration_log if e["action"] == "create_domain"]),
                "services_created": len([e for e in self.migration_log if e["action"] == "create_service"]),
                "files_deprecated": len([e for e in self.migration_log if e["action"] == "deprecate"]),
                "imports_updated": len(self.import_updates)
            },
            "migration_log": self.migration_log,
            "import_updates": self.import_updates,
            "import_mapping": self.generate_import_mapping()
        }
        
        report_path = self.repo_path / "CONSOLIDATION_IMPLEMENTATION_REPORT.json"
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"\n✓ Migration report saved to: {report_path}")
        return report
    
    def run(self):
        """Execute the full consolidation process."""
        print("=" * 80)
        print("A1Betting7-13.2 Consolidation Implementation")
        print(f"Mode: {'DRY RUN' if self.dry_run else 'LIVE'}")
        print("=" * 80)
        
        # Phase 1: Create directory structure
        print("\n[1/6] Creating domain directories...")
        self.create_domain_directories()
        
        print("\n[2/6] Creating service directories...")
        self.create_service_directories()
        
        print("\n[3/6] Creating script directories...")
        self.create_script_directories()
        
        # Phase 2: Migrate files
        print("\n[4/6] Migrating domain files...")
        domain_count = self.migrate_domain_files()
        
        print("\n[5/6] Migrating service files...")
        service_count = self.migrate_service_files()
        
        print("\n[6/6] Migrating script files...")
        script_count = self.migrate_script_files()
        
        # Deprecate old config files
        print("\n[Extra] Deprecating old config files...")
        config_count = self.deprecate_config_files()
        
        # Generate report
        report = self.save_migration_report()
        
        print("\n" + "=" * 80)
        print("CONSOLIDATION SUMMARY")
        print("=" * 80)
        print(f"Total files migrated: {domain_count + service_count + script_count}")
        print(f"  - Domain files: {domain_count}")
        print(f"  - Service files: {service_count}")
        print(f"  - Script files: {script_count}")
        print(f"  - Config files deprecated: {config_count}")
        print("=" * 80)
        
        return report

if __name__ == "__main__":
    import sys
    
    dry_run = "--dry-run" in sys.argv
    
    implementer = ConsolidationImplementer("/home/ubuntu/A1Betting7-13.2", dry_run=dry_run)
    report = implementer.run()
    
    if dry_run:
        print("\n⚠️  This was a DRY RUN. No files were actually moved.")
        print("Run without --dry-run to execute the consolidation.")
