# Backend Security Scan Guide

## Purpose

This guide explains how to run the automated security hardening scan for the backend and integrate it into CI/CD pipelines.

## How to Run Manually

1. Ensure you have Python 3.13+ installed.
2. From the `backend/` directory, run:
   ```bash
   bash run_security_scan.sh
   ```
3. The scan will output results and save a report to `security_report.json`.
4. If vulnerabilities are found, the script will exit with a non-zero code and print a warning.

## CI/CD Integration

- Add the following step to your CI/CD pipeline before deployment:
  ```bash
  bash backend/run_security_scan.sh
  ```
- The build will fail if vulnerabilities are detected.

## Report

- Review `security_report.json` for details on vulnerabilities and affected files.
- Fix all HIGH severity issues before merging or deploying.

## Maintainers

- Update this guide if the security scan logic or script changes.
- For questions, see `security_hardening.py` or contact the backend lead.
