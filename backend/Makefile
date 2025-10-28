# Makefile for backend development tasks

.PHONY: help format lint type-check test install install-dev clean

help:
	@echo "Available commands:"
	@echo "  make install       - Install production dependencies"
	@echo "  make install-dev   - Install development dependencies"
	@echo "  make format        - Format code with Ruff"
	@echo "  make lint          - Check code with Ruff linter"
	@echo "  make type-check    - Check types with mypy"
	@echo "  make test          - Run tests with coverage"
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

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache .mypy_cache .ruff_cache htmlcov .coverage
