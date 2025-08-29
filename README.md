# EduApp (MVP skeleton)

## Start backend lokalt (Codespaces eller egen maskin)
1) (Hvis du har Docker lokalt) start DB/Redis:
   cd infra && docker compose up -d

2) Start backend:
   cd apps/backend
   pip install uv || python -m pip install uv
   uv pip install -e .
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   # Åpne /health i nettleseren

## Start mobil (web i Codespaces eller lokalt)
cd apps/mobile
corepack enable
pnpm install || npm install
export EXPO_PUBLIC_API_URL="http://localhost:8000"  # i Codespaces: bruk https://<codespace>-8000.app.github.dev
expo start --web
