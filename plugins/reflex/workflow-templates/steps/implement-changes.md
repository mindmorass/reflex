---
name: implement-changes
description: Make code changes following project conventions
requires-tools: []
variables:
  - name: branch_strategy
    description: Branch naming convention
    default: ""
---
### {{step_number}}. Implement Changes

{{#branch_strategy}}- Create a {{branch_strategy}}
{{/branch_strategy}}- Follow existing code patterns and conventions in the project
- Make minimal, focused changes that address the requirements
- Write or update tests alongside implementation
- Keep commits atomic and well-scoped
