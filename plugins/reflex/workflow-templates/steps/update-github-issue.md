---
name: update-github-issue
description: Post status update on GitHub issue
requires-tools:
  - mcp__plugin_reflex_github__add_issue_comment
variables: []
---
### {{step_number}}. Update GitHub Issue

- Use `mcp__plugin_reflex_github__add_issue_comment` to post a status update on the issue
- Include: what was changed, files modified, and how to test
