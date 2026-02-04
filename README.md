# Reflex Plugin Marketplace

[![Release](https://img.shields.io/github/v/release/mindmorass/reflex)](https://github.com/mindmorass/reflex/releases)

A Claude Code plugin for application development, infrastructure, and data engineering workflows.

## Installation

```
/plugin marketplace add mindmorass/reflex
/plugin install reflex
```

## Features

| Component | Count | Description |
|-----------|-------|-------------|
| Skills | 40 | Development patterns, RAG, harvesting, infrastructure |
| Commands | 15 | `/reflex:agents`, `/reflex:skills`, `/reflex:handoff`, etc. |
| Agents | 2 | `rag-proxy`, `workflow-orchestrator` |

## Docker Services

The `docker/` directory contains Docker Compose configurations for supporting services:

| Service | Purpose | Port |
|---------|---------|------|
| [Qdrant](./docker/qdrant) | Vector database for RAG | 6333 |
| [LangFuse](./docker/langfuse) | LLM observability | 3000 |

### Quick Start

```bash
# Qdrant (required for RAG features)
cd docker/qdrant
cp .env.example .env
docker compose up -d

# LangFuse (optional - for observability)
cd docker/langfuse
cp .env.example .env
# Edit .env and generate secrets
docker compose up -d
```

## Structure

```
reflex/
├── plugins/reflex/        # Main plugin
│   ├── agents/            # Sub-agents
│   ├── skills/            # 40 skill definitions
│   ├── commands/          # Slash commands
│   ├── hooks/             # Session hooks
│   └── scripts/           # Helper scripts
└── docker/                # Docker services
    ├── qdrant/            # Vector database
    └── langfuse/          # LLM observability
```

## License

MIT
