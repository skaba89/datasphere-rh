#!/bin/bash
# Switch Prisma provider between SQLite and PostgreSQL
# Usage: bash scripts/switch-db-provider.sh postgres|sqlite

PROVIDER="${1:-postgres}"
SCHEMA="prisma/schema.prisma"

if [ "$PROVIDER" = "postgres" ]; then
  sed -i 's/provider = "sqlite"/provider = "postgresql"/' "$SCHEMA"
  echo "✓ Prisma provider changé vers PostgreSQL (Neon)"
elif [ "$PROVIDER" = "sqlite" ]; then
  sed -i 's/provider = "postgresql"/provider = "sqlite"/' "$SCHEMA"
  echo "✓ Prisma provider changé vers SQLite (local)"
else
  echo "Usage: $0 postgres|sqlite"
  exit 1
fi

npx prisma generate 2>/dev/null
echo "✓ Client Prisma régénéré"
