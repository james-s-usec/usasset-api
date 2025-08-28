#!/bin/sh
set -e

echo "🚀 Starting USAsset Backend..."
echo "📁 Working directory: $(pwd)"
echo "📂 Contents: $(ls -la)"

# Wait for database to be ready
echo "⏳ Waiting for database..."
while ! nc -z ${DB_HOST:-postgres} ${DB_PORT:-5432}; do
  sleep 1
done
echo "✅ Database is ready!"

# Run migrations
if [ "$NODE_ENV" = "production" ]; then
  echo "🔄 Running production migrations..."
  npx prisma migrate deploy
  echo "✅ Migrations deployed!"
else
  echo "🔄 Running development migrations..."
  npx prisma migrate deploy || echo "⚠️ No pending migrations"
  echo "✅ Migrations applied!"
fi

# Verify Prisma client is available
echo "🔍 Checking Prisma client..."
if [ -d "/app/node_modules/.prisma" ]; then
  echo "✅ Prisma client found at /app/node_modules/.prisma"
else
  echo "⚠️ Prisma client not found, generating..."
  npx prisma generate
fi

# Run seed if requested
if [ "$RUN_SEED" = "true" ]; then
  echo "🌱 Running database seed..."
  npx prisma db seed || echo "⚠️ Seeding failed or already seeded"
  echo "✅ Seeding complete!"
fi

# Start the application
echo "🎯 Starting application..."
exec "$@"