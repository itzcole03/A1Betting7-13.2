PROMPT_TEMPLATES = {
    "playerdash": {
        "description": "Generate a React component for a player dashboard.",
        "template": """
# God Prompt: /playerdash

**Context:**
-   **Goal:** Implement a new player statistics dashboard component in the frontend.
-   **Frontend Location:** {{frontend_location}}
-   **Backend API:** Expects data from `{{backend_api_path}}` (returns `{{backend_api_response_model}}` interface, define if not exists).
-   **Design Inspiration:** PropFinder's Player Dashboard (focus on clear trends, matchup analysis, advanced stats visualization, user-friendly layout).
-   **Requirements:**
    -   Display player name, team, and position prominently.
    -   Show recent game logs (last 5-10 games) with key stats (points, rebounds, assists, etc.) in a clear, sortable table.
    -   Include interactive charts (e.g., line chart, bar chart) visualizing selected stat trends over recent games. Allow dynamic selection of stats.
    -   Ensure the component is highly responsive and integrates seamlessly with existing A1Betting frontend styles and component library.
    -   Implement efficient data fetching from the backend API, including loading states and error handling.
    -   Write comprehensive unit and integration tests for data fetching, component rendering, and user interactions.

**Task:**
Generate the React TypeScript functional component `PlayerDashboard`. Focus on robust data fetching, intuitive UI/UX for data presentation, and adherence to the A1Betting architectural patterns for frontend-backend communication. Include necessary imports, type definitions, and placeholder for API calls.

{{additional_context}}
"""
    },
    "aibetreco": {
        "description": "Develop an AI-driven betting recommendation endpoint.",
        "template": """
# God Prompt: /aibetreco

**Context:**
-   **Goal:** Develop a new AI-driven betting recommendation endpoint in the backend.
-   **Backend Location:** {{backend_location}}
-   **ML Integration:** Utilize the existing ML ensemble. Assume a `ml_service.predict_betting_opportunity(data)` function exists (or suggest its creation) that returns a `{{ml_response_model}}` object (define Pydantic model for this).
-   **Data Input:** Requires `game_id`, `player_id` (optional), `prop_type` (e.g., 'points', 'rebounds').
-   **Output:** Return a `{{ml_response_model}}` Pydantic model including recommended prop, confidence score, and brief AI reasoning (if available from ML service).
-   **Requirements:**
    -   Define a FastAPI `POST` endpoint `{{endpoint_path}}` with robust request validation using Pydantic models.
    -   Implement the logic to call the `ml_service` for predictions, ensuring efficient data passing and minimal latency.
    -   Handle potential errors from the ML service or data processing gracefully, returning appropriate HTTP responses.
    -   Ensure the endpoint is optimized for response time (<500ms for heavy operations, <200ms for standard).
    -   Add comprehensive unit and integration tests for the endpoint, including mocking the ML service and data inputs.

**Task:**
Generate the FastAPI endpoint, Pydantic models for request/response, and integrate with the ML service. Focus on robust error handling, data validation, performance, and clear API design that aligns with the A1Betting backend architecture. Consider how this endpoint will be consumed by the frontend.

{{additional_context}}
"""
    },
    "dataingest": {
        "description": "Optimize real-time data ingestion from TheOdds API.",
        "template": """
# God Prompt: /dataingest

**Context:**
-   **Goal:** Optimize real-time data ingestion from TheOdds API for improved efficiency and reliability.
-   **Location:** {{data_ingestion_location}}
-   **Current Issue:** Occasional hanging during API calls to TheOdds API, leading to data staleness and potential resource exhaustion.
-   **Requirements:**
    -   Implement aggressive timeouts (e.g., 30 seconds) for all external API requests to prevent indefinite hanging.
    -   Apply a robust circuit breaker pattern (e.g., using `tenacity` library or a custom implementation) for retries with exponential backoff on transient errors, and a fallback mechanism.
    -   Add comprehensive logging for successful data fetches, failures, retries, and circuit breaker state changes.
    -   Consider graceful degradation strategies (e.g., serving slightly stale cached data if the API is unresponsive for an extended period).
    -   Ensure proper process monitoring for background data ingestion tasks, including health checks and alerts for prolonged failures.
    -   Optimize data parsing and storage to handle large volumes efficiently, considering the 3000+ file context and overall system load.

**Task:**
Refactor the `fetch_odds_data` function (or create a new data ingestion pipeline) to include robust timeout mechanisms, a circuit breaker pattern, and comprehensive logging. Provide example usage and considerations for deployment in a large-scale, real-time environment.

{{additional_context}}
"""
    },
    "mobileref": {
        "description": "Refactor a core frontend component for optimal mobile app compatibility.",
        "template": """
# God Prompt: /mobileref

**Context:**
-   **Goal:** Refactor a core frontend component for optimal mobile app compatibility (React Native).
-   **Target File:** {{target_file_path}}
-   **Overall Objective:** Prepare A1Betting for a future React Native mobile application, ensuring core UI logic is easily portable.
-   **Requirements:**
    -   Eliminate all direct DOM manipulation (e.g., `document.getElementById`, `window` object usage) and replace with React-idiomatic approaches.
    -   Refactor styling to use platform-agnostic methods (e.g., inline styles, CSS-in-JS solutions that compile to React Native styles, or a design system that supports both web and native).
    -   Strictly separate presentation logic from business logic and data fetching concerns.
    -   Adhere to standard React patterns (functional components, hooks) that are compatible with React Native.
    -   Consider how user interactions (gestures, touch events) would replace traditional mouse events and suggest appropriate abstractions.
    -   Identify and comment on any remaining web-specific dependencies or APIs that would require native module development in React Native.

**Task:**
Review and refactor `{{target_component_name}}` to maximize its compatibility with React Native. Focus on abstracting platform-specific elements, promoting reusable logic, and providing clear comments on the path to full React Native portability. Ensure the refactored component still functions correctly within the existing Electron/web frontend.

{{additional_context}}
"""
    }
}


