---
name: run-tests
description: Run the project test suite
requires-tools: []
variables:
  - name: test_command
    description: Command to run the project's test suite
    default: "the project's test suite"
---
### {{step_number}}. Run Tests

- Run {{test_command}} to verify nothing is broken
- Ensure new tests pass and cover the acceptance criteria
- Fix any failures before proceeding
