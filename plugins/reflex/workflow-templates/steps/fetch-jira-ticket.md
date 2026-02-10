---
name: fetch-jira-ticket
description: Fetch and read a Jira ticket for requirements
requires-tools:
  - mcp__plugin_reflex_atlassian__jira_get_issue
variables:
  - name: ticket_prefix
    description: Jira project key prefix (e.g., PROJ)
    default: ""
---
### {{step_number}}. Get Requirements from Jira

- Use `mcp__plugin_reflex_atlassian__jira_get_issue` to fetch the assigned ticket{{#ticket_prefix}} (tickets use the `{{ticket_prefix}}` prefix){{/ticket_prefix}}
- Read the description, acceptance criteria, and linked issues
- Check comments for additional context using the ticket key
- If requirements are unclear, use `AskUserQuestion` to clarify with the user before proceeding
