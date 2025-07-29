# Sport-by-Sport Automation Scripts

This directory contains automation scripts for ETL, feature engineering, model training, evaluation, and deployment for each sport (MLB, NBA, etc.).

## Usage

- `run_etl.sh <SPORT>`: Run ETL pipeline for the given sport (default: MLB)
- `run_feature_engineering.sh <SPORT>`: Run feature engineering after ETL
- `run_model_training.sh <SPORT>`: Run model training and evaluation
- `run_deploy.sh <SPORT>`: Deploy updated models to API endpoints

All logs are saved in `automation/logs/`.

## Best Practices

- Schedule these scripts via cron, Airflow, or CI/CD for full automation.
- Monitor logs and set up alerts for failures or anomalies.
- Update and document scripts as new sports are added.
