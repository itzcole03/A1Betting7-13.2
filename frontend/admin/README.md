# Admin Rule Management UI

This project is a secure React-admin dashboard for managing business rules, audit trails, and system status for A1Betting. Features:

- Admin authentication (placeholder, integrate with backend)
- View and edit business rules (YAML, global and per-user)
- View audit trail/history (from backend API)
- Propose rule changes (inline YAML editor, upload, or diff)
- View recent violations (if available)
- Material UI and Monaco/Ace editor for YAML

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Security

- All API calls require admin authentication.
- UI is for authorized users only.
- All rule changes are auditable and logged.

## Next Steps

- Integrate backend authentication
- Implement YAML validation and diff preview
- Connect to backend API endpoints for rules and audit log
- Add end-to-end tests
