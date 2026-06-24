#!/bin/bash
# Bot-store bootstrap: install postgres if missing, create db+schema, then exec bot-store
set -e

LOG=/tmp/botstore-boot.log
exec > >(tee -a $LOG) 2>&1
echo "=== $(date) bot-store boot ==="

# 1. Install PostgreSQL if missing
if ! command -v pg_ctlcluster >/dev/null 2>&1; then
  echo "[boot] installing postgresql..."
  apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq postgresql postgresql-contrib >/dev/null
fi

# 2. Start postgres cluster (idempotent)
if ! pg_isready -q 2>/dev/null; then
  echo "[boot] starting postgres cluster..."
  pg_ctlcluster 15 main start || true
  sleep 2
fi

# 3. Create role + db (idempotent)
su - postgres -c "psql -tc \"SELECT 1 FROM pg_roles WHERE rolname='botstore'\" | grep -q 1" \
  || su - postgres -c "psql -c \"CREATE USER botstore WITH PASSWORD 'botstore123';\""
su - postgres -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname='botstore_db'\" | grep -q 1" \
  || su - postgres -c "psql -c \"CREATE DATABASE botstore_db OWNER botstore;\""

# 4. Apply schema (idempotent)
PGPASSWORD=botstore123 psql -h localhost -U botstore -d botstore_db \
  -f /app/extracted/bot-store/schema.sql >/dev/null

mkdir -p /tmp/bot-assets

# 5. Exec bot-store
echo "[boot] launching bot-store..."
cd /app/extracted/bot-store
set -a
[ -f .env ] && source .env
set +a
exec node --max-old-space-size=512 api-server/dist/index.mjs
