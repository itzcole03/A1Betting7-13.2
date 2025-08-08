# Prompts Directory

This directory contains standardized prompts for code generation, onboarding, and automation in the A1Betting7-13.2 project.

## Available Prompts

- **aibetreco.prompt**: Backend FastAPI betting recommendation endpoint. Use for generating endpoints, Pydantic models, ML integration, and tests.
- **dataingest.prompt**: Real-time data ingestion optimization for TheOdds API. Use for refactoring or generating robust ingestion pipelines.
- **mobileref.prompt**: Refactor frontend components for React Native/mobile compatibility. Use for code review and mobile-ready component generation.
- **playerdash.prompt**: Frontend player statistics dashboard. Use for generating new dashboard components with rich data and interactivity.

## Automation & Integration

- All prompts include a YAML metadata header for automated parsing and integration.
- The `manifest.json` file lists all prompts and their metadata for use in automation tools and dynamic prompt generators.
- Use the manifest to discover, select, and inject prompts into code generation workflows, onboarding, and CI/CD pipelines.

## Usage

- Reference these prompts in code generation tools, onboarding guides, or developer documentation.
- Use with dynamic prompt generators or AI assistants to scaffold new features and refactor existing code.
- Integrate into your workflow for consistent, high-quality code and rapid onboarding.
