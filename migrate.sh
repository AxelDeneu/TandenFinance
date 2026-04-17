#!/bin/sh
set -e

if [ -z "$MIGRATION_SECRET" ]; then
  echo "MIGRATION_SECRET is not set" >&2
  exit 1
fi

HOST="${MIGRATE_HOST:-127.0.0.1}"
PORT="${PORT:-3000}"
URL="http://$HOST:$PORT/_admin/migrate"

echo "Applying database migrations via $URL..."
curl -fsS --show-error -X POST \
  -H "Authorization: Bearer $MIGRATION_SECRET" \
  "$URL"
echo
