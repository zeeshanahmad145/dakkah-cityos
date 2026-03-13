  GNU nano 7.2                                                                              build-prod.sh
#!/bin/bash
set -e

PROJECT_DIR="/root/srv/apps/marketplace/dakkah-cityos"

echo "Building Medusa backend..."
cd $PROJECT_DIR/apps/backend
npx medusa build

echo "Building storefront..."
cd $PROJECT_DIR/apps/storefront
npx vite build

echo "Build complete."
