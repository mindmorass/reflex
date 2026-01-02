---
name: code-review-patterns
description: Systematic patterns for reviewing code to catch bugs, security issues, and quality problems.
---


# Code Review Patterns Skill

## Purpose
Systematic patterns for reviewing code to catch bugs, security issues, and quality problems.

## When to Use
- Before merging any code changes
- After implementation is "complete"
- When auditing existing codebases
- During security assessments

## Review Process

### Phase 1: Understand Context
Before diving into code details:
1. What is this code supposed to do?
2. What problem does it solve?
3. What are the requirements/constraints?
4. How does it fit into the larger system?

### Phase 2: High-Level Review
```
□ Does the approach make sense?
□ Is the architecture appropriate?
□ Are there simpler alternatives?
□ Does it follow existing patterns in the codebase?
```

### Phase 3: Detailed Review
Go through code systematically, checking each category below.

### Phase 4: Summarize Findings
Organize by severity, provide actionable feedback.

## Review Categories

### 1. Correctness
```
□ Does the code do what it's supposed to?
□ Are edge cases handled?
□ Is error handling complete?
□ Are return values correct?
□ Are async operations awaited properly?
```

**Common Issues:**
- Off-by-one errors
- Null/undefined not checked
- Race conditions
- Floating promises
- Wrong comparison operators

### 2. Security
```
□ Is user input validated and sanitized?
□ Are queries parameterized (no SQL injection)?
□ Is output encoded (no XSS)?
□ Are authentication/authorization checks in place?
□ Are secrets managed properly?
□ Are dependencies secure?
```

**OWASP Top 10 to Check:**
1. Injection
2. Broken Authentication
3. Sensitive Data Exposure
4. XML External Entities (XXE)
5. Broken Access Control
6. Security Misconfiguration
7. Cross-Site Scripting (XSS)
8. Insecure Deserialization
9. Using Components with Known Vulnerabilities
10. Insufficient Logging & Monitoring

### 3. Performance
```
□ Are there N+1 query patterns?
□ Is there unnecessary computation?
□ Are results cached when appropriate?
□ Is algorithm complexity acceptable?
□ Are resources cleaned up properly?
```

**Performance Red Flags:**
```python
# N+1 Query
for user in users:
    orders = get_orders(user.id)  # Query per user!

# Should be:
orders = get_orders_for_users([u.id for u in users])

# Unnecessary work in loop
for item in items:
    config = load_config()  # Loaded every iteration!
    process(item, config)

# Should be:
config = load_config()
for item in items:
    process(item, config)
```

### 4. Maintainability
```
□ Is the code readable?
□ Are names clear and consistent?
□ Is complexity manageable?
□ Is there appropriate documentation?
□ Is there code duplication?
```

**Complexity Indicators:**
- Functions > 50 lines
- Cyclomatic complexity > 10
- Nesting depth > 3
- Too many parameters (> 5)

### 5. Testing
```
□ Are there tests for new functionality?
□ Do tests cover edge cases?
□ Are tests meaningful (not just coverage)?
□ Are mocks used appropriately?
□ Are tests deterministic?
```

### 6. API Design
```
□ Is the interface intuitive?
□ Are errors informative?
□ Is backwards compatibility maintained?
□ Is the API documented?
□ Are types/contracts clear?
```

## Language-Specific Patterns

### Python
```python
# Check for:
□ Type hints present
□ No bare except clauses
□ Context managers for resources
□ No mutable default arguments
□ Proper use of generators for large data
□ Async/await patterns correct
```

**Anti-patterns:**
```python
# Mutable default argument
def add_item(item, items=[]):  # Bug!
    items.append(item)
    return items

# Should be:
def add_item(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items

# Bare except
try:
    risky_operation()
except:  # Catches everything, even KeyboardInterrupt!
    pass

# Should be:
try:
    risky_operation()
except SpecificError as e:
    handle_error(e)
```

### JavaScript/TypeScript
```typescript
// Check for:
□ Strict TypeScript enabled
□ No any types without justification
□ Promises properly handled
□ Memory leaks avoided (event listeners, subscriptions)
□ Proper null/undefined handling
```

**Anti-patterns:**
```typescript
// Floating promise
async function doSomething() {
    riskyOperation();  // Not awaited!
}

// Should be:
async function doSomething() {
    await riskyOperation();
}

// Memory leak with event listener
useEffect(() => {
    window.addEventListener('resize', handler);
    // Missing cleanup!
});

// Should be:
useEffect(() => {
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
}, []);
```

## Feedback Format

### Severity Levels
| Level | Meaning | Action |
|-------|---------|--------|
| **Critical** | Security vulnerability, crash, data loss | Must fix |
| **Major** | Bug, significant issue | Should fix |
| **Minor** | Code smell, style issue | Recommend fix |
| **Suggestion** | Improvement idea | Optional |

### Feedback Template
```markdown
## [Severity] Issue Title

**Location:** `file.py:45`

**Issue:** Clear description of the problem

**Why it matters:** Impact if not fixed

**Suggestion:**
```python
# Before
problematic_code()

# After
better_code()
```
```

### Good vs. Bad Feedback

**Bad:**
> "This is wrong."
> "Fix this."
> "Don't do this."

**Good:**
> "This SQL query is vulnerable to injection attacks because user input is concatenated directly. Use parameterized queries instead: `cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))`"

## Review Checklist Template

```markdown
## Code Review: [PR/Change Title]

### Summary
[Brief overview of changes and review findings]

### Critical Issues
- [ ] Issue 1 with location and fix
- [ ] Issue 2 with location and fix

### Major Issues
- [ ] Issue with explanation

### Minor Issues
- [ ] Issue with suggestion

### Suggestions
- Consider X for Y benefit
- Could simplify Z

### Positive Notes
- Good use of [pattern]
- Well-documented
- Comprehensive tests

### Verdict
- [ ] Approve
- [ ] Approve with minor changes
- [ ] Request changes
- [ ] Needs discussion
```

## Automated Tool Integration

Reference these tool outputs when available:

| Tool | Purpose |
|------|---------|
| ESLint/Pylint | Linting issues |
| MyPy/TSC | Type errors |
| Bandit/npm audit | Security scanning |
| Coverage reports | Test coverage |
| SonarQube | Code quality metrics |

Automated tools catch mechanical issues; human review focuses on:
- Logic and design
- Context and intent
- Security implications
- Maintainability
