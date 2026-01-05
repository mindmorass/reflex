# Docker Services for Reflex

This directory contains Docker Compose configurations for services used by Reflex.

## Available Services

| Directory | Service | Purpose |
|-----------|---------|---------|
| `qdrant/` | Qdrant | Vector database for RAG and semantic search |
| `langfuse/` | LangFuse | LLM observability and tracing |

## Quick Start

### Qdrant (Required for RAG features)

```bash
cd qdrant
cp .env.example .env
docker compose up -d
```

Dashboard: http://localhost:6333/dashboard

### LangFuse (Optional - for observability)

```bash
cd langfuse
cp .env.example .env
# Edit .env and generate secrets (see comments in file)
docker compose up -d
```

Web UI: http://localhost:3000

## Notes

- Each service has its own `.env.example` file - copy to `.env` before starting
- Never commit `.env` files (they contain secrets)
- Data is persisted in Docker volumes
