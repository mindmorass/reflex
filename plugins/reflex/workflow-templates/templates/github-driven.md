---
name: github-driven
version: "1.0.0"
description: GitHub issue-driven development workflow with PR integration
tags: [github, issues, pull-requests]
variables:
  - name: test_command
    description: Command to run the project's test suite
    default: "the project's test suite"
  - name: branch_strategy
    description: Branch naming convention
    default: "feature branch from main"
  - name: require_plan_approval
    description: Whether to require user approval before implementing
    default: "true"
steps:
  - fetch-github-issue
  - plan-implementation
  - implement-changes
  - self-review
  - run-tests
  - create-pull-request
  - update-documentation
---
<!-- BEGIN: Project Workflow -->
## Project Workflow

This project uses a GitHub-driven development workflow. Follow these steps for every task.

### 1. Get Requirements from GitHub

- Use `mcp__plugin_reflex_github__issue_read` or `mcp__plugin_reflex_github__search_issues` to fetch the assigned issue
- Read the issue description, labels, and linked PRs
- Check comments for additional context
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
- Make minimal, focused changes that address the issue requirements
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

### 6. Create or Update Pull Request

- Use `mcp__plugin_reflex_github__create_pull_request` to open a PR linking the issue
- Include a summary of changes, test plan, and any notes for reviewers
- Use `mcp__plugin_reflex_github__add_issue_comment` to post a status update on the issue

### 7. Documentation

- Update relevant documentation if the change affects APIs, configuration, or user-facing behavior
- Add inline comments only where logic is non-obvious
<!-- END: Project Workflow -->
