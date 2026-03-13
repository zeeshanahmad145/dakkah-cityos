  GNU nano 7.2                                                                              start-prod.sh
#!/bin/bash

PROJECT_DIR="/root/srv/apps/marketplace/dakkah-cityos"

kill_port() {
  local port=$1
  local pids
  pids=$(lsof -ti :"$port" 2>/dev/null)
  if [ -n "$pids" ]; then
    echo "Killing processes on port $port: $pids"
    echo "$pids" | xargs kill -9 2>/dev/null || true
  fi
}

kill_port 9000
kill_port 5173

echo "Starting Medusa backend..."
cd $PROJECT_DIR/apps/backend
NODE_ENV=production NODE_OPTIONS="--max-old-space-size=1024" npx medusa start &
BACKEND_PID=$!

echo "Waiting for backend..."
for i in $(seq 1 60); do
  if curl -s http://localhost:9000/health > /dev/null; then
    echo "Backend ready"
    break
  fi
  sleep 2
done

echo "Starting storefront..."
cd $PROJECT_DIR/apps/storefront
HOST=0.0.0.0 PORT=5173 node .output/server/index.mjs &
STOREFRONT_PID=$!

wait $BACKEND_PID $STOREFRONT_PID

