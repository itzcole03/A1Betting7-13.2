# IPC Endpoint Documentation

This file documents all IPC endpoints exposed by `main-sportsbook-api.js` and their expected payload schemas.

---

## IPC Endpoints

### runExtensibilityHook

- **Payload:**
  - `hook` (string, required): Name of the extensibility hook
  - `args` (object, optional): Arguments for the hook

### exportData

- **Payload:**
  - `userId` (string, optional): User ID
  - `type` (string, required): One of 'settings', 'bets', 'metrics', 'all'

### getMetrics

- **Payload:**
  - `userId` (string, optional): User ID
  - `range` (string, optional): One of '24h', '7d', '30d'

### checkForUpdates

- **Payload:**
  - `userId` (string, optional): User ID
  - `currentVersion` (string, required): Current app version

### sendNotification

- **Payload:**
  - `userId` (string, optional): User ID
  - `type` (string, required): One of 'info', 'warning', 'error', 'success'
  - `message` (string, required): Notification message
  - `meta` (object, optional): Additional metadata

### getSettings

- **Payload:**
  - `userId` (string, optional): User ID

### updateSettings

- **Payload:**
  - `userId` (string, optional): User ID
  - `settings` (object, required): Settings object

### getOnboardingHelp

- **Payload:**
  - `userId` (string, optional): User ID
  - `context` (string, optional): Context string

### healthCheck

- **Payload:** None

### fetchOpticOdds

- **Payload:**
  - `userId` (string, required): User ID
  - `params` (object, required): API parameters

### fetchSportsDataIO

- **Payload:**
  - `userId` (string, required): User ID
  - `params` (object, required): API parameters

### fetchESPNData

- **Payload:**
  - `userId` (string, required): User ID
  - `sport` (string, required): Sport name
  - `league` (string, required): League name
  - `eventId` (string, required): Event ID

### fetchSportsRadarData

- **Payload:**
  - `userId` (string, required): User ID
  - `endpoint` (string, required): API endpoint
  - `params` (object, required): API parameters
  - `apiKey` (string, required): API key

### fetchOdds

- **Payload:**
  - `userId` (string, required): User ID
  - `userSecret` (string, required): User secret
  - `sport` (string, required): Sport name
  - `region` (string, optional): Region
  - `market` (string, optional): Market

---

All payloads are validated using Joi schemas for security and robustness.
