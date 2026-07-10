# 🇬🇳 DataSphere RH Guinée — SIRH Premium SaaS

> **Système d'Information Ressources Humaines** premium adapté au contexte guinéen, avec IA multi-providers, blockchain, RAG, conformité RGPD et API publique.

[![Deploy on Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-indigo)](https://www.prisma.io/)

---

## 📋 Table des matières

- [Aperçu](#aperçu)
- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Démarrage rapide](#démarrage-rapide)
- [Structure du projet](#structure-du-projet)
- [Module IA — 11 providers LLM](#module-ia--11-providers-llm)
- [API publique REST v1](#api-publique-rest-v1)
- [SDK npm](#sdk-npm)
- [Sécurité](#sécurité)
- [Tests](#tests)
- [Déploiement](#déploiement)
- [Captures d'écran](#captures-décran)
- [Licence](#licence)

---

## 🎯 Aperçu

DataSphere RH est un **SIRH (Système d'Information Ressources Humaines)** complet conçu spécifiquement pour le marché guinéen. Il intègre :

- **66 pages fonctionnelles** couvrant toute la gestion RH
- **82 endpoints API** REST
- **51 modèles Prisma** (base de données)
- **11 providers LLM** intégrés (ZAI/GLM, OpenAI, Claude, Gemini, Groq…)
- **Conformité légale guinéenne** : CNSS, RTS, Code du travail (Loi L/2014/072/AN)

### Pourquoi DataSphere RH ?

| Problème | Solution DataSphere RH |
|----------|----------------------|
| Les SIRH internationaux ne gèrent pas la CNSS guinéenne | Calculs CNSS (5% salarié, 17% employeur), RTS, ITS intégrés |
| Pas de chatbot RH en français local | Chatbot IA avec function calling (compte employés, recherche…) |
| Documents papier non sécurisés | Certification blockchain des documents (contrats, attestations) |
| Pas de base de connaissances RH | RAG (indexation politiques, FAQ, Code du travail guinéen) |
| Difficulté de gestion des contrats fournisseurs | Module contractuel avec alertes d'échéance et renouvellement |

---

## ✨ Fonctionnalités

### 📊 Gestion RH classique (66 pages)

| Module | Pages | Description |
|--------|-------|-------------|
| **Pilotage** | 16 | Dashboard, pilotage consolidé, calendrier, employés, paie & CNSS, congés, temps & présence, géolocalisation, budget, notes de frais, prêts, planning, comptabilité, référentiel |
| **Talent** | 17 | Recrutement, offres d'emploi, évaluations, feedback 360°, entretiens, organigramme, formation, onboarding, compétences, plan de carrière, santé, bien-être, avantages, matériel, conflits, gamification, mentoring |
| **Engagement** | 5 | Satisfaction, communication, helpdesk, CSE/IRP, diversité & inclusion |
| **Analytics & IA** | 12 | Aide décision IA, prévisions, analytics, IA RH, chatbot, playground IA, vision IA, templates prompts, base RAG, bibliothèque IA, workflows IA, éditeur visuel |
| **Premium** | 11 | Coffre-fort, signature électronique, notifications, conformité, prestataires B2B, traçabilité docs, risques, crise, RSE, contrats fournisseurs, blockchain |
| **Self-service** | 5 | Portail employé, exports, multi-langue, API & webhooks, international |
| **Administration** | 5 | Journal d'audit, gouvernance données, paramètres IA, paramètres avancés, paramètres |

### 🤖 Module IA avancé

#### 11 Providers LLM supportés

| Provider | Modèles populaires | API Style |
|----------|-------------------|-----------|
| **Z.ai (GLM)** ⭐ | GLM-4.6, GLM-4 Flash, GLM-4V (vision) | ZAI SDK natif |
| **OpenAI** | GPT-4o, GPT-4o-mini, o1-preview | OpenAI |
| **Anthropic Claude** | Claude 3.5 Sonnet, Claude 3 Haiku | Anthropic |
| **Groq** ⚡ | Llama 3.3 70B, Llama 3.2 Vision | OpenAI-compatible |
| **Google Gemini** | Gemini 2.0 Flash, Gemini 1.5 Pro | Gemini |
| **OpenRouter** | 200+ modèles agrégés | OpenAI-compatible |
| **Mistral AI** | Mistral Large, Mixtral 8x22B | OpenAI-compatible |
| **DeepSeek** | DeepSeek V3, DeepSeek R1 | OpenAI-compatible |
| **Cohere** | Command R+ | OpenAI-compatible |
| **Together AI** | Llama 405B, Qwen 72B | OpenAI-compatible |
| **Ollama** (local) | Llama 3.3, Qwen, Mistral, Gemma | OpenAI-compatible |

#### Fonctionnalités IA

- **Chat unifié** avec fallback automatique (si un provider échoue → ZAI)
- **RAG** (Retrieval-Augmented Generation) — indexez vos documents RH, posez des questions
- **Vision IA** — OCR, analyse de contrats, lecture de pièces d'identité
- **Workflows IA** — chaînez des étapes (générer → améliorer → indexer → sauver)
- **Éditeur visuel** — canvas drag & drop (React Flow) pour créer des workflows
- **Function calling** — le chatbot peut interroger la base (compter employés, rechercher…)
- **Templates prompts** — 11 templates RH prêts à l'emploi (contrat CDI, synthèse évaluation…)
- **Rate limiting** — 500 appels/jour, 100/heure, $10/jour (configurable)
- **Budget alerts** — alertes automatiques à 50%, 80%, 100% du budget IA
- **Tracking** — tous les appels LLM sont tracés (tokens, coût, durée)

#### 10 pages IA dédiées

1. **Chatbot RH** — avec function calling + sélecteur de provider
2. **Playground IA** — comparez les réponses de plusieurs providers côte à côte
3. **Vision IA** — upload images + OCR + analyse documents
4. **Templates prompts** — 11 templates RH avec variables
5. **Base RAG** — indexation + recherche sémantique + Q&A
6. **Bibliothèque IA** — historique générations + favoris + archive
7. **Workflows IA** — 3 prédéfinis + custom + builder
8. **Éditeur visuel** — canvas React Flow avec nœuds drag & drop
9. **Clés API publique** — CRUD + scopes + documentation API v1
10. **Paramètres IA** — configuration providers + consommation (graphique 30 jours)

### 🔗 Blockchain

- Certification immuable de documents sur chaîne privée "DataSphere Chain"
- Chaque certificat a un hash, txHash, blockNumber, qrToken de vérification
- Révocation possible (marque comme REVOKED dans un registre CRL)

### 🛡️ Conformité RGPD

- **6 types de consentements** (cookies, traitement données, marketing, analytics, photo, biométrie)
- **6 droits RGPD** : export (Article 20), droit à l'oubli (17), rectification (16), restriction (18), opposition (21), portabilité
- **Webhooks entrants** — recevez des notifications de services externes (Slack, GitHub, Zapier)
- **Journal des requêtes RGPD** — traçabilité complète

### 📱 PWA (Progressive Web App)

- **Installable** sur desktop et mobile (manifest + service worker)
- **Offline** — cache des pages + assets statiques + page hors ligne
- **Push notifications** — notifications push VAPID
- **Background sync** — rejoue les actions en attente quand connexion rétablie

### 🌍 Internationalisation

- **5 langues** : Français 🇫🇷, English 🇬🇧, العربية 🇸🇦 (RTL), Português 🇵🇹, Español 🇪🇸
- **RTL automatique** pour l'arabe (direction du texte)
- **Persistance** via localStorage

### 📊 Monitoring

- **Health check** (`/api/healthz`) — vérifie DB, providers LLM, index RAG
- **Métriques Prometheus** (`/api/metrics`) — 20+ métriques pour Grafana
- **Dashboard Grafana** — 12 panels (latence, tokens, mémoire, activité…)
- **Audit sécurité** (`/api/security-audit`) — 11 checks avec score et grade
- **OpenAPI/Swagger** (`/api-docs`) — documentation interactive de l'API

---

## 🛠️ Stack technique

| Couche | Technologies |
|--------|-------------|
| **Frontend** | Next.js 16 (Turbopack), React 19, TypeScript 5, Tailwind CSS 3, shadcn/ui, Recharts, React Flow |
| **Backend** | Next.js API Routes (82 endpoints), Prisma ORM 6 |
| **Base de données** | SQLite (dev) / PostgreSQL 16 + pgvector (prod) |
| **Cache** | Redis 7 (optionnel, fallback mémoire) |
| **IA/LLM** | z-ai-web-dev-sdk, OpenAI, Anthropic, Google, Groq, Mistral, DeepSeek, Cohere, Together, OpenRouter, Ollama |
| **Auth** | Session-based + RBAC (6 rôles, 12 permissions) + SSO/SAML config |
| **Déploiement** | Docker (multi-stage), nginx (SSL Let's Encrypt), Netlify + Neon SQL |
| **Monitoring** | Prometheus, Grafana, health check |
| **Tests** | E2E bash (24 tests), Playwright (7 tests), tests de charge Python |
| **PWA** | Service Worker, Web Push VAPID, manifest.json |

---

## 🚀 Démarrage rapide

### Prérequis

- Node.js 20+
- npm ou bun

### Installation (5 minutes)

```bash
# 1. Cloner le dépôt
git clone https://github.com/skaba89/datasphere-rh.git
cd datasphere-rh

# 2. Installer les dépendances
npm install --legacy-peer-deps

# 3. Configuration
cp .env.example .env
# Éditez .env — minimum requis :
#   DATABASE_URL="file:./db/custom.db"
#   NEXTAUTH_SECRET="openssl rand -base64 32"
#   CRON_SECRET="openssl rand -hex 16"

# 4. Base de données
npx prisma generate
npx prisma db push

# 5. Seed (données démo)
npx tsx scripts/seed-netlify.ts   # Société + 9 employés + RAG + contrats
npx tsx scripts/seed-advanced.ts  # Contrats fournisseurs + certificats blockchain
npx tsx scripts/seed-all.ts       # RAG documents (politiques, FAQ, lois)

# 6. Démarrer
npm run dev
# → http://localhost:3000
```

### Login démo

- **Email** : `admin@datasphere.gn`
- **Mot de passe** : `demo123`

---

## 📁 Structure du projet

```
datasphere-rh/
├── src/
│   ├── app/
│   │   ├── api/                    # 82 endpoints API
│   │   │   ├── v1/llm/            # API publique (clé API auth)
│   │   │   ├── llm/               # API interne LLM (chat, templates, RAG…)
│   │   │   ├── rgpd/              # Conformité RGPD
│   │   │   ├── cron/              # Jobs planifiés
│   │   │   ├── push/              # Notifications push VAPID
│   │   │   ├── blockchain/        # Certifications blockchain
│   │   │   ├── contracts-mgmt/    # Gestion contractuelle
│   │   │   ├── pilotage/          # Dashboard consolidé
│   │   │   └── ...                # Endpoints RH (employees, payroll…)
│   │   ├── api-docs/              # Swagger UI (OpenAPI 3.0)
│   │   └── page.tsx               # App principale (66 pages)
│   ├── components/rh/
│   │   ├── pages/                 # 66 composants de pages
│   │   ├── sidebar.tsx            # Navigation collapsable (7 catégories)
│   │   ├── notifications-bell.tsx # Cloche notifications (polling 60s)
│   │   ├── pwa-register.tsx       # PWA (service worker + install)
│   │   └── ...
│   └── lib/
│       ├── llm/                   # Modules IA
│       │   ├── providers.ts       # 11 providers, 60+ modèles
│       │   ├── router.ts          # Chat unifié (ZAI, OpenAI, Anthropic, Gemini)
│       │   ├── fallback.ts        # Résilience multi-providers
│       │   ├── rag.ts             # RAG (chunking + recherche sémantique)
│       │   ├── templates.ts       # 11 templates de prompts RH
│       │   ├── functions.ts       # Function calling (5 fonctions RH)
│       │   ├── workflows.ts       # Workflows IA (3 prédéfinis)
│       │   ├── api-keys.ts        # Clés API + scopes (11 permissions)
│       │   ├── rate-limit.ts      # Rate limiting + alertes budget
│       │   ├── usage.ts           # Tracking tokens + coûts
│       │   └── generations.ts     # Sauvegarde générations IA
│       ├── advanced/              # RBAC, audit, webhooks
│       ├── cache/                 # Cache Redis + fallback mémoire
│       ├── i18n/                  # Internationalisation (5 langues)
│       ├── rgpd/                  # Conformité RGPD
│       └── push/                  # Notifications push VAPID
├── prisma/
│   └── schema.prisma              # 51 modèles Prisma
├── sdk/                           # SDK npm @datasphere/rh-sdk
│   ├── src/index.ts               # SDK TypeScript complet
│   ├── README.md                  # Documentation SDK
│   └── examples/basic.ts          # Exemple exécutable
├── tests/e2e/                     # Tests Playwright
├── scripts/
│   ├── e2e/                       # Tests E2E bash
│   ├── deploy/                    # Déploiement + SSL + backup
│   ├── seed-*.ts                  # Scripts de seed
│   └── load-test.py               # Tests de charge
├── docs/
│   ├── DEPLOY.md                  # Guide déploiement production
│   ├── DEPLOY-NETLIFY.md          # Guide Netlify + Neon
│   ├── CRON.md                    # Documentation cron jobs
│   └── grafana/                   # Dashboard Grafana + config Prometheus
├── public/
│   ├── manifest.json              # PWA manifest
│   ├── sw.js                      # Service worker
│   └── offline.html              # Page hors ligne
├── docker-compose.yml             # PostgreSQL 16 + Redis 7
├── Dockerfile                     # Multi-stage production
├── nginx.conf                     # Reverse proxy + SSL
├── netlify.toml                   # Config Netlify
├── playwright.config.ts           # Config Playwright
└── .env.example                   # Toutes les variables d'environnement
```

---

## 🤖 Module IA — 11 providers LLM

### Configuration

Ajoutez vos clés API dans `.env` (toutes optionnelles — ZAI fonctionne sans clé) :

```bash
# Z.ai (GLM) — fonctionne sans clé via z-ai-web-dev-sdk
ZAI_API_KEY=

# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...

# Groq (ultra-rapide, 500+ tokens/s)
GROQ_API_KEY=gsk_...

# Google Gemini
GEMINI_API_KEY=AIza...

# OpenRouter (agrégateur 200+ modèles)
OPENROUTER_API_KEY=sk-or-...

# Mistral AI
MISTRAL_API_KEY=...

# DeepSeek (économique)
DEEPSEEK_API_KEY=sk-...

# Cohere
COHERE_API_KEY=...

# Together AI
TOGETHER_API_KEY=...

# Ollama (local, privé)
OLLAMA_BASE_URL=http://localhost:11434
```

### Fallback automatique

Si le provider par défaut échoue (clé manquante, 5xx, timeout), le système retente automatiquement avec ZAI (GLM) qui fonctionne sans clé API.

---

## 🔌 API publique REST v1

### Endpoints

| Endpoint | Scope requis | Description |
|----------|-------------|-------------|
| `POST /api/v1/llm/chat` | `llm:chat` | Chat multi-providers |
| `POST /api/v1/llm/vision` | `llm:vision` | Analyse d'images (OCR, documents) |
| `POST /api/v1/llm/rag/ask` | `rag:ask` | Q&A sur documents RH internes |
| `POST /api/v1/llm/templates/run` | `templates:run` | Exécuter un template de prompt |
| `POST /api/v1/llm/workflows/run` | `workflows:run` | Exécuter un workflow IA |

### Authentification

```bash
curl -X POST https://votre-site.netlify.app/api/v1/llm/chat \
  -H "Authorization: Bearer dsrh_live_xxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Bonjour"}]}'
```

### Scopes disponibles (11)

`llm:chat`, `llm:vision`, `llm:stream`, `rag:ask`, `rag:search`, `rag:index`, `templates:run`, `workflows:run`, `employees:read`, `audit:read`, `*` (admin)

---

## 📦 SDK npm

```bash
npm install @datasphere/rh-sdk
```

```typescript
import { createClient } from '@datasphere/rh-sdk'

const client = createClient('dsrh_live_xxxxxxxx')

// Chat
const { content } = await client.chat(
  [{ role: 'user', content: 'Bonjour' }]
)

// RAG
const { answer, sources } = await client.ragAsk({
  question: 'Combien de jours de télétravail ?'
})

// Template
const result = await client.runTemplate('contrat_cdi_resume', {
  poste: 'Développeur',
  salaire: '1500000',
  date_embauche: '2026-01-15',
})

// Workflow
const { finalOutput } = await client.runWorkflow(
  'document_analysis',
  'Texte à analyser...'
)
```

Voir [`sdk/README.md`](sdk/README.md) pour la documentation complète.

---

## 🔒 Sécurité

| Mécanisme | Description |
|-----------|-------------|
| **RBAC** | 6 rôles (SUPER_ADMIN → EMPLOYE), 12 permissions |
| **Multi-tenant** | Isolation companyId sur toutes les requêtes |
| **Clés API** | Hashées SHA-256, jamais stockées en clair |
| **Rate limiting** | 500 appels/jour, 100/heure, $10/jour (configurable) |
| **Audit trail** | Toutes les actions tracées (immuable) |
| **Budget alerts** | Alertes automatiques à 50%, 80%, 100% |
| **HTTPS** | Forcé en production + security headers (HSTS, X-Frame-Options) |
| **RGPD** | Consentements, droit à l'oubli, portabilité des données |
| **Push VAPID** | Notifications push sécurisées |

### Audit sécurité

```bash
curl https://votre-site.netlify.app/api/security-audit
# → { "score": 82, "grade": "B", "checks": [...] }
```

---

## 🧪 Tests

### Tests E2E (bash)

```bash
# Tests de base (24 assertions)
bash scripts/e2e/run-e2e.sh

# Tests IA (47 assertions)
bash scripts/e2e/run-e2e-ai.sh
```

### Tests Playwright (UI)

```bash
npx playwright test                    # Tous les tests
npx playwright test --headed            # Voir le navigateur
npx playwright test --project=chromium # Navigateur spécifique
```

### Tests de charge

```bash
# Test dashboard (20 users, 15s)
python3 scripts/load-test.py --duration 15 --users 20

# Résultat attendu :
#   200+ req/s, 0% erreur, P95 < 100ms
```

---

## 🚢 Déploiement

### Option 1 : Netlify + Neon SQL (recommandé pour démo)

Voir [`docs/DEPLOY-NETLIFY.md`](docs/DEPLOY-NETLIFY.md) — Guide complet en 5 minutes.

1. Créer une base sur https://neon.tech (gratuit)
2. Push sur GitHub
3. Importer sur https://app.netlify.com
4. Ajouter les variables d'environnement
5. Déployer ✅

### Option 2 : Docker (production)

```bash
# Build
bash scripts/deploy/deploy.sh build

# Démarrer (Postgres + Redis + App)
bash scripts/deploy/deploy.sh start

# SSL automatique
sudo bash scripts/deploy/setup-ssl.sh rh.datasphere.gn admin@datasphere.gn
```

Voir [`docs/DEPLOY.md`](docs/DEPLOY.md) — Guide complet de déploiement production.

### Option 3 : Vercel

```bash
npx vercel
# Configurer DATABASE_URL et autres variables
```

### Variables d'environnement

Voir [`.env.example`](.env.example) pour la liste complète.

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `DATABASE_URL` | ✅ | URL de la base de données |
| `NEXTAUTH_SECRET` | ✅ | Secret d'authentification (≥32 chars) |
| `NEXTAUTH_URL` | ✅ | URL de l'application |
| `CRON_SECRET` | ✅ | Clé pour les cron jobs |
| `ZAI_API_KEY` | ❌ | Clé Z.ai (fonctionne sans) |
| `OPENAI_API_KEY` | ❌ | Clé OpenAI |
| `ANTHROPIC_API_KEY` | ❌ | Clé Anthropic |
| `GROQ_API_KEY` | ❌ | Clé Groq |
| `GEMINI_API_KEY` | ❌ | Clé Google Gemini |
| `REDIS_URL` | ❌ | URL Redis (fallback mémoire si absent) |

---

## 📊 Performance

Testé avec 20 utilisateurs simultanés pendant 15 secondes :

| Métrique | Valeur |
|----------|--------|
| Requêtes totales | 3 205 |
| Taux d'erreur | 0.0% |
| Débit | 209.6 req/s |
| Latence P50 | 30ms |
| Latence P95 | 96ms |
| Latence P99 | 336ms |

---

## 🗺️ Roadmap

- [ ] Application mobile React Native (portail employé)
- [ ] Embeddings vectoriels avec pgvector (similarité cosinus)
- [ ] SSO/SAML complet (Azure AD, Google Workspace, Okta)
- [ ] Marketplace publique de workflows
- [ ] Conformité ISO 27001
- [ ] Multi-devises (USD, EUR en plus de GNF)
- [ ] Module de formation en ligne (LMS)
- [ ] Intégration biométrie (pointage facial)

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour les guidelines.

1. Fork le projet
2. Créer une branche (`git checkout -b feature/ma-feature`)
3. Commit (`git commit -m 'Ajout ma feature'`)
4. Push (`git push origin feature/ma-feature`)
5. Ouvrir une Pull Request

---

## 📄 Licence

MIT © DataSphere SARL — Conakry, République de Guinée

Voir [LICENSE](LICENSE) pour plus de détails.

---

## 👥 Équipe

- **Développement** : DataSphere Team
- **Contact** : contact@datasphere.gn
- **Site web** : https://rh.datasphere.gn
- **GitHub** : https://github.com/skaba89/datasphere-rh

---

## 🙏 Remerciements

- **Z.ai** pour le SDK z-ai-web-dev-sdk (GLM-4.6)
- **Next.js** pour le framework React 16 avec Turbopack
- **Prisma** pour l'ORM multi-database
- **shadcn/ui** pour les composants UI
- **React Flow** pour l'éditeur de workflows visuel
- **Recharts** pour les graphiques
- **Playwright** pour les tests E2E

---

<div align="center">

**Fait avec ❤️ en Guinée 🇬🇳**

</div>
