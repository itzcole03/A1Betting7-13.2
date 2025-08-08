# Workflow Integration Guide

This guide describes how to integrate the `prompts/` and `tools/` resources into your automation, onboarding, and code review processes for A1Betting7-13.2.

- Use prompts in `prompts/` as input for dynamic prompt generators (see `tools/dynamic_prompt_generator.py`) to scaffold new endpoints, components, and pipelines.
- Discover and select prompts using the `prompts/manifest.json` file for automated workflows.
- Leverage utility scripts in `tools/` for codebase analysis, documentation generation, and intelligent code suggestions.
- Integrate prompt generation and codebase analysis into CI/CD pipelines for continuous quality and rapid feature development.

## Onboarding

- Reference `prompts/README.md` and `tools/README.md` in onboarding guides for new developers and automation agents.
- Use prompts to quickly generate high-quality code and familiarize new contributors with project standards.
- Run codebase analysis scripts to provide new team members with up-to-date documentation and code maps.

## Code Review

- Use prompts as checklists for code review and refactoring tasks.
- Run analysis scripts to identify outdated or non-compliant code before merging PRs.
- Ensure all new features and changes adhere to the standards and patterns described in the prompts and tools documentation.

## Best Practices

- Keep prompts and utility scripts up to date as the project evolves.
- Document new prompts and tools in their respective `README.md` files.
- Encourage all contributors to use these resources for consistent, high-quality development.
