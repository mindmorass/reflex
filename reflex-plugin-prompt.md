# Reflex Plugin - Claude Code Build Specification

## Overview

Build a comprehensive Claude Code plugin called **Reflex** that orchestrates Application Development, Infrastructure as Code (IaC), and Data Engineering workflows. This plugin runs on macOS and follows an opinionated, agent-based architecture with persistent vector storage for intelligent caching.

---

## Project Structure

Create the following monorepo structure:

```
reflex/
├── README.md
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
│
├── src/
│   ├── index.ts                    # Main plugin entry point
│   ├── orchestrator.ts             # Central orchestration logic
│   │
│   ├── commands/                   # Slash commands
│   │   ├── index.ts
│   │   ├── gitconfig.ts
│   │   ├── certcollect.ts
│   │   └── audit.ts
│   │
│   ├── agents/                     # Subagents
│   │   ├── index.ts
│   │   ├── base-agent.ts           # Abstract base class
│   │   ├── analyst.ts
│   │   ├── coder.ts
│   │   ├── devops.ts
│   │   ├── harvester.ts
│   │   ├── planner.ts
│   │   ├── researcher.ts
│   │   ├── reviewer.ts
│   │   ├── tester.ts
│   │   └── writer.ts
│   │
│   ├── skills/                     # Skill loader and registry
│   │   ├── index.ts
│   │   ├── registry.ts
│   │   └── loader.ts
│   │
│   ├── hooks/                      # Event handlers
│   │   ├── index.ts
│   │   ├── session-start.ts
│   │   ├── session-end.ts
│   │   ├── pre-agent-handoff.ts
│   │   ├── post-tool-call.ts
│   │   ├── error.ts
│   │   └── file-upload.ts
│   │
│   ├── mcp/                        # MCP server configurations
│   │   ├── index.ts
│   │   ├── config.ts
│   │   └── servers/
│   │       ├── atlassian.ts
│   │       ├── git.ts
│   │       ├── github.ts
│   │       ├── microsoft-docs.ts
│   │       ├── azure.ts
│   │       ├── azure-devops.ts
│   │       ├── markitdown.ts
│   │       ├── sql-server.ts
│   │       ├── playwright.ts
│   │       ├── devbox.ts
│   │       ├── azure-ai-foundry.ts
│   │       └── m365-agents.ts
│   │
│   ├── storage/                    # ChromaDB integration
│   │   ├── index.ts
│   │   ├── client.ts
│   │   ├── collections.ts
│   │   └── embeddings.ts
│   │
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── config.ts
│   │   └── env.ts
│   │
│   └── types/
│       ├── index.ts
│       ├── agents.ts
│       ├── skills.ts
│       ├── hooks.ts
│       └── mcp.ts
│
├── config/
│   ├── agents.yaml                 # Agent configurations
│   ├── skills.yaml                 # Skill mappings
│   ├── mcp-servers.yaml            # MCP server configs
│   └── hooks.yaml                  # Hook configurations
│
├── tests/
│   ├── commands/
│   ├── agents/
│   ├── hooks/
│   └── storage/
│
└── docs/
    ├── ARCHITECTURE.md
    ├── AGENTS.md
    ├── SKILLS.md
    ├── COMMANDS.md
    └── MCP-SERVERS.md
```

---

## Component Specifications

### 1. Slash Commands

All commands are namespaced with `/reflex:` prefix.

#### `/reflex:gitconfig`

**Purpose**: Display important git configuration information respecting environment variables.

```typescript
// src/commands/gitconfig.ts

interface GitConfigOptions {
  verbose?: boolean;  // -v, --verbose: Show all config values with sources
  simple?: boolean;   // -s, --simple: Show only essential info (default)
}

// Implementation requirements:
// 1. Check environment variables in order:
//    - GIT_CONFIG_GLOBAL
//    - XDG_CONFIG_HOME/git/config
//    - ~/.gitconfig
//    - ~/.config/git/config
// 2. Parse and display:
//    - user.name, user.email
//    - core.editor
//    - default branch
//    - credential helper
//    - aliases (in verbose mode)
//    - includes/includeIf directives
// 3. Show which file each setting comes from (verbose mode)

// Command registration:
// Name: /reflex:gitconfig
// Aliases: /reflex:gc
// Options:
//   -v, --verbose    Show all configuration with sources
//   -s, --simple     Show essential info only (default)
```

#### `/reflex:certcollect`

**Purpose**: Collect SSL/TLS certificates from websites using openssl s_client.

```typescript
// src/commands/certcollect.ts

interface CertCollectOptions {
  verbose?: boolean;     // -v, --verbose: Show certificate details
  simple?: boolean;      // -s, --simple: Just save files (default)
  output?: string;       // -o, --output: Output directory (default: ~/Desktop)
  chain?: boolean;       // -c, --chain: Include full certificate chain
  format?: 'pem' | 'der' | 'both';  // -f, --format: Output format
}

interface CertCollectArgs {
  url: string;           // Website URL or hostname
  port?: number;         // Port number (default: 443)
}

// Implementation requirements:
// 1. Parse URL to extract hostname
// 2. Use openssl s_client to connect:
//    openssl s_client -connect hostname:port -servername hostname -showcerts
// 3. Extract and save:
//    - Server certificate (hostname.crt)
//    - Intermediate certificates (hostname-chain-N.crt)
//    - Root certificate if available (hostname-root.crt)
// 4. Optionally display certificate info:
//    - Subject, Issuer, Validity dates
//    - SANs (Subject Alternative Names)
//    - Fingerprints
// 5. Handle SNI properly for virtual hosts

// Multi-turn interaction:
// If URL not provided, prompt for it
// If output directory doesn't exist, ask to create it
```

#### `/reflex:audit`

**Purpose**: Enable session auditing to log all actions taken.

```typescript
// src/commands/audit.ts

interface AuditOptions {
  verbose?: boolean;     // -v, --verbose: Log all details including tool outputs
  simple?: boolean;      // -s, --simple: Log actions only (default)
  output?: string;       // -o, --output: Custom log file path
  format?: 'json' | 'markdown' | 'text';  // -f, --format: Log format
}

type AuditCommand = 'on' | 'off' | 'status' | 'export';

// Implementation requirements:
// 1. 'on': Start audit logging
//    - Create timestamped log file
//    - Register hooks for all actions
// 2. 'off': Stop audit logging
//    - Finalize and close log file
//    - Generate summary
// 3. 'status': Show current audit state
//    - Whether auditing is active
//    - Current log file location
//    - Actions logged count
// 4. 'export': Export current session log
//    - Supports multiple formats
//    - Can export while still logging

// Log entry structure:
interface AuditLogEntry {
  timestamp: string;
  action: string;
  agent?: string;
  skill?: string;
  tool?: string;
  input?: unknown;
  output?: unknown;
  duration_ms?: number;
  success: boolean;
  error?: string;
}
```

---

### 2. Subagents

All agents follow a common interface and hand off through the orchestrator.

#### Base Agent Structure

```typescript
// src/agents/base-agent.ts

import { Skill } from '../types/skills';
import { AgentContext, AgentResult, HandoffRequest } from '../types/agents';

export abstract class BaseAgent {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly skills: string[];  // Skill names this agent can invoke
  
  // Optional MCP servers this agent needs
  readonly mcpServers?: string[];
  
  // Execute the agent's task
  abstract execute(context: AgentContext): Promise<AgentResult>;
  
  // Request handoff to another agent via orchestrator
  protected requestHandoff(request: HandoffRequest): void {
    // Emits event to orchestrator, does not directly call other agent
  }
  
  // Invoke a skill
  protected async invokeSkill(skillName: string, input: unknown): Promise<unknown> {
    // Validates skill is in this.skills, then invokes via registry
  }
}

export interface AgentContext {
  task: string;
  projectContext: ProjectContext;
  previousAgentOutput?: unknown;
  chromaCollection: string;  // Project-specific collection
  sessionId: string;
}

export interface AgentResult {
  success: boolean;
  output: unknown;
  artifacts?: Artifact[];
  suggestedNextAgent?: string;
  handoffContext?: unknown;
}
```

#### Agent Definitions

```typescript
// src/agents/analyst.ts
export class AnalystAgent extends BaseAgent {
  name = 'analyst';
  description = 'Data analysis, metrics evaluation, pattern recognition, and insight generation';
  skills = [
    'embedding-comparison',
    'knowledge-ingestion-patterns',
    'task-decomposition',
    'troubleshooting'
  ];
}

// src/agents/coder.ts
export class CoderAgent extends BaseAgent {
  name = 'coder';
  description = 'Write, modify, and refactor application code across languages and frameworks';
  skills = [
    'microsoft-code-reference',
    'test-patterns',
    'docker-patterns',
    'ci-cd-patterns'
  ];
  mcpServers = ['github', 'git'];
}

// src/agents/devops.ts
export class DevOpsAgent extends BaseAgent {
  name = 'devops';
  description = 'Infrastructure as Code, CI/CD pipelines, deployment, and operations';
  skills = [
    'ci-cd-patterns',
    'docker-patterns',
    'workspace-builder',
    'workflow-builder'
  ];
  mcpServers = ['azure', 'azure-devops', 'github'];
}

// src/agents/harvester.ts
export class HarvesterAgent extends BaseAgent {
  name = 'harvester';
  description = 'Collect and process data from external sources: web, APIs, documents, media';
  skills = [
    'github-harvester',
    'pdf-harvester',
    'site-crawler',
    'youtube-harvester',
    'knowledge-ingestion-patterns'
  ];
  mcpServers = ['markitdown'];
}

// src/agents/planner.ts
export class PlannerAgent extends BaseAgent {
  name = 'planner';
  description = 'Task breakdown, project planning, roadmap creation, and prioritization';
  skills = [
    'task-decomposition',
    'project-onboarding',
    'workflow-builder',
    'router-builder'
  ];
  mcpServers = ['atlassian', 'azure-devops'];
}

// src/agents/researcher.ts
export class ResearcherAgent extends BaseAgent {
  name = 'researcher';
  description = 'Deep investigation, option comparison, context gathering, and documentation review';
  skills = [
    'microsoft-docs',
    'site-crawler',
    'knowledge-ingestion-patterns',
    'embedding-comparison'
  ];
  mcpServers = ['microsoft-docs'];
}

// src/agents/reviewer.ts
export class ReviewerAgent extends BaseAgent {
  name = 'reviewer';
  description = 'Code review, security review, architecture review, and quality assessment';
  skills = [
    'code-review-patterns',
    'security-review',
    'test-patterns'
  ];
  mcpServers = ['github'];
}

// src/agents/tester.ts
export class TesterAgent extends BaseAgent {
  name = 'tester';
  description = 'Test generation, test execution, coverage analysis, and quality assurance';
  skills = [
    'test-patterns',
    'code-review-patterns'
  ];
  mcpServers = ['playwright'];
}

// src/agents/writer.ts
export class WriterAgent extends BaseAgent {
  name = 'writer';
  description = 'Documentation, technical writing, READMEs, and knowledge base articles';
  skills = [
    'doc-sync',
    'joplin-publisher',
    'obsidian-publisher',
    'mermaid-diagrams',
    'graphviz-diagrams',
    'prompt-template'
  ];
}
```

#### Orchestrator

```typescript
// src/orchestrator.ts

import { BaseAgent, AgentContext, AgentResult, HandoffRequest } from './agents';
import { HookManager } from './hooks';
import { ChromaClient } from './storage';

export class Orchestrator {
  private agents: Map<string, BaseAgent>;
  private hookManager: HookManager;
  private chromaClient: ChromaClient;
  private currentProject: string;
  
  constructor(config: OrchestratorConfig) {
    // Initialize agents, hooks, storage
  }
  
  // Set the current project context (determines ChromaDB collection)
  setProject(projectId: string): void {
    this.currentProject = projectId;
  }
  
  // Route task to appropriate agent
  async routeTask(task: string, preferredAgent?: string): Promise<AgentResult> {
    // 1. Fire pre-routing hook
    // 2. Determine best agent (via routing skill or explicit)
    // 3. Create agent context with project-specific chroma collection
    // 4. Execute agent
    // 5. Handle handoff requests
    // 6. Fire post-routing hook
    // 7. Cache results to ChromaDB
  }
  
  // Handle agent handoff requests
  private async handleHandoff(request: HandoffRequest, previousResult: AgentResult): Promise<AgentResult> {
    // All handoffs come back to orchestrator
    // Orchestrator validates and routes to next agent
    // Provides previous agent's output as context
  }
  
  // Invoke a skill directly (for orchestrator-level operations)
  async invokeSkill(skillName: string, input: unknown): Promise<unknown> {
    // Direct skill invocation from orchestrator
  }
}
```

---

### 3. Skills

Skills are pre-defined capabilities loaded from an external location.

```typescript
// src/skills/registry.ts

export interface Skill {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  outputSchema: JSONSchema;
  execute: (input: unknown, context: SkillContext) => Promise<unknown>;
}

export interface SkillContext {
  chromaCollection: string;
  sessionId: string;
  projectId: string;
}

export class SkillRegistry {
  private skills: Map<string, Skill>;
  
  // Load skills from external directory
  async loadSkills(skillsPath: string): Promise<void> {
    // Read MANIFEST.yaml from skillsPath
    // Load each skill module
    // Validate skill interfaces
    // Register in map
  }
  
  // Get a skill by name
  getSkill(name: string): Skill | undefined;
  
  // List all available skills
  listSkills(): SkillInfo[];
  
  // Invoke a skill with caching to ChromaDB
  async invokeSkill(
    name: string, 
    input: unknown, 
    context: SkillContext
  ): Promise<unknown> {
    // 1. Check ChromaDB cache for similar queries
    // 2. If cache hit with high similarity, return cached result
    // 3. Otherwise execute skill
    // 4. Cache result to ChromaDB
    // 5. Return result
  }
}
```

```yaml
# config/skills.yaml
# Maps skills to their source locations

skills_base_path: "${REFLEX_SKILLS_PATH:-~/.reflex/skills}"

skills:
  - name: agent-builder
    path: agent-builder/
    
  - name: ci-cd-patterns
    path: ci-cd-patterns/
    
  - name: code-review-patterns
    path: code-review-patterns/
    
  - name: collection-migration
    path: collection-migration/
    
  - name: doc-sync
    path: doc-sync/
    
  - name: docker-patterns
    path: docker-patterns/
    
  - name: embedding-comparison
    path: embedding-comparison/
    
  - name: github-harvester
    path: github-harvester/
    
  - name: graphviz-diagrams
    path: graphviz-diagrams/
    
  - name: joplin-publisher
    path: joplin-publisher/
    
  - name: knowledge-ingestion-patterns
    path: knowledge-ingestion-patterns/
    
  - name: local
    path: local/
    
  - name: mcp-server-builder
    path: mcp-server-builder/
    
  - name: mermaid-diagrams
    path: mermaid-diagrams/
    
  - name: microsoft-code-reference
    path: microsoft-code-reference/
    
  - name: microsoft-docs
    path: microsoft-docs/
    
  - name: obsidian-publisher
    path: obsidian-publisher/
    
  - name: pdf-harvester
    path: pdf-harvester/
    
  - name: project-onboarding
    path: project-onboarding/
    
  - name: prompt-template
    path: prompt-template/
    
  - name: rag-builder
    path: rag-builder/
    
  - name: router-builder
    path: router-builder/
    
  - name: security-review
    path: security-review/
    
  - name: site-crawler
    path: site-crawler/
    
  - name: task-decomposition
    path: task-decomposition/
    
  - name: test-patterns
    path: test-patterns/
    
  - name: troubleshooting
    path: troubleshooting/
    
  - name: workflow-builder
    path: workflow-builder/
    
  - name: workspace-builder
    path: workspace-builder/
    
  - name: youtube-harvester
    path: youtube-harvester/
```

---

### 4. Hooks (Event Handlers)

```typescript
// src/hooks/index.ts

export type HookEvent = 
  | 'session_start'
  | 'session_end'
  | 'pre_agent_handoff'
  | 'post_tool_call'
  | 'error'
  | 'file_upload';

export interface HookContext {
  sessionId: string;
  projectId: string;
  timestamp: Date;
  event: HookEvent;
  data: unknown;
}

export type HookHandler = (context: HookContext) => Promise<void>;

export class HookManager {
  private hooks: Map<HookEvent, HookHandler[]>;
  
  register(event: HookEvent, handler: HookHandler): void;
  
  async emit(event: HookEvent, data: unknown): Promise<void> {
    // Execute all handlers for event in order
    // Catch and log errors but don't stop execution
  }
}
```

#### Hook Implementations

```typescript
// src/hooks/session-start.ts
export const sessionStartHook: HookHandler = async (context) => {
  // 1. Initialize ChromaDB connection
  // 2. Load or create project-specific collection
  // 3. Load user preferences/context from previous sessions
  // 4. Initialize audit log if auditing is enabled
  // 5. Warm up frequently used embeddings
};

// src/hooks/session-end.ts
export const sessionEndHook: HookHandler = async (context) => {
  // 1. Persist any pending data to ChromaDB
  // 2. Finalize and close audit log
  // 3. Generate session summary
  // 4. Cleanup temporary resources
  // 5. Save session metadata for future reference
};

// src/hooks/pre-agent-handoff.ts
export const preAgentHandoffHook: HookHandler = async (context) => {
  // 1. Validate handoff request
  // 2. Ensure target agent exists and is available
  // 3. Serialize current agent state
  // 4. Log handoff in audit trail
  // 5. Prepare context for target agent
};

// src/hooks/post-tool-call.ts
export const postToolCallHook: HookHandler = async (context) => {
  // 1. Extract key information from tool result
  // 2. Generate embeddings for cacheable content
  // 3. Store in ChromaDB with metadata:
  //    - tool name, input hash, timestamp
  //    - project ID, session ID
  //    - TTL for cache invalidation
  // 4. Update audit log if auditing enabled
  // 5. Check for error patterns to surface
};

// src/hooks/error.ts
export const errorHook: HookHandler = async (context) => {
  // 1. Log error with full context
  // 2. Determine if error is recoverable
  // 3. If recoverable, attempt recovery strategy:
  //    - Retry with backoff
  //    - Fallback to alternative approach
  //    - Request user intervention
  // 4. If not recoverable, ensure graceful degradation
  // 5. Store error pattern for future avoidance
};

// src/hooks/file-upload.ts
export const fileUploadHook: HookHandler = async (context) => {
  // 1. Detect file type
  // 2. If document (PDF, DOCX, etc.):
  //    - Extract text content
  //    - Generate embeddings
  //    - Store in ChromaDB
  // 3. If code file:
  //    - Parse and index symbols
  //    - Store structure in ChromaDB
  // 4. If data file (CSV, JSON):
  //    - Parse schema
  //    - Sample and index content
  // 5. Make content available to agents
};
```

---

### 5. MCP Server Configurations

```typescript
// src/mcp/config.ts

export interface MCPServerConfig {
  name: string;
  type: 'http' | 'stdio';
  url?: string;           // For http type
  command?: string;       // For stdio type
  args?: string[];        // For stdio type
  env?: Record<string, string>;
  toolsets?: string[];    // Limit to specific toolsets
  auth?: AuthConfig;
}

export interface AuthConfig {
  type: 'oauth' | 'token' | 'none';
  tokenEnvVar?: string;
}
```

```yaml
# config/mcp-servers.yaml

servers:
  # Atlassian (Jira/Confluence)
  - name: atlassian
    type: stdio
    command: npx
    args: ["-y", "@anthropic/mcp-atlassian"]
    env:
      ATLASSIAN_URL: "${ATLASSIAN_URL}"
      ATLASSIAN_EMAIL: "${ATLASSIAN_EMAIL}"
      ATLASSIAN_API_TOKEN: "${ATLASSIAN_API_TOKEN}"
      
  # Git (local)
  - name: git
    type: stdio
    command: npx
    args: ["-y", "@anthropic/mcp-git"]
    
  # GitHub
  - name: github
    type: http
    url: "https://api.githubcopilot.com/mcp/"
    auth:
      type: oauth
    toolsets:
      - repos
      - issues
      - pull_requests
      - actions
      
  # Microsoft Learn Docs
  - name: microsoft-docs
    type: http
    url: "https://learn.microsoft.com/api/mcp"
    
  # Azure MCP
  - name: azure
    type: stdio
    command: npx
    args: ["-y", "@azure/azure-mcp@latest"]
    
  # Azure DevOps
  - name: azure-devops
    type: stdio
    command: npx
    args: ["-y", "@microsoft/mcp-azure-devops@latest"]
    
  # MarkItDown
  - name: markitdown
    type: stdio
    command: npx
    args: ["-y", "@microsoft/mcp-markitdown@latest"]
    
  # SQL Server
  - name: sql-server
    type: stdio
    command: npx
    args: ["-y", "@azure/mcp@latest", "server", "start", "--namespace", "sql"]
    
  # Playwright
  - name: playwright
    type: stdio
    command: npx
    args: ["-y", "@microsoft/mcp-playwright@latest"]
    
  # Dev Box
  - name: devbox
    type: stdio
    command: npx
    args: ["-y", "@microsoft/mcp-devbox@latest"]
    
  # Azure AI Foundry
  - name: azure-ai-foundry
    type: stdio
    command: uvx
    args: ["--prerelease=allow", "--from", "git+https://github.com/azure-ai-foundry/mcp-foundry.git", "run-azure-ai-foundry-mcp"]
    
  # Microsoft 365 Agents Toolkit
  - name: m365-agents
    type: stdio
    command: npx
    args: ["-y", "@microsoft/m365agentstoolkit-mcp@latest", "server", "start"]
```

---

### 6. ChromaDB Integration

```typescript
// src/storage/client.ts

import { ChromaClient as Chroma, Collection } from 'chromadb';

export class ChromaClient {
  private client: Chroma;
  private collections: Map<string, Collection>;
  
  constructor(config: ChromaConfig) {
    // Initialize persistent ChromaDB client
    // Default path: ~/.reflex/chromadb
  }
  
  // Get or create a project-specific collection
  async getCollection(projectId: string): Promise<Collection> {
    const collectionName = `reflex_${projectId}`;
    
    if (!this.collections.has(collectionName)) {
      const collection = await this.client.getOrCreateCollection({
        name: collectionName,
        metadata: {
          projectId,
          created: new Date().toISOString(),
          embeddingModel: 'all-MiniLM-L6-v2'
        }
      });
      this.collections.set(collectionName, collection);
    }
    
    return this.collections.get(collectionName)!;
  }
  
  // Store content with embeddings
  async store(
    projectId: string,
    content: StorageContent
  ): Promise<string> {
    const collection = await this.getCollection(projectId);
    const embedding = await this.generateEmbedding(content.text);
    const id = this.generateId(content);
    
    await collection.add({
      ids: [id],
      embeddings: [embedding],
      documents: [content.text],
      metadatas: [{
        type: content.type,
        source: content.source,
        timestamp: new Date().toISOString(),
        ttl: content.ttl,
        ...content.metadata
      }]
    });
    
    return id;
  }
  
  // Query for similar content
  async query(
    projectId: string,
    queryText: string,
    options: QueryOptions = {}
  ): Promise<QueryResult[]> {
    const collection = await this.getCollection(projectId);
    const embedding = await this.generateEmbedding(queryText);
    
    const results = await collection.query({
      queryEmbeddings: [embedding],
      nResults: options.limit || 5,
      where: options.filter
    });
    
    return this.formatResults(results);
  }
  
  // Check cache for tool results
  async checkCache(
    projectId: string,
    toolName: string,
    inputHash: string
  ): Promise<CacheHit | null> {
    const collection = await this.getCollection(projectId);
    
    const results = await collection.get({
      where: {
        type: 'tool_cache',
        toolName,
        inputHash
      }
    });
    
    if (results.ids.length > 0) {
      // Check TTL
      const metadata = results.metadatas[0];
      if (this.isExpired(metadata.timestamp, metadata.ttl)) {
        await collection.delete({ ids: [results.ids[0]] });
        return null;
      }
      
      return {
        hit: true,
        result: JSON.parse(results.documents[0]),
        timestamp: metadata.timestamp
      };
    }
    
    return null;
  }
  
  // List all projects (collections)
  async listProjects(): Promise<ProjectInfo[]> {
    const collections = await this.client.listCollections();
    return collections
      .filter(c => c.name.startsWith('reflex_'))
      .map(c => ({
        projectId: c.name.replace('reflex_', ''),
        metadata: c.metadata
      }));
  }
  
  // Delete a project's collection
  async deleteProject(projectId: string): Promise<void> {
    await this.client.deleteCollection(`reflex_${projectId}`);
    this.collections.delete(`reflex_${projectId}`);
  }
}

// src/storage/embeddings.ts

import { pipeline } from '@xenova/transformers';

let embeddingPipeline: any = null;

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!embeddingPipeline) {
    embeddingPipeline = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
  }
  
  const output = await embeddingPipeline(text, {
    pooling: 'mean',
    normalize: true
  });
  
  return Array.from(output.data);
}
```

```typescript
// src/storage/collections.ts

export interface StorageContent {
  text: string;
  type: ContentType;
  source: string;
  ttl?: number;        // Time to live in seconds
  metadata?: Record<string, unknown>;
}

export type ContentType = 
  | 'tool_cache'       // Cached tool/skill results
  | 'document'         // Uploaded/harvested documents
  | 'code'             // Code snippets and symbols
  | 'conversation'     // Conversation history
  | 'research'         // Research findings
  | 'context';         // General context

export interface QueryOptions {
  limit?: number;
  filter?: Record<string, unknown>;
  minSimilarity?: number;
}

export interface QueryResult {
  id: string;
  content: string;
  similarity: number;
  metadata: Record<string, unknown>;
}

export interface CacheHit {
  hit: boolean;
  result: unknown;
  timestamp: string;
}
```

---

### 7. Configuration Files

```yaml
# config/agents.yaml

orchestrator:
  default_agent: planner
  max_handoff_depth: 5
  timeout_ms: 300000

agents:
  analyst:
    description: "Data analysis, metrics evaluation, pattern recognition"
    skills:
      - embedding-comparison
      - knowledge-ingestion-patterns
      - task-decomposition
      - troubleshooting
    mcp_servers: []
    
  coder:
    description: "Application code development and refactoring"
    skills:
      - microsoft-code-reference
      - test-patterns
      - docker-patterns
      - ci-cd-patterns
    mcp_servers:
      - github
      - git
      
  devops:
    description: "Infrastructure, CI/CD, deployment operations"
    skills:
      - ci-cd-patterns
      - docker-patterns
      - workspace-builder
      - workflow-builder
    mcp_servers:
      - azure
      - azure-devops
      - github
      
  harvester:
    description: "External data collection and processing"
    skills:
      - github-harvester
      - pdf-harvester
      - site-crawler
      - youtube-harvester
      - knowledge-ingestion-patterns
    mcp_servers:
      - markitdown
      
  planner:
    description: "Task decomposition and project planning"
    skills:
      - task-decomposition
      - project-onboarding
      - workflow-builder
      - router-builder
    mcp_servers:
      - atlassian
      - azure-devops
      
  researcher:
    description: "Investigation and documentation review"
    skills:
      - microsoft-docs
      - site-crawler
      - knowledge-ingestion-patterns
      - embedding-comparison
    mcp_servers:
      - microsoft-docs
      
  reviewer:
    description: "Code and security review"
    skills:
      - code-review-patterns
      - security-review
      - test-patterns
    mcp_servers:
      - github
      
  tester:
    description: "Test generation and execution"
    skills:
      - test-patterns
      - code-review-patterns
    mcp_servers:
      - playwright
      
  writer:
    description: "Documentation and technical writing"
    skills:
      - doc-sync
      - joplin-publisher
      - obsidian-publisher
      - mermaid-diagrams
      - graphviz-diagrams
      - prompt-template
    mcp_servers: []
```

```yaml
# config/hooks.yaml

hooks:
  session_start:
    enabled: true
    handlers:
      - initialize_chromadb
      - load_project_context
      - warmup_embeddings
      
  session_end:
    enabled: true
    handlers:
      - persist_pending_data
      - finalize_audit_log
      - generate_session_summary
      - cleanup_resources
      
  pre_agent_handoff:
    enabled: true
    handlers:
      - validate_handoff
      - serialize_agent_state
      - log_handoff
      
  post_tool_call:
    enabled: true
    handlers:
      - cache_result
      - update_audit_log
      
  error:
    enabled: true
    handlers:
      - log_error
      - attempt_recovery
      - notify_if_critical
      
  file_upload:
    enabled: true
    handlers:
      - detect_file_type
      - extract_content
      - generate_embeddings
      - store_in_chromadb
```

---

### 8. Environment Configuration

```bash
# .env.example

# Project Settings
REFLEX_SKILLS_PATH=~/.reflex/skills
REFLEX_CHROMADB_PATH=~/.reflex/chromadb
REFLEX_LOG_PATH=~/.reflex/logs

# Current Project (can be overridden per session)
REFLEX_PROJECT_ID=default

# Atlassian
ATLASSIAN_URL=https://your-domain.atlassian.net
ATLASSIAN_EMAIL=your-email@example.com
ATLASSIAN_API_TOKEN=your-api-token

# GitHub (OAuth handled by client, but PAT can be used)
GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# Azure
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_TENANT_ID=your-tenant-id

# Azure DevOps
AZURE_DEVOPS_ORG=your-org
AZURE_DEVOPS_PAT=your-pat

# SQL Server (optional)
SQL_SERVER_CONNECTION_STRING=Server=localhost;Database=mydb;

# Audit Settings
REFLEX_AUDIT_ENABLED=false
REFLEX_AUDIT_FORMAT=json
```

---

### 9. Type Definitions

```typescript
// src/types/agents.ts

export interface AgentContext {
  task: string;
  projectContext: ProjectContext;
  previousAgentOutput?: unknown;
  chromaCollection: string;
  sessionId: string;
  metadata?: Record<string, unknown>;
}

export interface ProjectContext {
  projectId: string;
  workingDirectory: string;
  gitBranch?: string;
  files?: FileInfo[];
  recentActions?: ActionHistory[];
}

export interface AgentResult {
  success: boolean;
  output: unknown;
  artifacts?: Artifact[];
  suggestedNextAgent?: string;
  handoffContext?: unknown;
  tokensUsed?: number;
  duration_ms?: number;
}

export interface Artifact {
  type: 'file' | 'code' | 'diagram' | 'report';
  name: string;
  content: string | Buffer;
  metadata?: Record<string, unknown>;
}

export interface HandoffRequest {
  targetAgent: string;
  reason: string;
  context: unknown;
  priority?: 'low' | 'normal' | 'high';
}

// src/types/skills.ts

export interface Skill {
  name: string;
  description: string;
  version: string;
  inputSchema: JSONSchema;
  outputSchema: JSONSchema;
  cacheable: boolean;
  cacheTTL?: number;
  execute: (input: unknown, context: SkillContext) => Promise<unknown>;
}

export interface SkillContext {
  chromaCollection: string;
  sessionId: string;
  projectId: string;
  agent?: string;
}

export interface SkillInfo {
  name: string;
  description: string;
  version: string;
  cacheable: boolean;
}

// src/types/hooks.ts

export type HookEvent = 
  | 'session_start'
  | 'session_end'
  | 'pre_agent_handoff'
  | 'post_tool_call'
  | 'error'
  | 'file_upload';

export interface HookContext {
  sessionId: string;
  projectId: string;
  timestamp: Date;
  event: HookEvent;
  data: unknown;
}

export type HookHandler = (context: HookContext) => Promise<void>;

// src/types/mcp.ts

export interface MCPServerConfig {
  name: string;
  type: 'http' | 'stdio';
  url?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  toolsets?: string[];
  auth?: AuthConfig;
}

export interface AuthConfig {
  type: 'oauth' | 'token' | 'none';
  tokenEnvVar?: string;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
}
```

---

## Implementation Notes

### Dependencies (package.json)

```json
{
  "name": "reflex",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx watch src/index.ts",
    "test": "vitest"
  },
  "dependencies": {
    "chromadb": "^1.8.0",
    "@xenova/transformers": "^2.17.0",
    "yaml": "^2.3.0",
    "zod": "^3.22.0",
    "commander": "^12.0.0",
    "chalk": "^5.3.0",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.4.0",
    "tsx": "^4.7.0",
    "vitest": "^1.3.0"
  }
}
```

### Build Order

1. **Phase 1 - Foundation**
   - Set up project structure
   - Implement types
   - Create configuration loaders
   - Set up ChromaDB client

2. **Phase 2 - Core Infrastructure**
   - Implement HookManager
   - Create SkillRegistry and loader
   - Build MCP server configuration manager

3. **Phase 3 - Agents**
   - Implement BaseAgent
   - Create all 9 agents
   - Build Orchestrator

4. **Phase 4 - Commands**
   - Implement `/reflex:gitconfig`
   - Implement `/reflex:certcollect`
   - Implement `/reflex:audit`

5. **Phase 5 - Integration**
   - Wire everything together in index.ts
   - Implement hooks
   - Test end-to-end flows

6. **Phase 6 - Documentation**
   - Generate ARCHITECTURE.md
   - Create usage documentation
   - Add examples

---

## Testing Requirements

Create tests for:

1. **Commands**
   - Test option parsing
   - Test multi-turn interactions
   - Mock system calls (git, openssl)

2. **Agents**
   - Test skill invocation
   - Test handoff mechanics
   - Test context passing

3. **Hooks**
   - Test event emission
   - Test handler execution order
   - Test error isolation

4. **Storage**
   - Test ChromaDB operations
   - Test embedding generation
   - Test cache hit/miss logic
   - Test project isolation

---

## Success Criteria

1. All slash commands work with both simple and verbose modes
2. Agents can be invoked and hand off through orchestrator
3. Skills can be loaded from external path and invoked
4. Hooks fire at appropriate times
5. ChromaDB provides isolated, persistent storage per project
6. MCP servers can be configured and connected
7. Audit logging captures all actions when enabled
8. All components have test coverage
