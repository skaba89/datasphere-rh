# ━━━ DataSphere RH — Dockerfile production multi-stage ━━━

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copie package files
COPY package.json bun.lock* ./
COPY prisma ./prisma/

# Installe bun (plus rapide que npm pour install)
RUN npm install -g bun && bun install --frozen-lockfile

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Génère le client Prisma
RUN npx prisma generate

# Build Next.js (standalone output)
RUN npx next build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crée un utilisateur non-root
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Copie uniquement les fichiers nécessaires
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
