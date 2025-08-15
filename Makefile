# A1Betting7-13.2 Makefile
# Development and testing utilities

.PHONY: help observability-smoke backend frontend test lint clean

help:
	@echo "Available commands:"
	@echo "  observability-smoke  - Run observability infrastructure smoke tests"
	@echo "  backend             - Start FastAPI backend server"
	@echo "  frontend            - Start React frontend development server"
	@echo "  test                - Run backend tests with pytest"
	@echo "  lint                - Run backend linting with flake8/black"
	@echo "  clean               - Clean cache and build artifacts"

# PR8 Mini Task D - Observability smoke test
observability-smoke:
	@echo "🧪 Running Observability Smoke Tests..."
	@echo "📍 Ensure backend is running on http://127.0.0.1:8000"
	@python observability_smoke_test.py

# Development servers
backend:
	@echo "🚀 Starting FastAPI backend server..."
	python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

frontend:
	@echo "🚀 Starting React frontend development server..."
	cd frontend && npm run dev

# Testing and quality
test:
	@echo "🧪 Running backend tests..."
	pytest backend/tests/ -v

lint:
	@echo "🔍 Running backend linting..."
	flake8 backend/
	black --check backend/

# Cleanup
clean:
	@echo "🧹 Cleaning cache and build artifacts..."
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	rm -rf backend/logs/*.log