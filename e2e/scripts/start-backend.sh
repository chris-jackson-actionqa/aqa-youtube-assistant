#!/bin/bash
#
# Start Backend Server Script
# Starts the FastAPI backend server with the test database
# - In CI: Uses system Python with installed dependencies
# - Locally: Uses virtual environment
# - Sets DATABASE_URL to test database
# - Starts uvicorn on port 8000 in background
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/../../backend" && pwd)"

echo "🚀 Starting backend server with test database..."

# Kill any existing backend server first
"$SCRIPT_DIR/kill-backend.sh"

# Navigate to backend directory
cd "$BACKEND_DIR"

# Determine Python command based on environment
if [ "$CI" = "true" ]; then
    echo "🏭 Running in CI mode - using system Python"
    PYTHON_CMD="python"
    UVICORN_CMD="python -m uvicorn"
else
    echo "💻 Running in local mode - using virtual environment"
    # Check if virtual environment exists
    if [ ! -d ".venv" ]; then
        echo "❌ Error: Virtual environment not found at $BACKEND_DIR/.venv"
        exit 1
    fi
    
    echo "📦 Using virtual environment: $BACKEND_DIR/.venv"
    source .venv/bin/activate
    
    PYTHON_CMD="python"
    UVICORN_CMD=".venv/bin/uvicorn"
fi

echo "🔍 Checking Python version..."
PYTHON_VERSION=$($PYTHON_CMD --version)
echo "   Python version: $PYTHON_VERSION"

# Install dependencies (CI uses pip cache, local installs if needed)
echo "📦 Installing backend dependencies..."
if [ "$CI" = "true" ]; then
    $PYTHON_CMD -m pip install --upgrade pip --quiet
    pip install -r requirements.txt --quiet
else
    pip install -q -r requirements.txt
fi

# Start server in background with test database
echo "🗄️  Using test database: youtube_assistant_test.db"
echo "🎯 Starting uvicorn server..."

DATABASE_URL='sqlite:///./youtube_assistant_test.db' \
    $UVICORN_CMD app.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    > /tmp/e2e-backend.log 2>&1 &

BACKEND_PID=$!

# Wait for server to start (max 30 seconds)
echo "⏳ Waiting for backend server to start..."
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ Backend server started successfully (PID: $BACKEND_PID)"
        echo "📝 Logs: /tmp/e2e-backend.log"
        exit 0
    fi
    
    # Check if process is still running
    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo "❌ Backend server failed to start. Check logs at /tmp/e2e-backend.log"
        tail -20 /tmp/e2e-backend.log
        exit 1
    fi
    
    sleep 1
done

echo "❌ Backend server did not respond after 30 seconds"
echo "📝 Last 20 lines of logs:"
tail -20 /tmp/e2e-backend.log
exit 1
