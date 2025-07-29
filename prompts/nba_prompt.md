# NBA Data & Modeling Prompt

## Goal

Build, validate, and deploy an end-to-end NBA betting prediction pipeline using real data, with a focus on accuracy and actionable recommendations.

## Data Flow

- Ingest real NBA data from SportRadar, TheOdds, PrizePicks, etc.
- ETL: Clean, normalize, and store in database (PostgreSQL/SQLite).
- Feature engineering: Extract player, team, matchup, and context features.
- Model: Train/test ML/LLM models for NBA props and outcomes.
- API: Expose predictions via BetAnalysisResponse (with enriched_props, confidence, etc.).
- Frontend: Display NBA props, predictions, and explanations in PropOllamaUnified/PropGPT.

## Focus

- Validate every step with NBA-specific data and edge cases.
- Tune models for NBA stat distributions and betting markets.
- Document lessons learned for future sports.

## Next Steps

- Integrate and test live NBA data feeds.
- Build and validate NBA feature engineering pipeline.
- Train and evaluate NBA-specific models.
- Expose NBA predictions via API and frontend.
