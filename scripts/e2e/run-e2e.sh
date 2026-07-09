#!/bin/bash
# =============================================================================
# Tests E2E — Flux critiques des modules avancés DataSphere RH
# =============================================================================
# Valide les flux suivants :
#   1. Pilotage → état initial
#   2. Contrats → liste + détail
#   3. Contrats → renouvellement → audit + webhook delivery
#   4. Blockchain → révocation → audit + webhook delivery
#   5. IA prédictive → entraînement → audit + métriques
#   6. Cron alertes → notifications IN_APP
#   7. Notifications → liste + marquer comme lu
#   8. Webhooks → liste + historique livraisons
#   9. Audit trail → filtrage par module
#  10. Pilotage → KPIs incrémentés après actions
# =============================================================================

set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"
PASS=0
FAIL=0
declare -a FAILURES

color_ok()   { printf "\033[32m%s\033[0m\n" "$1"; }
color_fail() { printf "\033[31m%s\033[0m\n" "$1"; }
color_info() { printf "\033[36m%s\033[0m\n" "$1"; }

assert_status() {
  local name="$1"
  local expected="$2"
  local actual="$3"
  if [ "$actual" = "$expected" ]; then
    color_ok "  ✓ $name (HTTP $actual)"
    PASS=$((PASS+1))
  else
    color_fail "  ✗ $name (attendu $expected, obtenu $actual)"
    FAIL=$((FAIL+1))
    FAILURES+=("$name")
  fi
}

assert_json_field() {
  local name="$1"
  local json="$2"
  local field="$3"
  local expected="$4"
  local actual=$(echo "$json" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('$field', '___MISSING___'))" 2>/dev/null || echo "___ERROR___")
  if [ "$actual" = "$expected" ]; then
    color_ok "  ✓ $name ($field=$actual)"
    PASS=$((PASS+1))
  else
    color_fail "  ✗ $name (attendu $field=$expected, obtenu $actual)"
    FAIL=$((FAIL+1))
    FAILURES+=("$name")
  fi
}

assert_json_contains() {
  local name="$1"
  local json="$2"
  local pattern="$3"
  if echo "$json" | python3 -c "import json,sys; d=json.load(sys.stdin); sys.exit(0 if '$pattern' in json.dumps(d) else 1)" 2>/dev/null; then
    color_ok "  ✓ $name (contient '$pattern')"
    PASS=$((PASS+1))
  else
    color_fail "  ✗ $name (ne contient pas '$pattern')"
    FAIL=$((FAIL+1))
    FAILURES+=("$name")
  fi
}

# Helper pour récupérer un champ JSON (supporte nested avec points)
get_field() {
  echo "$1" | python3 -c "
import json,sys
d = json.load(sys.stdin)
keys = '$2'.split('.')
for k in keys:
    if isinstance(d, dict):
        d = d.get(k, '')
    else:
        d = ''
        break
print(d)
" 2>/dev/null
}

echo ""
color_info "============================================================"
color_info "  TESTS E2E — DataSphere RH (modules avancés)"
color_info "  Base URL : $BASE_URL"
color_info "============================================================"
echo ""

# ============================================================================
# 0. Sanity check
# ============================================================================
color_info "▸ 0. Sanity check"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
assert_status "Page d'accueil" "200" "$HTTP"

# ============================================================================
# 1. Pilotage — état initial
# ============================================================================
color_info ""
color_info "▸ 1. Pilotage consolidé — état initial"
RESP=$(curl -s "$BASE_URL/api/pilotage")
MODULES_COUNT=$(echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('modules',[])))" 2>/dev/null)
if [ "$MODULES_COUNT" = "4" ]; then
  color_ok "  ✓ Pilotage retourne 4 modules"
  PASS=$((PASS+1))
else
  color_fail "  ✗ Pilotage devrait retourner 4 modules (obtenu : $MODULES_COUNT)"
  FAIL=$((FAIL+1))
  FAILURES+=("Pilotage modules")
fi
assert_status "Pilotage HTTP" "200" "$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/pilotage")"

# Capture des KPIs initiaux (nested)
INITIAL_AUDIT=$(get_field "$RESP" "kpis.audit.total")
color_info "  ℹ Audit total initial : $INITIAL_AUDIT"

# ============================================================================
# 2. Contrats — liste + détail
# ============================================================================
color_info ""
color_info "▸ 2. Contrats — liste et détail"
RESP=$(curl -s "$BASE_URL/api/contracts-mgmt")
CONTRACTS_COUNT=$(echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('contracts',[])))" 2>/dev/null)
if [ "$CONTRACTS_COUNT" -gt "0" ] 2>/dev/null; then
  color_ok "  ✓ Liste contrats ($CONTRACTS_COUNT contrats)"
  PASS=$((PASS+1))
else
  color_fail "  ✗ Liste contrats vide"
  FAIL=$((FAIL+1))
  FAILURES+=("Liste contrats")
fi

# Récupère un contrat au hasard pour test détail
CONTRACT_ID=$(echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['contracts'][0]['id'] if d.get('contracts') else '')" 2>/dev/null)
if [ -n "$CONTRACT_ID" ]; then
  RESP_DETAIL=$(curl -s "$BASE_URL/api/contracts-mgmt/$CONTRACT_ID")
  assert_status "Détail contrat HTTP" "200" "$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/contracts-mgmt/$CONTRACT_ID")"
  assert_json_contains "Détail contient timeline" "$RESP_DETAIL" "timeline"
fi

# ============================================================================
# 3. Contrats → renouvellement → audit + webhook delivery
# ============================================================================
color_info ""
color_info "▸ 3. Flux renouvellement contrat"
RESP=$(curl -s -X POST -H "Content-Type: application/json" -d "{\"contractId\":\"$CONTRACT_ID\",\"durationMonths\":12}" "$BASE_URL/api/contracts-mgmt/renew")
assert_json_field "Renouvellement success" "$RESP" "success" "True"
TX_HASH=$(get_field "$RESP" "renewed.txHash")
if [ -n "$TX_HASH" ] && [ "$TX_HASH" != "" ]; then
  color_ok "  ✓ Tx hash généré ($TX_HASH)"
  PASS=$((PASS+1))
else
  color_fail "  ✗ Tx hash manquant"
  FAIL=$((FAIL+1))
  FAILURES+=("Tx hash renouvellement")
fi

# ============================================================================
# 4. Blockchain → révocation → audit + webhook
# ============================================================================
color_info ""
color_info "▸ 4. Flux révocation certificat"
RESP=$(curl -s "$BASE_URL/api/blockchain")
CERT_ID=$(echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['certificates'][0]['id'] if d.get('certificates') else 'test-cert')" 2>/dev/null)
RESP=$(curl -s -X POST -H "Content-Type: application/json" -d "{\"certificateId\":\"$CERT_ID\",\"reason\":\"Test E2E de révocation\"}" "$BASE_URL/api/blockchain/revoke")
assert_json_field "Révocation success" "$RESP" "success" "True"

# Test validation motif court
RESP=$(curl -s -X POST -H "Content-Type: application/json" -d '{"certificateId":"x","reason":"ab"}' "$BASE_URL/api/blockchain/revoke")
assert_json_contains "Motif court rejeté" "$RESP" "min 5"

# ============================================================================
# 5. IA prédictive → entraînement
# ============================================================================
color_info ""
color_info "▸ 5. Flux entraînement IA"
RESP=$(curl -s -X POST "$BASE_URL/api/predictive/train")
assert_json_field "Entraînement success" "$RESP" "success" "True"
assert_json_contains "Métriques retournées" "$RESP" "modelVersion"
assert_json_contains "F1 score présent" "$RESP" "f1Score"

# ============================================================================
# 6. Cron alertes → notifications
# ============================================================================
color_info ""
color_info "▸ 6. Cron alertes automatiques"
# Sans clé → 401
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/cron/contract-alerts")
assert_status "Cron sans clé rejeté" "401" "$HTTP"

# Avec clé → 200
RESP=$(curl -s "$BASE_URL/api/cron/contract-alerts?key=datasphere-cron-2026")
assert_json_field "Cron success" "$RESP" "success" "True"

# ============================================================================
# 7. Notifications → liste + marquer comme lu
# ============================================================================
color_info ""
color_info "▸ 7. Notifications IN_APP"
RESP=$(curl -s "$BASE_URL/api/notifications")
assert_json_contains "Notifications présentes" "$RESP" "notifications"
UNREAD_BEFORE=$(get_field "$RESP" "unread")
color_info "  ℹ Unread avant : $UNREAD_BEFORE"

NOTIF_ID=$(echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['notifications'][0]['id'] if d.get('notifications') else '')" 2>/dev/null)
if [ -n "$NOTIF_ID" ]; then
  RESP=$(curl -s -X PATCH -H "Content-Type: application/json" -d '{"status":"LU"}' "$BASE_URL/api/notifications/$NOTIF_ID")
  assert_json_field "Marquer comme lu" "$RESP" "success" "True"
fi

# ============================================================================
# 8. Webhooks → liste + historique livraisons
# ============================================================================
color_info ""
color_info "▸ 8. Webhooks et historique livraisons"
RESP=$(curl -s "$BASE_URL/api/webhooks")
WEBHOOK_ID=$(echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['webhooks'][0]['id'] if d.get('webhooks') else '')" 2>/dev/null)

if [ -n "$WEBHOOK_ID" ]; then
  # Test du webhook
  RESP=$(curl -s -X POST -H "Content-Type: application/json" -d "{\"webhookId\":\"$WEBHOOK_ID\"}" "$BASE_URL/api/webhooks/test")
  assert_json_contains "Test webhook retourne statut" "$RESP" "status"

  # Historique des livraisons
  RESP=$(curl -s "$BASE_URL/api/webhooks/$WEBHOOK_ID/deliveries")
  assert_json_contains "Historique deliveries" "$RESP" "deliveries"
  assert_json_contains "Stats deliveries" "$RESP" "stats"
else
  color_fail "  ✗ Aucun webhook configuré"
  FAIL=$((FAIL+1))
  FAILURES+=("Webhook manquant")
fi

# ============================================================================
# 9. Audit trail → filtrage par module
# ============================================================================
color_info ""
color_info "▸ 9. Audit trail filtrable"
RESP=$(curl -s "$BASE_URL/api/audit-advanced")
assert_json_contains "Audit contient logs" "$RESP" "logs"
assert_json_contains "Audit contient stats" "$RESP" "stats"

RESP=$(curl -s "$BASE_URL/api/audit-advanced?module=BLOCKCHAIN")
BLOCKCHAIN_COUNT=$(echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('logs',[])))" 2>/dev/null)
if [ "$BLOCKCHAIN_COUNT" -gt "0" ] 2>/dev/null; then
  color_ok "  ✓ Filtre module BLOCKCHAIN ($BLOCKCHAIN_COUNT logs)"
  PASS=$((PASS+1))
else
  color_fail "  ✗ Filtre module BLOCKCHAIN vide"
  FAIL=$((FAIL+1))
  FAILURES+=("Filtre audit")
fi

# ============================================================================
# 10. Pilotage → KPIs incrémentés
# ============================================================================
color_info ""
color_info "▸ 10. Pilotage après actions"
RESP=$(curl -s "$BASE_URL/api/pilotage")
FINAL_AUDIT=$(get_field "$RESP" "kpis.audit.total")
color_info "  ℹ Audit total final : $FINAL_AUDIT (initial : $INITIAL_AUDIT)"
if [ "$FINAL_AUDIT" -gt "$INITIAL_AUDIT" ] 2>/dev/null; then
  color_ok "  ✓ KPIs audit incrémentés ($INITIAL_AUDIT → $FINAL_AUDIT)"
  PASS=$((PASS+1))
else
  color_fail "  ✗ KPIs audit non incrémentés"
  FAIL=$((FAIL+1))
  FAILURES+=("KPIs pilotage")
fi

# ============================================================================
# Résumé
# ============================================================================
echo ""
color_info "============================================================"
if [ "$FAIL" -eq "0" ]; then
  color_ok "  RÉSULTAT : $PASS/$PASS tests passent ✓"
  color_ok "  Aucune défaillance détectée"
else
  color_fail "  RÉSULTAT : $PASS tests OK, $FAIL échecs"
  color_fail "  Défaillances :"
  for f in "${FAILURES[@]}"; do
    color_fail "    - $f"
  done
fi
color_info "============================================================"
echo ""

[ "$FAIL" -eq "0" ]
