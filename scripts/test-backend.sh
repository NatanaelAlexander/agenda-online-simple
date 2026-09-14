#!/usr/bin/env bash
# Lanza tests del backend dentro del contenedor `api`.
# Uso (raíz del repo, stack arriba):
#   ./scripts/test-backend.sh
#   ./scripts/test-backend.sh unit
#   ./scripts/test-backend.sh api
#   ./scripts/test-backend.sh watch
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! docker compose ps api --status running -q 2>/dev/null | grep -q .; then
  echo ">> El servicio api no está arriba. Levantando..."
  docker compose up -d api
fi

target="${1:-}"
case "$target" in
  ""|all|ci)
    echo ">> docker compose exec api pnpm test"
    docker compose exec api pnpm test
    ;;
  unit)
    echo ">> docker compose exec api pnpm run test:unit"
    docker compose exec api pnpm run test:unit
    ;;
  api)
    echo ">> docker compose exec api pnpm run test:api"
    docker compose exec api pnpm run test:api
    ;;
  watch)
    echo ">> docker compose exec api pnpm run test:watch"
    docker compose exec api pnpm run test:watch
    ;;
  *)
    echo "Uso: $0 [all|unit|api|watch]"
    exit 1
    ;;
esac
