# Reflex Skills

This document describes the skill system in Reflex and how to define, use, and extend skills.

## Overview

Skills are reusable capabilities that agents can invoke to perform specific tasks. Each agent has a defined set of skills it's authorized to use.

## Skill Architecture

```typescript
interface SkillDefinition {
  name: string;
  description: string;
  handler: string;          // Handler function or module
  inputSchema?: JSONSchema; // Input validation schema
  outputSchema?: JSONSchema;// Output type schema
  cache?: {
    enabled: boolean;
    ttl: number;            // Seconds
  };
}
```

## Built-in Skills

### Code & Development

| Skill | Description | Used By |
|-------|-------------|---------|
| `microsoft-code-reference` | Code patterns and best practices from MS docs | coder |
| `test-patterns` | Unit and integration test patterns | coder, tester |
| `docker-patterns` | Containerization best practices | coder |
| `ci-cd-patterns` | CI/CD pipeline patterns | coder |

### Infrastructure

| Skill | Description | Used By |
|-------|-------------|---------|
| `azure-iac-patterns` | Azure infrastructure as code patterns | devops |
| `terraform-modules` | Terraform module best practices | devops |
| `kubernetes-patterns` | K8s deployment and configuration | devops |
| `monitoring-patterns` | Observability and alerting patterns | devops |

### Analysis & Review

| Skill | Description | Used By |
|-------|-------------|---------|
| `data-analysis-patterns` | Statistical analysis approaches | analyst |
| `troubleshooting-guide` | Systematic debugging guides | analyst |
| `code-review-checklist` | Code review guidelines | reviewer |
| `security-review-patterns` | Security vulnerability checks | reviewer |
| `pr-review-patterns` | PR review workflow | reviewer |

### Testing

| Skill | Description | Used By |
|-------|-------------|---------|
| `test-generation-patterns` | Test case generation | tester |
| `coverage-analysis` | Coverage analysis and reporting | tester |
| `e2e-test-patterns` | End-to-end testing patterns | tester |

### Documentation

| Skill | Description | Used By |
|-------|-------------|---------|
| `documentation-patterns` | Documentation best practices | writer |
| `api-documentation` | API documentation standards | writer |
| `readme-templates` | README templates and guidelines | writer |

### Planning & Research

| Skill | Description | Used By |
|-------|-------------|---------|
| `agile-patterns` | Agile methodology guidance | planner |
| `jira-workflow` | Jira workflow patterns | planner |
| `microsoft-docs-search` | Microsoft documentation search | researcher |
| `best-practices-review` | Industry best practices lookup | researcher |

### Data Collection

| Skill | Description | Used By |
|-------|-------------|---------|
| `web-scraping-patterns` | Web scraping best practices | harvester |
| `api-integration-patterns` | API consumption patterns | harvester |

## Skill Configuration

Skills are configured in `config/skills.yaml`:

```yaml
skills:
  microsoft-code-reference:
    description: "Code patterns and best practices"
    handler: "skills/code-reference"
    cache:
      enabled: true
      ttl: 3600
    inputSchema:
      type: object
      properties:
        query:
          type: string
          description: "Search query"
        language:
          type: string
          enum: ["typescript", "javascript", "csharp", "python"]
      required: ["query"]
```

## Skill Invocation

Agents invoke skills through the `invokeSkill` method:

```typescript
class CoderAgent extends BaseAgent {
  async execute(context: AgentContext): Promise<AgentResult> {
    // Invoke authorized skill
    const result = await this.invokeSkill('microsoft-code-reference', {
      query: context.task,
      language: 'typescript'
    }, context);

    return this.success(result);
  }
}
```

### Authorization

Agents can only invoke skills listed in their `skills` array:

```typescript
class CoderAgent extends BaseAgent {
  readonly skills = [
    'microsoft-code-reference',
    'test-patterns',
    'docker-patterns',
    'ci-cd-patterns'
  ];

  async execute(context: AgentContext): Promise<AgentResult> {
    // This works - skill is authorized
    await this.invokeSkill('docker-patterns', input, context);

    // This throws - skill not authorized
    await this.invokeSkill('security-review-patterns', input, context);
  }
}
```

## Skill Caching

Skills can cache results in ChromaDB:

```yaml
skills:
  expensive-api-call:
    cache:
      enabled: true
      ttl: 7200  # 2 hours
```

Cache lookup flow:
1. Generate hash from skill name + input
2. Check ChromaDB for cached result
3. If found and not expired, return cached result
4. Otherwise, execute skill and cache result

## Creating Custom Skills

### 1. Define Skill Configuration

Add to `config/skills.yaml`:

```yaml
skills:
  my-custom-skill:
    description: "Description of what this skill does"
    handler: "skills/my-custom-skill"
    inputSchema:
      type: object
      properties:
        param1:
          type: string
        param2:
          type: number
      required: ["param1"]
    cache:
      enabled: true
      ttl: 3600
```

### 2. Implement Handler

Create handler file (e.g., `skills/my-custom-skill.ts`):

```typescript
import type { SkillContext } from '../types/skills';

interface MySkillInput {
  param1: string;
  param2?: number;
}

interface MySkillOutput {
  result: string;
  data: unknown;
}

export async function handler(
  input: MySkillInput,
  context: SkillContext
): Promise<MySkillOutput> {
  // Implement skill logic
  const result = await doSomething(input.param1, input.param2);

  return {
    result: 'success',
    data: result
  };
}
```

### 3. Register with Agent

Update agent's skill list:

```typescript
class MyAgent extends BaseAgent {
  readonly skills = [
    'existing-skill',
    'my-custom-skill'  // Add new skill
  ];
}
```

## External Skills

Skills can be loaded from external directories:

```bash
# Set skills path in environment
REFLEX_SKILLS_PATH=/path/to/custom/skills
```

Structure:
```
/path/to/custom/skills/
├── skill-a/
│   ├── index.ts
│   └── config.yaml
├── skill-b/
│   ├── index.ts
│   └── config.yaml
```

## Skill Context

Skills receive context information:

```typescript
interface SkillContext {
  sessionId: string;         // Current session
  projectId: string;         // Project identifier
  agent: string;             // Invoking agent name
  chromaCollection?: string; // ChromaDB collection
}
```

## Best Practices

1. **Single Responsibility** - Each skill should do one thing well
2. **Cache Wisely** - Enable caching for expensive operations
3. **Schema Validation** - Define input/output schemas for type safety
4. **Error Handling** - Return meaningful errors for debugging
5. **Logging** - Use logger for debugging and auditing

```typescript
import { createLogger } from '../utils/logger';

const logger = createLogger('skills:my-skill');

export async function handler(input, context) {
  logger.debug('Skill invoked', { input, context });

  try {
    const result = await process(input);
    logger.info('Skill completed', { result });
    return result;
  } catch (error) {
    logger.error('Skill failed', error);
    throw error;
  }
}
```
