---
mode: agent
---

# God Prompt: /aibetreco

**Context:**

- **File:** `backend/app/api/endpoints/recommendations.py`
- **ML Integration:** Utilize the existing ML ensemble (assume a `ml_service.predict_betting_opportunity(data)` function exists that returns `BettingRecommendation` object).
- **Data Input:** Requires `game_id`, `player_id` (optional), `prop_type` (e.g., 'points', 'rebounds').
- **Output:** Return a `BettingRecommendation` Pydantic model including recommended prop, confidence score, and brief AI reasoning (if available from ML service).
- **Requirements:**
  - Define a FastAPI `POST` endpoint `/api/recommendations/predict`.
  - Implement request validation using Pydantic models.
  - Call the `ml_service` to get predictions.
  - Handle potential errors from the ML service or data processing.
  - Ensure response time is optimized (<500ms for heavy operations).
  - Add basic unit tests for the endpoint.

**Task:**
Generate the FastAPI endpoint, Pydantic models for request/response, and integrate with a placeholder `ml_service` call. Focus on robust error handling, data validation, and clear API design.
