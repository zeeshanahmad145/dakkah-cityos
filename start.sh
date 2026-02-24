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

kill_port() {
  local port=$1
  local pids
  pids=$(lsof -ti :"$port" 2>/dev/null)
  if [ -n "$pids" ]; then
    echo "Killing processes on port $port: $pids"
    echo "$pids" | xargs kill -9 2>/dev/null || true
  fi
}

wait_port_free() {
  local port=$1
  local max_wait=10
  local count=0
  while lsof -ti :"$port" >/dev/null 2>&1; do
    count=$((count + 1))
    if [ $count -ge $max_wait ]; then
      echo "Warning: Port $port still occupied after ${max_wait}s, force killing again"
      kill_port "$port"
      sleep 1
      break
    fi
    sleep 1
  done
}

kill_port 9000
kill_port 5000
kill_port 5001
wait_port_free 9000
wait_port_free 5000

echo "Starting Medusa backend on port 9000..."
cd /home/runner/workspace/apps/backend
npm run dev -- --port 9000 --host 0.0.0.0 &
BACKEND_PID=$!

echo "Starting storefront on port 5000..."
cd /home/runner/workspace/apps/storefront
exec npm run dev -- --port 5000 --host 0.0.0.0 --strictPort
