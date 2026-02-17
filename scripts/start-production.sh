#!/bin/bash

echo "========================================"
echo "  Dakkah CityOS Commerce — Production"
echo "========================================"

fuser -k 9000/tcp 2>/dev/null || true
fuser -k 5000/tcp 2>/dev/null || true
sleep 1

echo "Starting storefront on port 5000..."
cd /home/runner/workspace/apps/storefront
PORT=5000 HOST=0.0.0.0 NODE_ENV=production node server.mjs &
STOREFRONT_PID=$!

echo "Running database migrations..."
cd /home/runner/workspace/apps/backend
NODE_OPTIONS="--max-old-space-size=512" npx medusa db:migrate 2>&1 | tail -5
echo "Migrations complete."

echo "Starting Medusa backend on port 9000..."
NODE_ENV=production NODE_OPTIONS="--max-old-space-size=512" npx medusa start &
BACKEND_PID=$!

wait $STOREFRONT_PID
