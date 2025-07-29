# Soccer Data & Modeling Prompt

## Goal

Build, validate, and deploy an end-to-end Soccer betting prediction pipeline using real data, with a focus on accuracy and actionable recommendations.

## Data Flow

- Ingest real Soccer data from SportRadar, TheOdds, PrizePicks, etc.
- ETL: Clean, normalize, and store in database (PostgreSQL/SQLite).
- Feature engineering: Extract player, team, matchup, and context features.
- Model: Train/test ML/LLM models for Soccer props and outcomes.
- API: Expose predictions via BetAnalysisResponse (with enriched_props, confidence, etc.).
- Frontend: Display Soccer props, predictions, and explanations in PropOllamaUnified/PropGPT.

## Focus

- Validate every step with Soccer-specific data and edge cases.
- Tune models for Soccer stat distributions and betting markets.
- Document lessons learned for future sports.

## Next Steps

- Integrate and test live Soccer data feeds.
- Build and validate Soccer feature engineering pipeline.
- Train and evaluate Soccer-specific models.
- Expose Soccer predictions via API and frontend.
