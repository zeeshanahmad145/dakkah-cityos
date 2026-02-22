#!/bin/bash

# Configuration
export PORT=5000
export HOST=0.0.0.0

# Medusa Backend Setup
# We use 127.0.0.1 for internal health checks to avoid proxy issues
export MEDUSA_BACKEND_URL="http://127.0.0.1:9000"
# VITE_MEDUSA_BACKEND_URL is used by the frontend SDK
# Setting to "/" allows Vite proxy to handle it, which is more reliable in Replit
export VITE_MEDUSA_BACKEND_URL="/" 

# Kill any existing processes on ports 9000 and 5000
echo "Cleaning up ports 9000 and 5000..."
fuser -k 9000/tcp 5000/tcp 2>/dev/null || true

# 1. Start Medusa Backend
echo "Starting Medusa backend on port 9000..."
cd apps/backend
npm run dev -- --port 9000 --host 0.0.0.0 &

# Wait for backend to be healthy before starting frontend
echo "Waiting for Medusa backend to initialize..."
# Medusa v2 can take a bit to start up all modules
timeout 60s bash -c 'until curl -s http://127.0.0.1:9000/health > /dev/null; do sleep 2; done'

if [ $? -ne 0 ]; then
  echo "Backend failed to start within 60s. Checking logs..."
  exit 1
fi
echo "Medusa backend is ready."

# 2. Start Storefront
echo "Starting storefront on port 5000..."
cd ../storefront
# Explicitly set port and host for Vite to ensure it hits the Replit webview
npm run dev -- --port 5000 --host 0.0.0.0
