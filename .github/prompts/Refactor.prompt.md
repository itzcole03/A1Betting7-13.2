---
mode: agent
---

Copilot agent:
Based on the comprehensive audit findings, develop a structured, actionable plan for repository-wide codebase modernization. For each file or module, clearly specify one or more of the following actions as justified by the audit:

Refactor: Identify files that need code improvement for readability, maintainability, performance, or conformance with project standards. Specify the refactoring goals and any patterns or practices to adopt (e.g., modularization, async/await, React hooks, etc.).
Restructure: Propose changes to the directory or module layout to improve logical separation, discoverability, or alignment with backend/frontend best practices. Suggest where files should be relocated or how directories should be reorganized.
Rewire: Outline where dependencies, imports, or service integrations need to be decoupled, updated, or unified (e.g., replacing direct fetch calls with a shared HTTP client, consolidating state management, or standardizing API usage).
Remove: List obsolete, redundant, or legacy files/components/services that should be deleted, including a rationale for each.
Other Actions: Note any files that require documentation updates, additional tests, or architectural review before proceeding.
For each action item:

Reference the exact file(s) or module(s) affected.
Briefly state the reason for the action, referencing specific audit findings or architectural goals.
Prioritize changes in logical phases (e.g., high-risk refactors first, removals after safe migration, etc.).
Present the plan as a detailed checklist, organized by action type and priority, suitable for use as a living roadmap and for assignment to individual contributors.

use context7
