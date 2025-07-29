#!/bin/bash
# Run ETL for a given sport (e.g., MLB, NBA)
# Usage: ./run_etl.sh MLB
SPORT=${1:-MLB}
echo "[ETL] Starting ETL for $SPORT at $(date)"
python backend/data_pipeline.py --sport $SPORT > automation/logs/etl_$SPORT.log 2>&1
echo "[ETL] Finished ETL for $SPORT at $(date)"
