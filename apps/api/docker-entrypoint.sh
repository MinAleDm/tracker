#!/bin/sh
set -eu

cd /app

echo "Applying database migrations..."

attempt=0
max_attempts=30

until pnpm --filter @tracker/db exec prisma migrate deploy --schema prisma/schema.prisma; do
  attempt=$((attempt + 1))

  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "Database is still unavailable after ${max_attempts} attempts."
    exit 1
  fi

  echo "Database not ready yet, retrying in 2s..."
  sleep 2
done

if [ "${SEED_DEMO_DATA:-false}" = "true" ]; then
  echo "Seeding explicitly enabled demo data..."
  pnpm --filter @tracker/db prisma:seed
fi

echo "Starting API..."
exec node /app/apps/api/dist/main.js
