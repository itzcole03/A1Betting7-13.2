#!/usr/bin/env python3
"""Validate consolidation implementation."""

import os
import sys
from pathlib import Path
import json

class ConsolidationValidator:
    def __init__(self, repo_path):
        self.repo_path = Path(repo_path)
        self.backend_path = self.repo_path / "backend"
        self.errors = []
        self.warnings = []
        self.successes = []
        
    def validate_domain_structure(self):
        """Validate domain directories exist and have expected structure."""
        expected_domains = ["auth", "betting", "propfinder", "analytics", "arbitrage", "predictions"]
        
        for domain in expected_domains:
            domain_path = self.backend_path / "domains" / domain
            if not domain_path.exists():
                self.errors.append(f"Domain directory missing: {domain}")
            else:
                self.successes.append(f"Domain exists: {domain}")
                
                # Check for __init__.py
                init_file = domain_path / "__init__.py"
                if not init_file.exists():
                    self.warnings.append(f"Missing __init__.py in {domain}")
    
    def validate_service_structure(self):
        """Validate service directories exist."""
        expected_services = ["cache", "database", "ml", "external"]
        
        for service in expected_services:
            service_path = self.backend_path / "services" / service
            if not service_path.exists():
                self.errors.append(f"Service directory missing: {service}")
            else:
                self.successes.append(f"Service exists: {service}")
    
    def validate_script_structure(self):
        """Validate script directories exist."""
        expected_scripts = ["analysis", "migration", "maintenance", "debug"]
        
        for script_dir in expected_scripts:
            script_path = self.backend_path / "scripts" / script_dir
            if not script_path.exists():
                self.errors.append(f"Script directory missing: {script_dir}")
            else:
                self.successes.append(f"Script directory exists: {script_dir}")
    
    def check_import_syntax(self):
        """Check for basic Python syntax errors in migrated files."""
        import_errors = []
        
        # Check domains
        for domain_dir in (self.backend_path / "domains").iterdir():
            if domain_dir.is_dir():
                for py_file in domain_dir.glob("*.py"):
                    try:
                        with open(py_file, 'r', encoding='utf-8') as f:
                            compile(f.read(), str(py_file), 'exec')
                    except SyntaxError as e:
                        import_errors.append(f"{py_file.name}: {e}")
        
        if import_errors:
            self.errors.extend(import_errors)
        else:
            self.successes.append("No syntax errors in migrated files")
    
    def validate_migration_completeness(self):
        """Check that expected files were migrated."""
        with open(self.repo_path / "CONSOLIDATION_IMPLEMENTATION_REPORT.json", 'r') as f:
            report = json.load(f)
        
        total_migrations = report["summary"]["total_migrations"]
        if total_migrations >= 60:
            self.successes.append(f"Migration complete: {total_migrations} files migrated")
        else:
            self.warnings.append(f"Only {total_migrations} files migrated (expected ~62)")
    
    def run_validation(self):
        """Run all validation checks."""
        print("=" * 80)
        print("Consolidation Validation Report")
        print("=" * 80)
        
        print("\n[1/5] Validating domain structure...")
        self.validate_domain_structure()
        
        print("[2/5] Validating service structure...")
        self.validate_service_structure()
        
        print("[3/5] Validating script structure...")
        self.validate_script_structure()
        
        print("[4/5] Checking import syntax...")
        self.check_import_syntax()
        
        print("[5/5] Validating migration completeness...")
        self.validate_migration_completeness()
        
        print("\n" + "=" * 80)
        print("VALIDATION RESULTS")
        print("=" * 80)
        print(f"✓ Successes: {len(self.successes)}")
        print(f"⚠ Warnings: {len(self.warnings)}")
        print(f"✗ Errors: {len(self.errors)}")
        
        if self.errors:
            print("\n❌ ERRORS:")
            for error in self.errors:
                print(f"  - {error}")
        
        if self.warnings:
            print("\n⚠️  WARNINGS:")
            for warning in self.warnings:
                print(f"  - {warning}")
        
        print("\n" + "=" * 80)
        
        if self.errors:
            print("❌ VALIDATION FAILED")
            return False
        else:
            print("✅ VALIDATION PASSED")
            return True

if __name__ == "__main__":
    validator = ConsolidationValidator("/home/ubuntu/A1Betting7-13.2")
    success = validator.run_validation()
    sys.exit(0 if success else 1)
