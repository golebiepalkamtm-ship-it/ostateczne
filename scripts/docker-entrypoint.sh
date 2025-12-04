#!/bin/sh
set -e

echo "� Starting Next.js application..."
echo "⚠️  Migrations are handled by the 'prisma' container"
# Run lightweight startup diagnostic to check for missing runtime modules
if command -v node >/dev/null 2>&1; then
	echo "[entrypoint] running startup-diagnostic.js"
	node ./scripts/startup-diagnostic.js || true
else
	echo "[entrypoint] node not found, skipping startup diagnostic"
fi
exec "$@"
