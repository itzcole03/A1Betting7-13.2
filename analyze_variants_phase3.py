#!/usr/bin/env python3
"""Analyze variant files for Phase 3 consolidation."""

import os
from pathlib import Path
import json

class VariantAnalyzer:
    def __init__(self, repo_path):
        self.repo_path = Path(repo_path)
        self.backend_path = self.repo_path / "backend"
        self.variants = []
        
    def find_all_variants(self):
        """Find all enhanced, advanced, and simple variant files."""
        variant_groups = {}
        
        for root, dirs, files in os.walk(self.backend_path):
            dirs[:] = [d for d in dirs if d not in ['__pycache__', '.git', 'node_modules']]
            
            for file in files:
                if not file.endswith('.py'):
                    continue
                
                file_path = Path(root) / file
                base_name = file
                prefix = None
                
                if file.startswith('enhanced_'):
                    base_name = file.replace('enhanced_', '')
                    prefix = 'enhanced'
                elif file.startswith('advanced_'):
                    base_name = file.replace('advanced_', '')
                    prefix = 'advanced'
                elif file.startswith('simple_'):
                    base_name = file.replace('simple_', '')
                    prefix = 'simple'
                
                if prefix:
                    if base_name not in variant_groups:
                        variant_groups[base_name] = []
                    
                    # Get file stats
                    lines = 0
                    try:
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            lines = len(f.readlines())
                    except:
                        pass
                    
                    variant_groups[base_name].append({
                        'prefix': prefix,
                        'path': str(file_path.relative_to(self.repo_path)),
                        'full_name': file,
                        'lines': lines,
                        'size_kb': file_path.stat().st_size // 1024
                    })
        
        # Also check for base versions
        for base_name, variants in variant_groups.items():
            # Look for base version
            for root, dirs, files in os.walk(self.backend_path):
                if base_name in files:
                    file_path = Path(root) / base_name
                    lines = 0
                    try:
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            lines = len(f.readlines())
                    except:
                        pass
                    
                    variants.append({
                        'prefix': 'base',
                        'path': str(file_path.relative_to(self.repo_path)),
                        'full_name': base_name,
                        'lines': lines,
                        'size_kb': file_path.stat().st_size // 1024
                    })
                    break
        
        return variant_groups
    
    def prioritize_variants(self, variant_groups):
        """Prioritize variant groups by number of variants and importance."""
        priority_list = []
        
        for base_name, variants in variant_groups.items():
            if len(variants) < 2:
                continue
            
            # Calculate priority score
            score = len(variants) * 10  # More variants = higher priority
            
            # Boost priority for key modules
            if any(keyword in base_name.lower() for keyword in ['feature_engineering', 'ml_service', 'data_pipeline']):
                score += 50
            
            # Boost for large files
            total_lines = sum(v['lines'] for v in variants)
            if total_lines > 3000:
                score += 30
            
            priority_list.append({
                'base_name': base_name,
                'variants': variants,
                'count': len(variants),
                'total_lines': total_lines,
                'priority_score': score
            })
        
        return sorted(priority_list, key=lambda x: x['priority_score'], reverse=True)
    
    def generate_consolidation_plan(self):
        """Generate detailed consolidation plan for Phase 3."""
        variant_groups = self.find_all_variants()
        prioritized = self.prioritize_variants(variant_groups)
        
        plan = {
            'summary': {
                'total_variant_groups': len(prioritized),
                'total_files_to_consolidate': sum(p['count'] for p in prioritized)
            },
            'priority_groups': prioritized[:10],  # Top 10
            'all_groups': prioritized
        }
        
        return plan
    
    def print_analysis(self, plan):
        """Print human-readable analysis."""
        print("=" * 80)
        print("Phase 3: Variant Consolidation Analysis")
        print("=" * 80)
        
        print(f"\n📊 SUMMARY")
        print(f"Total variant groups: {plan['summary']['total_variant_groups']}")
        print(f"Total files to consolidate: {plan['summary']['total_files_to_consolidate']}")
        
        print(f"\n🎯 TOP PRIORITY GROUPS (by score):\n")
        
        for i, group in enumerate(plan['priority_groups'], 1):
            print(f"{i}. {group['base_name']} (Score: {group['priority_score']})")
            print(f"   Variants: {group['count']} | Total lines: {group['total_lines']}")
            for variant in group['variants']:
                print(f"   - [{variant['prefix']:8}] {variant['path']} ({variant['lines']} lines)")
            print()
        
        return plan

if __name__ == "__main__":
    analyzer = VariantAnalyzer("/home/ubuntu/A1Betting7-13.2")
    plan = analyzer.generate_consolidation_plan()
    analyzer.print_analysis(plan)
    
    # Save plan
    output_path = Path("/home/ubuntu/A1Betting7-13.2/PHASE3_VARIANT_ANALYSIS.json")
    with open(output_path, 'w') as f:
        json.dump(plan, f, indent=2)
    
    print(f"✓ Analysis saved to: {output_path}")
    print("=" * 80)
