#!/bin/bash
# Check status of production services

PROD_DIR="$HOME/aqa-youtube-assistant-prod"
PID_DIR="$PROD_DIR/pids"

echo "📊 AQA YouTube Assistant (Production) - Status"
echo ""

# Check Backend
if [ -f "$PID_DIR/backend.pid" ]; then
    BACKEND_PID=$(cat "$PID_DIR/backend.pid")
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "✅ Backend: RUNNING (PID: $BACKEND_PID, Port: 8001)"
    else
        echo "❌ Backend: STOPPED (stale PID file)"
    fi
else
    echo "❌ Backend: STOPPED"
fi

# Check Frontend
if [ -f "$PID_DIR/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$PID_DIR/frontend.pid")
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "✅ Frontend: RUNNING (PID: $FRONTEND_PID, Port: 3001)"
    else
        echo "❌ Frontend: STOPPED (stale PID file)"
    fi
else
    echo "❌ Frontend: STOPPED"
fi

echo ""
echo "Production directory: $PROD_DIR"
