# NHL Data & Modeling Prompt

## Goal

Build, validate, and deploy an end-to-end NHL betting prediction pipeline using real data, with a focus on accuracy and actionable recommendations.

## Data Flow

- Ingest real NHL data from SportRadar, TheOdds, PrizePicks, etc.
- ETL: Clean, normalize, and store in database (PostgreSQL/SQLite).
- Feature engineering: Extract player, team, matchup, and context features.
- Model: Train/test ML/LLM models for NHL props and outcomes.
- API: Expose predictions via BetAnalysisResponse (with enriched_props, confidence, etc.).
- Frontend: Display NHL props, predictions, and explanations in PropOllamaUnified/PropGPT.

## Focus

- Validate every step with NHL-specific data and edge cases.
- Tune models for NHL stat distributions and betting markets.
- Document lessons learned for future sports.

## Next Steps

- Integrate and test live NHL data feeds.
- Build and validate NHL feature engineering pipeline.
- Train and evaluate NHL-specific models.
- Expose NHL predictions via API and frontend.
