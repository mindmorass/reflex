---
name: self-review
description: Self-review all changes for correctness and security
requires-tools: []
variables: []
---
### {{step_number}}. Self-Review

- Re-read all changed files to verify correctness
- Check for security issues (injection, XSS, hardcoded secrets)
- Ensure no unintended side effects on existing functionality
- Verify code style matches the project's conventions
