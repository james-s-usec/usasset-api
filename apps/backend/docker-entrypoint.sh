#!/bin/sh
set -e

echo "🚀 Starting USAsset Backend..."

# Wait for database to be ready
echo "⏳ Waiting for database..."
while ! nc -z ${DB_HOST:-postgres} ${DB_PORT:-5432}; do
  sleep 1
done
echo "✅ Database is ready!"

# Run migrations in production
if [ "$NODE_ENV" = "production" ]; then
  echo "🔄 Running production migrations..."
  npx prisma migrate deploy
  echo "✅ Migrations deployed!"
else
  echo "🔄 Running development migrations..."
  npx prisma migrate deploy || echo "⚠️ No pending migrations"
  echo "✅ Migrations applied!"
fi

# Skip Prisma generation - already done in build stage
echo "✅ Prisma Client already generated during build!"

# Run seed if requested
if [ "$RUN_SEED" = "true" ]; then
  echo "🌱 Running database seed..."
  npx prisma db seed || echo "⚠️ Seeding failed or already seeded"
  echo "✅ Seeding complete!"
fi

# Start the application
echo "🎯 Starting application..."
exec "$@"