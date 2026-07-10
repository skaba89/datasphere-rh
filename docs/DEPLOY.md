# DataSphere RH — Guide de déploiement production

Guide complet pour déployer DataSphere RH en production sur un serveur Linux (Ubuntu/Debian).

## Prérequis

- Serveur Linux (Ubuntu 22.04+ ou Debian 12+) avec 2GB RAM minimum
- Accès root (sudo)
- Nom de domaine pointant vers le serveur (ex: `rh.datasphere.gn`)
- Ports 80 (HTTP) et 443 (HTTPS) ouverts

## 1. Installation des dépendances

```bash
# Mise à jour système
sudo apt update && sudo apt upgrade -y

# Installation Docker + Docker Compose
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# Se déconnecter/reconnecter pour prise en compte du groupe

# Installation Node.js 20 (pour scripts et build)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Installation bun (gestionnaire de paquets rapide)
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

## 2. Clonage et configuration

```bash
git clone https://github.com/datasphere-gn/rh.git
cd rh

# Copie du fichier d'environnement
cp .env.example .env

# Édition de .env — REMPLIR toutes les valeurs
nano .env
```

### Variables .env critiques

```bash
# Base de données — PostgreSQL recommandé en prod
DATABASE_URL="postgresql://datasphere:VOTRE_MOT_DE_PASSE_FORT@localhost:5432/datasphere?schema=public"

# Auth
NEXTAUTH_SECRET="générez-avec: openssl rand -base64 32"
NEXTAUTH_URL="https://rh.datasphere.gn"

# Au moins une clé LLM (ZAI recommandé — fonctionne sans clé mais clé conseillée)
ZAI_API_KEY="votre-cle-zai"

# Cron secret
CRON_SECRET="générez-avec: openssl rand -hex 16"
```

## 3. Démarrage des services (Postgres + Redis)

```bash
# Démarre Postgres (avec pgvector) + Redis
docker compose up -d

# Vérifie que les services sont prêts
docker compose ps
```

## 4. Migration et seed de la base

```bash
# Installation des dépendances
bun install

# Génération du client Prisma
npx prisma generate

# Migration (crée les tables)
npx prisma migrate deploy

# Si vous utilisez PostgreSQL + pgvector : activez l'extension
psql $DATABASE_URL -f scripts/postgres-pgvector.sql

# Seed initial (société démo + employés + documents RH)
npx tsx scripts/seed-v6.ts
npx tsx scripts/seed-advanced.ts
npx tsx scripts/seed-rag.ts
```

## 5. Build et démarrage de l'application

### Option A : Docker (recommandé)

```bash
# Build l'image Docker
bash scripts/deploy/deploy.sh build

# Démarre tout (app + services)
bash scripts/deploy/deploy.sh start

# Vérifie le statut
bash scripts/deploy/deploy.sh status
```

### Option B : Process Manager (PM2)

```bash
# Build Next.js
bun run build

# Installation PM2
sudo npm install -g pm2

# Démarrage
pm2 start "bun run start" --name datasphere-rh
pm2 startup
pm2 save
```

## 6. Configuration nginx + SSL

```bash
# Configuration nginx + certificat SSL Let's Encrypt
sudo bash scripts/deploy/setup-ssl.sh rh.datasphere.gn admin@datasphere.gn
```

Le script :
1. Installe certbot
2. Copie la config nginx (`nginx.conf`)
3. Obtient le certificat SSL via Let's Encrypt
4. Configure le renouvellement automatique (cron quotidien)

## 7. Configuration des cron jobs

Ajoutez au crontab (`crontab -e`) :

```cron
# DataSphere RH — cron jobs (à 8h00 chaque jour)

# Alertes contrats expirants
0 8 * * * curl -fsS "https://rh.datasphere.gn/api/cron/contract-alerts?key=VOTRE_CRON_SECRET" >> /var/log/datasphere-cron.log 2>&1

# Retry queue webhooks (toutes les 5 min)
*/5 * * * * curl -fsS "https://rh.datasphere.gn/api/cron/webhook-retries?key=VOTRE_CRON_SECRET" >> /var/log/datasphere-cron.log 2>&1

# Alertes budget IA (toutes les heures)
0 * * * * curl -fsS "https://rh.datasphere.gn/api/cron/llm-budget-alerts?key=VOTRE_CRON_SECRET" >> /var/log/datasphere-cron.log 2>&1
```

## 8. Monitoring (optionnel)

### Prometheus + Grafana

```bash
# Installation Prometheus + Grafana via Docker
docker run -d --name prometheus -p 9090:9090 \
  -v $(pwd)/docs/grafana/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus

docker run -d --name grafana -p 3001:3000 grafana/grafana

# Importer le dashboard
# 1. Ouvrir http://localhost:3001 (admin/admin)
# 2. Configuration → Data sources → Ajouter Prometheus (http://host.docker.internal:9090)
# 3. Dashboards → Import → Upload docs/grafana/dashboard.json
```

Voir `docs/grafana/README.md` pour les détails.

## 9. Sauvegardes automatiques

```bash
# Script de backup quotidien
sudo tee /usr/local/bin/datasphere-backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/datasphere"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup Postgres
docker exec datasphere-postgres pg_dump -U datasphere datasphere | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Garde 30 jours
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
EOF

sudo chmod +x /usr/local/bin/datasphere-backup.sh

# Cron à 2h du matin
echo "0 2 * * * /usr/local/bin/datasphere-backup.sh" | sudo crontab -
```

## 10. Vérification finale

```bash
# Health check
curl https://rh.datasphere.gn/api/health

# Métriques
curl https://rh.datasphere.gn/api/metrics

# API docs
open https://rh.datasphere.gn/api-docs

# Test chatbot
curl -X POST https://rh.datasphere.gn/api/chatbot \
  -H "Content-Type: application/json" \
  -d '{"message":"Bonjour"}'
```

## Maintenance

### Commandes utiles

```bash
# Voir les logs
bash scripts/deploy/deploy.sh logs

# Redémarrer l'app
bash scripts/deploy/deploy.sh restart

# Mettre à jour (après git pull)
bash scripts/deploy/deploy.sh build
bash scripts/deploy/deploy.sh restart

# Migration après mise à jour
bash scripts/deploy/deploy.sh migrate
```

### Mise à jour

```bash
git pull origin main
bun install
npx prisma migrate deploy
npx prisma generate
bash scripts/deploy/deploy.sh build
bash scripts/deploy/deploy.sh restart
```

### Rollback

```bash
# Conserve la version précédente
docker tag datasphere-rh:latest datasphere-rh:previous
bash scripts/deploy/deploy.sh build
bash scripts/deploy/deploy.sh restart

# Si problème : rollback
docker tag datasphere-rh:previous datasphere-rh:latest
bash scripts/deploy/deploy.sh restart
```

## Troubleshooting

### L'app ne démarre pas

```bash
# Voir les logs
docker logs datasphere-rh-app

# Vérifier la DB
docker exec datasphere-postgres pg_isready -U datasphere

# Vérifier le .env
cat .env | grep DATABASE_URL
```

### SSL expiré

```bash
sudo certbot renew
sudo systemctl reload nginx
```

### Mémoire élevée

```bash
# Voir l'usage
docker stats datasphere-rh-app

# Redémarrer si > 1GB
bash scripts/deploy/deploy.sh restart
```

### Performance LLM lente

```bash
# Voir la latence moyenne
curl https://rh.datasphere.gn/api/metrics | grep llm_avg_duration

# Si > 5s, changer de provider (Groq pour la vitesse, ZAI pour la Guinée)
```

## Sécurité

- ✅ HTTPS forcé (redirection HTTP → HTTPS)
- ✅ Headers de sécurité (X-Frame-Options, X-Content-Type-Options, HSTS)
- ✅ Rate limiting nginx (API: 100r/m, LLM: 30r/m)
- ✅ Clés API hashées (SHA-256, jamais stockées en clair)
- ✅ RBAC multi-niveau (6 rôles, 12 permissions)
- ✅ Multi-tenant strict (isolation companyId)
- ✅ Audit trail immuable (toutes actions tracées)
- ✅ Rate limiting LLM (500 appels/jour, 100/h, $10/jour par défaut)

## Architecture finale

```
Internet → nginx (SSL, rate limit) → Next.js app (:3000)
                                        ↓
                                    PostgreSQL 16 + pgvector (:5432)
                                        ↓
                                    Redis 7 (:6379, cache/sessions)
                                        ↓
                                    APIs LLM externes (ZAI, OpenAI, Claude...)
```
