#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# Render gives postgres:// — convert to SQLAlchemy psycopg flavor
if [[ "${DATABASE_URL:-}" == postgres://* ]]; then
  export DATABASE_URL="${DATABASE_URL/postgres:\/\//postgresql+psycopg:\/\/}"
fi

# Run DB migrations, then start API
alembic upgrade head
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
