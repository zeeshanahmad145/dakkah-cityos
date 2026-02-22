#!/bin/bash

# Port Mapping:
#   Port 5000 - Storefront (TanStack Start + Vite) - PUBLIC facing
#   Port 9000 - Medusa Backend API - INTERNAL (proxied through Vite on 5000)
#
# Priority: Storefront starts FIRST to satisfy port detection,
#           Backend starts in parallel

export PORT=5000
export HOST=0.0.0.0
export MEDUSA_BACKEND_URL="http://127.0.0.1:9000"

# Clean up any stale processes
fuser -k 9000/tcp 5000/tcp 2>/dev/null || true
sleep 1

# Start Medusa Backend in background (port 9000)
echo "Starting Medusa backend on port 9000..."
cd /home/runner/workspace/apps/backend
npm run dev -- --port 9000 --host 0.0.0.0 &
BACKEND_PID=$!

# Start Storefront immediately (port 5000) - don't wait for backend
# Vite proxy will handle reconnection when backend becomes available
echo "Starting storefront on port 5000..."
cd /home/runner/workspace/apps/storefront
exec npm run dev -- --port 5000 --host 0.0.0.0
