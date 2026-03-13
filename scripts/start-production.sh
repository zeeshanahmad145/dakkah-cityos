#!/bin/bash

echo "========================================"
echo "  Dakkah CityOS Commerce — Starting"
echo "========================================"

# ── 1. Start the production proxy FIRST on port 5000 ──
echo "[1/3] Starting production proxy on port 5000..."
cd /root/srv/marketplace/apps/dakkah-cityos
if command -v pm2 &> /dev/null; then
  pm2 start prod-proxy.js --name "cityos-proxy"
else
  node prod-proxy.js &
  PROXY_PID=$!
fi
sleep 1
echo "  Proxy ready"

# ── 2. Start Medusa backend on port 9001 ──
echo "[2/3] Starting Medusa backend on port 9001..."
cd /root/srv/apps/marketplace/dakkah-cityos/apps/backend
if command -v pm2 &> /dev/null; then
  pm2 start "NODE_ENV=production PORT=9001 NODE_OPTIONS='--max-old-space-size=1024' npx medusa start" --name "cityos-backend"
else
  NODE_ENV=production PORT=9001 NODE_OPTIONS="--max-old-space-size=1024" npx medusa start &
  BACKEND_PID=$!
fi

# ── 3. Start storefront on port 5173 ──
echo "[3/3] Starting storefront on port 5173..."
cd /root/srv/apps/marketplace/dakkah-cityos/apps/storefront
if [ -f ".output/server/index.mjs" ]; then
  echo "  Using Nitro SSR build"
  if command -v pm2 &> /dev/null; then
    pm2 start "HOST=0.0.0.0 PORT=5173 NODE_OPTIONS='--max-old-space-size=512' node .output/server/index.mjs" --name "cityos-storefront"
  else
    HOST=0.0.0.0 PORT=5173 NODE_OPTIONS="--max-old-space-size=512" node .output/server/index.mjs &
    STOREFRONT_PID=$!
  fi
else
  echo "  WARNING: No storefront build found"
  STOREFRONT_PID=""
fi

cd /root/srv/apps/dakkah-cityos
echo ""
echo "  All services launched."
echo "  Proxy on :5000 → Backend on :9001 + Storefront on :5173"
echo "  /health returns 200 immediately (services report readiness)"

# Wait for the proxy process (keeps the script alive)
wait $PROXY_PID