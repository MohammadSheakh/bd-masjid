#!/bin/sh
set -e

echo "🚀 Starting BD Masjid Backend (NestJS + Prisma)..."

# Optionally run database migrations
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "📦 Checking and applying database migrations..."
  npx prisma migrate deploy --schema prisma/schema.prisma || {
    echo "⚠️ Prisma migrate deploy encountered an error. Waiting 5s before retrying (database cold start check)..."
    sleep 5
    npx prisma migrate deploy --schema prisma/schema.prisma
  }
  echo "✅ Database migrations up to date."
fi

# Hand over execution to the main container command with PID 1 signal forwarding
exec "$@"
