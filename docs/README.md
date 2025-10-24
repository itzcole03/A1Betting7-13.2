# Documentation Index

A1Betting7-13.2 ships with hundreds of Markdown files spread across the root
and `docs/` tree. This index calls out the references that should stay active
and the sets that need archiving or consolidation as we drive the audit to
completion.

## 1. Canonical references (keep current)

| Area                      | Canonical file(s)                                                                                                             | Notes                                                                       |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Backend onboarding        | `README.md` (root), `backend/README.md`                                                                                       | Keep one source of truth; update once service consolidation lands.          |
| Frontend onboarding       | `frontend/README.md`                                                                                                          | Reference Vite commands, type-check, and test workflow.                     |
| Security playbooks        | `docs/security/secret_scanning_plan.md`, `docs/security/git_history_sanitization.md`, `docs/security/log_redaction_policy.md` | Newly authored during audit; hook up to `SECURITY_ACTIONS.md` checklist.    |
| Architecture decisions    | `docs/architecture/adr/`                                                                                                      | ADRs remain authoritative; cross-link from contributor guide.               |
| Observability stack       | `docs/observability/`                                                                                                         | Align with `infrastructure/monitoring/` manifests; trim duplicates in root. |
| API reference             | `docs/api/`, `OPENAPI_DOCUMENTATION.md`, `openapi.json`                                                                       | Ensure OpenAPI generation script is documented in contributor guide.        |
| PropFinder feature matrix | `docs/FEATURE_MATRIX.md`                                                                                                      | Archive root-level duplicate once consolidation finishes.                   |

## 2. Active runbooks

| Domain              | File                                 | Action                                                                       |
| ------------------- | ------------------------------------ | ---------------------------------------------------------------------------- |
| Backfill pipeline   | `docs/backfill_runbook.md`           | Confirm scripts referenced still exist; move deprecated commands to archive. |
| CLV metrics         | `docs/clv_metrics_runbook.md`        | Update after service consolidation (CLV cache handling changes).             |
| Smart signals       | `docs/SMART_SIGNALS.md`              | Verify data sources align with current ML assets before next release.        |
| Websocket migration | `docs/WEBSOCKET_MIGRATION_STATUS.md` | Convert to historical entry once migration is locked.                        |

## 3. Legacy & archival candidates

Move the following into `docs/archive/` (or delete after history scrub):

- Phase completion reports (`PHASE*_STEP*_COMPLETE.md`), including `docs/security/PHASE1_STEP6_COMPLETE.md`.
- Historical automation summaries (`AUTONOMOUS_EXECUTION_SUMMARY.md`, `COPILOT_HANDOFF_SUMMARY.md`).
- Duplicated feature/status reports (`FEATURE_MATRIX.md` at repo root, `FUNCTIONALITY_STATUS.md`, `PROJECT_STATUS.md`).
- Redundant prop finder comparisons once the competitive analysis workflow is finalized.

## 4. Contributor & AI playbook

Planned deliverables (tracked in Section 16 of `PROJECT_GLOBAL_AUDIT.md`):

- `CONTRIBUTING.md`: human-focused setup, testing, branch protection, deployment story.
- `AI_PLAYBOOK.md`: distilled instructions for copilots/agents (directory discipline, forbidden actions, command matrix).
- Updated `README.md`: link both guides, point to this index, and remove references to superseded automation documents.

## 5. Open actions for docs team

1. **Curate canonical onboarding:** merge the contents of `docs/dev/`, `docs/developer/`, and PR templates into `CONTRIBUTING.md`.
2. **Archive or delete duplicates:** use the list above to relocate historical summaries to `docs/archive/`.
3. **Link security workflows:** ensure `SECURITY_ACTIONS.md` references the three active runbooks so audit progress is traceable.
4. **Align deployment docs:** once the DevOps RFC selects Compose vs Helm, update `PRODUCTION_DEPLOYMENT_GUIDE.md` and this index accordingly.
5. **Establish review cadence:** add documentation review to the quarterly hygiene checklist (Section 13 of `PROJECT_GLOBAL_AUDIT.md`).

Maintaining this index avoids future documentation sprawl and gives new
contributors—human or AI—a single launch pad into the repo.
