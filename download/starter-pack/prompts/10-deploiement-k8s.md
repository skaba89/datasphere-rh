# Prompt 10 — Déploiement Kubernetes + CI/CD

## CONTEXTE

Implémente le pipeline CI/CD complet et la configuration Kubernetes pour la
production de DataSphere RH Guinée.

## STACK

- GitHub Actions pour CI/CD
- Docker multi-stage builds
- Kubernetes (EKS ou OVHcloud Managed K8s)
- Helm 3 pour packaging
- ArgoCD pour GitOps (optionnel, phase 2)
- Cloudflare pour CDN + WAF + DNS

## 1. CI/CD GITHUB ACTIONS

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test --coverage
      - uses: codecov/codecov-action@v4

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm audit --audit-level=moderate
      - uses: snyk/actions/node@master
        with: { command: test }
        env: { SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }} }
      - uses: aquasecurity/trivy-action@master
        with: { image-ref: '.', scan-type: 'fs' }

  e2e:
    runs-on: ubuntu-latest
    needs: [lint-test]
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: test }
        ports: ['5432:5432']
      redis:
        image: redis:7
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm db:migrate
        env: { DATABASE_URL: postgresql://postgres:test@localhost:5432/test }
      - run: pnpm test:e2e
```

`.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  build-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build & Push API
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./apps/api/Dockerfile
          push: true
          tags: |
            ghcr.io/${{ github.repository }}/api:${{ github.sha }}
            ghcr.io/${{ github.repository }}/api:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build & Push Web
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./apps/web/Dockerfile
          push: true
          tags: |
            ghcr.io/${{ github.repository }}/web:${{ github.sha }}
            ghcr.io/${{ github.repository }}/web:latest

  deploy-staging:
    needs: build-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - uses: azure/setup-kubectl@v4
      - uses: azure/setup-helm@v4
      - run: |
          echo "${{ secrets.KUBE_CONFIG }}" > kubeconfig
          export KUBECONFIG=kubeconfig
          helm upgrade --install dsrh-api ./helm/api \
            --set image.tag=${{ github.sha }} \
            --set environment=staging \
            --namespace dsrh-staging
          helm upgrade --install dsrh-web ./helm/web \
            --set image.tag=${{ github.sha }} \
            --namespace dsrh-staging
          kubectl rollout status deployment/dsrh-api -n dsrh-staging
          kubectl rollout status deployment/dsrh-web -n dsrh-staging

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/v')
    environment: production
    steps:
      - uses: actions/checkout@v4
      # Helm deploy to production namespace
      # avec tests smoke post-deploy
```

## 2. DOCKERFILES MULTI-STAGE

`apps/api/Dockerfile`:

```dockerfile
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@9

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/*/package.json ./packages/*/
RUN pnpm install --frozen-lockfile --filter @dsrh/api...

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @dsrh/api build
RUN pnpm --filter @dsrh/api deploy --prod /tmp/api

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
COPY --from=builder --chown=nestjs:nodejs /tmp/api/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /tmp/api/dist ./dist
USER nestjs
EXPOSE 3001
CMD ["node", "dist/main.js"]
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget --quiet --tries=1 --spider http://localhost:3001/api/v1/health || exit 1
```

`apps/web/Dockerfile`:

```dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm@9

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/*/package.json ./packages/*/
RUN pnpm install --frozen-lockfile --filter @dsrh/web...

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @dsrh/web build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
```

## 3. HELM CHARTS

`helm/api/values.yaml`:

```yaml
replicaCount: 3
image:
  repository: ghcr.io/datasphere-rh-gn/api
  tag: latest
  pullPolicy: IfNotPresent

environment: production

resources:
  requests:
    cpu: 250m
    memory: 512Mi
  limits:
    cpu: 1000m
    memory: 1Gi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

env:
  DATABASE_URL: "{{ .Values.secrets.databaseUrl }}"
  REDIS_URL: "{{ .Values.secrets.redisUrl }}"
  S3_ENDPOINT: "{{ .Values.secrets.s3Endpoint }}"
  JWT_SECRET: "{{ .Values.secrets.jwtSecret }}"

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt
    nginx.ingress.kubernetes.io/rate-limit-requests: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
  hosts:
    - host: api.datasphererh.gn
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: api-tls
      hosts: [api.datasphererh.gn]

probes:
  liveness:
    httpGet: { path: /api/v1/health, port: 3001 }
    initialDelaySeconds: 30
  readiness:
    httpGet: { path: /api/v1/health/ready, port: 3001 }
    initialDelaySeconds: 10
```

## 4. K8S MANIFESTS (PostgreSQL managé recommandé)

- PostgreSQL: RDS ou Cloud SQL (managed, pas dans K8s)
- Redis: ElastiCache ou Redis Enterprise
- MinIO: S3 ou MinIO Operator
- App: Helm + HPA + Ingress + cert-manager

## 5. OBSERVABILITÉ

- Logs: Loki + Promtail (structuré JSON)
- Métriques: Prometheus + Grafana
- Traces: Tempo + OpenTelemetry
- Alerting: AlertManager + PagerDuty
- Erreurs: Sentry

## 6. ROLLBACK

- Helm rollback: `helm rollback dsrh-api REVISION`
- Database migrations: Prisma migration resolves, avec `prisma migrate resolve` si besoin
- Feature flags: LaunchDarkly pour désactiver fonctionnalité sans redeploy

## 7. DISASTER RECOVERY

- Backup PostgreSQL: quotidien, RPO 24h, rétention 30 jours
- Backup MinIO: cross-region replication
- DR test trimestriel: restore complet sur environnement DR
- Runbook documentation dans `docs/runbook/`

## 8. CHECKLIST PRODUCTION

- [ ] HTTPS obligatoire (cert-manager + Let's Encrypt)
- [ ] HSTS, CSP, X-Frame-Options headers
- [ ] Rate limiting (nginx ingress + API)
- [ ] WAF Cloudflare activé
- [ ] Secrets dans Kubernetes Secrets (jamais en clair)
- [ ] Rotation secrets via External Secrets Operator
- [ ] Backups automatiques testés
- [ ] Alerting sur 99.9% SLA
- [ ] Runbook complet
- [ ] Disaster recovery testé trimestriellement

Génère tous les fichiers + documentation + scripts de déploiement.
