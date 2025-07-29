# Golf Data & Modeling Prompt

## Goal

Build, validate, and deploy an end-to-end Golf betting prediction pipeline using real data, with a focus on accuracy and actionable recommendations.

## Data Flow

- Ingest real Golf data from SportRadar, TheOdds, PrizePicks, etc.
- ETL: Clean, normalize, and store in database (PostgreSQL/SQLite).
- Feature engineering: Extract player, course, round, and context features.
- Model: Train/test ML/LLM models for Golf props and outcomes.
- API: Expose predictions via BetAnalysisResponse (with enriched_props, confidence, etc.).
- Frontend: Display Golf props, predictions, and explanations in PropOllamaUnified/PropGPT.

## Focus

- Validate every step with Golf-specific data and edge cases.
- Tune models for Golf stat distributions and betting markets.
- Document lessons learned for future sports.

## Next Steps

- Integrate and test live Golf data feeds.
- Build and validate Golf feature engineering pipeline.
- Train and evaluate Golf-specific models.
- Expose Golf predictions via API and frontend.
