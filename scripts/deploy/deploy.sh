#!/bin/bash
# =============================================================================
# DataSphere RH — Script de déploiement production
# =============================================================================
# Usage :
#   bash scripts/deploy/deploy.sh build     # Build Docker image
#   bash scripts/deploy/deploy.sh start     # Démarrer services (Postgres + Redis + App)
#   bash scripts/deploy/deploy.sh stop      # Arrêter services
#   bash scripts/deploy/deploy.sh restart   # Redémarrer l'app uniquement
#   bash scripts/deploy/deploy.sh logs      # Voir les logs
#   bash scripts/deploy/deploy.sh status    # État des services
#   bash scripts/deploy/deploy.sh migrate   # Exécuter migrations Prisma
#   bash scripts/deploy/deploy.sh seed      # Seeder la base
#   bash scripts/deploy/deploy.sh health    # Test health check
# =============================================================================

set -e

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

IMAGE_NAME="datasphere-rh"
IMAGE_TAG="latest"
CONTAINER_NAME="datasphere-rh-app"
COMPOSE_FILE="docker-compose.yml"

print_ok()   { echo -e "${GREEN}✓ $1${NC}"; }
print_err()  { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${CYAN}▸ $1${NC}"; }
print_warn() { echo -e "${YELLOW}⚠ $1${NC}"; }

# ━━━ Commands ━━━

cmd_build() {
  print_info "Build Docker image ${IMAGE_NAME}:${IMAGE_TAG}..."
  docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
  print_ok "Image buildée"
}

cmd_start() {
  print_info "Démarrage des services (Postgres + Redis)..."
  docker compose -f ${COMPOSE_FILE} up -d
  print_ok "Postgres + Redis démarrés"

  print_info "Attente de Postgres (10s)..."
  sleep 10

  print_info "Démarrage de l'application..."
  # Si l'image n'existe pas, on build
  if ! docker image inspect ${IMAGE_NAME}:${IMAGE_TAG} >/dev/null 2>&1; then
    print_warn "Image non trouvée, build en cours..."
    cmd_build
  fi

  # Arrête l'ancien conteneur si présent
  docker rm -f ${CONTAINER_NAME} 2>/dev/null || true

  # Démarre l'app
  docker run -d \
    --name ${CONTAINER_NAME} \
    --env-file .env \
    -p 3000:3000 \
    --network host \
    --restart unless-stopped \
    ${IMAGE_NAME}:${IMAGE_TAG}

  print_ok "Application démarrée sur http://localhost:3000"

  # Attend que l'app soit prête
  print_info "Vérification health check (30s max)..."
  for i in $(seq 1 30); do
    if curl -sf http://localhost:3000/api/health >/dev/null 2>&1; then
      print_ok "Application prête"
      cmd_health
      return
    fi
    sleep 1
  done
  print_err "L'application n'a pas démarré dans les 30s"
  cmd_logs
}

cmd_stop() {
  print_info "Arrêt des services..."
  docker rm -f ${CONTAINER_NAME} 2>/dev/null || true
  docker compose -f ${COMPOSE_FILE} down
  print_ok "Services arrêtés"
}

cmd_restart() {
  print_info "Redémarrage de l'application..."
  docker restart ${CONTAINER_NAME}
  print_ok "Application redémarrée"
  sleep 3
  cmd_health
}

cmd_logs() {
  docker logs -f --tail 100 ${CONTAINER_NAME}
}

cmd_status() {
  print_info "État des conteneurs :"
  echo ""
  docker ps --filter "name=datasphere" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Aucun conteneur"
  echo ""
  print_info "Health check :"
  cmd_health
}

cmd_migrate() {
  print_info "Exécution des migrations Prisma..."
  docker exec ${CONTAINER_NAME} npx prisma migrate deploy 2>/dev/null || {
    print_warn "Exécution locale (mode dev)"
    npx prisma migrate deploy
  }
  print_ok "Migrations appliquées"
}

cmd_seed() {
  print_info "Seed de la base..."
  docker exec ${CONTAINER_NAME} npx tsx scripts/seed-v6.ts 2>/dev/null || {
    print_warn "Exécution locale (mode dev)"
    npx tsx scripts/seed-v6.ts
  }
  print_ok "Seed terminé"
}

cmd_health() {
  if ! curl -sf http://localhost:3000/api/health >/dev/null 2>&1; then
    print_err "Application non accessible"
    return 1
  fi

  local result=$(curl -s http://localhost:3000/api/health)
  local status=$(echo "$result" | python3 -c "import json,sys; print(json.load(sys.stdin)['status'])" 2>/dev/null || echo "unknown")

  if [ "$status" = "healthy" ]; then
    print_ok "Health: $status"
    echo "$result" | python3 -c "
import json, sys
d = json.load(sys.stdin)
for k, v in d['checks'].items():
    icon = '✓' if v['status'] == 'ok' else '✗'
    extra = f' ({v.get(\"latencyMs\",\"?\")}ms)' if 'latencyMs' in v else f' — {v.get(\"details\",\"\")}'
    print(f'  {icon} {k}: {v[\"status\"]}{extra}')
" 2>/dev/null
  else
    print_err "Health: $status"
  fi
}

# ━━━ Main ━━━

case "${1:-}" in
  build)    cmd_build ;;
  start)    cmd_start ;;
  stop)     cmd_stop ;;
  restart)  cmd_restart ;;
  logs)     cmd_logs ;;
  status)   cmd_status ;;
  migrate)  cmd_migrate ;;
  seed)     cmd_seed ;;
  health)   cmd_health ;;
  *)
    echo "Usage: $0 {build|start|stop|restart|logs|status|migrate|seed|health}"
    echo ""
    echo "Commands:"
    echo "  build     Build Docker image"
    echo "  start     Démarrer services + app"
    echo "  stop      Arrêter tous les services"
    echo "  restart   Redémarrer l'app uniquement"
    echo "  logs      Voir les logs (follow)"
    echo "  status    État des conteneurs + health"
    echo "  migrate   Exécuter migrations Prisma"
    echo "  seed      Seeder la base"
    echo "  health    Test health check"
    exit 1
    ;;
esac
