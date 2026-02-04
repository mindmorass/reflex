# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0](https://github.com/mindmorass/reflex/compare/v1.0.0...v1.1.0) (2026-02-04)


### Features

* Add plugin update notification for marketplace users ([a10eb98](https://github.com/mindmorass/reflex/commit/a10eb9886e6fc56f8c8c37a16a52231ead17bc56))
* Add workflow orchestration principles to CLAUDE.md ([5554396](https://github.com/mindmorass/reflex/commit/5554396346297a734ef33e0225d4515c04108e10))


### Bug Fixes

* Update statusline to Starship theme, fix plugin-relative paths ([d50841c](https://github.com/mindmorass/reflex/commit/d50841ce1c1211dcba7d6d5d0d06aa036cf5496d))

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
