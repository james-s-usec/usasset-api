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
  npx prisma migrate dev --skip-seed
  echo "✅ Migrations applied!"
fi

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate
echo "✅ Prisma Client generated!"

# Start the application
echo "🎯 Starting application..."
exec "$@"