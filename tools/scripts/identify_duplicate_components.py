#!/usr/bin/env python3
"""
Identifies duplicate component files across frontend/src/components.
Groups by base filename to find which components exist in multiple directories.
"""
import os
import sys
from pathlib import Path
from collections import defaultdict

def find_duplicate_components():
    """Find all duplicate component files."""
    components_dir = Path("frontend/src/components")
    
    # Track files by basename
    files_by_name = defaultdict(list)
    
    # Walk through all component files
    for filepath in components_dir.rglob("*.tsx"):
        # Skip test files and type definition files
        if filepath.name.endswith((".test.tsx", ".d.ts", ".spec.tsx")):
            continue
        
        # Get the relative path
        rel_path = filepath.relative_to(components_dir)
        basename = filepath.name
        
        files_by_name[basename].append(rel_path)
    
    # Also check .jsx files
    for filepath in components_dir.rglob("*.jsx"):
        if filepath.name.endswith((".test.jsx", ".spec.jsx")):
            continue
        rel_path = filepath.relative_to(components_dir)
        basename = filepath.name
        files_by_name[basename].append(rel_path)
    
    # Find duplicates
    duplicates = {name: paths for name, paths in files_by_name.items() if len(paths) > 1}
    
    # Sort for consistent output
    duplicates = dict(sorted(duplicates.items()))
    
    return files_by_name, duplicates

def categorize_components(duplicates):
    """Categorize duplicates by type."""
    categories = {
        "base_ui": [],
        "contexts_providers": [],
        "features": [],
        "pages": [],
        "layouts": [],
        "other": []
    }
    
    base_ui_names = {
        "Accordion", "Alert", "Avatar", "Badge", "Breadcrumb", "Button", "Card",
        "Checkbox", "Dialog", "Dropdown", "Input", "Label", "Modal", "Progress",
        "Skeleton", "Slider", "Spinner", "Tabs", "Toast", "Tooltip", "Select",
        "Switch", "ProgressBar", "Toaster", "LoadingScreen", "ErrorState"
    }
    
    context_provider_names = {
        "AuthContext", "AuthProvider", "ThemeProvider", "ToastContext",
        "ToastProvider", "ErrorBoundary", "ErrorFallback"
    }
    
    feature_names = {
        "Arbitrage", "BetSlip", "Betting", "Analytics", "Props", "Lineup",
        "Injury", "News", "Settings", "Profile"
    }
    
    for component_name, paths in duplicates.items():
        if any(ui_name in component_name for ui_name in base_ui_names):
            categories["base_ui"].append((component_name, paths))
        elif any(ctx_name in component_name for ctx_name in context_provider_names):
            categories["contexts_providers"].append((component_name, paths))
        elif any(feat_name in component_name for feat_name in feature_names):
            categories["features"].append((component_name, paths))
        elif "Page" in component_name or "Dashboard" in component_name:
            categories["pages"].append((component_name, paths))
        elif "Layout" in component_name or "Navbar" in component_name:
            categories["layouts"].append((component_name, paths))
        else:
            categories["other"].append((component_name, paths))
    
    return categories

def main():
    """Run the analysis."""
    files_by_name, duplicates = find_duplicate_components()
    
    print("=" * 80)
    print("COMPONENT DUPLICATE ANALYSIS")
    print("=" * 80)
    print(f"\nTotal unique component names: {len(files_by_name)}")
    print(f"Total duplicated components: {len(duplicates)}")
    print(f"Total files with duplicates: {sum(len(paths) for paths in duplicates.values())}")
    
    # Show all duplicates grouped
    print("\n" + "=" * 80)
    print("DUPLICATE COMPONENTS BY CATEGORY")
    print("=" * 80)
    
    categories = categorize_components(duplicates)
    
    for category_name, components_list in categories.items():
        if components_list:
            print(f"\n{category_name.upper().replace('_', ' ')} ({len(components_list)} duplicates):")
            print("-" * 80)
            for component_name, paths in sorted(components_list):
                print(f"\n  {component_name} ({len(paths)} occurrences):")
                for path in sorted(paths):
                    print(f"    - {path}")
    
    # Summary stats
    print("\n" + "=" * 80)
    print("CONSOLIDATION TARGETS")
    print("=" * 80)
    print("\nBase UI Components (consolidate to frontend/src/components/base/):")
    for component_name, paths in categories["base_ui"]:
        print(f"  - {component_name}")
    
    print("\nContexts/Providers (consolidate to frontend/src/contexts/ and /providers/):")
    for component_name, paths in categories["contexts_providers"]:
        print(f"  - {component_name}")
    
    print("\nFeature Components (consolidate to frontend/src/components/features/):")
    for component_name, paths in categories["features"][:10]:  # Show first 10
        print(f"  - {component_name}")
    if len(categories["features"]) > 10:
        print(f"  ... and {len(categories['features']) - 10} more")

if __name__ == "__main__":
    main()
