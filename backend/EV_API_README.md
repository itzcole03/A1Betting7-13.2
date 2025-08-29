# EV Enrichment for Predictions

Prediction responses produced by the consolidated ML endpoints may include additional expected-value fields when the request provides market odds and a probability can be inferred from the model output.

When available the following fields may be present on prediction results:

- `odds_decimal`: market odds normalized to decimal format (e.g. `2.5`).
- `ev`: expected value for a 1.0 stake (numeric), computed as `probability * decimal_odds - 1`.
- `ev_pct`: expected value expressed as a percentage of stake (e.g. `25.0` for +25%).
- `ev_label`: a short label: `+EV`, `ZeroEV`, or `-EV`.

These fields are added defensively and will not interfere with prediction processing if odds are absent or invalid.
