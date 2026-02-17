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
echo "========================================"
echo "  Build complete!"
echo "========================================"
