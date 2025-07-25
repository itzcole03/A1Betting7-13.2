# Frontend Developer Guide — PropGPT (A1Betting)

## 🔥 Product Focus: PropGPT/PropOllama/AI/Analytics/Chat

This app is now a PropGPT/PropOllama competitor, focused on advanced AI-powered prop research, analytics, and chat. All generic betting, dashboard, and user profile features have been removed from the main exports and UI.

## � Key Features

- PropOllamaUnified: AI-powered prop research and chat interface
- AnalyticsTab: Advanced analytics and insights
- QuantumAITab: Quantum-enhanced AI analytics and predictions
- PredictionDisplay: Latest AI/ML prop predictions and confidence
- Automated backend discovery (dev)
- Graceful fallback UI for backend errors
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
- All generic betting/dashboard/user profile features are deprecated. Use only the new PropGPT/AI/analytics/chat components from `user-friendly/index.tsx`.

## 📂 Scripts

- `start-dev.ps1`: Automated dev startup
- `monitor_backend.py`: Backend health monitor
