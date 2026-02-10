---
name: run-linting
description: Run code linting and formatting checks
requires-tools: []
variables:
  - name: lint_command
    description: Command to run linting/formatting
    default: "the project's linter"
---
### {{step_number}}. Run Linting

- Run {{lint_command}} to check for style and formatting issues
- Fix any linting errors or warnings before proceeding
- Ensure all files follow the project's coding standards
