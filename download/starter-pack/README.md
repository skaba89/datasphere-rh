# DataSphere RH Guinée — Starter Pack

> SIRH premium SaaS multi-tenant pour le marché guinéen (CNSS, RTS, versement forfaitaire).
> Cahier des charges complet : `../DataSphere_RH_Guinee_Cahier_des_charges.pdf`

## Structure du monorepo

```
starter-pack/
├── apps/
│   ├── api/                  # NestJS 10 (backend)
│   └── web/                  # Next.js 14 (frontend)
├── packages/
│   ├── db/                   # Prisma 5 (schema, migrations, seeds)
│   ├── types/                # Types TypeScript partagés
│   └── ui/                   # shadcn/ui + design system
├── prisma/
│   └── schema.prisma         # Schéma complet (15 modèles, multi-tenant)
├── prompts/                  # 10 prompts modulaires pour Cursor/Claude/Lovable
├── docker/
│   └── postgres/
│       └── init-multi-tenant.sh
├── docker-compose.yml        # PostgreSQL + Redis + MinIO + MailHog
├── openapi.yaml              # Spécification API REST complète
├── .env.example              # Variables d'environnement
├── package.json              # Monorepo pnpm + Turborepo
├── turbo.json                # Configuration Turborepo
├── BACKLOG.md                # Backlog MVP en user stories
├── PILOTES_CLIENTS.md        # Grille de scoring 3 clients pilotes
└── README.md                 # Ce fichier
```

## Démarrage rapide (5 minutes)

### 1. Pré-requis
- Node.js 20+
- pnpm 9+
- Docker + Docker Compose

### 2. Installation
```bash
cd starter-pack
cp .env.example .env           # adapter les valeurs si besoin
pnpm install                   # installe toutes les deps du monorepo
```

### 3. Démarrer l'infrastructure
```bash
pnpm db:up                     # Postgres + Redis + MinIO + MailHog
# Vérifier: http://localhost:9001 (MinIO console, admin/dsrh_minio_dev_password)
# Vérifier: http://localhost:8025 (MailHog UI)
```

### 4. Initialiser la base de données
```bash
pnpm db:migrate --name init    # exécute les migrations Prisma
pnpm db:seed                   # charge données de démo (1 tenant + 5 employés)
```

### 5. Lancer les applications
```bash
pnpm dev                       # démarre API + Web en parallèle
# API:  http://localhost:3001/api/v1/health
# Web:  http://localhost:3000
```

## Comptes de démonstration (après seed)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Super Admin | superadmin@datasphererh.gn | Demo1234! |
| Admin Entreprise | admin@demo.gn | Demo1234! |
| RH | rh@demo.gn | Demo1234! |
| Employé | employe@demo.gn | Demo1234! |

⚠️ **2FA activé pour Super Admin et Admin Entreprise** — code TOTP visible dans les logs seed.

## Workflow de développement recommandé

1. **Initialiser le projet dans Cursor** avec `prompts/01-master.md`
2. **Coder le module Auth** avec `prompts/02-auth-rbac.md` (Sprint 1)
3. **Coder le module Employés** avec `prompts/03-employes.md` (Sprint 2)
4. … suivre la roadmap du PDF (chapitre 10)

Chaque prompt est autonome et peut être collé tel quel dans Cursor ou Claude Code.

## Conventions

- **Commits** : Conventionnal Commits (`feat:`, `fix:`, `chore:`, `docs:`)
- **Branches** : `feat/SX-module` (ex: `feat/S1-auth`), `fix/issue-NN`
- **Tests** : couverture ≥ 80 % sur modules critiques (Auth, Paie)
- **TypeScript** : `strict: true`, `noUncheckedIndexedAccess: true`
- **Sécurité** : jamais de secrets en clair, rotation tous les 90 jours

## Documentation

- 📘 Cahier des charges complet : `../DataSphere_RH_Guinee_Cahier_des_charges.pdf`
- 📋 Backlog MVP : `./BACKLOG.md`
- 🎯 Pilotes clients : `./PILOTES_CLIENTS.md`
- 🔌 API spec : `./openapi.yaml`
- 🗄️ Schéma DB : `./prisma/schema.prisma`

## Support

- Documentation : voir le PDF livré
- Issues : créer un ticket dans le gestionnaire de projet
- Email : dev@datasphererh.gn

---

**Licence** : MIT — © 2026 DataSphere RH Guinée
