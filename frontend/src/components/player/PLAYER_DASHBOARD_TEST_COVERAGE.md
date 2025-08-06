# Player Dashboard Test Coverage

## Integration & Component Tests (Vitest/Jest)

- **PlayerDashboardContainer**: Renders loading, error, empty, and data states
- **usePlayerDashboardState**: Validates state transitions and API boundary
- **API Schema Compliance**: Ensures dashboard data matches expected structure at the frontend boundary
- **Correlation ID**: Propagation from frontend to backend is asserted at the request boundary
- **Mocked Backend**: All API calls are intercepted and mocked using MSW

### Limitations

- Does not test real backend or database
- Correlation ID is not checked in backend logs, only at request boundary
- Schema compliance is checked by rendering, not by full runtime type validation
- E2E navigation/search flows are not covered here (see E2E tests)

## E2E Tests (Playwright)

- **User Flow**: Loads dashboard for a player, validates data rendering
- **Navigation/Search**: Simulates main search page, player selection, navigation to dashboard, and back navigation (browser and UI)
- **Loading/Error/Empty States**: Simulates slow, error, and empty API responses for both search and dashboard
- **Error Recovery**: User can retry failed search or dashboard loads
- **Correlation ID**: Propagation checked at request boundary
- **API Mocking**: All backend calls are intercepted and mocked

### Limitations & Usability Issues

- Does not test real backend or database
- Correlation ID is not checked in backend logs, only at request boundary
- Loading indicators are present, but no spinner animation (consider adding for better feedback)
- Back navigation via browser works, but UI 'Back' button is not always visible (consider persistent back button)
- Keyboard navigation (Tab/Enter) works for search, but not for dashboard quick actions (accessibility improvement)
- For full production validation, add backend log checks and multi-player navigation flows

---

**Summary & Next Steps:**

- All critical dashboard states, navigation/search flows, and error recovery are now covered by integration and E2E tests
- Mocked backend ensures deterministic, isolated test runs
- Usability improvements recommended: add loading spinner, persistent back button, and improve dashboard keyboard accessibility
- For full production validation, add backend log checks and multi-player navigation flows
