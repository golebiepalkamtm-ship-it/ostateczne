#!/bin/sh
set -e

echo "� Starting Next.js application..."
echo "⚠️  Migrations are handled by the 'prisma' container"
exec "$@"
