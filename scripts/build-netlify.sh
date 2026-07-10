#!/bin/bash
# =============================================================================
# Build script pour Netlify + Neon SQL
# =============================================================================
set -e

echo "▸ Installation des dépendances..."
npm install --legacy-peer-deps

echo "▸ Génération du client Prisma..."
npx prisma generate

echo "▸ Migration de la base de données Neon..."
npx prisma db push --accept-data-loss

echo "▸ Seed des données démo..."
npx tsx scripts/seed-netlify.ts || true

echo "▸ Build Next.js..."
npx next build

echo "✓ Build terminé"
