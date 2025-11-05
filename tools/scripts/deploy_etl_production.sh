#!/bin/bash
# ETL Production Deployment Script

set -e

# Activate virtual environment (if applicable)
# source venv/bin/activate

# Install dependencies
pip install -r backend/enhanced_requirements.txt

# Set environment variables (example)
export A1BETTING_SENTRY_DSN="<your_sentry_dsn>"
export A1BETTING_ALERT_SLACK_WEBHOOK="<your_slack_webhook_url>"
export A1BETTING_ALERT_EMAIL="<your_alert_email>"
export LOG_LEVEL="INFO"
export PROMETHEUS_PORT=8001

# Start Prometheus metrics server and ETL pipeline
python backend/etl_providerx_sample.py

# For production, use a process manager (e.g., systemd, supervisor, pm2)
# Example: systemctl start etl-pipeline

# Health check (optional)
curl http://localhost:8001/metrics

echo "ETL pipeline deployed and running. Monitor Prometheus, Sentry, and Slack for alerts."
