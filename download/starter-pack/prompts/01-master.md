# Prompt 01 — Master : Initialisation projet DataSphere RH Guinée

## CONTEXTE

Tu crées un SIRH premium SaaS pour le marché guinéen (CNSS, RTS, versement
forfaitaire). Architecture multi-tenant (schema-per-tenant PostgreSQL).

Le cahier des charges complet est dans `../DataSphere_RH_Guinee_Cahier_des_charges.pdf`
et le schéma Prisma dans `../prisma/schema.prisma`.

## STACK OBLIGATOIRE

- Monorepo: Turborepo + pnpm workspaces (déjà configuré dans `package.json`)
- Frontend: Next.js 14 (App Router) + TypeScript 5 + Tailwind 3 + shadcn/ui
- Backend: NestJS 10 + TypeScript + Prisma 5
- DB: PostgreSQL 16 (schema-per-tenant, schéma déjà initialisé dans docker-compose)
- Cache: Redis 7
- Storage: MinIO (S3-compatible)
- Auth: JWT (15min) + refresh (7j, rotation) + 2FA TOTP
- Tests: Vitest (unit) + Playwright (E2E)
- Docker Compose pour dev local (déjà fourni)

## LIVRABLES ATTENDUS

1. Structure monorepo:
   ```
   apps/web/         — Next.js (App Router, i18n fr/en, dark mode)
   apps/api/         — NestJS (modulaire, DI, decorators)
   packages/ui/      — shadcn/ui + design system
   packages/types/   — Types TypeScript partagés
   packages/db/      — Prisma client + migrations + seeds
   ```
2. Middleware multi-tenant NestJS (sous-domaine + header X-Tenant-ID + JWT claim)
3. Système d'auth complet: login, refresh, 2FA, reset password
4. Schéma Prisma avec 15 modèles (déjà fourni dans prisma/schema.prisma)
5. Design system Tailwind + shadcn configuré (FR/EN, dark mode)
6. README détaillé + scripts de démarrage (déjà fourni)
7. docker-compose.yml (déjà fourni — PostgreSQL + Redis + MinIO + MailHog)

## CONTRAINTES

- TypeScript strict (no implicit any, noUncheckedIndexedAccess)
- Toutes les réponses API au format `{data, meta, error}`
- Toutes les entités avec tenant_id UUID
- Audit trail immuable sur chaque mutation (table audit_logs + trigger)
- Tests E2E pour les flows critiques (login, paie, bulletin)
- Conformité WCAG 2.1 AA
- Variables d'environnement via .env (modèle dans .env.example)

## ORDRE D'EXÉCUTION

1. Initialise le monorepo avec la structure ci-dessus
2. Configure TypeScript strict + ESLint + Prettier
3. Configure Tailwind + shadcn/ui (thème Corporate Guinée : accent #27698a)
4. Configure Prisma avec le schéma fourni (migrations initiales)
5. Configure NestJS avec middleware multi-tenant + guards JWT
6. Configure Next.js avec App Router + i18n + dark mode
7. Crée le script `pnpm db:seed` qui crée 1 tenant demo + 5 employés + 1 user admin

## LANCEMENT

Après génération, je dois pouvoir faire:
```bash
cp .env.example .env
pnpm install
pnpm db:up
pnpm db:migrate --name init
pnpm db:seed
pnpm dev
```

Commence par générer la structure complète puis itère module par module.
