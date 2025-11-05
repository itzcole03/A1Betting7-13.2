"""Analyze backend service modules and emit an import dependency report.

This utility scans ``backend/services`` for Python modules, captures their import
relationships, and writes a JSON report that can be used to identify redundant
or unused implementations (e.g., ``enhanced_*`` vs ``unified_*``).
"""

from __future__ import annotations

import argparse
import ast
import json
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable, Set

PROJECT_ROOT = Path(__file__).resolve().parents[1]
SERVICES_DIR = PROJECT_ROOT / "backend" / "services"
REPORTS_DIR = PROJECT_ROOT / "reports"
DEFAULT_OUTPUT = REPORTS_DIR / "service_dependency_report.json"


@dataclass
class ModuleDependencies:
    """Represents import information for a single services module."""

    module: str
    path: str
    internal_dependencies: Set[str]
    external_dependencies: Set[str]

    def to_dict(self) -> dict:
        data = asdict(self)
        data["internal_dependencies"] = sorted(self.internal_dependencies)
        data["external_dependencies"] = sorted(self.external_dependencies)
        return data


def iter_service_modules(root: Path) -> Iterable[Path]:
    for path in root.rglob("*.py"):
        if path.name == "__init__.py":
            continue
        yield path


def normalize_internal_import(name: str) -> str | None:
    if not name:
        return None
    if name.startswith("backend.services."):
        return name[len("backend.services.") :]
    if not name.startswith("backend."):
        return None
    return None


def extract_dependencies(module_path: Path) -> ModuleDependencies:
    rel_path = module_path.relative_to(PROJECT_ROOT)
    module_name = rel_path.with_suffix("").as_posix().replace("/", ".")
    internal: Set[str] = set()
    external: Set[str] = set()

    try:
        source = module_path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        # Binary or encoded differently; skip but note as external.
        return ModuleDependencies(
            module_name, str(rel_path), internal, {"<unreadable>"}
        )

    try:
        tree = ast.parse(source, filename=str(module_path))
    except SyntaxError as exc:
        external.add(f"<syntax-error:{exc.lineno}>")
        return ModuleDependencies(module_name, str(rel_path), internal, external)

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                name = alias.name
                internal_name = normalize_internal_import(name)
                if internal_name:
                    internal.add(internal_name)
                else:
                    external.add(name.split(".")[0])
        elif isinstance(node, ast.ImportFrom):
            module = node.module or ""
            internal_name = normalize_internal_import(module)
            if internal_name:
                internal.add(internal_name)
            else:
                if module.startswith("backend.services"):
                    # Handle relative imports like "from .cache import ..."
                    dotted = module.replace("backend.services.", "")
                    internal.add(dotted)
                elif module.startswith("."):
                    # Resolve relative imports manually
                    base = module_name.rsplit(".", 1)[0]
                    resolved = f"{base}{module}".replace("..", ".")
                    normalized = normalize_internal_import(resolved)
                    if normalized:
                        internal.add(normalized)
                elif module:
                    external.add(module.split(".")[0])

    return ModuleDependencies(module_name, str(rel_path), internal, external)


def generate_report(output: Path) -> None:
    modules: list[dict] = []

    for module_path in iter_service_modules(SERVICES_DIR):
        dependencies = extract_dependencies(module_path)
        modules.append(dependencies.to_dict())

    report = {
        "root": str(SERVICES_DIR.relative_to(PROJECT_ROOT)),
        "module_count": len(modules),
        "modules": sorted(modules, key=lambda item: item["module"]),
    }

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2, sort_keys=True), encoding="utf-8")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"Path to write the dependency report (default: {DEFAULT_OUTPUT}).",
    )
    args = parser.parse_args(argv)

    if not SERVICES_DIR.exists():
        parser.error(f"Services directory not found at {SERVICES_DIR}")

    generate_report(args.output)
    print(f"Dependency report written to {args.output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
