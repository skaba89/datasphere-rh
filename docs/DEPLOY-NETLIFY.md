# ━━━ DataSphere RH — Déploiement Netlify + Neon SQL ━━━

## Guide complet (5 minutes)

## 1️⃣ Créer une base Neon SQL (2 min)

1. Aller sur **https://neon.tech** → Sign up (GitHub/Google)
2. **New Project** → Name: `datasphere-rh` → Region: `Frankfurt` → Create
3. Copier la connection string :
   ```
   postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```

## 2️⃣ Préparer le projet (1 min)

```bash
# Switch Prisma vers PostgreSQL
bash scripts/switch-db-provider.sh postgres

# Tester la connexion Neon
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require" npx prisma db push

# Seed les données démo
DATABASE_URL="postgresql://..." npx tsx scripts/seed-netlify.ts
```

## 3️⃣ Pousser sur GitHub (30 sec)

```bash
git add -A
git commit -m "Deploy: Netlify + Neon SQL"
git push origin main
```

## 4️⃣ Déployer sur Netlify (1 min)

1. Aller sur **https://app.netlify.com** → **Add new site** → **Import from Git**
2. Choisir votre repo GitHub
3. Config auto détectée (netlify.toml) :
   - Build: `npm run build:netlify`
   - Publish: `.next`
4. **Environment Variables** (OBLIGATOIRE) :

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` (générer une clé) |
| `NEXTAUTH_URL` | `https://VOTRE-SITE.netlify.app` |
| `CRON_SECRET` | `openssl rand -hex 16` (générer une clé) |
| `ZAI_API_KEY` | (optionnel — ZAI fonctionne sans clé) |

5. Click **Deploy site** ✅

## 5️⃣ Vérifier (30 sec)

1. Visiter `https://VOTRE-SITE.netlify.app`
2. Login: **admin@datasphere.gn** / **demo123**
3. Le dashboard affiche 9 employés, 5 documents RAG, 5 contrats

## URLs utiles

| URL | Description |
|-----|-------------|
| `https://VOTRE-SITE.netlify.app` | Application |
| `https://VOTRE-SITE.netlify.app/api/healthz` | Health check |
| `https://VOTRE-SITE.netlify.app/api-docs` | Swagger UI |
| `https://VOTRE-SITE.netlify.app/api/metrics` | Métriques |
| `https://VOTRE-SITE.netlify.app/api/security-audit` | Audit sécurité |

## Cron jobs gratuits (cron-job.org)

Netlify gratuit ne supporte pas les cron jobs. Utiliser **https://cron-job.org** :

1. Créer un compte
2. Ajouter 2 jobs :

| Job | URL | Schedule |
|-----|-----|----------|
| Alertes contrats | `https://VOTRE-SITE.netlify.app/api/cron/contract-alerts?key=VOTRE_CRON_SECRET` | `0 8 * * *` |
| Retry webhooks | `https://VOTRE-SITE.netlify.app/api/cron/webhook-retries?key=VOTRE_CRON_SECRET` | `*/5 * * * *` |

## Limites plans gratuits

| Service | Limite |
|---------|--------|
| **Netlify** | 300 min build/mois, 100 GB bande passante |
| **Neon** | 0.5 GB stockage, suspendu après 5j inactivité (1 requête = réactiver) |
| **ZAI (LLM)** | Gratuit, illimité via z-ai-web-dev-sdk |

## Dépannage

**Build failed** → Vérifier `DATABASE_URL` (doit contenir `?sslmode=require`)
**Database error** → Vérifier que Neon n'est pas en veille (1 clic pour réactiver)
**Login fails** → Le seed crée `admin@datasphere.gn` / `demo123`
**LLM ne répond pas** → ZAI fonctionne sans clé, vérifier la console Netlify
