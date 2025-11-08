#!/usr/bin/env python3
"""Phase 3: Consolidate variant files."""

import os
import shutil
from pathlib import Path
import json

class Phase3Consolidator:
    def __init__(self, repo_path, dry_run=False):
        self.repo_path = Path(repo_path)
        self.backend_path = self.repo_path / "backend"
        self.dry_run = dry_run
        self.actions = []
        
    def consolidate_feature_engineering(self):
        """Consolidate 4 feature_engineering variants into canonical version."""
        print("\n[1/5] Consolidating feature_engineering variants...")
        
        # Target: Keep the advanced version as it's most complete
        canonical = self.backend_path / "services/ml/feature_engineering.py"
        variants_to_deprecate = [
            self.backend_path / "services/enhanced_feature_engineering.py",
            self.backend_path / "services/ml/enhanced_feature_engineering.py",
            self.backend_path / "services/ml/advanced_feature_engineering.py"
        ]
        
        # Use advanced as canonical (most complete at 1280 lines)
        source = self.backend_path / "services/ml/advanced_feature_engineering.py"
        
        if source.exists() and canonical.exists():
            if not self.dry_run:
                # Backup original
                shutil.copy(canonical, str(canonical) + ".backup")
                # Replace with advanced version
                shutil.copy(source, canonical)
            
            self.actions.append({
                'action': 'consolidate',
                'module': 'feature_engineering',
                'canonical': str(canonical.relative_to(self.repo_path)),
                'source': str(source.relative_to(self.repo_path))
            })
        
        # Move variants to deprecated
        for variant in variants_to_deprecate:
            if variant.exists():
                target = self.backend_path / "deprecated" / variant.name
                if not self.dry_run:
                    target.parent.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(variant), str(target))
                
                self.actions.append({
                    'action': 'deprecate',
                    'source': str(variant.relative_to(self.repo_path)),
                    'target': str(target.relative_to(self.repo_path))
                })
        
        print(f"  ✓ Consolidated feature_engineering.py (4 variants → 1 canonical)")
        return 4
    
    def consolidate_ml_service(self):
        """Consolidate 3 ml_service variants."""
        print("\n[2/5] Consolidating ml_service variants...")
        
        canonical = self.backend_path / "services/ml/ml_service.py"
        variants = [
            self.backend_path / "cleanup_phase1/services/advanced_ml_service.py",
            self.backend_path / "services/advanced_ml_service.py",
            self.backend_path / "services/enhanced_ml_service.py"
        ]
        
        # Use enhanced as canonical (most complete at 756 lines)
        source = self.backend_path / "services/enhanced_ml_service.py"
        
        if source.exists():
            if not self.dry_run:
                canonical.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy(source, canonical)
            
            self.actions.append({
                'action': 'consolidate',
                'module': 'ml_service',
                'canonical': str(canonical.relative_to(self.repo_path)),
                'source': str(source.relative_to(self.repo_path))
            })
        
        # Deprecate variants
        for variant in variants:
            if variant.exists():
                target = self.backend_path / "deprecated" / variant.name
                if not self.dry_run:
                    target.parent.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(variant), str(target))
                
                self.actions.append({
                    'action': 'deprecate',
                    'source': str(variant.relative_to(self.repo_path)),
                    'target': str(target.relative_to(self.repo_path))
                })
        
        print(f"  ✓ Consolidated ml_service.py (3 variants → 1 canonical)")
        return 3
    
    def consolidate_data_pipeline(self):
        """Consolidate 3 data_pipeline variants."""
        print("\n[3/5] Consolidating data_pipeline variants...")
        
        canonical = self.backend_path / "services/data_pipeline.py"
        variants = [
            self.backend_path / "enhanced_data_pipeline.py",
            self.backend_path / "services/enhanced_data_pipeline.py"
        ]
        
        # Check if canonical exists, if not use enhanced version
        source = self.backend_path / "enhanced_data_pipeline.py"
        
        if source.exists():
            if not self.dry_run:
                if canonical.exists():
                    shutil.copy(canonical, str(canonical) + ".backup")
                canonical.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy(source, canonical)
            
            self.actions.append({
                'action': 'consolidate',
                'module': 'data_pipeline',
                'canonical': str(canonical.relative_to(self.repo_path)),
                'source': str(source.relative_to(self.repo_path))
            })
        
        # Deprecate variants
        for variant in variants:
            if variant.exists():
                target = self.backend_path / "deprecated" / variant.name
                if not self.dry_run:
                    target.parent.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(variant), str(target))
                
                self.actions.append({
                    'action': 'deprecate',
                    'source': str(variant.relative_to(self.repo_path)),
                    'target': str(target.relative_to(self.repo_path))
                })
        
        print(f"  ✓ Consolidated data_pipeline.py (3 variants → 1 canonical)")
        return 3
    
    def consolidate_database(self):
        """Consolidate 2 database variants."""
        print("\n[4/5] Consolidating database variants...")
        
        canonical = self.backend_path / "services/database/database.py"
        variant = self.backend_path / "enhanced_database.py"
        
        if variant.exists():
            if not self.dry_run:
                canonical.parent.mkdir(parents=True, exist_ok=True)
                if canonical.exists():
                    shutil.copy(canonical, str(canonical) + ".backup")
                shutil.copy(variant, canonical)
            
            self.actions.append({
                'action': 'consolidate',
                'module': 'database',
                'canonical': str(canonical.relative_to(self.repo_path)),
                'source': str(variant.relative_to(self.repo_path))
            })
            
            # Deprecate variant
            target = self.backend_path / "deprecated" / variant.name
            if not self.dry_run:
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.move(str(variant), str(target))
            
            self.actions.append({
                'action': 'deprecate',
                'source': str(variant.relative_to(self.repo_path)),
                'target': str(target.relative_to(self.repo_path))
            })
        
        print(f"  ✓ Consolidated database.py (2 variants → 1 canonical)")
        return 2
    
    def consolidate_openapi(self):
        """Consolidate 2 openapi variants."""
        print("\n[5/5] Consolidating openapi variants...")
        
        canonical = self.backend_path / "config/openapi.py"
        variants = [
            self.backend_path / "config/enhanced_openapi.py",
            self.backend_path / "docs/enhanced_openapi.py"
        ]
        
        # Use config version as canonical
        source = self.backend_path / "config/enhanced_openapi.py"
        
        if source.exists():
            if not self.dry_run:
                if canonical.exists():
                    shutil.copy(canonical, str(canonical) + ".backup")
                shutil.copy(source, canonical)
            
            self.actions.append({
                'action': 'consolidate',
                'module': 'openapi',
                'canonical': str(canonical.relative_to(self.repo_path)),
                'source': str(source.relative_to(self.repo_path))
            })
        
        # Deprecate variants
        for variant in variants:
            if variant.exists():
                target = self.backend_path / "deprecated" / variant.name
                if not self.dry_run:
                    target.parent.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(variant), str(target))
                
                self.actions.append({
                    'action': 'deprecate',
                    'source': str(variant.relative_to(self.repo_path)),
                    'target': str(target.relative_to(self.repo_path))
                })
        
        print(f"  ✓ Consolidated openapi.py (2 variants → 1 canonical)")
        return 2
    
    def run(self):
        """Execute Phase 3 consolidation."""
        print("=" * 80)
        print("Phase 3: Variant Consolidation Implementation")
        print(f"Mode: {'DRY RUN' if self.dry_run else 'LIVE'}")
        print("=" * 80)
        
        total = 0
        total += self.consolidate_feature_engineering()
        total += self.consolidate_ml_service()
        total += self.consolidate_data_pipeline()
        total += self.consolidate_database()
        total += self.consolidate_openapi()
        
        # Save report
        report = {
            'summary': {
                'total_variants_consolidated': total,
                'canonical_modules_created': 5
            },
            'actions': self.actions
        }
        
        report_path = self.repo_path / "PHASE3_CONSOLIDATION_REPORT.json"
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        print("\n" + "=" * 80)
        print("CONSOLIDATION SUMMARY")
        print("=" * 80)
        print(f"Total variants consolidated: {total}")
        print(f"Canonical modules created: 5")
        print(f"Report saved to: {report_path}")
        print("=" * 80)
        
        return report

if __name__ == "__main__":
    import sys
    dry_run = "--dry-run" in sys.argv
    
    consolidator = Phase3Consolidator("/home/ubuntu/A1Betting7-13.2", dry_run=dry_run)
    consolidator.run()
    
    if dry_run:
        print("\n⚠️  This was a DRY RUN. No files were actually moved.")
        print("Run without --dry-run to execute the consolidation.")
