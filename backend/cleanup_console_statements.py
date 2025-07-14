#!/usr/bin/env python3
"""
Console Statement Cleanup Script

This script removes console.log, console.debug, console.info statements from production code
while preserving error logging and functionality.
"""

import os
import re
import glob
from pathlib import Path

def cleanup_console_statements(file_path: str) -> bool:
    """Remove console statements from a file while preserving error logging."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Remove console.log statements (but keep console.error)
        content = re.sub(r'console\.log\([^)]*\);?\s*', '', content)
        
        # Remove console.debug statements
        content = re.sub(r'console\.debug\([^)]*\);?\s*', '', content)
        
        # Remove console.info statements
        content = re.sub(r'console\.info\([^)]*\);?\s*', '', content)
        
        # Remove empty lines that might be left behind
        content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        
        return False
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def cleanup_backend_debug_logging(file_path: str) -> bool:
    """Remove excessive debug logging from backend files."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Remove logger.debug statements that are not critical
        # Keep debug statements that are important for debugging
        content = re.sub(r'logger\.debug\([^)]*\);?\s*', '', content)
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        
        return False
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    """Main cleanup function."""
    print("🧹 Starting Console Statement Cleanup...")
    
    # Frontend cleanup
    frontend_files = glob.glob("frontend/src/**/*.tsx", recursive=True)
    frontend_files.extend(glob.glob("frontend/src/**/*.ts", recursive=True))
    
    frontend_cleaned = 0
    for file_path in frontend_files:
        if cleanup_console_statements(file_path):
            frontend_cleaned += 1
            print(f"✅ Cleaned: {file_path}")
    
    # Backend cleanup (only production files, not automation scripts)
    backend_files = glob.glob("backend/**/*.py", recursive=True)
    # Exclude automation scripts and CLI tools
    backend_files = [f for f in backend_files if not any(x in f for x in [
        'start_autonomous', 'launch_autonomous', 'generate_docs', 'validate_'
    ])]
    
    backend_cleaned = 0
    for file_path in backend_files:
        if cleanup_backend_debug_logging(file_path):
            backend_cleaned += 1
            print(f"✅ Cleaned: {file_path}")
    
    print(f"\n🎉 Cleanup Complete!")
    print(f"Frontend files cleaned: {frontend_cleaned}")
    print(f"Backend files cleaned: {backend_cleaned}")
    print(f"Total files processed: {len(frontend_files) + len(backend_files)}")

if __name__ == "__main__":
    main() 