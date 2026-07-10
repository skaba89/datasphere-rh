#!/bin/bash
# =============================================================================
# DataSphere RH — Configuration SSL Let's Encrypt
# =============================================================================
# Installe et configure certbot + nginx pour SSL automatique.
#
# Usage (en root) :
#   bash scripts/deploy/setup-ssl.sh rh.datasphere.gn
#   bash scripts/deploy/setup-ssl.sh rh.datasphere.gn user@email.com
# =============================================================================

set -e

DOMAIN="${1:-rh.datasphere.gn}"
EMAIL="${2:-admin@datasphere.gn}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

print_ok()   { echo -e "${GREEN}✓ $1${NC}"; }
print_info() { echo -e "${CYAN}▸ $1${NC}"; }
print_warn() { echo -e "${YELLOW}⚠ $1${NC}"; }

if [ "$EUID" -ne 0 ]; then
  echo "Ce script doit être exécuté en root (sudo)"
  exit 1
fi

print_info "Configuration SSL pour ${DOMAIN} (email: ${EMAIL})"

# 1. Installe certbot
if ! command -v certbot &> /dev/null; then
  print_info "Installation de certbot..."
  apt-get update -qq
  apt-get install -y -qq certbot python3-certbot-nginx
  print_ok "Certbot installé"
else
  print_ok "Certbot déjà installé"
fi

# 2. Vérifie que nginx est installé et configuré
if ! command -v nginx &> /dev/null; then
  print_warn "nginx non installé — installation..."
  apt-get install -y -qq nginx
fi

# 3. Copie la config nginx si pas déjà fait
NGINX_CONF="/etc/nginx/sites-available/${DOMAIN}"
if [ ! -f "$NGINX_CONF" ]; then
  print_info "Copie de la configuration nginx..."
  cp nginx.conf "$NGINX_CONF"
  sed -i "s/rh.datasphere.gn/${DOMAIN}/g" "$NGINX_CONF"
  ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/${DOMAIN}"
  print_ok "Configuration nginx installée"
fi

# 4. Test nginx
print_info "Test configuration nginx..."
nginx -t
print_ok "Configuration nginx valide"

# 5. Reload nginx (HTTP d'abord pour que Let's Encrypt puisse vérifier)
systemctl reload nginx
print_ok "nginx rechargé"

# 6. Obtient le certificat SSL
print_info "Obtention du certificat SSL via Let's Encrypt..."
certbot --nginx \
  -d "${DOMAIN}" \
  --non-interactive \
  --agree-tos \
  --email "${EMAIL}" \
  --redirect

print_ok "Certificat SSL obtenu et configuré"

# 7. Configuration du renouvellement automatique
print_info "Configuration du renouvellement automatique..."
echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'" | crontab -
print_ok "Renouvellement programmé (chaque jour à 3h)"

# 8. Test final
print_info "Test HTTPS..."
sleep 2
if curl -sf "https://${DOMAIN}/api/health" >/dev/null 2>&1; then
  print_ok "HTTPS fonctionne !"
  curl -s "https://${DOMAIN}/api/health" | python3 -m json.tool
else
  print_warn "HTTPS pas encore accessible — vérifiez que l'app tourne sur :3000"
fi

echo ""
print_ok "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_ok " Configuration SSL terminée pour ${DOMAIN}"
print_ok "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "URLs :"
echo "  Application : https://${DOMAIN}"
echo "  API docs    : https://${DOMAIN}/api-docs"
echo "  Health      : https://${DOMAIN}/api/health"
echo "  Metrics     : https://${DOMAIN}/api/metrics"
echo ""
echo "Renouvellement : automatique (cron 3h quotidien)"
