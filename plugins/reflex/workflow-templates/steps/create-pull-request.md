---
name: create-pull-request
description: Create or update a GitHub pull request
requires-tools:
  - mcp__plugin_reflex_github__create_pull_request
  - mcp__plugin_reflex_github__add_issue_comment
variables: []
---
### {{step_number}}. Create or Update Pull Request

- Use `mcp__plugin_reflex_github__create_pull_request` to open a PR linking the issue
- Include a summary of changes, test plan, and any notes for reviewers
- Use `mcp__plugin_reflex_github__add_issue_comment` to post a status update on the issue
