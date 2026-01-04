---
description: List available Reflex skills
allowed-tools: Read, Glob
---

# Reflex Skills

List all available skills in the Reflex plugin.

## Instructions

Read the skills from the reflex skills directory and display them with their descriptions.

The skills directory is located at: `${CLAUDE_CONFIG_DIR:-~/.claude}/reflex/skills/`

Each skill has a `SKILL.md` file containing its documentation. Extract the skill name from the directory name and the description from the first paragraph after the title in each SKILL.md.

## Output Format

Display as a table:

| Skill | Description |
|-------|-------------|
| skill-name | Brief description from SKILL.md |

## Available Skills (36)

**Knowledge & RAG:**
- qdrant-patterns, rag-builder, rag-wrapper, research-patterns
- knowledge-ingestion-patterns, collection-migration, embedding-comparison

**Data Collection:**
- github-harvester, pdf-harvester, site-crawler, youtube-harvester

**Media & Video:**
- ffmpeg-patterns, streaming-patterns, video-upload-patterns
- ai-video-generation, podcast-production

**Infrastructure:**
- docker-patterns, kubernetes-patterns, terraform-patterns
- aws-patterns, observability-patterns, database-migration-patterns

**Claude Code Building:**
- agent-builder, mcp-server-builder, router-builder, workflow-builder, prompt-template

**Documentation & Publishing:**
- graphviz-diagrams, obsidian-publisher, joplin-publisher

**Project & Analysis:**
- project-onboarding, task-decomposition, workspace-builder
- analysis-patterns, microsoft-docs, microsoft-code-reference

**Note:** Code review, testing, security, mermaid diagrams, and debugging are provided by official plugins (testing-suite, security-pro, documentation-generator, developer-essentials).
