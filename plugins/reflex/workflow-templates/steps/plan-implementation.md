---
name: plan-implementation
description: Enter plan mode and design implementation approach
requires-tools: []
variables:
  - name: require_plan_approval
    description: Whether to require user approval before implementing
    default: "true"
---
### {{step_number}}. Plan the Implementation

- Enter plan mode for any non-trivial task (3+ steps or architectural decisions)
- Read relevant source files to understand the current state
- Identify affected files and components
- Write a clear plan with numbered steps
{{#require_plan_approval}}- Get user approval before proceeding{{/require_plan_approval}}
