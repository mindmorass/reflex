# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.2](https://github.com/mindmorass/reflex/compare/v1.7.1...v1.7.2) (2026-02-06)


### Bug Fixes

* Store summary in Qdrant instead of full topology report ([e76a360](https://github.com/mindmorass/reflex/commit/e76a360d5b800c4c1805a67caa48273e11f34126))

## [1.7.1](https://github.com/mindmorass/reflex/compare/v1.7.0...v1.7.1) (2026-02-06)


### Bug Fixes

* Resolve output dir via shell and add KQL query guidelines ([45bd2bd](https://github.com/mindmorass/reflex/commit/45bd2bde8499312e19a4c508e7be6ed0ed4544aa))

## [1.7.0](https://github.com/mindmorass/reflex/compare/v1.6.1...v1.7.0) (2026-02-06)


### Features

* Add REFLEX_AZURE_DISCOVER_OUTPUT_DIR for topology report output ([423e381](https://github.com/mindmorass/reflex/commit/423e3818ce9c67aa9951c03bb749165f59cb39b0))

## [1.6.1](https://github.com/mindmorass/reflex/compare/v1.6.0...v1.6.1) (2026-02-06)


### Bug Fixes

* Move pattern listing to Python to avoid self-triggering guardrail ([9a86891](https://github.com/mindmorass/reflex/commit/9a86891bb104bdbaea37223d28ae4cbd2a3dbe01))
* Sync guardrail patterns listing with actual patterns ([9781bc1](https://github.com/mindmorass/reflex/commit/9781bc1548e01b4fae2623d647682d65c334a599))

## [1.6.0](https://github.com/mindmorass/reflex/compare/v1.5.0...v1.6.0) (2026-02-06)


### Features

* Add pre-push rebase instruction to git workflow ([e3a63b7](https://github.com/mindmorass/reflex/commit/e3a63b7730c8ef880a474e9bc5384cace521629f))

## [1.5.0](https://github.com/mindmorass/reflex/compare/v1.4.1...v1.5.0) (2026-02-06)


### Features

* Redesign azure-discover as resource-centric dependency tracer ([b6d7904](https://github.com/mindmorass/reflex/commit/b6d79048a7e6e68355c2f9745d150997663207e6))


### Bug Fixes

* Guardrail hook output protocol and add missing patterns ([892e339](https://github.com/mindmorass/reflex/commit/892e3396f5b8effa59c4e2a3cb6777047752e2a9))

## [1.4.1](https://github.com/mindmorass/reflex/compare/v1.4.0...v1.4.1) (2026-02-06)


### Bug Fixes

* Use claude mcp add-json instead of writing .mcp.json file ([6b79c1a](https://github.com/mindmorass/reflex/commit/6b79c1a20b5bba80735281e11326f753b42acc03))

## [1.4.0](https://github.com/mindmorass/reflex/compare/v1.3.1...v1.4.0) (2026-02-06)


### Features

* Decouple MCP servers from plugin namespace ([7743d45](https://github.com/mindmorass/reflex/commit/7743d45700322ce26b647567411214fa7b11bc14))

## [1.3.1](https://github.com/mindmorass/reflex/compare/v1.3.0...v1.3.1) (2026-02-06)


### Bug Fixes

* Add spacelift to MCP select groups and fix README description ([60553d8](https://github.com/mindmorass/reflex/commit/60553d82df8d69a454124e7161007032239ecaf8))
* Remove bundled MCP servers and sync version to 1.3.0 ([733386e](https://github.com/mindmorass/reflex/commit/733386e6b12f96fdfbd3258f3172bc5e812fa683))

## [1.3.0](https://github.com/mindmorass/reflex/compare/v1.2.0...v1.3.0) (2026-02-06)


### Features

* Add /reflex:init workflow command, MCP catalog URLs, and credits ([42e1fa4](https://github.com/mindmorass/reflex/commit/42e1fa43b0e21b995d43718bed83e7f56412ea0c))

## [1.2.0](https://github.com/mindmorass/reflex/compare/v1.1.1...v1.2.0) (2026-02-06)


### Features

* Add Azure resource discovery command and skill ([22cff23](https://github.com/mindmorass/reflex/commit/22cff2328ab4c007b1522b20950d221674babc2c))
* Add meeting transcript summarizer ([f87e74d](https://github.com/mindmorass/reflex/commit/f87e74d59a2da8024b18237aa662cae5fb1e3f15))
* Add REFLEX_TRANSCRIPT_ environment variables ([9ff454c](https://github.com/mindmorass/reflex/commit/9ff454c52ec8a877a92d68fdab895cf1fc3fee22))
* Add structured output directory for meeting transcripts ([71675ad](https://github.com/mindmorass/reflex/commit/71675adcfa84428dacd32074c5b1e02564c88a9e))
* Rename meeting-summarizer skill to transcript-summarizer ([fc9a784](https://github.com/mindmorass/reflex/commit/fc9a78410ae5729d1f00c891faf8f963ccf11fe6))
* Rename summarize-meeting to summarize-transcript ([3e60499](https://github.com/mindmorass/reflex/commit/3e604992918efb5b50e20cfbc9da38b220b1f0e2))


### Bug Fixes

* Allow QDRANT_URL override via environment variable ([7e3e0d6](https://github.com/mindmorass/reflex/commit/7e3e0d61918393feb07d5bf227f05156945be3d7))
* Respect CLAUDE_CONFIG_DIR in statusline and qdrant commands ([26d7474](https://github.com/mindmorass/reflex/commit/26d7474f40a85570f958a64d7952b94324385dae))
* Store full meeting summary content in Qdrant for RAG ([d155e6b](https://github.com/mindmorass/reflex/commit/d155e6b1a13da38d2d038c1f9bcc42feea437a60))
* Update summarize.py to use REFLEX_TRANSCRIPT_ env vars ([5098694](https://github.com/mindmorass/reflex/commit/50986946bef75de24d20c31d69d07e6c7b5dbc27))
* Update transcript-summarizer skill with env vars and cleanup ([4d786b2](https://github.com/mindmorass/reflex/commit/4d786b242cfbb131d80ef38bea791f8c172ead46))

## [1.1.1](https://github.com/mindmorass/reflex/compare/v1.1.0...v1.1.1) (2026-02-04)


### Bug Fixes

* Remove unused C_WHITE variable from statusline ([a57d803](https://github.com/mindmorass/reflex/commit/a57d8034a7b6311aa648c9fa2e10fb66d4965a92))
* Respect CLAUDE_CONFIG_DIR across all commands and docs ([690fa1b](https://github.com/mindmorass/reflex/commit/690fa1bcab65b3607b8e6634015c30ae4f807887))
* Use gray for status line time display ([68bee29](https://github.com/mindmorass/reflex/commit/68bee2918a1ec6375af77c72e76e96549f47bef8))

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
