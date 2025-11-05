# Setting Up GitHub Copilot with Custom `.prompt` Files in VS Code (Enhanced for Large Codebases)

This guide provides enhanced instructions for setting up and utilizing custom `.prompt` files with GitHub Copilot in Visual Studio Code, specifically tailored for large and complex projects like A1Betting7-13.2. The goal is to empower Copilot to understand your extensive codebase, facilitate seamless frontend-backend integration, and generate highly relevant and accurate code.

## 1. Understanding `.prompt` Files and Their Role in Large Projects

In a large project with thousands of files, Copilot needs more than just basic instructions. `.prompt` files act as powerful, reusable directives that embed deep project context, architectural patterns, and development philosophies. When you invoke a command (e.g., `/playerdash`), Copilot leverages the content of the corresponding `.prompt` file, combined with its understanding of your open files and project structure, to provide intelligent suggestions. This is crucial for:

-   **Maintaining Consistency:** Ensuring generated code adheres to established patterns across your 3000+ files.
-   **Facilitating Integration:** Guiding Copilot to understand how frontend components interact with backend APIs, and vice-versa.
-   **Accelerating Development:** Reducing the need for manual corrections and detailed follow-up prompts.
-   **Architectural Adherence:** Encouraging Copilot to respect the overall system design (e.g., data flow, service boundaries).

## 2. Project Structure for `.prompt` Files

Maintain a `.copilot` directory at the root of your repository. This centralizes your Copilot configurations and makes them accessible across the entire project.

```
/your-project-root
├── .copilot/
│   ├── instructions.md  (Crucial for general, high-level guidance)
│   ├── playerdash.prompt
│   ├── aibetreco.prompt
│   ├── dataingest.prompt
│   ├── mobileref.prompt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── ... (Your 1500+ frontend files)
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── services/
│   │   └── ... (Your 1500+ backend files)
└── ...
```

## 3. Enhanced `.prompt` File Contents

These `.prompt` files have been refined to provide more explicit guidance regarding your large codebase, emphasizing architectural understanding and integration points. Remember to place these in your `.copilot` directory.

### `instructions.md` (General Project-Wide Guidance - **CRITICAL**)

This file is paramount for a large project. It provides overarching directives that Copilot should consider for *any* task. Create this file if it doesn't exist, or update it with the following content:

```markdown
# GitHub Copilot Instructions for A1Betting7-13.2 (Comprehensive)

## Project Overview

A1Betting7-13.2 is a professional sports betting intelligence platform with a large, interconnected codebase. We have approximately 1500+ frontend files (React 18, TypeScript, Vite, Electron) and 1500+ backend files (FastAPI, Python 3.11+, ML ensemble). Our core mission is to provide comprehensive sports statistics (like PropFinder) and AI-driven betting analysis (like PropGPT) in a user-friendly manner.

## Core Directives for Large Codebases

1.  **Architectural Awareness:** Always consider the overall system architecture. Understand that the frontend (`frontend/src/`) consumes data from the backend (`backend/app/api/`). Generated code must respect this separation of concerns and data flow.
2.  **Existing Codebase Integration:** Prioritize integrating with existing code patterns, utility functions, and data structures. Do not introduce redundant code. Search for and reuse existing components, services, and models.
3.  **Explicit File Paths & Context:** When working on a specific feature, assume the relevant files (e.g., `frontend/src/components/`, `backend/app/api/endpoints/`) are open or easily discoverable. If a task spans multiple files, suggest the next logical file to modify.
4.  **Frontend-Backend Contract:** When developing features that involve both frontend and backend, ensure the API contracts (request/response schemas, endpoint paths) are consistent. If a new API endpoint is needed, suggest the corresponding frontend data fetching logic, and vice-versa.
5.  **Scalability & Performance:** Given the large number of files and real-time data, always consider performance implications. Optimize data fetching, rendering, and API response times. Avoid N+1 queries and inefficient component re-renders.
6.  **Error Handling & Robustness:** Implement comprehensive error handling at both frontend (user-friendly messages, graceful degradation) and backend (logging, appropriate HTTP status codes). Assume potential failures in external data sources.
7.  **Testing Strategy:** For every new feature or modification, suggest relevant unit and integration tests that cover both frontend components and backend API endpoints. Ensure tests mock external dependencies appropriately.
8.  **Documentation & Comments:** For any non-trivial code, provide clear inline comments explaining the logic, especially for complex ML integrations or data transformations. Update relevant READMEs or architectural docs if significant changes are made.
9.  **Security Best Practices:** Adhere to all security guidelines (JWT, rate limiting, input validation via Pydantic models, CORS). Assume sensitive data handling requires extra scrutiny.
10. **Problem Solving:** When faced with ambiguity or errors, follow the "Sequential Thinking Framework" (Analyze, Research, Plan, Execute, Validate, Document) outlined in the `A1Betting Elite Autonomous Developer Mode` document. Proactively identify and suggest solutions.

## Specific Contextual Directives

-   **Frontend Components:** When creating or modifying React components, prioritize functional components, hooks, and adherence to the project's component library (if any). Focus on data visualization and user interaction.
-   **API Endpoints:** For FastAPI, use `async/await` where appropriate, define clear request/response models with Pydantic, and integrate with existing services. Ensure efficient data retrieval from the ML layer.
-   **ML Model Integration:** When connecting ML models to the API, ensure efficient data serialization/deserialization and minimal latency. Understand that ML models are served via the backend and their outputs are consumed by the frontend.

```

### `playerdash.prompt` (Enhanced)

```
# God Prompt: /playerdash

**Context:**
-   **Goal:** Implement a new player statistics dashboard component in the frontend.
-   **Frontend Location:** `frontend/src/components/PlayerDashboard.tsx`
-   **Backend API:** Expects data from `/api/player/{playerId}/performance` (returns `PlayerPerformanceData` interface, define if not exists).
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
```

### `aibetreco.prompt` (Enhanced)

```
# God Prompt: /aibetreco

**Context:**
-   **Goal:** Develop a new AI-driven betting recommendation endpoint in the backend.
-   **Backend Location:** `backend/app/api/endpoints/recommendations.py`
-   **ML Integration:** Utilize the existing ML ensemble. Assume a `ml_service.predict_betting_opportunity(data)` function exists (or suggest its creation) that returns a `BettingRecommendation` object (define Pydantic model for this).
-   **Data Input:** Requires `game_id`, `player_id` (optional), `prop_type` (e.g., 'points', 'rebounds').
-   **Output:** Return a `BettingRecommendation` Pydantic model including recommended prop, confidence score, and brief AI reasoning (if available from ML service).
-   **Requirements:**
    -   Define a FastAPI `POST` endpoint `/api/recommendations/predict` with robust request validation using Pydantic models.
    -   Implement the logic to call the `ml_service` for predictions, ensuring efficient data passing and minimal latency.
    -   Handle potential errors from the ML service or data processing gracefully, returning appropriate HTTP responses.
    -   Ensure the endpoint is optimized for response time (<500ms for heavy operations, <200ms for standard).
    -   Add comprehensive unit and integration tests for the endpoint, including mocking the ML service and data inputs.

**Task:**
Generate the FastAPI endpoint, Pydantic models for request/response, and integrate with the ML service. Focus on robust error handling, data validation, performance, and clear API design that aligns with the A1Betting backend architecture. Consider how this endpoint will be consumed by the frontend.
```

### `dataingest.prompt` (Enhanced)

```
# God Prompt: /dataingest

**Context:**
-   **Goal:** Optimize real-time data ingestion from TheOdds API for improved efficiency and reliability.
-   **Location:** `backend/app/services/data_ingestion.py` (or suggest a new module if more appropriate for a large pipeline).
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
```

### `mobileref.prompt` (Enhanced)

```
# God Prompt: /mobileref

**Context:**
-   **Goal:** Refactor a core frontend component for optimal mobile app compatibility (React Native).
-   **Target File:** `frontend/src/components/SharedStatDisplay.tsx` (a generic component displaying a single statistic, representative of components needing cross-platform adaptation).
-   **Overall Objective:** Prepare A1Betting for a future React Native mobile application, ensuring core UI logic is easily portable.
-   **Requirements:**
    -   Eliminate all direct DOM manipulation (e.g., `document.getElementById`, `window` object usage) and replace with React-idiomatic approaches.
    -   Refactor styling to use platform-agnostic methods (e.g., inline styles, CSS-in-JS solutions that compile to React Native styles, or a design system that supports both web and native).
    -   Strictly separate presentation logic from business logic and data fetching concerns.
    -   Adhere to standard React patterns (functional components, hooks) that are compatible with React Native.
    -   Consider how user interactions (gestures, touch events) would replace traditional mouse events and suggest appropriate abstractions.
    -   Identify and comment on any remaining web-specific dependencies or APIs that would require native module development in React Native.

**Task:**
Review and refactor `SharedStatDisplay.tsx` to maximize its compatibility with React Native. Focus on abstracting platform-specific elements, promoting reusable logic, and providing clear comments on the path to full React Native portability. Ensure the refactored component still functions correctly within the existing Electron/web frontend.
```

## 4. How to Use in VS Code (Refined)

1.  **Ensure `.copilot` Directory Exists:** Verify that the `.copilot` directory is present at the root of your `A1Betting7-13.2` project. If not, create it.
2.  **Populate `.prompt` Files:** Create or update the `instructions.md`, `playerdash.prompt`, `aibetreco.prompt`, `dataingest.prompt`, and `mobileref.prompt` files inside the `.copilot` directory with the enhanced content provided above.
3.  **Open VS Code:** Launch VS Code with your `A1Betting7-13.2` project open. Ensure you have the GitHub Copilot and GitHub Copilot Chat extensions installed and enabled.
4.  **Access Copilot Chat:** Open the Copilot Chat view (typically `Ctrl+I` or `Cmd+I`).
5.  **Invoke Prompts:** In the Copilot Chat input field, type your simplified commands (e.g., `/playerdash`). Copilot will now use the enhanced `.prompt` file content to generate more precise and context-aware suggestions.

## 5. Advanced Usage and Best Practices for Large Projects

-   **Leverage `instructions.md`:** This file is your primary tool for setting the overall tone and architectural understanding for Copilot. Update it regularly with new architectural decisions or project-wide best practices.
-   **Be Specific with Context:** Even with `.prompt` files, the more specific you are in the chat, the better. For example, when using `/playerdash`, you might add: "Focus on the `PlayerPerformanceChart` sub-component and ensure it uses `Chart.js` as per `frontend/src/utils/charts.ts`."
-   **Iterative Refinement & Feedback:** For complex tasks, Copilot might not get it perfect on the first try. Provide precise feedback. "That's close, but the `fetchPlayerPerformance` function needs to handle a `404 Not Found` response by displaying a user-friendly message, not just logging to console."
-   **Code Review Copilot's Output:** Always review the generated code carefully. Ensure it aligns with your project's standards, integrates correctly, and is performant. Treat Copilot as a highly productive assistant, not an autonomous developer.
-   **Keep Prompts Synchronized:** As your codebase evolves, ensure your `.prompt` files reflect the latest architectural decisions, API changes, and common patterns. This is a continuous process.
-   **Share and Collaborate:** Commit your `.copilot` directory to your version control. This ensures all team members benefit from consistent Copilot guidance and a shared understanding of how to interact with the AI assistant.

By diligently following these enhanced instructions, GitHub Copilot will become an even more powerful and integrated part of your A1Betting7-13.2 development workflow, helping you navigate and build within your large codebase more effectively.

