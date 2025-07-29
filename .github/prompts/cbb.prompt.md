# CBB Data & Modeling Prompt

## Goal

Build, validate, and deploy an end-to-end College Basketball (CBB) betting prediction pipeline using real data, with a focus on accuracy and actionable recommendations.

## Data Flow

- Ingest real CBB data from SportRadar, TheOdds, PrizePicks, etc.
- ETL: Clean, normalize, and store in database (PostgreSQL/SQLite).
- Feature engineering: Extract player, team, matchup, and context features.
- Model: Train/test ML/LLM models for CBB props and outcomes.
- API: Expose predictions via BetAnalysisResponse (with enriched_props, confidence, etc.).
- Frontend: Display CBB props, predictions, and explanations in PropOllamaUnified/PropGPT.

## Focus

- Validate every step with CBB-specific data and edge cases.
- Tune models for CBB stat distributions and betting markets.
- Document lessons learned for future sports.

## Next Steps

- Integrate and test live CBB data feeds.
- Build and validate CBB feature engineering pipeline.
- Train and evaluate CBB-specific models.
- Expose CBB predictions via API and frontend.
