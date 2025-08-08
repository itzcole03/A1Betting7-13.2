
import os
import ast
import json

def get_python_dependencies(file_path):
    dependencies = set()
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            tree = ast.parse(f.read())

        for node in ast.walk(tree):
            if isinstance(node, (ast.Import, ast.ImportFrom)):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        module_name = alias.name.split('.')[0]
                        dependencies.add(module_name)
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        module_name = node.module.split('.')[0]
                        dependencies.add(module_name)
    except (SyntaxError, UnicodeDecodeError) as e:
        print(f"Error parsing {file_path}: {e}")
    return list(dependencies)

def map_backend_dependencies(base_path):
    dependency_map = {}
    for root, _, files in os.walk(base_path):
        for file in files:
            if file.endswith('.py'):
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, base_path)
                dependencies = get_python_dependencies(file_path)
                dependency_map[relative_path] = dependencies
    return dependency_map

if __name__ == '__main__':
    backend_path = './A1Betting7-13.2/backend'
    dependencies = map_backend_dependencies(backend_path)
    with open('backend_dependencies.json', 'w') as f:
        json.dump(dependencies, f, indent=4)



