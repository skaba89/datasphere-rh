#!/bin/bash
# =============================================================================
# Tests E2E étendus — Features IA (LLM, RAG, Workflows, API v1, Vision)
# =============================================================================
# À exécuter après run-e2e.sh (tests de base)
# Usage : bash scripts/e2e/run-e2e-ai.sh
# =============================================================================

set -e
BASE_URL="${BASE_URL:-http://localhost:3000}"
PASS=0
FAIL=0
declare -a FAILURES

color_ok()   { printf "\033[32m%s\033[0m\n" "$1"; }
color_fail() { printf "\033[31m%s\033[0m\n" "$1"; }
color_info() { printf "\033[36m%s\033[0m\n" "$1"; }

assert_contains() {
  local name="$1" json="$2" pattern="$3"
  if echo "$json" | python3 -c "import json,sys; d=json.load(sys.stdin); sys.exit(0 if '$pattern' in json.dumps(d) else 1)" 2>/dev/null; then
    color_ok "  ✓ $name"
    PASS=$((PASS+1))
  else
    color_fail "  ✗ $name"
    FAIL=$((FAIL+1))
    FAILURES+=("$name")
  fi
}

assert_status() {
  local name="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then
    color_ok "  ✓ $name (HTTP $actual)"
    PASS=$((PASS+1))
  else
    color_fail "  ✗ $name (attendu $expected, obtenu $actual)"
    FAIL=$((FAIL+1))
    FAILURES+=("$name")
  fi
}

echo ""
color_info "============================================================"
color_info "  TESTS E2E IA — DataSphere RH"
color_info "  Base URL : $BASE_URL"
color_info "============================================================"
echo ""

# ============================================================================
# 1. LLM Providers
# ============================================================================
color_info "▸ 1. LLM Providers"
RESP=$(curl -s "$BASE_URL/api/llm/providers")
assert_contains "Providers liste" "$RESP" "providers"
assert_contains "Providers >= 11" "$RESP" "glm-4.6"
assert_contains "Providers OpenAI" "$RESP" "openai"
assert_contains "Providers Groq" "$RESP" "groq"
assert_contains "Providers Gemini" "$RESP" "gemini"

# ============================================================================
# 2. LLM Chat
# ============================================================================
color_info ""
color_info "▸ 2. LLM Chat (ZAI)"
RESP=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"provider":"zai","model":"glm-4.6","messages":[{"role":"user","content":"Dis OK"}],"maxTokens":20}' \
  "$BASE_URL/api/llm/chat")
assert_contains "Chat success" "$RESP" "success"
assert_contains "Chat content" "$RESP" "content"
assert_contains "Chat provider zai" "$RESP" 'zai'
assert_contains "Chat usage tokens" "$RESP" "totalTokens"

# ============================================================================
# 3. LLM Test endpoint
# ============================================================================
color_info ""
color_info "▸ 3. LLM Test"
RESP=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"provider":"zai"}' \
  "$BASE_URL/api/llm/test")
assert_contains "Test success" "$RESP" "success"
assert_contains "Test response" "$RESP" "response"

# ============================================================================
# 4. LLM Templates
# ============================================================================
color_info ""
color_info "▸ 4. LLM Templates"
RESP=$(curl -s "$BASE_URL/api/llm/templates")
assert_contains "Templates liste" "$RESP" "templates"
assert_contains "Templates >= 11" "$RESP" "contrat_cdi_resume"

RESP=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"templateId":"contrat_cdi_resume","variables":{"poste":"Dev","salaire":"1500000","date_embauche":"2026-01-15","periode_essai":"3 mois","lieu":"Conakry"}}' \
  "$BASE_URL/api/llm/templates/run")
assert_contains "Template run success" "$RESP" "success"
assert_contains "Template run content" "$RESP" "content"
assert_contains "Template run generationId" "$RESP" "generationId"

# ============================================================================
# 5. RAG
# ============================================================================
color_info ""
color_info "▸ 5. RAG (Recherche + Q&A)"
RESP=$(curl -s "$BASE_URL/api/llm/rag/search?q=teletravail&limit=3")
assert_contains "RAG search results" "$RESP" "results"

RESP=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"question":"Combien de jours de teletravail par semaine ?"}' \
  "$BASE_URL/api/llm/rag/ask")
assert_contains "RAG ask answer" "$RESP" "answer"
assert_contains "RAG ask sources" "$RESP" "sources"

# ============================================================================
# 6. Embeddings
# ============================================================================
color_info ""
color_info "▸ 6. Embeddings"
RESP=$(curl -s "$BASE_URL/api/llm/rag/embeddings")
assert_contains "Embeddings status" "$RESP" "withEmbeddings"

RESP=$(curl -s "$BASE_URL/api/llm/rag/vector-search?q=travail&limit=3")
assert_contains "Vector search results" "$RESP" "results"

# ============================================================================
# 7. Workflows
# ============================================================================
color_info ""
color_info "▸ 7. Workflows"
RESP=$(curl -s "$BASE_URL/api/llm/workflows")
assert_contains "Workflows liste" "$RESP" "workflows"
assert_contains "Workflows predefined" "$RESP" "contract_pipeline"

RESP=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"workflowId":"document_analysis","input":"Test document for analysis with RH content about congés and teletravail."}' \
  "$BASE_URL/api/llm/workflows")
assert_contains "Workflow run success" "$RESP" "success"
assert_contains "Workflow run steps" "$RESP" "steps"
assert_contains "Workflow run finalOutput" "$RESP" "finalOutput"

# ============================================================================
# 8. Custom Workflows
# ============================================================================
color_info ""
color_info "▸ 8. Custom Workflows CRUD"
RESP=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"name":"Test E2E workflow","description":"Workflow de test","steps":[{"id":"s1","type":"summarize","label":"Résumer","config":{"prompt":"3 points","temperature":0.5,"maxTokens":300}}],"trigger":"manual"}' \
  "$BASE_URL/api/llm/custom-workflows")
assert_contains "Custom workflow create" "$RESP" "success"

RESP=$(curl -s "$BASE_URL/api/llm/custom-workflows")
assert_contains "Custom workflow list" "$RESP" "custom"

# ============================================================================
# 9. Generations (Bibliothèque IA)
# ============================================================================
color_info ""
color_info "▸ 9. Generations (Bibliothèque IA)"
RESP=$(curl -s "$BASE_URL/api/llm/generations")
assert_contains "Generations list" "$RESP" "generations"

# ============================================================================
# 10. API Keys
# ============================================================================
color_info ""
color_info "▸ 10. API Keys"
RESP=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"name":"Test E2E","scopes":["llm:chat","rag:ask","*"],"rateLimitPerHour":100}' \
  "$BASE_URL/api/llm/api-keys")
assert_contains "API key create" "$RESP" "plainKey"
KEY=$(echo "$RESP" | python3 -c "import json,sys; print(json.load(sys.stdin).get('plainKey',''))" 2>/dev/null)

if [ -n "$KEY" ]; then
  color_ok "  ✓ Clé API générée (${KEY:0:20}...)"
  PASS=$((PASS+1))
else
  color_fail "  ✗ Clé API non générée"
  FAIL=$((FAIL+1))
  FAILURES+=("API key generation")
fi

# ============================================================================
# 11. API v1 (publique avec clé API)
# ============================================================================
color_info ""
color_info "▸ 11. API v1 publique"

# Sans clé → 401
HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/v1/llm/chat" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}]}')
assert_status "API v1 sans clé → 401" "401" "$HTTP"

if [ -n "$KEY" ]; then
  # Chat via API v1
  RESP=$(curl -s -X POST "$BASE_URL/api/v1/llm/chat" \
    -H "Authorization: Bearer $KEY" \
    -H "Content-Type: application/json" \
    -d '{"messages":[{"role":"user","content":"Dis bonjour"}],"maxTokens":30}')
  assert_contains "API v1 chat success" "$RESP" "success"

  # RAG via API v1
  RESP=$(curl -s -X POST "$BASE_URL/api/v1/llm/rag/ask" \
    -H "Authorization: Bearer $KEY" \
    -H "Content-Type: application/json" \
    -d '{"question":"Politique de teletravail ?"}')
  assert_contains "API v1 RAG answer" "$RESP" "answer"

  # Template via API v1
  RESP=$(curl -s -X POST "$BASE_URL/api/v1/llm/templates/run" \
    -H "Authorization: Bearer $KEY" \
    -H "Content-Type: application/json" \
    -d '{"templateId":"contrat_cdi_resume","variables":{"poste":"Dev","salaire":"1000000","date_embauche":"2026-01-01","periode_essai":"3 mois","lieu":"Conakry"}}')
  assert_contains "API v1 template success" "$RESP" "success"

  # Workflow via API v1
  RESP=$(curl -s -X POST "$BASE_URL/api/v1/llm/workflows/run" \
    -H "Authorization: Bearer $KEY" \
    -H "Content-Type: application/json" \
    -d '{"workflowId":"document_analysis","input":"Document test for API v1 workflow."}')
  assert_contains "API v1 workflow success" "$RESP" "success"

  # Scope insuffisant (vision sans scope)
  RESP=$(curl -s -X POST "$BASE_URL/api/v1/llm/vision" \
    -H "Authorization: Bearer $KEY" \
    -H "Content-Type: application/json" \
    -d '{"images":[{"base64":"test"}],"prompt":"test"}')
  assert_contains "API v1 vision scope refusé" "$RESP" 'insuffisant'
fi

# ============================================================================
# 12. Chatbot (avec function calling)
# ============================================================================
color_info ""
color_info "▸ 12. Chatbot + Function calling"
RESP=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"message":"Combien y a-t-il d employes actifs ?"}' \
  "$BASE_URL/api/chatbot-smart")
assert_contains "Chatbot smart reply" "$RESP" "reply"
assert_contains "Chatbot smart function" "$RESP" "functionCalled"

# ============================================================================
# 13. Marketplace
# ============================================================================
color_info ""
color_info "▸ 13. Marketplace"
RESP=$(curl -s "$BASE_URL/api/llm/marketplace")
assert_contains "Marketplace liste" "$RESP" "templates"
assert_contains "Marketplace officiels" "$RESP" "contract_pipeline"

# ============================================================================
# 14. Outgoing Webhooks
# ============================================================================
color_info ""
color_info "▸ 14. Outgoing Webhooks"
RESP=$(curl -s "$BASE_URL/api/llm/outgoing-webhooks")
assert_contains "Webhooks list" "$RESP" "availableEvents"

# ============================================================================
# 15. Health + Metrics
# ============================================================================
color_info ""
color_info "▸ 15. Health + Metrics"
RESP=$(curl -s "$BASE_URL/api/health")
assert_contains "Health status" "$RESP" "healthy"
assert_contains "Health database" "$RESP" "database"

RESP=$(curl -s "$BASE_URL/api/metrics")
HTTP=$(echo "$RESP" | grep -c "datasphere_companies_total"); if [ "$HTTP" -gt 0 ]; then color_ok "  ✓ Metrics companies"; PASS=$((PASS+1)); else color_fail "  ✗ Metrics companies"; FAIL=$((FAIL+1)); FAILURES+=("Metrics companies"); fi
HTTP=$(echo "$RESP" | grep -c "datasphere_llm_usages_total"); if [ "$HTTP" -gt 0 ]; then color_ok "  ✓ Metrics LLM"; PASS=$((PASS+1)); else color_fail "  ✗ Metrics LLM"; FAIL=$((FAIL+1)); FAILURES+=("Metrics LLM"); fi

# ============================================================================
# 16. API Docs (Swagger)
# ============================================================================
color_info ""
color_info "▸ 16. API Docs (Swagger)"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api-docs")
assert_status "Swagger UI accessible" "200" "$HTTP"

# ============================================================================
# Résumé
# ============================================================================
echo ""
color_info "============================================================"
if [ "$FAIL" -eq "0" ]; then
  color_ok "  RÉSULTAT IA : $PASS/$PASS tests passent ✓"
  color_ok "  Aucune défaillance détectée"
else
  color_fail "  RÉSULTAT IA : $PASS tests OK, $FAIL échecs"
  color_fail "  Défaillances :"
  for f in "${FAILURES[@]}"; do
    color_fail "    - $f"
  done
fi
color_info "============================================================"
echo ""

[ "$FAIL" -eq "0" ]
