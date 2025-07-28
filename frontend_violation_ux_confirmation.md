# Frontend Violation UX Confirmation: Action Required

## Context

- The backend now provides granular violation reasons for each bet filtered by business rules (see API docs and response examples).
- These reasons are surfaced in both the bet object (`violations` array) and top-level response metadata.

## Request

- Please confirm that violation reasons are clearly visible and actionable in both the user and admin UI.
- Attach screenshots or a short demo video showing:
  - How violations are displayed to end users (e.g., tooltips, banners, modals, etc.)
  - How violations are displayed to admins (e.g., audit logs, dashboards, etc.)
- If not yet implemented, please file a ticket and track progress.

## Reference

- See `API_DOCUMENTATION.md` for violation schema and response examples.
- For questions, contact the backend team.

---

**Status:**

- [ ] Violation reasons visible in user UI
- [ ] Violation reasons visible in admin UI
- [ ] Screenshots/demo attached
- [ ] Ticket filed if not yet implemented
