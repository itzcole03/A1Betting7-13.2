EV Calculation API

Endpoint: POST /api/ev/calc

Payload (JSON):
- `probability` (float, required): projected win probability in [0.0, 1.0]
- `odds` (float, required): market odds in decimal or American format (e.g. 2.5 or -150)
- `odds_format` (string, optional): explicitly `decimal` or `american` (if omitted, the server will guess)
- `stake` (float, optional): stake amount (default 1.0)

Example curl (decimal odds):

```pwsh
curl -X POST "http://localhost:8000/api/ev/calc" \
  -H "Content-Type: application/json" \
  -d '{"probability": 0.6, "odds": 2.0, "stake": 1.0}'
```

Example curl (American odds):

```pwsh
curl -X POST "http://localhost:8000/api/ev/calc" \
  -H "Content-Type: application/json" \
  -d '{"probability": 0.6, "odds": -150, "odds_format": "american", "stake": 1.0}'
```

Sample successful response (JSON envelope):

```json
{
  "success": true,
  "data": {
    "probability": 0.6,
    "odds_decimal": 2.0,
    "stake": 1.0,
    "ev": 0.2,
    "ev_pct": 20.0,
    "label": "+EV"
  },
  "error": null
}
```

Error responses:
- 422: validation errors (invalid probability, odds, or stake)
- 500: internal server error

Notes:
- The EV calculation used is: EV per unit = probability * (decimal_odds - 1) + (1 - probability) * (-1)
- `ev` is returned scaled to `stake`; `ev_pct` is `ev / stake * 100`.
