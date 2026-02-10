---
name: standalone
version: "1.0.0"
description: Standalone workflow without external ticket tracking
tags: [standalone, simple, local]
variables:
  - name: test_command
    description: Command to run the project's test suite
    default: "the project's test suite"
  - name: branch_strategy
    description: Branch naming convention
    default: ""
  - name: require_plan_approval
    description: Whether to require user approval before implementing
    default: "true"
steps:
  - understand-requirements
  - plan-implementation
  - implement-changes
  - self-review
  - run-tests
  - commit-and-summarize
  - update-documentation
---
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
{{#require_plan_approval}}- Get user approval before proceeding{{/require_plan_approval}}

### 3. Implement Changes

{{#branch_strategy}}- Create a {{branch_strategy}}
{{/branch_strategy}}- Follow existing code patterns and conventions in the project
- Make minimal, focused changes that address the requirements
- Write or update tests alongside implementation
- Keep commits atomic and well-scoped

### 4. Self-Review

- Re-read all changed files to verify correctness
- Check for security issues (injection, XSS, hardcoded secrets)
- Ensure no unintended side effects on existing functionality
- Verify code style matches the project's conventions

### 5. Run Tests

- Run {{test_command}} to verify nothing is broken
- Ensure new tests pass and cover the requirements
- Fix any failures before proceeding

### 6. Commit and Summarize

- Commit changes with a clear, descriptive message
- Provide a summary of what was changed, why, and how to verify

### 7. Documentation

- Update relevant documentation if the change affects APIs, configuration, or user-facing behavior
- Add inline comments only where logic is non-obvious
<!-- END: Project Workflow -->
