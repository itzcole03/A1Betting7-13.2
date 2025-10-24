# PropFinder.app Reconnaissance Tools

This directory contains competitive intelligence tools for analyzing PropFinder.app to inform our A1Betting development strategy.

## 🎯 Purpose

These reconnaissance scripts capture PropFinder.app's:

- API endpoints and network architecture
- Technology stack and framework choices
- UI/UX features and interaction patterns
- Performance characteristics
- Bundle composition and dependencies

## 🛠️ Available Tools

### 1. Node.js + Puppeteer (Most Comprehensive)

**File:** `recon.js`
**Best for:** Detailed analysis with screenshots and interaction testing

```bash
# Install dependencies
npm install

# Run reconnaissance
npm run recon
```

**Outputs:**

- `analysis/propfinder_analysis.json` - Comprehensive structured data
- `analysis/propfinder_screenshot.png` - Full page screenshot
- `analysis/propfinder_endpoints.txt` - API endpoints discovered
- `analysis/competitive_analysis.md` - Strategic analysis report

### 2. PowerShell (Windows Native)

**File:** `recon.ps1`
**Best for:** Windows environments without Node.js dependencies

```powershell
# Run reconnaissance
.\recon.ps1
```

**Features:**

- Bundle download and analysis
- Technology stack detection
- API endpoint extraction
- Connectivity testing

### 3. Shell/Bash (Cross-platform)

**File:** `recon.sh`
**Best for:** Linux/macOS or CI environments

```bash
# Make executable and run
chmod +x recon.sh
./recon.sh
```

**Features:**

- Lightweight analysis
- Bundle parsing with grep/sed
- Technology detection
- Basic connectivity tests

## 📊 Analysis Output Structure

All tools generate files in the `analysis/` directory:

```
analysis/
├── competitive_analysis.md       # Main strategic report
├── propfinder_index.html        # Homepage source
├── propfinder_bundles.txt        # JS bundle URLs
├── propfinder_endpoints.txt      # API endpoints found
├── tech_analysis.txt            # Technology stack detection
├── api_test.txt                 # Connectivity test results
├── bundle_*                     # Downloaded JS bundles
└── propfinder_screenshot.png    # Visual capture (Puppeteer only)
```

## 🔍 What Gets Analyzed

### Technology Stack Detection

- **Frameworks:** React, Vue, Angular
- **Build Tools:** Webpack, Vite, Rollup
- **Styling:** Tailwind CSS, Bootstrap, Styled Components
- **State Management:** Redux, Zustand, MobX
- **Real-time:** Socket.IO, WebSockets

### API Architecture Analysis

- Endpoint discovery from bundle analysis
- HTTP method patterns
- GraphQL usage detection
- Authentication mechanisms
- Rate limiting indicators

### Performance Metrics

- Initial load times
- Bundle sizes and composition
- Network request patterns
- Critical rendering path

### Feature Detection

- Search functionality
- Filtering systems
- Real-time updates
- Bookmark/save features
- Mobile responsiveness

## 🎯 Using Results for Development

### 1. Review Competitive Analysis Report

```bash
# Read the main strategic insights
cat analysis/competitive_analysis.md
```

### 2. Compare API Endpoints

```bash
# Compare discovered endpoints with our current implementation
diff analysis/propfinder_endpoints.txt <(grep -o '/api/[^"]*' backend/routes/*.py)
```

### 3. Technology Stack Alignment

Review `tech_analysis.txt` to ensure our React/TypeScript/Vite stack is competitive.

### 4. Feature Gap Analysis

Use detected features to prioritize our issues.json roadmap tickets.

## 🚀 Integration with Development Workflow

### Pre-Development Intelligence

```bash
# Run reconnaissance before major feature development
npm run recon

# Review findings
cat analysis/competitive_analysis.md

# Update roadmap based on discoveries
git add analysis/
git commit -m "Update competitive analysis - $(date +%Y-%m-%d)"
```

### Continuous Monitoring

Set up regular reconnaissance runs to track PropFinder.app changes:

```bash
# Weekly competitive analysis (add to cron/task scheduler)
0 9 * * 1 cd /path/to/A1Betting7-13.2/scripts && npm run recon
```

## 🛡️ Ethical Considerations

These tools:

- ✅ Only analyze publicly available information
- ✅ Respect robots.txt and rate limits
- ✅ Use legitimate web scraping techniques
- ✅ Generate competitive intelligence for feature parity

They do NOT:

- ❌ Attempt to access private/protected data
- ❌ Perform any malicious activities
- ❌ Violate terms of service
- ❌ Extract user data or personal information

## 🔧 Troubleshooting

### Common Issues

**Puppeteer Install Fails:**

```bash
# Install Chromium manually
npx puppeteer browsers install chrome
```

**PowerShell Execution Policy:**

```powershell
# Temporarily allow script execution
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

**Network Timeouts:**
Check internet connection and try increasing timeout values in the scripts.

**Bundle Download Fails:**
Some bundles may be behind CDNs with different CORS policies - this is normal.

## 📈 Roadmap Integration

Use reconnaissance results to inform issues.json ticket priorities:

1. **High Priority:** Missing API endpoints we should implement
2. **Medium Priority:** Technology choices that provide competitive advantage
3. **Low Priority:** Nice-to-have features for future phases

## 🤝 Contributing

When adding new reconnaissance capabilities:

1. Maintain ethical scraping practices
2. Add error handling for network failures
3. Structure output in consistent JSON/Markdown format
4. Update this README with new tool documentation
5. Test across different environments (Windows/macOS/Linux)

## 📋 Next Steps After Running Reconnaissance

1. **Review** `analysis/competitive_analysis.md` for strategic insights
2. **Compare** discovered endpoints with our current `/api/propfinder/*` routes
3. **Prioritize** issues.json tickets based on competitive gaps
4. **Implement** missing features with focus on exceeding PropFinder capabilities
5. **Schedule** regular reconnaissance updates to track competition

---

## 🗂️ Script inventory & guardrails

> ⚠️ Many scripts in this directory can mutate production data or hit billable
> third-party APIs. Always double-check the **Environment** column before
> running anything and prefer dry-run/test options where available.

### Safe utilities (diagnostic/read-only)

| Script                                                         | Environment | Notes                                                                                                         |
| -------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------- |
| `list_routes.py`                                               | Dev/CI      | Lists registered FastAPI routes; safe for baseline diffing.                                                   |
| `check_import.py`                                              | Dev/CI      | Validates Python imports + circular dependencies.                                                             |
| `diagnose_syntax.py`, `show_syntax_error.py`                   | Dev         | Helps debug failing scripts; no network calls.                                                                |
| `generate_service_dependency_report.py`                        | Dev         | Produces `reports/service_dependency_report.json` (gitignored); use when pruning services.                    |
| `security/generate_sensitive_blob_list.py`                     | Dev/CI      | Scans git history for sensitive blobs and writes a gitignored JSON report under `reports/security/`.          |
| `security/audit_logs_for_secrets.py`                           | Dev/CI      | Scans `logs/` directories for secret-like strings; emits summary and optional JSON under `reports/security/`. |
| `check_backend_system_monitor.py`, `check_recent_snapshots.py` | Dev         | Read-only health checks against local env or snapshots.                                                       |
| `recon.*` (see above)                                          | Dev/CI      | Competitive analysis only; respects rate limits.                                                              |

### Side-effecting scripts (use caution)

| Script                                                                               | Environment                       | Potential impact                                                                                                  |
| ------------------------------------------------------------------------------------ | --------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `run_backfill.py`, `run_backfill_bestline_names.py`, `backfill_aggregates.py`        | **Prod only** (with ops approval) | Writes backfill data to production DBs. Coordinate with data engineering before running.                          |
| `run_nba_ingestion.py`, `prizepicks_api_scraper.py`, `prizepicks_stealth_scraper.py` | Dev/Prod                          | Calls external provider APIs; may trigger rate limits or account bans. Ensure credentials/rotations are approved. |
| `retrain_win_probability_model.py`, `train_model.py`                                 | Dev (GPU/ML env)                  | Trains models and writes outputs under `mlruns/`. Heavy compute cost.                                             |
| `run-load-tests.ps1`, `auto_endpoint_test.py`, `smoke*.py`                           | Staging                           | Generates load and smoke traffic; never run against prod without SRE sign-off.                                    |
| `deploy_model.py`, `run_deploy.sh` (under `automation/`)                             | Prod pipeline                     | Pushes updated models/services. Follow deployment RFC before invoking.                                            |

### Autonomous / legacy helpers (quarantine)

| Script                                                                    | Status            | Next step                                                     |
| ------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------- |
| `auto_accessibility_audit.js`, `auto_ui_test.js`, `auto_endpoint_test.py` | Legacy automation | Validate usefulness; migrate to documented CI jobs or retire. |
| `autonomous_*`, `background_agents.py`, `agent_planner.py` (backend root) | Deprecated        | Pending archival per audit Section 8. Avoid executing.        |
| `recon.ps1` duplicates                                                    | Active            | Keep one canonical script once PowerShell usage is confirmed. |

### Execution checklist

1. Verify you are in the correct environment (local dev vs staging vs prod).
2. Export required environment variables (`.env`, credentials) explicitly—do
   not rely on repo-stored secrets.
3. Dry run where possible (`--dry-run`, `--noop`, or read-only variants).
4. Document the run in the audit log or relevant runbook when touching
   production data.
5. Open a follow-up PR/issue if a script lacks logging, config, or guardrails.

Maintaining this table satisfies the automation-governance action item captured
in Section 16 of `PROJECT_GLOBAL_AUDIT.md`. Update the classification whenever
new scripts are added or existing ones change behavior.
