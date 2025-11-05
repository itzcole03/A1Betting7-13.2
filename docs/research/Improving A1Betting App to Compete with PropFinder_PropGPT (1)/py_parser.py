import ast
import json
import os

class FastAPIParser(ast.NodeVisitor):
    def __init__(self):
        self.endpoints = []
        self.pydantic_models = []
        self.current_file = None

    def visit_FunctionDef(self, node):
        # Check for FastAPI route decorators
        for decorator in node.decorator_list:
            # Handle @router.get('/path') or @app.get('/path')
            if isinstance(decorator, ast.Call):
                func = decorator.func
                if isinstance(func, ast.Attribute):
                    # Check for router.get, router.post, etc.
                    if isinstance(func.value, ast.Name) and func.value.id in ["router", "app"] and \
                       func.attr in ["get", "post", "put", "delete", "patch"]:
                        path = "/" # Default path
                        if decorator.args and isinstance(decorator.args[0], ast.Constant):
                            path = decorator.args[0].value
                        
                        self.endpoints.append({
                            "name": node.name,
                            "path": path,
                            "method": func.attr.upper(),
                            "parameters": [], # Placeholder
                            "response_model": None, # Placeholder
                            "filePath": self.current_file
                        })
            
        self.generic_visit(node)

    def visit_ClassDef(self, node):
        # Check for Pydantic models (inheriting from BaseModel)
        for base in node.bases:
            if isinstance(base, ast.Name) and base.id == "BaseModel":
                fields = []
                for item in node.body:
                    if isinstance(item, ast.AnnAssign): # Annotated assignment for type hints
                        field_name = item.target.id
                        field_type = ast.unparse(item.annotation) if hasattr(ast, 'unparse') else str(item.annotation) # Use unparse if available
                        fields.append({"name": field_name, "type": field_type})
                    elif isinstance(item, ast.Assign): # Simple assignment for default values
                        if isinstance(item.targets[0], ast.Name):
                            field_name = item.targets[0].id
                            fields.append({"name": field_name, "type": "Any"}) # Type inference is harder here
                self.pydantic_models.append({
                    "name": node.name,
                    "fields": fields,
                    "filePath": self.current_file
                })
            elif isinstance(base, ast.Attribute) and base.attr == "BaseModel":
                # Handle cases like `from pydantic import BaseModel` and `class MyModel(BaseModel):`
                fields = []
                for item in node.body:
                    if isinstance(item, ast.AnnAssign): # Annotated assignment for type hints
                        field_name = item.target.id
                        field_type = ast.unparse(item.annotation) if hasattr(ast, 'unparse') else str(item.annotation)
                        fields.append({"name": field_name, "type": field_type})
                    elif isinstance(item, ast.Assign): # Simple assignment for default values
                        if isinstance(item.targets[0], ast.Name):
                            field_name = item.targets[0].id
                            fields.append({"name": field_name, "type": "Any"})
                self.pydantic_models.append({
                    "name": node.name,
                    "fields": fields,
                    "filePath": self.current_file
                })
        self.generic_visit(node)

def parse_python_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        tree = ast.parse(f.read(), filename=file_path)
    parser = FastAPIParser()
    parser.current_file = file_path
    parser.visit(tree)
    return parser.endpoints, parser.pydantic_models

if __name__ == "__main__":
    scanned_files_path = "/home/ubuntu/A1Betting7-13.2/tools/code_analyzer/scanned_files.json"
    with open(scanned_files_path, "r", encoding="utf-8") as f:
        all_files = json.load(f)

    py_files = [f for f in all_files if f.endswith(".py")]

    all_endpoints = []
    all_pydantic_models = []

    for file_path in py_files:
        try:
            endpoints, pydantic_models = parse_python_file(file_path)
            all_endpoints.extend(endpoints)
            all_pydantic_models.extend(pydantic_models)
        except Exception as e:
            print(f"Error parsing {file_path}: {e}")

    with open("/home/ubuntu/A1Betting7-13.2/tools/code_analyzer/backend_endpoints.json", "w") as f:
        json.dump(all_endpoints, f, indent=4)

    with open("/home/ubuntu/A1Betting7-13.2/tools/code_analyzer/backend_pydantic_models.json", "w") as f:
        json.dump(all_pydantic_models, f, indent=4)

    print(f"Extracted {len(all_endpoints)} endpoints and {len(all_pydantic_models)} Pydantic models.")
    print("Details saved to backend_endpoints.json and backend_pydantic_models.json")


