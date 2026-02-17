#!/bin/bash

# ── 1. Use Replit-provided PostgreSQL database ──
echo "Using Replit PostgreSQL database..."

# ── 2. Kill any stale processes on our ports ──
fuser -k 9000/tcp 2>/dev/null
fuser -k 5000/tcp 2>/dev/null
sleep 1

# ── 3. Start Medusa backend ──
cd /home/runner/workspace/apps/backend
echo "Starting Medusa backend..."
# Use 'start' if built, otherwise 'develop'
if [ -d ".medusa/server" ]; then
  NODE_OPTIONS="--max-old-space-size=1024" npx medusa start &
else
  NODE_OPTIONS="--max-old-space-size=1024" npx medusa develop &
fi
BACKEND_PID=$!

echo "Waiting for Medusa backend to start..."
for i in $(seq 1 30); do
  if curl -s http://localhost:9000/health > /dev/null 2>&1; then
    echo "Medusa backend is ready on port 9000"
    break
  fi
  sleep 2
done

# ── 4. Start storefront ──
cd /home/runner/workspace/apps/storefront
echo "Starting storefront..."
if [ -d ".output" ]; then
  echo "Found production build, starting with node..."
  NODE_OPTIONS="--max-old-space-size=1024" exec node .output/server/index.mjs
else
  echo "Production build not found, starting in dev mode..."
  NODE_OPTIONS="--max-old-space-size=1024" exec npx vite dev --host 0.0.0.0 --port 5000 --strictPort
fi
