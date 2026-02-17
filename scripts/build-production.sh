#!/bin/bash
set -e

echo "========================================"
echo "  Dakkah CityOS Commerce — Build"
echo "========================================"

echo "[1/2] Building backend..."
cd /home/runner/workspace/apps/backend
pnpm build
echo "  ✓ Backend built"

echo "[2/2] Building storefront..."
cd /home/runner/workspace/apps/storefront
pnpm build
echo "  ✓ Storefront built"

echo ""
echo "Verifying build outputs..."
if [ -d "/home/runner/workspace/apps/backend/.medusa" ]; then
  echo "  ✓ Backend .medusa/ exists"
else
  echo "  ✗ WARNING: Backend .medusa/ missing"
fi

if [ -f "/home/runner/workspace/apps/storefront/.output/server/index.mjs" ]; then
  echo "  ✓ Storefront .output/server/index.mjs exists"
else
  echo "  ✗ WARNING: Storefront .output/ missing"
fi

echo ""
echo "========================================"
echo "  Build complete!"
echo "========================================"
