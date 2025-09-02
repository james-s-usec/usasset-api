#!/bin/bash
# Azure deployment script for USAsset Backend

set -e

echo "🚀 Azure Deployment Script Starting..."

# Ensure we're in production mode
export NODE_ENV=production

# Run production migrations
echo "🔄 Deploying database migrations..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
  echo "✅ Migrations successfully deployed!"
else
  echo "❌ Migration deployment failed!"
  exit 1
fi

# Generate Prisma Client (for runtime)
echo "🔧 Generating Prisma Client..."
npx prisma generate

echo "✅ Azure deployment preparation complete!"