# Tools Directory

This directory contains utility scripts for codebase analysis, prompt generation, and automation in the A1Betting7-13.2 project.

## Utility Scripts

- **dynamic_prompt_generator.py**: Dynamically generates prompts for code generation and automation using project context and templates.
- **ts_parser.mjs**: Parses TypeScript files to extract React components and their props for documentation and analysis.
- **py_parser.py**: Parses Python files to discover FastAPI endpoints and Pydantic models for backend analysis and documentation.
- **file_scanner.py**: Recursively scans frontend/backend directories for `.ts`, `.tsx`, and `.py` files to create a file manifest.
- **knowledge_base_interface.py**: Loads and queries frontend components, backend endpoints, and Pydantic models from JSON files for intelligent automation.
- **prompt_templates.py**: Stores reusable prompt templates for consistent code generation and automation workflows.

## Automation & Integration

- Use the `prompts/manifest.json` file to discover and select prompts for automated code generation and onboarding.
- Integrate utility scripts with dynamic prompt generators and CI/CD workflows for continuous code quality and rapid development.
- See each script for example usage and integration patterns.
