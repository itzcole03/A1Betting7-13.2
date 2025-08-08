# God Prompt: /playerdash

**Context:**

- **File:** `frontend/src/components/PlayerDashboard.tsx`
- **Data Source:** Backend FastAPI endpoint `/api/player/{playerId}/performance` (returns `PlayerPerformanceData` interface).
- **Design Inspiration:** PropFinder's Player Dashboard (focus on clear trends, matchup analysis, and advanced stats visualization).
- **Requirements:**
  - Display player name, team, and position.
  - Show recent game logs (last 5-10 games) with key stats (points, rebounds, assists, etc.).
  - Include a small chart (e.g., line chart) visualizing a selected stat's trend over recent games.
  - Allow selection of different stats to visualize (e.g., dropdown).
  - Ensure responsiveness and adherence to existing A1Betting frontend styles.
  - Write unit tests for data fetching and component rendering.

**Task:**
Generate the React TypeScript functional component `PlayerDashboard` that fetches data, displays it in a user-friendly table, and includes a basic trend chart. Prioritize clean, readable code and efficient data handling. Include necessary imports and type definitions.
