#!/bin/bash
# ============================================================
# Run Supabase migrations via the REST API
# ============================================================
# Usage:
#   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
#   bash run-migrations.sh
#
# Or pass it inline:
#   SUPABASE_SERVICE_ROLE_KEY="ey..." bash run-migrations.sh
# ============================================================

set -euo pipefail

PROJECT_REF="rawlqwjdfzicjepzmcng"
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"

# Check for service role key
if [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  echo "ERROR: SUPABASE_SERVICE_ROLE_KEY is not set."
  echo ""
  echo "  export SUPABASE_SERVICE_ROLE_KEY='your-key-here'"
  echo "  bash run-migrations.sh"
  echo ""
  echo "Find it in: Supabase Dashboard → Settings → API → service_role key"
  exit 1
fi

MIGRATIONS_DIR="$(cd "$(dirname "$0")/migrations" && pwd)"

# Migration files in order
MIGRATION_FILES=(
  "00001_consolidated_rls.sql"
  "00004_cleanup_test_data.sql"
)

run_sql() {
  local file="$1"
  local filepath="${MIGRATIONS_DIR}/${file}"

  if [ ! -f "$filepath" ]; then
    echo "  SKIP: $file (not found)"
    return 0
  fi

  local sql
  sql=$(<"$filepath")

  echo "  Running: $file ($(wc -c < "$filepath") bytes)..."

  local response
  local http_code

  # Use the Supabase pg-meta SQL execution endpoint
  response=$(curl -s -w "\n%{http_code}" \
    -X POST "${SUPABASE_URL}/rest/v1/rpc/" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d "$(jq -n --arg sql "$sql" '{query: $sql}')" \
    2>&1)

  http_code=$(echo "$response" | tail -1)
  local body
  body=$(echo "$response" | sed '$d')

  # If the rpc/ endpoint doesn't work, try the pg-meta endpoint
  if [ "$http_code" != "200" ] && [ "$http_code" != "204" ]; then
    echo "  RPC endpoint returned $http_code, trying pg-meta SQL endpoint..."

    response=$(curl -s -w "\n%{http_code}" \
      -X POST "https://${PROJECT_REF}.supabase.co/pg/query" \
      -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
      -H "Content-Type: application/json" \
      -d "$(jq -n --arg sql "$sql" '{query: $sql}')" \
      2>&1)

    http_code=$(echo "$response" | tail -1)
    body=$(echo "$response" | sed '$d')
  fi

  # If that also fails, try the management API sql endpoint
  if [ "$http_code" != "200" ] && [ "$http_code" != "204" ]; then
    echo "  pg-meta returned $http_code, trying direct SQL via management API..."

    response=$(curl -s -w "\n%{http_code}" \
      -X POST "https://${PROJECT_REF}.supabase.co/rest/v1/rpc/exec_sql" \
      -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
      -H "Content-Type: application/json" \
      -d "$(jq -n --arg sql "$sql" '{sql_string: $sql}')" \
      2>&1)

    http_code=$(echo "$response" | tail -1)
    body=$(echo "$response" | sed '$d')
  fi

  if [ "$http_code" = "200" ] || [ "$http_code" = "204" ]; then
    echo "  OK ($http_code)"
  else
    echo "  FAILED ($http_code)"
    echo "  Response: $body"
    echo ""
    echo "  ─────────────────────────────────────────────"
    echo "  None of the REST endpoints support raw SQL."
    echo "  You'll need to run this via one of:"
    echo ""
    echo "  1. Supabase Dashboard → SQL Editor (paste the file)"
    echo "  2. psql connection:"
    echo "     psql 'postgresql://postgres.${PROJECT_REF}:<PASSWORD>@aws-0-us-east-1.pooler.supabase.com:6543/postgres'"
    echo "  3. Supabase CLI: supabase db push --linked"
    echo "  ─────────────────────────────────────────────"
    return 1
  fi
}

echo "============================================"
echo "Supabase Migration Runner"
echo "Project: ${PROJECT_REF}"
echo "URL:     ${SUPABASE_URL}"
echo "============================================"
echo ""

failed=0
for file in "${MIGRATION_FILES[@]}"; do
  if ! run_sql "$file"; then
    failed=$((failed + 1))
  fi
done

echo ""
if [ "$failed" -eq 0 ]; then
  echo "All migrations completed successfully!"
else
  echo "${failed} migration(s) failed. See output above."
  exit 1
fi
