#!/bin/bash
# Run backend security hardening scan and fail on vulnerabilities
set -e

python security_hardening.py

if grep -q '"total_vulnerabilities": 0' security_report.json; then
  echo "✅ No security vulnerabilities detected."
else
  echo "❌ Security vulnerabilities found! See security_report.json."
  exit 1
fi
