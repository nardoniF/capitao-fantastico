#!/usr/bin/env bash
# Restaura vitrine CJ após trocar DATABASE_URL (Supabase ou outro Postgres).
# Uso:
#   1. Crie projeto em https://supabase.com (Free)
#   2. Settings → Database → Connection string → URI (pooler, porta 6543)
#   3. Vercel → capitao-fantastico → DATABASE_URL → cole → Redeploy
#   4. Local: export DATABASE_URL="postgresql://..."
#   5. ./scripts/setup-supabase-restore.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Defina DATABASE_URL (Supabase pooler URI com ?sslmode=require)"
  exit 1
fi

echo "→ prisma db push"
npx prisma db push

echo "→ importar até 200 produtos CJ (pode levar 10–30 min)"
npx tsx scripts/import-to-200.ts

echo "✔ Concluído. Confira /produtos e /admin"
