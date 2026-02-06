<!-- BEGIN: Project Workflow -->
## Project Workflow

This project uses a Jira-driven development workflow. Follow these steps for every task.

### 1. Get Requirements from Jira

- Use `mcp__plugin_reflex_atlassian__jira_get_issue` to fetch the assigned ticket
- Read the description, acceptance criteria, and linked issues
- Check comments for additional context using the ticket key
- If requirements are unclear, use `AskUserQuestion` to clarify with the user before proceeding

### 2. Plan the Implementation

- Enter plan mode for any non-trivial task (3+ steps or architectural decisions)
- Read relevant source files to understand the current state
- Identify affected files and components
- Write a clear plan with numbered steps
- Get user approval before proceeding

### 3. Implement Changes

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

- Run the project's test suite to verify nothing is broken
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
