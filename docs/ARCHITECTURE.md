# Reflex Architecture

This document describes the internal architecture of the Reflex Claude Code plugin.

## Overview

Reflex is a comprehensive orchestration framework that extends Claude Code with specialized agents, skills, and integrations. The architecture is built around three core concepts:

1. **Agents** - Specialized AI personas with defined skills and responsibilities
2. **Skills** - Reusable capabilities that agents can invoke
3. **MCP Servers** - External tool integrations via the Model Context Protocol

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Claude Code                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Slash     │  │    MCP      │  │       Hooks         │  │
│  │  Commands   │  │  Servers    │  │                     │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
└─────────┼────────────────┼─────────────────────┼────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      Orchestrator                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    Agent Router                      │    │
│  │  analyst│coder│devops│harvester│planner│researcher  │    │
│  │         reviewer│tester│writer                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│  ┌────────────┐  ┌────────┴────────┐  ┌─────────────────┐   │
│  │   Skills   │  │   Hook Manager  │  │    ChromaDB     │   │
│  │  Registry  │  │                 │  │  Vector Store   │   │
│  └────────────┘  └─────────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### Orchestrator (`src/orchestrator.ts`)

The central coordinator that:
- Routes tasks to appropriate agents based on content analysis
- Manages agent handoffs and workflow transitions
- Maintains session context and state
- Coordinates with the HookManager for event emission

```typescript
class Orchestrator {
  routeTask(task: string): string;           // Determine best agent
  executeTask(context, agent?): AgentResult; // Execute with routing
  getAvailableAgents(): AgentInfo[];         // List all agents
}
```

### Agent System (`src/agents/`)

All agents extend `BaseAgent` and implement:

```typescript
abstract class BaseAgent extends EventEmitter {
  abstract name: string;
  abstract description: string;
  abstract skills: string[];
  abstract execute(context: AgentContext): Promise<AgentResult>;

  protected invokeSkill(name, input, context): Promise<unknown>;
  protected requestHandoff(request: HandoffRequest): void;
}
```

**Agent Lifecycle:**
1. Orchestrator receives task
2. Router selects appropriate agent
3. Agent executes with access to authorized skills
4. Agent returns result or requests handoff
5. Hooks emit events at each stage

### Skill Registry (`src/skills/registry.ts`)

Manages skill definitions and invocations:

```typescript
class SkillRegistry {
  register(skill: SkillDefinition): void;
  hasSkill(name: string): boolean;
  invokeSkill(name, input, context): Promise<unknown>;
  getSkillSchema(name: string): JSONSchema;
}
```

Skills can:
- Be loaded from YAML configuration
- Be dynamically loaded from external paths
- Cache results in ChromaDB
- Define input/output schemas

### Hook Manager (`src/hooks/index.ts`)

Event-driven system for cross-cutting concerns:

```typescript
class HookManager {
  register(event: HookEvent, handler: HookHandler): void;
  unregister(event: HookEvent, handler: HookHandler): void;
  emit(event: HookEvent, data: unknown): Promise<void>;
}
```

**Supported Events:**
- `session_start` - Session initialization
- `session_end` - Session cleanup
- `pre_agent_handoff` - Before agent transitions
- `post_tool_call` - After tool/skill execution
- `error` - Error handling
- `file_upload` - File processing

### MCP Server Manager (`src/mcp/config.ts`)

Manages Model Context Protocol server integrations:

```typescript
class MCPServerManager {
  isServerConfigured(name: string): boolean;
  getServerStatus(name: string): MCPServerState;
  getServersByAgent(agentName: string): string[];
}
```

**Server Types:**
- `stdio` - Local process communication
- `http` - Remote HTTP/REST endpoints

### ChromaDB Storage (`src/storage/client.ts`)

Vector database for semantic storage and caching:

```typescript
class ChromaDBClient {
  store(projectId, content): Promise<string>;
  query(projectId, queryText, options): Promise<QueryResult[]>;
  checkCache(projectId, toolName, inputHash): Promise<CacheHit | null>;
  cacheToolResult(projectId, toolName, input, result, ttl?): Promise<string>;
}
```

**Use Cases:**
- Skill result caching
- Semantic search over project context
- Session history storage
- Tool output persistence

## Data Flow

### Task Execution Flow

```
1. User invokes slash command or task
         │
         ▼
2. Orchestrator.routeTask() analyzes task
         │
         ▼
3. Appropriate Agent selected
         │
         ▼
4. HookManager emits 'pre_agent_handoff'
         │
         ▼
5. Agent.execute() runs
         │
    ┌────┴────┐
    │         │
    ▼         ▼
6a. Agent    6b. Agent requests
    invokes       handoff
    skill         │
    │             │
    ▼             ▼
7a. Result   7b. New agent
    returned      selected
         │         │
         └────┬────┘
              │
              ▼
8. HookManager emits 'post_tool_call'
              │
              ▼
9. Result returned to user
```

### Caching Flow

```
1. Skill invocation requested
         │
         ▼
2. Generate input hash
         │
         ▼
3. Check ChromaDB cache
         │
    ┌────┴────┐
    │         │
    ▼         ▼
4a. Cache   4b. Cache
    hit         miss
    │           │
    ▼           ▼
5a. Return  5b. Execute
    cached      skill
    result      │
                ▼
            6b. Store in
                cache
                │
         └──────┘
              │
              ▼
7. Return result
```

## Configuration

### YAML Configuration Files

Located in `config/`:

- `agents.yaml` - Agent definitions
- `skills.yaml` - Skill mappings
- `hooks.yaml` - Hook handlers
- `mcp-servers.yaml` - MCP server configs

### Environment Variables

Key variables in `.env`:

```bash
CHROMA_DB_PATH          # ChromaDB persistence path
REFLEX_LOG_PATH         # Audit log directory
REFLEX_PROJECT_ID       # Default project identifier
REFLEX_SKILLS_PATH      # External skills directory
```

## Extension Points

### Adding New Agents

1. Create class extending `BaseAgent` in `src/agents/`
2. Define `name`, `description`, `skills`
3. Implement `execute()` method
4. Register in orchestrator
5. Update `config/agents.yaml`

### Adding New Skills

1. Add skill definition to `config/skills.yaml`
2. Or create external skill in skills directory
3. Define input/output schema
4. Implement handler function

### Adding New Hooks

1. Create handler in `src/hooks/`
2. Register event type in `HookEvent`
3. Add to `config/hooks.yaml`
4. Hook auto-registered on startup

## Security Considerations

- Agents can only invoke their authorized skills
- MCP servers have separate authentication
- ChromaDB storage is project-isolated
- Audit logging captures all operations
- Environment variables for sensitive credentials
