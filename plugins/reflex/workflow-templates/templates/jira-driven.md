---
name: jira-driven
version: "1.0.0"
description: Jira-driven development workflow with ticket tracking
tags: [jira, agile, ticketing]
variables:
  - name: test_command
    description: Command to run the project's test suite
    default: "the project's test suite"
  - name: branch_strategy
    description: Branch naming convention
    default: "feature branch from main"
  - name: ticket_prefix
    description: Jira project key prefix (e.g., PROJ)
    default: ""
  - name: require_plan_approval
    description: Whether to require user approval before implementing
    default: "true"
steps:
  - fetch-jira-ticket
  - plan-implementation
  - implement-changes
  - self-review
  - run-tests
  - update-jira
  - update-documentation
---
<!-- BEGIN: Project Workflow -->
## Project Workflow

This project uses a Jira-driven development workflow. Follow these steps for every task.

### 1. Get Requirements from Jira

- Use `mcp__plugin_reflex_atlassian__jira_get_issue` to fetch the assigned ticket{{#ticket_prefix}} (tickets use the `{{ticket_prefix}}` prefix){{/ticket_prefix}}
- Read the description, acceptance criteria, and linked issues
- Check comments for additional context using the ticket key
- If requirements are unclear, use `AskUserQuestion` to clarify with the user before proceeding

### 2. Plan the Implementation

- Enter plan mode for any non-trivial task (3+ steps or architectural decisions)
- Read relevant source files to understand the current state
- Identify affected files and components
- Write a clear plan with numbered steps
{{#require_plan_approval}}- Get user approval before proceeding{{/require_plan_approval}}

### 3. Implement Changes

- Create a {{branch_strategy}}
- Follow existing code patterns and conventions in the project
- Make minimal, focused changes that address the ticket requirements
- Write or update tests alongside implementation
- Keep commits atomic and well-scoped

### 4. Self-Review

- Re-read all changed files to verify correctness
- Check for security issues (injection, XSS, hardcoded secrets)
- Ensure no unintended side effects on existing functionality
- Verify code style matches the project's conventions

### 5. Run Tests

- Run {{test_command}} to verify nothing is broken
- Ensure new tests pass and cover the acceptance criteria
- Fix any failures before proceeding

### 6. Update Jira

- Use `mcp__plugin_reflex_atlassian__jira_add_comment` to post a summary of changes
- Include: what was changed, files modified, and how to test
- Use `mcp__plugin_reflex_atlassian__jira_transition_issue` to move the ticket to the appropriate status

### 7. Documentation

- Update relevant documentation if the change affects APIs, configuration, or user-facing behavior
- Add inline comments only where logic is non-obvious
<!-- END: Project Workflow -->
