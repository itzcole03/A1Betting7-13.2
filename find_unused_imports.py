#!/usr/bin/env python3
"""
Simple script to find potentially unused imports in Python files.
"""

import ast
import os
import sys
from pathlib import Path


class UnusedImportFinder(ast.NodeVisitor):
    def __init__(self):
        self.imports = {}  # name -> (node, line_number)
        self.names_used = set()

    def visit_Import(self, node):
        for alias in node.names:
            name = alias.asname if alias.asname else alias.name
            # Store just the top-level module name
            top_name = name.split(".")[0]
            self.imports[top_name] = (node, node.lineno)
        self.generic_visit(node)

    def visit_ImportFrom(self, node):
        for alias in node.names:
            if alias.name == "*":
                # Skip star imports as they're hard to analyze
                continue
            name = alias.asname if alias.asname else alias.name
            self.imports[name] = (node, node.lineno)
        self.generic_visit(node)

    def visit_Name(self, node):
        if isinstance(node.ctx, ast.Load):
            self.names_used.add(node.id)
        self.generic_visit(node)

    def visit_Attribute(self, node):
        # For module.attribute access
        if isinstance(node.value, ast.Name):
            self.names_used.add(node.value.id)
        self.generic_visit(node)


def find_unused_imports_in_file(file_path):
    """Find potentially unused imports in a single file."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        tree = ast.parse(content)
        finder = UnusedImportFinder()
        finder.visit(tree)

        unused = []
        for name, (node, line_no) in finder.imports.items():
            if name not in finder.names_used:
                # Get the actual import statement
                lines = content.split("\n")
                if line_no <= len(lines):
                    import_line = lines[line_no - 1].strip()
                    unused.append((line_no, import_line))

        return unused

    except (SyntaxError, UnicodeDecodeError, Exception) as e:
        # Skip files with syntax errors or encoding issues
        return []


def main():
    if len(sys.argv) != 2:
        print("Usage: python find_unused_imports.py <directory>")
        sys.exit(1)

    directory = Path(sys.argv[1])
    if not directory.exists():
        print(f"Directory {directory} does not exist")
        sys.exit(1)

    total_unused = 0

    for py_file in directory.rglob("*.py"):
        # Skip __pycache__ and .git directories
        if "__pycache__" in str(py_file) or ".git" in str(py_file):
            continue

        unused_imports = find_unused_imports_in_file(py_file)
        if unused_imports:
            print(f"\n📁 {py_file.relative_to(directory)}:")
            for line_no, import_line in unused_imports:
                print(f"  Line {line_no}: {import_line}")
                total_unused += 1

    print(f"\n🔍 Found {total_unused} potentially unused imports")
    print("⚠️  Note: This is a basic analysis. Manual review is recommended.")


if __name__ == "__main__":
    main()
