#!/bin/bash
# Stop production services

PROD_DIR="$HOME/aqa-youtube-assistant-prod"
PID_DIR="$PROD_DIR/pids"

echo "🛑 Stopping AQA YouTube Assistant (Production)..."

# Stop Backend
if [ -f "$PID_DIR/backend.pid" ]; then
    BACKEND_PID=$(cat "$PID_DIR/backend.pid")
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "Stopping backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        rm "$PID_DIR/backend.pid"
        echo "✅ Backend stopped"
    else
        echo "⚠️  Backend not running"
        rm "$PID_DIR/backend.pid"
    fi
else
    echo "⚠️  No backend PID file found"
fi

# Stop Frontend
if [ -f "$PID_DIR/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$PID_DIR/frontend.pid")
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "Stopping frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        rm "$PID_DIR/frontend.pid"
        echo "✅ Frontend stopped"
    else
        echo "⚠️  Frontend not running"
        rm "$PID_DIR/frontend.pid"
    fi
else
    echo "⚠️  No frontend PID file found"
fi

echo ""
echo "✅ Production services stopped"
