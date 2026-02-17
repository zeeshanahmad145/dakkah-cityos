#!/bin/bash

echo "========================================"
echo "  Dakkah CityOS Commerce — Starting"
echo "========================================"

echo "[1/2] Starting storefront on port 5000..."
cd /home/runner/workspace/apps/storefront
PORT=5000 HOST=0.0.0.0 NODE_ENV=production node server.mjs &
STOREFRONT_PID=$!

echo "[2/2] Starting Medusa backend on port 9000..."
cd /home/runner/workspace/apps/backend
NODE_ENV=production NODE_OPTIONS="--max-old-space-size=512" npx medusa start &
BACKEND_PID=$!

echo "Services started. Storefront PID=$STOREFRONT_PID, Backend PID=$BACKEND_PID"

wait -n $STOREFRONT_PID $BACKEND_PID 2>/dev/null || wait $STOREFRONT_PID
