# Architecture Decision Records (ADR)

This directory contains Architecture Decision Records for the A1Betting project. ADRs document important architectural decisions, the context that led to them, and their consequences.

## ADR Format

We use the following format for ADRs based on the template by Michael Nygard:

- **Status**: What is the status, such as proposed, accepted, rejected, deprecated, superseded?
- **Context**: What is the issue that we're seeing that is motivating this decision or change?  
- **Decision**: What is the change that we're proposing or have agreed to implement?
- **Consequences**: What becomes easier or more difficult to do and any risks introduced?

## ADR Index

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-001](./ADR-001-observability-strategy.md) | Observability Strategy | Proposed |
| [ADR-002](./ADR-002-model-degradation-strategy.md) | Model Degradation Strategy | Proposed |
| [ADR-003](./ADR-003-websocket-contract-design.md) | WebSocket Contract Design | Proposed |

## Naming Convention

ADRs are numbered sequentially and use the following naming pattern:

```text
ADR-XXX-brief-description.md
```

Where:

- `XXX` is a zero-padded sequential number (001, 002, etc.)
- `brief-description` is a short, kebab-case description of the decision

## Creating New ADRs

1. Copy the [ADR template](./template.md)
2. Name it following the convention above
3. Fill in all sections
4. Update this README.md index
5. Submit for review via pull request

## Status Definitions

- **Proposed**: The ADR is under discussion
- **Accepted**: The ADR is agreed upon and should be implemented
- **Rejected**: The ADR was considered but not accepted
- **Deprecated**: The ADR was previously accepted but is no longer valid
- **Superseded**: The ADR was replaced by a newer ADR