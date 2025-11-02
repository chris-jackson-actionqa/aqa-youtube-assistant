#!/bin/bash
#
# Setup Test Database Script
# Prepares the test database before starting servers
# - Deletes existing test database
# - Runs Alembic migrations to create schema and seed data
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/../../backend" && pwd)"
E2E_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🗄️  Setting up test database..."

# Navigate to backend directory
cd "$BACKEND_DIR"

# Detect CI environment and set Python command
if [ "$CI" = "true" ]; then
    PYTHON_CMD="python"
    echo "🔍 CI environment detected - using system Python"
    
    # Install dependencies in CI mode
    echo "📦 Installing Python dependencies..."
    pip install --upgrade pip -q
    pip install -r requirements.txt -q
    echo "✓ Dependencies installed"
else
    PYTHON_CMD=".venv/bin/python"
    echo "🔍 Local environment detected - using virtual environment"
fi

# Delete existing test database
if [ -f "youtube_assistant_test.db" ]; then
    rm -f youtube_assistant_test.db
    echo "✓ Deleted existing test database"
fi

# Run Alembic migrations
echo "📊 Running Alembic migrations..."
if [ "$CI" = "true" ]; then
    DATABASE_URL='sqlite:///./youtube_assistant_test.db' alembic upgrade head
else
    DATABASE_URL='sqlite:///./youtube_assistant_test.db' .venv/bin/alembic upgrade head
fi
echo "✓ Database migrations complete"

echo "✅ Test database ready"
