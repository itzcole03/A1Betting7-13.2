# Frontend Developer Guide — A1Betting

## 🔑 Key Features
- Automated backend discovery (dev)
- Graceful fallback UI for backend errors
- Backend version check
- Centralized API service (no hardcoded URLs)
- Environment-specific config via `.env.development` and `.env.production`
- Health monitoring and onboarding scripts

## 🚦 Quick Start
1. Set your backend URL in `.env.development` or `.env.production`.
2. Run the onboarding script:
   ```powershell
   ./start-dev.ps1
   ```
3. The frontend will auto-discover the backend and show a clear error if unreachable.
4. Use `monitor_backend.py` to monitor backend health.

## 🛠️ Best Practices
- Use `discoverBackend()` for all API calls.
- Never hardcode backend URLs.
- Handle null from `discoverBackend()`.
- Check the error banner for backend connectivity issues.

## 📝 Migration Note
- All references to `backendDiscovery` have been removed. Use `discoverBackend()` instead.

## 📂 Scripts
- `start-dev.ps1`: Automated dev startup
- `monitor_backend.py`: Backend health monitor
