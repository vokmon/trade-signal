#!/bin/bash

#
# Usage examples:
#   ./trade-signal.sh up
#   ./trade-signal.sh down
#   ./trade-signal.sh down -v
#   ./trade-signal.sh rebuild
#   ./trade-signal.sh help
#

WORKDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="docker-compose.yml"
ENV_FILE="$WORKDIR/.env"

print_help() {
  echo ""
  echo "Usage: ./trade-signal.sh [command]"
  echo ""
  echo "Commands:"
  echo "  up              Start trade-signal stack (detached mode)"
  echo "  down            Stop and remove containers"
  echo "  down -v         Stop and remove containers and volumes"
  echo "  rebuild         Rebuild images without cache and restart stack"
  echo "  help            Show this help message"
  echo ""
}

# Load environment variables
if [[ -f "$ENV_FILE" ]]; then
  echo "✅ Loading environment variables from $ENV_FILE"
  export $(grep -v '^#' "$ENV_FILE" | xargs)
else
  echo "⚠️  Environment file '$ENV_FILE' not found. Continuing without loading custom variables."
fi

case "$1" in
  up)
    echo "🚀 Starting trade-signal stack in $WORKDIR ..."
    docker compose -f "$COMPOSE_FILE" up -d
    ;;
  down)
    if [[ "$2" == "-v" ]]; then
      echo "🧹 Stopping and removing containers and volumes in $WORKDIR ..."
      docker compose -f "$COMPOSE_FILE" down -v
    else
      echo "🛑 Stopping and removing containers in $WORKDIR ..."
      docker compose -f "$COMPOSE_FILE" down
    fi
    ;;
  rebuild)
    echo "🔧 Rebuilding trade-signal image without cache in $WORKDIR ..."
    docker compose -f "$COMPOSE_FILE" build --no-cache
    docker compose -f "$COMPOSE_FILE" up -d --force-recreate
    ;;
  help|--help|-h|"")
    print_help
    ;;
  *)
    echo "❌ Unknown command: $1"
    print_help
    ;;
esac

