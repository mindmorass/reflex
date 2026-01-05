---
description: Control LangFuse observability Docker service
allowed-tools: Bash(docker compose:*), Bash(docker ps:*), Bash(curl:*)
argument-hint: <start|stop|status|logs>
---

# LangFuse Docker Service

Start, stop, or check status of the LangFuse observability stack.

## Instructions

The docker-compose file is located at `~/.claude/docker/langfuse/`.

**Note:** LangFuse requires a `.env` file with secrets. Copy `.env.example` and fill in values before starting.

### Arguments

- `start` - Start the LangFuse stack
- `stop` - Stop the LangFuse stack
- `status` - Show container status and health
- `logs` - Show recent container logs

### start

```bash
DOCKER_DIR="$HOME/.claude/docker/langfuse"
if [ ! -f "$DOCKER_DIR/.env" ]; then
    echo "Error: $DOCKER_DIR/.env not found"
    echo "Copy $DOCKER_DIR/.env.example to $DOCKER_DIR/.env and configure secrets first."
    exit 1
fi
cd "$DOCKER_DIR" && docker compose up -d
echo ""
echo "LangFuse starting (may take 30-60s for all services)..."
echo ""
echo "Services:"
echo "  Web UI: http://localhost:3000"
echo "  MinIO Console: http://localhost:9091"
echo ""
echo "Check status with: /reflex:langfuse-docker status"
```

### stop

```bash
cd "$HOME/.claude/docker/langfuse" && docker compose down
echo "LangFuse stopped."
```

### status

```bash
echo "**Container Status:**"
docker ps --filter "name=langfuse" --format "table {{.Names}}\t{{.Status}}" 2>/dev/null || echo "Not running"
echo ""
echo "**Health Check:**"
if curl -s http://localhost:3000/api/public/health >/dev/null 2>&1; then
    echo "LangFuse web is healthy"
else
    echo "LangFuse web is not responding (may still be starting)"
fi
```

### logs

```bash
cd "$HOME/.claude/docker/langfuse" && docker compose logs --tail=50
```

### No argument or invalid

If no argument or invalid argument provided, show usage:

```
Usage: /reflex:langfuse-docker <start|stop|status|logs>

Control LangFuse observability Docker service.

Commands:
  start   Start the LangFuse stack (postgres, redis, clickhouse, minio, langfuse)
  stop    Stop the LangFuse stack
  status  Show container status and health
  logs    Show recent container logs

Setup:
  1. cp ~/.claude/docker/langfuse/.env.example ~/.claude/docker/langfuse/.env
  2. Generate secrets and fill in .env
  3. /reflex:langfuse-docker start

Web UI: http://localhost:3000

Related:
  /reflex:langfuse on|off|status  - Enable/disable LangFuse tracing integration
```
