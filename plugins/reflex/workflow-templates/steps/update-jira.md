---
name: update-jira
description: Post summary and transition Jira ticket
requires-tools:
  - mcp__plugin_reflex_atlassian__jira_add_comment
  - mcp__plugin_reflex_atlassian__jira_transition_issue
variables: []
---
### {{step_number}}. Update Jira

- Use `mcp__plugin_reflex_atlassian__jira_add_comment` to post a summary of changes
- Include: what was changed, files modified, and how to test
- Use `mcp__plugin_reflex_atlassian__jira_transition_issue` to move the ticket to the appropriate status
