#!/bin/bash
#
# Start Frontend Server Script
# Starts the Next.js frontend development server
# - Starts on port 3000 in background
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/../../frontend" && pwd)"

echo "🚀 Starting frontend server..."

# Kill any existing frontend server first
"$SCRIPT_DIR/kill-frontend.sh"

# Navigate to frontend directory
cd "$FRONTEND_DIR"

# Check Node.js version
echo "🔍 Checking Node.js version..."
NODE_VERSION=$(node --version)
echo "   Node version: $NODE_VERSION"

# Install dependencies
echo "📦 Installing frontend dependencies..."
npm install --quiet

# Start server in background
echo "🎯 Starting Next.js dev server..."

npm run dev > /tmp/e2e-frontend.log 2>&1 &

FRONTEND_PID=$!

# Wait for server to start (max 60 seconds - Next.js can be slow)
echo "⏳ Waiting for frontend server to start..."
for i in {1..60}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Frontend server started successfully (PID: $FRONTEND_PID)"
        echo "📝 Logs: /tmp/e2e-frontend.log"
        exit 0
    fi
    
    # Check if process is still running
    if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo "❌ Frontend server failed to start. Check logs at /tmp/e2e-frontend.log"
        tail -20 /tmp/e2e-frontend.log
        exit 1
    fi
    
    sleep 1
done

echo "❌ Frontend server did not respond after 60 seconds"
echo "📝 Last 20 lines of logs:"
tail -20 /tmp/e2e-frontend.log
exit 1
