#!/bin/bash
#
# Start Backend Server Script
# Starts the FastAPI backend server with the test database
# - Activates virtual environment
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

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "❌ Error: Virtual environment not found at $BACKEND_DIR/.venv"
    exit 1
fi

echo "📦 Using virtual environment: $BACKEND_DIR/.venv"

# Activate virtual environment and check Python version
source .venv/bin/activate

echo "🔍 Checking Python version..."
PYTHON_VERSION=$(python --version)
echo "   Python version: $PYTHON_VERSION"

# Install dependencies
echo "📦 Installing backend dependencies..."
pip install -q -r requirements.txt

# Start server in background with test database
echo "🗄️  Using test database: youtube_assistant_test.db"
echo "🎯 Starting uvicorn server..."

DATABASE_URL='sqlite:///./youtube_assistant_test.db' \
    .venv/bin/uvicorn app.main:app \
    --host 127.0.0.1 \
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
