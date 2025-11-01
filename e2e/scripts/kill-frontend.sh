#!/bin/bash
#
# Kill Frontend Server Script
# Finds and kills the process using port 3000 (frontend server)
# Uses lsof to find the specific PID, avoiding killing unrelated node processes
#

set -e

echo "🔍 Checking for frontend server on port 3000..."

# Find the PID using port 3000 (try lsof first, then ss as fallback)
PID=$(lsof -ti :3000 2>/dev/null || true)

# If lsof didn't find it, try using ss
if [ -z "$PID" ]; then
    PID=$(ss -tlnp 2>/dev/null | grep :3000 | grep -oP 'pid=\K[0-9]+' | head -1 || true)
fi

if [ -z "$PID" ]; then
    echo "✓ No frontend server running on port 3000"
    exit 0
fi

echo "🛑 Killing frontend server (PID: $PID)..."
kill -TERM "$PID" 2>/dev/null || true

# Wait for process to terminate (max 5 seconds)
for i in {1..5}; do
    if ! kill -0 "$PID" 2>/dev/null; then
        echo "✓ Frontend server stopped successfully"
        exit 0
    fi
    sleep 1
done

# Force kill if still running
if kill -0 "$PID" 2>/dev/null; then
    echo "⚠ Force killing frontend server..."
    kill -9 "$PID" 2>/dev/null || true
    sleep 1
fi

echo "✓ Frontend server stopped"
