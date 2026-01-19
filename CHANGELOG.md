# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0 (2026-01-19)


### Bug Fixes

* switch markitdown to native npx package ([1dacb17](https://github.com/mindmorass/reflex/commit/1dacb1715aa503c2689b36e68c2044f0c758295c))

## [Unreleased]

## [1.1.0] - 2025-01-18

### Added

- `workflow-orchestrator` agent for multi-step workflow coordination
- 4 new skills: `iconset-maker`, `n8n-patterns`, `image-to-diagram`, `web-research`
- 6 new commands: `notify`, `speak`, `guardrail`, `ingest`, `update-mcp`, `init`
- 2 new MCP servers: `kubernetes`, `google-workspace`

### Changed

- Switched GitHub MCP to official Docker image (`ghcr.io/github/github-mcp-server`)
- Switched markitdown to native npx package (`markitdown-mcp-npx`)
- Qdrant command now controls MCP connection (on/off) instead of Docker

### Fixed

- Documentation now reflects accurate counts (40 skills, 13 commands, 2 agents, 14 MCP servers)

## [1.0.0] - Initial Release

### Features

- 38 skills for development patterns, RAG, harvesting, and infrastructure
- 7 slash commands (`/reflex:agents`, `/reflex:skills`, `/reflex:langfuse`, etc.)
- RAG proxy agent for wrapping any agent with vector context
- Docker configurations for Qdrant and LangFuse
- MCP servers for Atlassian, Azure, GitHub, Google Workspace, and more
