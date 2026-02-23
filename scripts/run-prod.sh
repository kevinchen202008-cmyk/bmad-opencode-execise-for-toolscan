#!/bin/sh

# This script is run inside the Docker container to apply any new database migrations before starting the app
echo "Running migrations..."
bunx drizzle-kit push --config=drizzle.config.ts

echo "Starting Next.js..."
exec node server.js
