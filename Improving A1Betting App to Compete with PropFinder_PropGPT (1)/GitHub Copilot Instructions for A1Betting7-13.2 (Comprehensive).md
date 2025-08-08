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



