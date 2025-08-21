# Backfill Runbook

This runbook describes safe steps to add the textual bookmaker name columns, seed bookmakers, run the backfill, and verify results.

Prerequisites
- Run from project root: `c:\Users\...\A1Betting7-13.2`
- Python environment with dependencies from `backend/requirements.txt`
- Access to target database (dev/staging) and backup / snapshot capability

Steps (safe order)

1. Create and review migration

```pwsh
# From project root
cd backend
alembic revision --autogenerate -m "add bestline bookmaker name columns"
# OR use the provided migration file (already created)
```

2. Run migration (dry-run if supported) and apply to staging

```pwsh
cd backend
alembic upgrade head
```

3. Seed bookmakers (idempotent)

```pwsh
python scripts/run_seed_bookmakers.py
```

4. Run backfill in dry-run mode (verify actions)

```pwsh
python scripts/run_backfill.py --dry-run --database-url <DATABASE_URL>
```

5. Run backfill (commit)

```pwsh
python scripts/run_backfill.py --database-url <DATABASE_URL>
```

6. Verify results

- Run scripts/check_aggregates.py to inspect updates

```pwsh
python scripts/run_check_aggregates_runner.py
```

- Call API to confirm fields are present

```pwsh
curl http://127.0.0.1:8000/api/propfinder/opportunities | jq '.data.opportunities[0] | {prop_id, bestOverBookmakerName, bestUnderBookmakerName}'
```

Rollback guidance
- If migration needs to be rolled back:

```pwsh
cd backend
alembic downgrade -1
```

- If backfill introduced incorrect names, restore DB from snapshot or run corrective SQL updates.

Notes
- The seeding script is idempotent and safe to run multiple times.
- The backfill supports `--dry-run` to preview changes before committing.

Contact
- For assistance, contact the backend owner or the SRE team.
