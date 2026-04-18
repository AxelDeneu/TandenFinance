#!/bin/sh
set -e
echo "Running database migrations..."
node -e "
import('/app/.output/server/index.mjs').then(async (server) => {
  if (server.runMigrations) {
    await server.runMigrations()
    console.log('Migrations done')
  }
})
" 2>/dev/null || true
echo "Starting server..."
exec node .output/server/index.mjs
