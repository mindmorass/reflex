# Qdrant - Vector Database

Self-hosted Qdrant for vector storage and semantic search.

## Quick Start

```bash
# Copy and configure environment
cp .env.example .env

# Start Qdrant
docker compose up -d

# Verify it's running
curl http://localhost:6333/healthz
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Qdrant REST API | 6333 | REST API and Dashboard |
| Qdrant gRPC | 6334 | gRPC interface |

## Dashboard

Open http://localhost:6333/dashboard to view collections and data.

## Management

```bash
# Stop
docker compose down

# Stop and remove data (data loss!)
docker compose down -v

# View logs
docker compose logs -f
```

## MCP Integration

Reflex uses the `mcp-server-qdrant` MCP server to connect:

```json
{
  "qdrant": {
    "command": "uvx",
    "args": ["mcp-server-qdrant"],
    "env": {
      "QDRANT_URL": "http://localhost:6333",
      "COLLECTION_NAME": "reflex"
    }
  }
}
```
