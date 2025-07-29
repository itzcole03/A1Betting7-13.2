# CFB Data & Modeling Prompt

## Goal

Build, validate, and deploy an end-to-end College Football (CFB) betting prediction pipeline using real data, with a focus on accuracy and actionable recommendations.

## Data Flow

- Ingest real CFB data from SportRadar, TheOdds, PrizePicks, etc.
- ETL: Clean, normalize, and store in database (PostgreSQL/SQLite).
- Feature engineering: Extract player, team, matchup, and context features.
- Model: Train/test ML/LLM models for CFB props and outcomes.
- API: Expose predictions via BetAnalysisResponse (with enriched_props, confidence, etc.).
- Frontend: Display CFB props, predictions, and explanations in PropOllamaUnified/PropGPT.

## Focus

- Validate every step with CFB-specific data and edge cases.
- Tune models for CFB stat distributions and betting markets.
- Document lessons learned for future sports.

## Next Steps

- Integrate and test live CFB data feeds.
- Build and validate CFB feature engineering pipeline.
- Train and evaluate CFB-specific models.
- Expose CFB predictions via API and frontend.
