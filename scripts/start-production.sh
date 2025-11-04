#!/bin/bash
# Start production services

set -e

PROD_DIR="$HOME/aqa-youtube-assistant-prod"
PID_DIR="$PROD_DIR/pids"

echo "🚀 Starting AQA YouTube Assistant (Production)..."

# Check if production directory exists
if [ ! -d "$PROD_DIR" ]; then
    echo "❌ Error: Production directory not found at $PROD_DIR"
    echo "   Run ./scripts/deploy-production.sh first"
    exit 1
fi

# Create PID directory
mkdir -p "$PID_DIR"

# Check if already running
if [ -f "$PID_DIR/backend.pid" ] && kill -0 $(cat "$PID_DIR/backend.pid") 2>/dev/null; then
    echo "⚠️  Backend already running (PID: $(cat $PID_DIR/backend.pid))"
else
    # Start Backend
    echo ""
    echo "🐍 Starting backend on port 8001..."
    cd "$PROD_DIR/backend"
    source venv-prod/bin/activate
    nohup uvicorn app.main:app --host 0.0.0.0 --port 8001 > "$PROD_DIR/backend.log" 2>&1 &
    echo $! > "$PID_DIR/backend.pid"
    deactivate
    echo "✅ Backend started (PID: $(cat $PID_DIR/backend.pid))"
    echo "   Log: $PROD_DIR/backend.log"
    cd - > /dev/null
fi

# Wait a moment for backend to start
sleep 2

# Check if already running
if [ -f "$PID_DIR/frontend.pid" ] && kill -0 $(cat "$PID_DIR/frontend.pid") 2>/dev/null; then
    echo "⚠️  Frontend already running (PID: $(cat $PID_DIR/frontend.pid))"
else
    # Start Frontend
    echo ""
    echo "⚛️  Starting frontend on port 3001..."
    cd "$PROD_DIR/frontend"
    nohup npm start -- -p 3001 > "$PROD_DIR/frontend.log" 2>&1 &
    echo $! > "$PID_DIR/frontend.pid"
    echo "✅ Frontend started (PID: $(cat $PID_DIR/frontend.pid))"
    echo "   Log: $PROD_DIR/frontend.log"
    cd - > /dev/null
fi

echo ""
echo "✅ Production services started!"
echo ""
echo "Access the application:"
echo "  Frontend: http://localhost:3001"
echo "  Backend:  http://localhost:8001"
echo "  API Docs: http://localhost:8001/docs"
echo ""
echo "To stop: ./scripts/stop-production.sh"
