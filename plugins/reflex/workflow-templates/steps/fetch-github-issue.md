---
name: fetch-github-issue
description: Fetch and read a GitHub issue for requirements
requires-tools:
  - mcp__plugin_reflex_github__issue_read
  - mcp__plugin_reflex_github__search_issues
variables: []
---
### {{step_number}}. Get Requirements from GitHub

- Use `mcp__plugin_reflex_github__issue_read` or `mcp__plugin_reflex_github__search_issues` to fetch the assigned issue
- Read the issue description, labels, and linked PRs
- Check comments for additional context
- If requirements are unclear, use `AskUserQuestion` to clarify with the user before proceeding
