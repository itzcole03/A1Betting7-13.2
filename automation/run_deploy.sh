#!/bin/bash
# Deploy updated models for a given sport
# Usage: ./run_deploy.sh MLB
SPORT=${1:-MLB}
echo "[DEPLOY] Deploying model for $SPORT at $(date)"
python backend/deploy_etl_production.sh $SPORT > automation/logs/deploy_$SPORT.log 2>&1
echo "[DEPLOY] Finished deployment for $SPORT at $(date)"
