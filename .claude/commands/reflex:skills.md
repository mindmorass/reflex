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

## Available Skills

Skills are organized by category:

**Documentation & Diagrams:**
- doc-sync, graphviz-diagrams, mermaid-diagrams, obsidian-publisher, joplin-publisher

**Data Collection:**
- github-harvester, pdf-harvester, site-crawler, youtube-harvester

**Code & Development:**
- agent-builder, mcp-server-builder, router-builder, workflow-builder, workspace-builder
- code-review-patterns, test-patterns, security-review

**Infrastructure:**
- ci-cd-patterns, docker-patterns

**Knowledge & AI:**
- embedding-comparison, knowledge-ingestion-patterns, rag-builder, collection-migration
- microsoft-docs, microsoft-code-reference

**Project Management:**
- project-onboarding, prompt-template, task-decomposition, troubleshooting
