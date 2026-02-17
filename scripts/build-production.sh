#!/bin/bash
set -e

echo "========================================"
echo "  Dakkah CityOS Commerce — Build"
echo "========================================"

echo "[1/3] Building backend..."
cd /home/runner/workspace/apps/backend
pnpm build
echo "  ✓ Backend built"

echo "[2/3] Running database migrations..."
NODE_OPTIONS="--max-old-space-size=512" npx medusa db:migrate 2>&1 | tail -5
echo "  ✓ Migrations complete"

echo "[3/3] Building storefront..."
cd /home/runner/workspace/apps/storefront
pnpm build
echo "  ✓ Storefront built"

echo ""
echo "========================================"
echo "  Build complete!"
echo "========================================"
