#!/bin/sh
set -e

echo "🚀 Starting USAsset Backend..."
echo "📁 Working directory: $(pwd)"
echo "📂 Contents: $(ls -la)"

# Parse DATABASE_URL for Azure PostgreSQL connection
# Azure provides DATABASE_URL format: postgresql://user:pass@host:port/database?sslmode=require
if [ -n "$DATABASE_URL" ]; then
  # Extract host and port using sed regex parsing
  # Regex explanation: .*@([^:]*):([0-9]*)/.*
  # - .*@ matches everything up to @ symbol
  # - ([^:]*) captures host (everything until :)
  # - ([0-9]*) captures port number
  # - /.* matches database name and params
  DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):\([0-9]*\)/.*|\1|p')
  DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*@[^:]*:\([0-9]*\)/.*|\1|p')
  echo "📊 Parsed from DATABASE_URL - Host: $DB_HOST, Port: $DB_PORT"
fi

# Only wait for database if we have connection details
if [ -n "$DB_HOST" ]; then
  echo "⏳ Waiting for database at $DB_HOST:${DB_PORT:-5432}..."
  while ! nc -z "$DB_HOST" "${DB_PORT:-5432}"; do
    sleep 1
  done
  echo "✅ Database is ready!"
else
  echo "⚠️ No database host configured, skipping connection check"
fi

# Run database migrations for production deployment
# Note: Migrations must be committed to git for production sync
# - prisma migrate deploy only applies committed migrations
# - Ensures production database matches current codebase state
# - Fails fast if migrations are missing or inconsistent
if [ "$NODE_ENV" = "production" ]; then
  echo "🔄 Running production migrations..."
  # Deploy only applies migrations that exist in prisma/migrations/
  # This requires migrations to be tracked in git for container deployment
  npx prisma migrate deploy
  echo "✅ Migrations deployed!"
else
  echo "🔄 Running development migrations..."
  # In development, attempt deploy but don't fail if no migrations
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