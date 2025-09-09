# EV Forecasting (Experimental)

This prototype adds near-future EV change estimation using recent snapshots of EV% per opportunity.

- Snapshot storage: for each opportunity, we store recent points `{ ts, ev }` under a stable key `sport|player|market|book`.
- Slope estimation: compute linear regression slope (EV% per minute) over the last N points (default 5).
- Prediction: `predictedEvNext5m = current_ev + slope_per_min * 5`.

API

- GET `/api/ev/forecast?min_ev=2&limit=50`
  - Returns items with positive slope only, sorted by predicted gain.
  - Response fields: `player`, `market`, `sport`, `source_book`, `current_ev`, `slope_per_min`, `predictedEvNext5m`, `num_snapshots`, `last_updated`.

Notes

- Data is cached; snapshots expire after 1 hour. Feed refresh runs every 60s by default.
- This feature is experimental; do not use for production decisions without further validation.

Testing

- Unit test `tests/backend/routes/test_ev_forecast.py` seeds an ascending sequence and asserts positive slope and `predictedEvNext5m > current_ev`.
