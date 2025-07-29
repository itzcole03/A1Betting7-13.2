# MLB Data & Modeling Prompt

## Goal

Build, validate, and deploy an end-to-end MLB betting prediction pipeline using real data, with a focus on accuracy and actionable recommendations.

## API Keys (for MLB integration)

- **SportRadar API Key:** `UqYgYOb5Rt7mQ9IE50RibmYhvoyColfo2nsfgKvy`
- **TheOdds API Key:** `8684be37505fc5ce63b0337d472af0ee`
- _These are currently hardcoded in `mlb_provider_client.py` for demo/dev. Move to environment/config for production._

## Data Flow

- Ingest real MLB data from SportRadar, TheOdds, PrizePicks, etc. (API keys above; see `mlb_provider_client.py` for usage)
- ETL: Clean, normalize, and store in database (PostgreSQL/SQLite).
- Feature engineering: Extract player, team, matchup, and context features.
- Model: Train/test ML/LLM models for MLB props and outcomes.
- API: Expose predictions via BetAnalysisResponse (with enriched_props, confidence, etc.).
- Frontend: Display MLB props, predictions, and explanations in PropOllamaUnified/PropGPT.

## API Usage Best Practices

- **In-memory caching** (TTL 60s) and **per-endpoint rate limiting** (10s) are implemented for all SportRadar and TheOdds API calls in MLB ETL.
- Update `mlb_provider_client.py` for persistent caching or stricter rate limits as needed.

- Validate every step with MLB-specific data and edge cases.
- Tune models for MLB stat distributions and betting markets.
- Document lessons learned for future sports.

## Next Steps

- Integrate and test live MLB data feeds.
- Build and validate MLB feature engineering pipeline.
- Train and evaluate MLB-specific models.
- Expose MLB predictions via API and frontend.
