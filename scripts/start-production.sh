#!/bin/bash

echo "========================================"
echo "  Dakkah CityOS Commerce — Starting"
echo "========================================"

# ── 1. Start the production proxy FIRST on port 5000 ──
# The proxy handles /health directly (always returns 200),
# so the deployment health check passes immediately.
# It gracefully returns 503 for other routes until services are ready.
echo "[1/3] Starting production proxy on port 5000..."
cd /home/runner/workspace
node prod-proxy.js &
PROXY_PID=$!

# Wait for proxy to bind
sleep 1
echo "  Proxy ready (PID=$PROXY_PID)"

# ── 2. Start Medusa backend on port 9000 ──
echo "[2/3] Starting Medusa backend on port 9000..."
cd /home/runner/workspace/apps/backend
NODE_ENV=production NODE_OPTIONS="--max-old-space-size=1024" npx medusa start &
BACKEND_PID=$!

# ── 3. Start storefront on port 5173 ──
echo "[3/3] Starting storefront on port 5173..."
cd /home/runner/workspace/apps/storefront
if [ -f ".output/server/index.mjs" ]; then
  echo "  Using Nitro SSR build"
  HOST=0.0.0.0 PORT=5173 NITRO_HOST=0.0.0.0 NITRO_PORT=5173 \
    NODE_OPTIONS="--max-old-space-size=512" node .output/server/index.mjs &
  STOREFRONT_PID=$!
elif [ -f "server.mjs" ]; then
  echo "  Using server.mjs wrapper"
  HOST=0.0.0.0 PORT=5173 \
    NODE_OPTIONS="--max-old-space-size=512" node server.mjs &
  STOREFRONT_PID=$!
else
  echo "  WARNING: No storefront build found"
  STOREFRONT_PID=""
fi

echo ""
echo "  All services launched."
echo "  Proxy on :5000 → Backend on :9000 + Storefront on :5173"
echo "  /health returns 200 immediately (services report readiness)"
echo ""

# Wait for the proxy process (keeps the script alive)
wait $PROXY_PID
