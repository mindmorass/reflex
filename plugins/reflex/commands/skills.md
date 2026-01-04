---
description: List available Reflex skills
allowed-tools: Bash(python3:*)
---

# Reflex Skills

List all available skills in the Reflex plugin.

## Instructions

Run this Python script to list all skills with descriptions:

```bash
python3 << 'PYEOF'
from pathlib import Path
import os

plugin_root = os.environ.get("CLAUDE_PLUGIN_ROOT", ".")
skills_dir = Path(plugin_root) / "skills"

if not skills_dir.exists():
    print("Skills directory not found")
    exit(1)

skills = []
for skill_path in sorted(skills_dir.iterdir()):
    if skill_path.is_dir():
        skill_file = skill_path / "SKILL.md"
        if skill_file.exists():
            desc = ""
            with open(skill_file) as f:
                for line in f:
                    if line.startswith("description:"):
                        desc = line.replace("description:", "").strip()
                        break
            skills.append((skill_path.name, desc[:65]))

print(f"## {len(skills)} Reflex Skills\n")
print("| Skill | Description |")
print("|-------|-------------|")
for name, desc in skills:
    print(f"| **{name}** | {desc} |")
PYEOF
```

## Skill Categories

| Category | Skills |
|----------|--------|
| **RAG & Knowledge** | qdrant-patterns, rag-builder, rag-wrapper, knowledge-ingestion-patterns, research-patterns, web-research |
| **Harvesting** | github-harvester, youtube-harvester, pdf-harvester, site-crawler |
| **Publishing** | obsidian-publisher, joplin-publisher |
| **Infrastructure** | aws-patterns, terraform-patterns, kubernetes-patterns, docker-patterns, observability-patterns |
| **Database** | database-migration-patterns, collection-migration, embedding-comparison |
| **Video/Streaming** | ffmpeg-patterns, streaming-patterns, video-upload-patterns, ai-video-generation, podcast-production |
| **Building** | agent-builder, workflow-builder, router-builder, mcp-server-builder, workspace-builder, rag-builder |
| **Diagrams** | image-to-diagram, graphviz-diagrams |
| **Analysis** | analysis-patterns, task-decomposition, project-onboarding |
| **Microsoft** | microsoft-docs, microsoft-code-reference |

## Note

Code review, testing, security, and mermaid diagrams are provided by official plugins (testing-suite, security-pro, documentation-generator, developer-essentials).
