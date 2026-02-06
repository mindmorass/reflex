<!-- BEGIN: Project Workflow -->
## Project Workflow

This project uses a standalone development workflow. Follow these steps for every task.

### 1. Understand Requirements

- Read the user's request carefully and identify the core objective
- If requirements are unclear, use `AskUserQuestion` to clarify before proceeding
- Check for existing related code, tests, or documentation

### 2. Plan the Implementation

- Enter plan mode for any non-trivial task (3+ steps or architectural decisions)
- Read relevant source files to understand the current state
- Identify affected files and components
- Write a clear plan with numbered steps
- Get user approval before proceeding

### 3. Implement Changes

- Follow existing code patterns and conventions in the project
- Make minimal, focused changes that address the requirements
- Write or update tests alongside implementation
- Keep commits atomic and well-scoped

### 4. Self-Review

- Re-read all changed files to verify correctness
- Check for security issues (injection, XSS, hardcoded secrets)
- Ensure no unintended side effects on existing functionality
- Verify code style matches the project's conventions

### 5. Run Tests

- Run the project's test suite to verify nothing is broken
- Ensure new tests pass and cover the requirements
- Fix any failures before proceeding

### 6. Commit and Summarize

- Commit changes with a clear, descriptive message
- Provide a summary of what was changed, why, and how to verify

### 7. Documentation

- Update relevant documentation if the change affects APIs, configuration, or user-facing behavior
- Add inline comments only where logic is non-obvious
<!-- END: Project Workflow -->
