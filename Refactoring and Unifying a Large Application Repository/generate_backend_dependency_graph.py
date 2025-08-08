
import json
import os

with open("backend_dependencies.json", "r") as f:
    dependencies = json.load(f)

mermaid_graph = "graph LR\n"

# Group files by their top-level module/directory
module_dependencies = {}
for file, deps in dependencies.items():
    # Extract top-level module for the current file
    file_parts = file.split(os.sep)
    if len(file_parts) > 1:
        file_module = file_parts[0] + "/" + file_parts[1] # e.g., backend/services
    else:
        file_module = file_parts[0].replace(".py", "") # for root-level files

    if file_module not in module_dependencies:
        module_dependencies[file_module] = set()

    for dep in deps:
        # Filter out built-in modules and common libraries
        if dep not in ("os", "sys", "json", "time", "logging", "re", "datetime", "typing", "asyncio",
                       "enum", "dataclasses", "collections", "warnings", "math", "subprocess",
                       "pathlib", "shutil", "inspect", "contextlib", "glob", "secrets", "hashlib",
                       "threading", "uuid", "random", "copy", "traceback", "functools",
                       "sqlite3", "aiosqlite", "psutil", "gc", "urllib", "requests", "aiohttp",
                       "httpx", "websockets", "aioredis", "redis", "sentry_sdk", "prometheus_client",
                       "sqlalchemy", "sqlmodel", "alembic", "dotenv", "pydantic", "fastapi",
                       "uvicorn", "starlette", "slowapi", "bcrypt", "jose", "passlib",
                       "sklearn", "numpy", "pandas", "scipy", "torch", "xgboost", "lightgbm",
                       "catboost", "optuna", "tensorflow", "networkx", "gudhi", "causal_learn",
                       "statsmodels", "ta", "nltk", "cachetools", "joblib", "shap", "lime",
                       "opentelemetry", "pydantic_settings") \
            and not dep.startswith("test_") and not dep.startswith("conftest"):
            # Determine the module of the dependency
            dep_parts = dep.split(".")
            if len(dep_parts) > 1:
                dep_module = dep_parts[0] + "/" + dep_parts[1] # e.g., backend.services -> backend/services
            else:
                dep_module = dep_parts[0] # for root-level modules

            if file_module != dep_module: # Avoid self-loops within the same module
                module_dependencies[file_module].add(dep_module)

for file_module, deps in module_dependencies.items():
    file_node = file_module.replace("/", "_").replace(".", "_")
    for dep_module in deps:
        dep_node = dep_module.replace("/", "_").replace(".", "_")
        mermaid_graph += f"    {file_node} --> {dep_node}\n"

with open("backend_module_dependency_graph.mmd", "w") as f:
    f.write(mermaid_graph)



