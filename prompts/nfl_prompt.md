# NFL Data & Modeling Prompt

## Goal

Build, validate, and deploy an end-to-end NFL betting prediction pipeline using real data, with a focus on accuracy and actionable recommendations.

## Data Flow

- Ingest real NFL data from SportRadar, TheOdds, PrizePicks, etc.
- ETL: Clean, normalize, and store in database (PostgreSQL/SQLite).
- Feature engineering: Extract player, team, matchup, and context features.
- Model: Train/test ML/LLM models for NFL props and outcomes.
- API: Expose predictions via BetAnalysisResponse (with enriched_props, confidence, etc.).
- Frontend: Display NFL props, predictions, and explanations in PropOllamaUnified/PropGPT.

## Focus

- Validate every step with NFL-specific data and edge cases.
- Tune models for NFL stat distributions and betting markets.
- Document lessons learned for future sports.

## Next Steps

- Integrate and test live NFL data feeds.
- Build and validate NFL feature engineering pipeline.
- Train and evaluate NFL-specific models.
- Expose NFL predictions via API and frontend.
