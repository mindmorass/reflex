---
description: Generate a handoff document for session continuation
allowed-tools: Write, Read, Bash(find:*), Bash(grep:*)
argument-hint: [path]
---

# Session Handoff

Generate a structured handoff document that captures the current session context for seamless continuation in a new conversation.

## Instructions

Create a handoff document by analyzing the current session. The document should be written to `tasks/handoff.md` (or the path provided as argument).

### Handoff Document Format

Write the following markdown structure:

```markdown
# Session Handoff

**Generated:** <current ISO 8601 timestamp>
**Project:** <project name from working directory>

## What We Were Working On

<1-3 sentence summary of the primary task/goal>

## Key Decisions Made

- <Decision 1 and reasoning>
- <Decision 2 and reasoning>

## Files Modified

| File | Change |
|------|--------|
| <path> | <brief description> |

## Current State

<What's working, what's not, where things stand>

## Outstanding Tasks

- [ ] <Remaining task 1>
- [ ] <Remaining task 2>

## Important Context

<Any non-obvious context the next session needs to know — architectural constraints, user preferences, gotchas discovered, etc.>

## How to Continue

<Specific instructions for the next session to pick up where this one left off>
```

### Steps

1. Review the conversation history to identify:
   - Primary task and goal
   - Decisions made and their rationale
   - Files that were created, modified, or discussed
   - What was completed vs what remains
   - Non-obvious context or constraints

2. Check for existing `tasks/todo.md` and incorporate outstanding items

3. Write the handoff document to `tasks/handoff.md` (or argument path)

4. Confirm the file was written and display a summary

### Default path

If no argument provided, write to `tasks/handoff.md` (create `tasks/` directory if needed).

If a path argument is provided, write to that path instead.
