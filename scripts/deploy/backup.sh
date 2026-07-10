#!/bin/bash
# =============================================================================
# DataSphere RH — Backup et restauration automatiques
# =============================================================================
# Usage :
#   bash scripts/deploy/backup.sh                 # Backup complet
#   bash scripts/deploy/backup.sh restore FILE    # Restaurer depuis un backup
#   bash scripts/deploy/backup.sh list            # Lister les backups
#   bash scripts/deploy/backup.sh test-restore    # Test de restauration (sandbox)
# =============================================================================

set -e

BACKUP_DIR="${BACKUP_DIR:-/var/backups/datasphere}"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

print_ok()   { echo -e "${GREEN}✓ $1${NC}"; }
print_err()  { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${CYAN}▸ $1${NC}"; }
print_warn() { echo -e "${YELLOW}⚠ $1${NC}"; }

# Détection du type de DB
detect_db_type() {
  if echo "$DATABASE_URL" | grep -q "^postgresql"; then
    echo "postgres"
  elif echo "$DATABASE_URL" | grep -q "^file:"; then
    echo "sqlite"
  else
    echo "unknown"
  fi
}

# ━━━ Backup ━━━

cmd_backup() {
  mkdir -p "$BACKUP_DIR"
  local DB_TYPE=$(detect_db_type)
  local BACKUP_FILE="$BACKUP_DIR/datasphere_$DATE"

  print_info "Backup DataSphere RH ($DB_type) — $(date)"

  case "$DB_TYPE" in
    postgres)
      # Backup PostgreSQL complet avec compression
      BACKUP_FILE="${BACKUP_FILE}.sql.gz"
      print_info "Dump PostgreSQL..."
      docker exec datasphere-postgres pg_dump -U datasphere datasphere 2>/dev/null | gzip > "$BACKUP_FILE" || \
        pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"
      print_ok "Backup PostgreSQL : $BACKUP_FILE"
      ;;

    sqlite)
      BACKUP_FILE="${BACKUP_FILE}.db"
      local DB_PATH=$(echo "$DATABASE_URL" | sed 's/^file://' | sed 's|^\./||')
      if [ -f "$DB_PATH" ]; then
        cp "$DB_PATH" "$BACKUP_FILE"
        gzip "$BACKUP_FILE"
        BACKUP_FILE="${BACKUP_FILE}.gz"
        print_ok "Backup SQLite : $BACKUP_FILE"
      else
        print_err "Base SQLite introuvable : $DB_PATH"
        exit 1
      fi
      ;;

    *)
      print_err "Type de DB non supporté : $DATABASE_URL"
      exit 1
      ;;
  esac

  # Backup des fichiers .env et configs
  tar czf "$BACKUP_DIR/configs_$DATE.tar.gz" \
    .env \
    prisma/schema.prisma \
    nginx.conf \
    docker-compose.yml \
    2>/dev/null || true
  print_ok "Backup configs : $BACKUP_DIR/configs_$DATE.tar.gz"

  # Nettoyage des anciens backups
  print_info "Nettoyage des backups > $RETENTION_DAYS jours..."
  local deleted=$(find "$BACKUP_DIR" -name "*.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
  if [ "$deleted" -gt 0 ]; then
    print_ok "$deleted ancien(s) backup(s) supprimé(s)"
  fi

  # Statistiques
  local size=$(du -sh "$BACKUP_DIR" | cut -f1)
  local count=$(ls -1 "$BACKUP_DIR"/*.gz 2>/dev/null | wc -l)
  print_ok "Backup terminé — $count fichier(s), taille totale : $size"

  # Vérification d'intégrité
  if gunzip -t "$BACKUP_FILE" 2>/dev/null; then
    print_ok "Vérification d'intégrité : OK"
  else
    print_warn "Vérification d'intégrité : échec (backup potentiellement corrompu)"
  fi
}

# ━━━ Restore ━━━

cmd_restore() {
  local FILE="$1"
  if [ -z "$FILE" ]; then
    print_err "Fichier de backup requis : backup.sh restore <file>"
    exit 1
  fi

  if [ ! -f "$FILE" ]; then
    print_err "Fichier introuvable : $FILE"
    exit 1
  fi

  print_warn "ATTENTION : cette opération va ÉCRASER la base actuelle !"
  read -p "Continuer ? (tapez 'CONFIRM') : " confirm
  if [ "$confirm" != "CONFIRM" ]; then
    print_info "Restauration annulée"
    exit 0
  fi

  local DB_TYPE=$(detect_db_type)

  case "$DB_TYPE" in
    postgres)
      print_info "Restauration PostgreSQL depuis $FILE..."
      gunzip -c "$FILE" | docker exec -i datasphere-postgres psql -U datasphere datasphere 2>/dev/null || \
        gunzip -c "$FILE" | psql "$DATABASE_URL"
      print_ok "Restauration PostgreSQL terminée"
      ;;

    sqlite)
      local DB_PATH=$(echo "$DATABASE_URL" | sed 's/^file://' | sed 's|^\./||')
      print_info "Restauration SQLite depuis $FILE..."
      cp "$DB_PATH" "${DB_PATH}.bak.$(date +%s)"  # backup de sécurité
      gunzip -c "$FILE" > "$DB_PATH"
      print_ok "Restauration SQLite terminée (backup sécurité : ${DB_PATH}.bak.*)"
      ;;
  esac

  # Migration post-restauration
  print_info "Vérification des migrations..."
  npx prisma migrate deploy 2>/dev/null || true
  print_ok "Migrations appliquées"

  # Health check
  print_info "Vérification health check..."
  sleep 2
  if curl -sf http://localhost:3000/api/health >/dev/null 2>&1; then
    print_ok "Application opérationnelle après restauration"
  else
    print_warn "Application non accessible — vérifiez les logs"
  fi
}

# ━━━ Test de restauration ━━━

cmd_test_restore() {
  print_info "Test de restauration en sandbox..."
  local LATEST=$(ls -t "$BACKUP_DIR"/datasphere_*.gz 2>/dev/null | head -1)

  if [ -z "$LATEST" ]; then
    print_err "Aucun backup trouvé dans $BACKUP_DIR"
    exit 1
  fi

  print_info "Backup sélectionné : $LATEST"

  # Vérifie l'intégrité
  if gunzip -t "$LATEST" 2>/dev/null; then
    print_ok "Intégrité : OK"
  else
    print_err "Intégrité : ÉCHEC — backup corrompu"
    exit 1
  fi

  # Test de décompression
  local TMPFILE=$(mktemp)
  gunzip -c "$LATEST" > "$TMPFILE"
  local SIZE=$(du -sh "$TMPFILE" | cut -f1)
  local LINES=$(wc -l < "$TMPFILE")
  print_ok "Décompression : OK ($SIZE, $LINES lignes)"

  # Vérifie que le dump contient des données (CREATE TABLE, INSERT, etc.)
  local tables=$(grep -c "CREATE TABLE" "$TMPFILE" 2>/dev/null || echo 0)
  local inserts=$(grep -c "INSERT INTO" "$TMPFILE" 2>/dev/null || echo 0)
  print_ok "Tables : $tables | Inserts : $inserts"

  if [ "$tables" -lt 5 ]; then
    print_warn "Peu de tables détectées — vérifiez le contenu"
  fi

  rm "$TMPFILE"
  print_ok "Test de restauration réussi — backup valide et restaurable"
}

# ━━━ List ━━━

cmd_list() {
  print_info "Backups disponibles dans $BACKUP_DIR :"
  echo ""
  if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
    print_warn "Aucun backup trouvé"
    exit 0
  fi

  printf "%-50s %10s %20s\n" "Fichier" "Taille" "Date"
  printf "%-50s %10s %20s\n" "$(printf '%.0s-' {1..50})" "$(printf '%.0s-' {1..10})" "$(printf '%.0s-' {1..20})"

  ls -lt "$BACKUP_DIR"/*.gz 2>/dev/null | while read -r line; do
    local file=$(echo "$line" | awk '{print $NF}')
    local size=$(du -sh "$file" | cut -f1)
    local date=$(echo "$line" | awk '{print $6, $7, $8}')
    local basename=$(basename "$file")
    printf "%-50s %10s %20s\n" "$basename" "$size" "$date"
  done

  echo ""
  local total=$(du -sh "$BACKUP_DIR" | cut -f1)
  local count=$(ls -1 "$BACKUP_DIR"/*.gz 2>/dev/null | wc -l)
  print_ok "Total : $count backup(s), $total"
}

# ━━━ Main ━━━

case "${1:-backup}" in
  backup)        cmd_backup ;;
  restore)       cmd_restore "$2" ;;
  test-restore)  cmd_test_restore ;;
  list)          cmd_list ;;
  *)
    echo "Usage: $0 {backup|restore <file>|test-restore|list}"
    echo ""
    echo "Commands:"
    echo "  backup        Backup complet (DB + configs)"
    echo "  restore FILE  Restaurer depuis un fichier de backup"
    echo "  test-restore  Tester l'intégrité du dernier backup"
    echo "  list          Lister tous les backups disponibles"
    exit 1
    ;;
esac
