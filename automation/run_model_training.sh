#!/bin/bash
# Run model training and evaluation for a given sport
# Usage: ./run_model_training.sh MLB
SPORT=${1:-MLB}
echo "[MODEL] Starting model training for $SPORT at $(date)"
python backend/services/real_ml_training_service.py --sport $SPORT > automation/logs/model_$SPORT.log 2>&1
echo "[MODEL] Finished model training for $SPORT at $(date)"
