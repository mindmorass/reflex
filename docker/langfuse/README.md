# LangFuse - LLM Observability

Self-hosted LangFuse v3 for tracing Claude Code, agent interactions, and MCP calls.

## Quick Start

```bash
# Start all services
docker compose up -d

# Wait ~2-3 minutes for initialization
docker compose logs -f langfuse-web

# When you see "Ready", open:
open http://localhost:3000
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| langfuse-web | 3000 | Web UI and API |
| langfuse-worker | 3030 (internal) | Background processing |
| postgres | 5433 | Main database |
| clickhouse | 8123/9000 (internal) | Analytics database |
| redis | 6379 (internal) | Cache/queue |
| minio | 9090 | S3-compatible storage |
| minio-console | 9091 (internal) | MinIO admin UI |

## Usage

### 1. Create Account

Open http://localhost:3000 and sign up.

### 2. Create Project

Create a new project and copy the API keys.

### 3. Configure Client

```bash
export LANGFUSE_BASE_URL="http://localhost:3000"
export LANGFUSE_PUBLIC_KEY="pk-..."
export LANGFUSE_SECRET_KEY="sk-..."
```

### 4. Python SDK

```bash
pip install langfuse
```

```python
from langfuse import Langfuse

langfuse = Langfuse()

# Create a trace
trace = langfuse.trace(name="my-trace")

# Add spans
span = trace.span(name="tool-call", input={"tool": "bash"})
span.end(output={"result": "success"})
```

## Management

```bash
# Stop
docker compose down

# Stop and remove volumes (data loss!)
docker compose down -v

# Upgrade
docker compose down
docker compose pull
docker compose up -d

# View logs
docker compose logs -f
docker compose logs -f langfuse-web
```

## Resources

- [LangFuse Docs](https://langfuse.com/docs)
- [Self-Hosting Guide](https://langfuse.com/self-hosting)
- [Python SDK](https://langfuse.com/docs/sdk/python)
