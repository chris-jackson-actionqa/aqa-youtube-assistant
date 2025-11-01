#!/bin/bash
#
# Setup Test Database Script
# Prepares the test database before starting servers
# - Deletes existing test database
# - Runs migrations to create tables
# - Creates default workspace
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

# Run database migration
echo "📊 Running database migrations..."
DATABASE_URL='sqlite:///./youtube_assistant_test.db' $PYTHON_CMD -c "
from app.database import SessionLocal, engine, Base
from app.models import Project, Workspace

# Create all tables
Base.metadata.create_all(bind=engine)
print('✓ Database tables created')
"

# Create default workspace
echo "🏢 Creating default workspace..."
DATABASE_URL='sqlite:///./youtube_assistant_test.db' $PYTHON_CMD -c "
from app.database import SessionLocal
from app.models import Workspace

db = SessionLocal()

# Check if default workspace exists
if not db.query(Workspace).filter(Workspace.id == 1).first():
    workspace = Workspace(id=1, name='Default Workspace', description='Default workspace for all projects')
    db.add(workspace)
    db.commit()
    print('✓ Created default workspace')
else:
    print('✓ Default workspace already exists')

db.close()
"

echo "✅ Test database ready"
