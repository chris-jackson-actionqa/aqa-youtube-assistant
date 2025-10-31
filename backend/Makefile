# Makefile for backend development tasks

.PHONY: help format lint type-check test install install-dev clean migrate migrate-all migrate-dev migrate-test

help:
	@echo "Available commands:"
	@echo "  make install       - Install production dependencies"
	@echo "  make install-dev   - Install development dependencies"
	@echo "  make format        - Format code with Ruff"
	@echo "  make lint          - Check code with Ruff linter"
	@echo "  make type-check    - Check types with mypy"
	@echo "  make test          - Run tests with coverage"
	@echo "  make migrate-all   - Run migrations on BOTH dev and test databases (recommended)"
	@echo "  make migrate-dev   - Run migrations on development database only"
	@echo "  make migrate-test  - Run migrations on E2E test database only"
	@echo "  make clean         - Remove cache and temp files"

install:
	pip install -r requirements.txt

install-dev:
	pip install -r requirements-dev.txt

format:
	ruff format .
	ruff check --fix .

lint:
	ruff check .

type-check:
	mypy app/

test:
	pytest unit_tests/ integration_tests/ -v --cov=app --cov-report=term --cov-report=html

# Database migrations
# NOTE: Dev and E2E test databases are SEPARATE files
# See docs/DATABASE_MANAGEMENT.md for details
migrate-all: migrate-dev migrate-test
	@echo "✅ Migrated both development and test databases"

migrate-dev:
	@echo "Migrating development database (youtube_assistant.db)..."
	python migrate_add_workspaces.py

migrate-test:
	@echo "Migrating E2E test database (youtube_assistant_test.db)..."
	DATABASE_URL="sqlite:///./youtube_assistant_test.db" python migrate_add_workspaces.py

# Alias for migrate-all (most common use case)
migrate: migrate-all

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache .mypy_cache .ruff_cache htmlcov .coverage
