#!/bin/bash
#
# Kill Backend Server Script
# Finds and kills the process using port 8000 (backend server)
# Uses lsof to find the specific PID, avoiding killing unrelated uvicorn processes
#

set -e

echo "🔍 Checking for backend server on port 8000..."

# Find the PID using port 8000 (try lsof first, then ss as fallback)
PID=$(lsof -ti :8000 2>/dev/null || true)

# If lsof didn't find it, try using ss
if [ -z "$PID" ]; then
    PID=$(ss -tlnp 2>/dev/null | grep :8000 | grep -oP 'pid=\K[0-9]+' | head -1 || true)
fi

if [ -z "$PID" ]; then
    echo "✓ No backend server running on port 8000"
    exit 0
fi

echo "🛑 Killing backend server (PID: $PID)..."
kill -TERM "$PID" 2>/dev/null || true

# Wait for process to terminate (max 5 seconds)
for i in {1..5}; do
    if ! kill -0 "$PID" 2>/dev/null; then
        echo "✓ Backend server stopped successfully"
        exit 0
    fi
    sleep 1
done

# Force kill if still running
if kill -0 "$PID" 2>/dev/null; then
    echo "⚠ Force killing backend server..."
    kill -9 "$PID" 2>/dev/null || true
    sleep 1
fi

echo "✓ Backend server stopped"
