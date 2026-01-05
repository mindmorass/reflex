---
description: Control Qdrant vector database Docker service
allowed-tools: Bash(docker compose:*), Bash(docker ps:*), Bash(curl:*)
argument-hint: <start|stop|status|logs>
---

# Qdrant Docker Service

Start, stop, or check status of the Qdrant vector database container.

## Instructions

The docker-compose file is located at `$CLAUDE_CONFIG_DIR/docker/qdrant/` (default: `~/.claude/docker/qdrant/`).

### Arguments

- `start` - Start the Qdrant container
- `stop` - Stop the Qdrant container
- `status` - Show container status and health
- `logs` - Show recent container logs

### start

```bash
DOCKER_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/docker/qdrant"
cd "$DOCKER_DIR" && docker compose up -d
echo ""
echo "Qdrant started on:"
echo "  REST API: http://localhost:6333"
echo "  Dashboard: http://localhost:6333/dashboard"
echo "  gRPC: localhost:6334"
```

### stop

```bash
DOCKER_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/docker/qdrant"
cd "$DOCKER_DIR" && docker compose down
echo "Qdrant stopped."
```

### status

```bash
echo "**Container Status:**"
docker ps --filter "name=qdrant" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Not running"
echo ""
echo "**Health Check:**"
if curl -s http://localhost:6333/readyz >/dev/null 2>&1; then
    echo "Qdrant is healthy and ready"
else
    echo "Qdrant is not responding"
fi
```

### logs

```bash
DOCKER_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/docker/qdrant"
cd "$DOCKER_DIR" && docker compose logs --tail=50
```

### No argument or invalid

If no argument or invalid argument provided, show usage:

```
Usage: /reflex:qdrant <start|stop|status|logs>

Control Qdrant vector database Docker service.

Commands:
  start   Start the Qdrant container
  stop    Stop the Qdrant container
  status  Show container status and health
  logs    Show recent container logs

Ports:
  6333    REST API + Dashboard
  6334    gRPC

Dashboard: http://localhost:6333/dashboard
```
