# Historical Models: Relationships & Schema Rationale

## Entity Relationships

| Entity     | Relationships                           |
| ---------- | --------------------------------------- |
| Casino     | GameSpread (one-to-many, via casino_id) |
| Match      | Score (one-to-many, via match_id)       |
|            | GameSpread (one-to-many, via match_id)  |
| Score      | Match (many-to-one, via match_id)       |
| GameSpread | Match (many-to-one, via match_id)       |
|            | Casino (many-to-one, via casino_id)     |

- **Casino**: Represents a sportsbook/bookmaker. Extensible for provider-specific fields.
- **Match**: Central entity for games/events. Has many scores and spreads.
- **Score**: Stores results for a match. Linked to Match.
- **GameSpread**: Stores odds/spreads for a match from a specific casino. Linked to both Match and Casino. `odds_metadata` allows flexible provider-specific data.

## Rationale

- **Normalization**: Avoids data duplication, supports analytics, and extensibility.
- **Indexes**: Added to `match_id` and `casino_id` for query performance.
- **Extensibility**: `odds_metadata` (JSON/String) supports diverse provider formats.
- **Relationship hooks**: Enable efficient ORM navigation and maintain referential integrity.

## ERD Diagram (Text)

Casino (1)---(M) GameSpread (M)---(1) Match (1)---(M) Score

## Migration & Integrity

- All models registered in `__all_models__.py` for Alembic.
- Relationship hooks placed after all imports to avoid circular dependencies.
- Use `cascade="all, delete-orphan"` for child relationships.

---

For maintainers: See historical.py and match.py for model definitions and relationship hooks.
