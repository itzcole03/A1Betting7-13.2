# Proposed Schema Expansion for Production ETL

## New Tables

### 1. Team

- `id` (PK, int, autoincrement)
- `name` (string, unique, not null)
- `provider_id` (string, nullable)
- Index: `name`

### 2. Event

- `id` (PK, int, autoincrement)
- `event_id` (int, unique, not null)
- `name` (string, not null)
- `start_time` (datetime, not null)
- `provider_id` (string, nullable)
- Index: `event_id`, `start_time`

### 3. Odds

- `id` (PK, int, autoincrement)
- `event_id` (FK to Event.id, not null)
- `team_id` (FK to Team.id, not null)
- `odds_type` (string, not null)
- `value` (float, not null)
- `provider_id` (string, nullable)
- Index: `event_id`, `team_id`, `odds_type`
- Constraint: Unique (`event_id`, `team_id`, `odds_type`, `provider_id`)

## Rationale

- **Normalization:** Separate teams, events, and odds for extensibility and data integrity.
- **Indexes:** Support fast queries for analytics and reporting.
- **Constraints:** Prevent duplicate odds and ensure referential integrity.
- **Provider Support:** Allow mapping to external provider IDs for integration.

## ERD Diagram (Text)

Team (1)---(M) Odds (M)---(1) Event

- Team: Can have many Odds
- Event: Can have many Odds
- Odds: Linked to one Team and one Event

Referential integrity enforced via foreign keys and unique constraints.

## Next Steps

- Implement models and migrations for new tables.
- Update ETL pipeline to support expanded schema.
- Document all changes and rationale in architecture docs.
