#!/usr/bin/env bash
set -euo pipefail

ROOT=/workspaces/eduapp
INFRA="$ROOT/infra"
BACKEND="$ROOT/apps/backend"

echo "▶ Bringing up Docker infra..."
cd "$INFRA"
docker compose up -d

echo "▶ Waiting for Postgres to be ready..."
for i in {1..30}; do
  if docker compose exec -T db pg_isready -U edu >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "▶ Applying DB migrations (Alembic)..."
cd "$BACKEND"
alembic upgrade head || true

# Start API if not listening already
if ! lsof -i:8000 >/dev/null 2>&1; then
  echo "▶ Starting API on :8000 (logs: /tmp/api.log)"
  nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > /tmp/api.log 2>&1 &
else
  echo "ℹ API already running on :8000"
fi

# Helpful hint for starting Expo Web pointed at the forwarded 8000 URL:
if [ -n "${CODESPACE_NAME:-}" ]; then
  echo
  echo "✅ Dev env ready."
  echo "To start Expo Web:"
  echo "  cd $ROOT/apps/mobile && export EXPO_PUBLIC_API_URL=\"https://${CODESPACE_NAME}-8000.app.github.dev\" && npx expo start --web"
else
  echo "✅ Dev env ready."
fi
