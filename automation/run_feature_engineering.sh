#!/bin/bash
# Run feature engineering for a given sport after ETL
# Usage: ./run_feature_engineering.sh MLB
SPORT=${1:-MLB}
echo "[FEATURE] Starting feature engineering for $SPORT at $(date)"
python backend/services/comprehensive_feature_engine.py --sport $SPORT > automation/logs/feature_$SPORT.log 2>&1
echo "[FEATURE] Finished feature engineering for $SPORT at $(date)"
