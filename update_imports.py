#!/usr/bin/env python3
import os
import re
from pathlib import Path
import json

class ImportUpdater:
    def __init__(self, repo_path, report_path):
        self.repo_path = Path(repo_path)
        self.backend_path = self.repo_path / "backend"
        with open(report_path, 'r') as f:
            report = json.load(f)
        self.import_mapping = report.get("import_mapping", {})
        self.updates_made = []
        
    def update_imports_in_file(self, file_path):
        if not file_path.exists() or file_path.suffix != '.py':
            return 0
        try:
            content = file_path.read_text(encoding='utf-8')
            original_content = content
            updates_in_file = 0
            for old_import, new_import in self.import_mapping.items():
                old_module = old_import.replace('backend.', '')
                new_module = new_import.replace('backend.', '')
                pattern1 = f"from backend.{old_module} import"
                replacement1 = f"from backend.{new_module} import"
                if pattern1 in content:
                    content = content.replace(pattern1, replacement1)
                    updates_in_file += 1
                pattern2 = f"import backend.{old_module}"
                replacement2 = f"import backend.{new_module}"
                if pattern2 in content:
                    content = content.replace(pattern2, replacement2)
                    updates_in_file += 1
            if content != original_content:
                file_path.write_text(content, encoding='utf-8')
                self.updates_made.append({"file": str(file_path.relative_to(self.repo_path)), "updates": updates_in_file})
            return updates_in_file
        except Exception as e:
            print(f"Warning: {e}")
            return 0
    
    def update_all_imports(self):
        total_updates = 0
        files_updated = 0
        for root, dirs, files in os.walk(self.backend_path):
            dirs[:] = [d for d in dirs if d not in ['__pycache__', '.git', 'node_modules']]
            for file in files:
                if file.endswith('.py'):
                    file_path = Path(root) / file
                    updates = self.update_imports_in_file(file_path)
                    if updates > 0:
                        total_updates += updates
                        files_updated += 1
        return files_updated, total_updates

updater = ImportUpdater("/home/ubuntu/A1Betting7-13.2", "/home/ubuntu/A1Betting7-13.2/CONSOLIDATION_IMPLEMENTATION_REPORT.json")
files_updated, total_updates = updater.update_all_imports()
print(f"Updated {total_updates} import statements in {files_updated} files")
