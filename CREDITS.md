# Credits

## ykdojo/claude-code-tips

The status line script and several workflow patterns in this plugin were adapted from [claude-code-tips](https://github.com/ykdojo/claude-code-tips) by [YK Dojo](https://github.com/ykdojo).

Specific tips incorporated:

| Tip | Feature | Implementation |
|-----|---------|----------------|
| [Tip 0](https://github.com/ykdojo/claude-code-tips#tip-0-customize-your-status-line) | Custom status line | `scripts/statusline.sh` |
| [Tip 8](https://github.com/ykdojo/claude-code-tips#tip-8-create-a-handoff-doc-before-your-context-window-runs-out) | Handoff documents | `commands/handoff.md` |
| [Tip 15](https://github.com/ykdojo/claude-code-tips#tip-15-enable_tool_search-for-mcp-heavy-setups) | Tool search for MCP performance | `CLAUDE.md` Performance section |
| [Tip 23](https://github.com/ykdojo/claude-code-tips#tip-23-fork-conversations-to-explore-alternatives) | Context management | `CLAUDE.md` Context Management section |
| [Tip 30](https://github.com/ykdojo/claude-code-tips#tip-30-periodically-re-read-claudemd) | Periodic CLAUDE.md review | `CLAUDE.md` Context Management section |
| [Tip 36](https://github.com/ykdojo/claude-code-tips#tip-36-run-background-subagents-for-parallel-work) | Background subagents | `CLAUDE.md` Subagent Strategy section |

Licensed under MIT. Thank you for sharing these patterns with the community.

## MCP Servers

Reflex integrates with the following MCP servers. We gratefully acknowledge the work of their maintainers and contributors.

| Server | Description | Maintainer | Repository |
|--------|-------------|------------|------------|
| Qdrant | Vector database for RAG and memory | [Qdrant](https://qdrant.tech/) | [qdrant/mcp-server-qdrant](https://github.com/qdrant/mcp-server-qdrant) |
| Atlassian | Jira and Confluence integration | [sooperset](https://github.com/sooperset) | [sooperset/mcp-atlassian](https://github.com/sooperset/mcp-atlassian) |
| Git | Git repository operations | [Model Context Protocol](https://github.com/modelcontextprotocol) | [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) |
| GitHub | GitHub repos, issues, PRs, and code security | [GitHub](https://github.com) | [github/github-mcp-server](https://github.com/github/github-mcp-server) |
| Microsoft Docs | Microsoft Learn documentation search | [Microsoft](https://microsoft.com) | [MicrosoftDocs/mcp](https://github.com/MicrosoftDocs/mcp) |
| Azure | Azure resource management | [Microsoft](https://microsoft.com) | [microsoft/mcp](https://github.com/microsoft/mcp) |
| Azure DevOps | Azure DevOps CI/CD and repos | [Microsoft](https://microsoft.com) | [microsoft/azure-devops-mcp](https://github.com/microsoft/azure-devops-mcp) |
| MarkItDown | Convert files to markdown | [Microsoft](https://microsoft.com) | [microsoft/markitdown](https://github.com/microsoft/markitdown) |
| SQL Server | Microsoft SQL Server queries | [bymcs](https://github.com/bymcs) | [bymcs/mssql-mcp](https://github.com/bymcs/mssql-mcp) |
| Playwright | Browser automation and testing | [Microsoft](https://microsoft.com) | [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp) |
| Dev Box | Microsoft Dev Box management | [Microsoft](https://microsoft.com) | [microsoft/devbox-mcp-server](https://github.com/microsoft/devbox-mcp-server) |
| Azure AI Foundry | Azure AI Foundry models and services | [Microsoft](https://microsoft.com) | [azure-ai-foundry/mcp-foundry](https://github.com/azure-ai-foundry/mcp-foundry) |
| Kubernetes | Kubernetes cluster operations | [Red Hat / Containers](https://github.com/containers) | [containers/kubernetes-mcp-server](https://github.com/containers/kubernetes-mcp-server) |
| Spacelift | Spacelift IaC management and deployment | [Spacelift](https://spacelift.io/) | [spacelift-io/spacectl](https://github.com/spacelift-io/spacectl) |
| Google Workspace | Gmail, Calendar, Drive, Docs, Sheets | [Taylor Wilsdon](https://github.com/taylorwilsdon) | [taylorwilsdon/google_workspace_mcp](https://github.com/taylorwilsdon/google_workspace_mcp) |
