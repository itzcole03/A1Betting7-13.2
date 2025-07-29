# WNBA Data & Modeling Prompt

## Goal

Build, validate, and deploy an end-to-end WNBA betting prediction pipeline using real data, with a focus on accuracy and actionable recommendations.

## Data Flow

- Ingest real WNBA data from SportRadar, TheOdds, PrizePicks, etc.
- ETL: Clean, normalize, and store in database (PostgreSQL/SQLite).
- Feature engineering: Extract player, team, matchup, and context features.
- Model: Train/test ML/LLM models for WNBA props and outcomes.
- API: Expose predictions via BetAnalysisResponse (with enriched_props, confidence, etc.).
- Frontend: Display WNBA props, predictions, and explanations in PropOllamaUnified/PropGPT.

## Focus

- Validate every step with WNBA-specific data and edge cases.
- Tune models for WNBA stat distributions and betting markets.
- Document lessons learned for future sports.

## Next Steps

- Integrate and test live WNBA data feeds.
- Build and validate WNBA feature engineering pipeline.
- Train and evaluate WNBA-specific models.
- Expose WNBA predictions via API and frontend.
