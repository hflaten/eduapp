#!/usr/bin/env bash
set -euo pipefail
APP=/workspaces/eduapp/apps/mobile
if [ -z "${CODESPACE_NAME:-}" ]; then
  echo "This helper is intended for GitHub Codespaces."; exit 1
fi
API_URL="https://${CODESPACE_NAME}-8000.app.github.dev"
cd "$APP"
export EXPO_PUBLIC_API_URL="$API_URL"
echo "EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL"
pkill -f "@expo/cli|expo start" 2>/dev/null || true
npx expo start --web --clear
