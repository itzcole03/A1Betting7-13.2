# MLB Data & Modeling Prompt

## Goal

Build, validate, and deploy an end-to-end MLB betting prediction pipeline using real data, with a focus on accuracy and actionable recommendations.

## Data Flow

- Ingest real MLB data from SportRadar, TheOdds, PrizePicks, etc.
- ETL: Clean, normalize, and store in database (PostgreSQL/SQLite).
- Feature engineering: Extract player, team, matchup, and context features.
- Model: Train/test ML/LLM models for MLB props and outcomes.
- API: Expose predictions via BetAnalysisResponse (with enriched_props, confidence, etc.).
- Frontend: Display MLB props, predictions, and explanations in PropOllamaUnified/PropGPT.

## Focus

- Validate every step with MLB-specific data and edge cases.
- Tune models for MLB stat distributions and betting markets.
- Document lessons learned for future sports.

## Next Steps

- Integrate and test live MLB data feeds.
- Build and validate MLB feature engineering pipeline.
- Train and evaluate MLB-specific models.
- Expose MLB predictions via API and frontend.
