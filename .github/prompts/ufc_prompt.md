# UFC Data & Modeling Prompt

## Goal

Build, validate, and deploy an end-to-end UFC betting prediction pipeline using real data, with a focus on accuracy and actionable recommendations.

## Data Flow

- Ingest real UFC data from SportRadar, TheOdds, PrizePicks, etc.
- ETL: Clean, normalize, and store in database (PostgreSQL/SQLite).
- Feature engineering: Extract fighter, matchup, and context features.
- Model: Train/test ML/LLM models for UFC props and outcomes.
- API: Expose predictions via BetAnalysisResponse (with enriched_props, confidence, etc.).
- Frontend: Display UFC props, predictions, and explanations in PropOllamaUnified/PropGPT.

## Focus

- Validate every step with UFC-specific data and edge cases.
- Tune models for UFC stat distributions and betting markets.
- Document lessons learned for future sports.

## Next Steps

- Integrate and test live UFC data feeds.
- Build and validate UFC feature engineering pipeline.
- Train and evaluate UFC-specific models.
- Expose UFC predictions via API and frontend.
