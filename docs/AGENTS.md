# Reflex Agents

This document describes the specialized agents available in Reflex and how to use them effectively.

## Overview

Reflex provides 9 specialized agents, each designed for specific types of tasks. The orchestrator automatically routes tasks to the most appropriate agent, or you can specify an agent directly.

## Agent Reference

### Analyst

**Purpose:** Data analysis, pattern recognition, and troubleshooting

**Skills:**
- `data-analysis-patterns` - Statistical analysis and data exploration
- `troubleshooting-guide` - Systematic debugging approaches

**Best For:**
- Analyzing application performance
- Debugging complex issues
- Pattern identification in logs or data
- Root cause analysis

**Example Tasks:**
```
"Analyze the error patterns in our logs"
"Debug the memory leak in the user service"
"Investigate why API response times increased"
```

---

### Coder

**Purpose:** Code development, refactoring, and implementation

**Skills:**
- `microsoft-code-reference` - Code patterns and best practices
- `test-patterns` - Testing strategies and patterns
- `docker-patterns` - Containerization patterns
- `ci-cd-patterns` - CI/CD pipeline patterns

**MCP Servers:** `github`, `git`

**Best For:**
- Writing new features
- Refactoring existing code
- Creating Docker configurations
- Setting up CI/CD pipelines

**Example Tasks:**
```
"Implement user authentication with JWT"
"Refactor the payment service for better testability"
"Create a Dockerfile for the Node.js application"
```

**Suggested Handoffs:**
- After implementation → `reviewer` for code review
- After writing tests → `tester` to run them
- After CI/CD setup → `devops` for deployment

---

### DevOps

**Purpose:** Infrastructure, CI/CD, and deployment operations

**Skills:**
- `azure-iac-patterns` - Azure infrastructure patterns
- `terraform-modules` - Terraform best practices
- `kubernetes-patterns` - Kubernetes deployment patterns
- `monitoring-patterns` - Observability setup

**MCP Servers:** `azure`, `azure-devops`, `github`

**Best For:**
- Infrastructure provisioning
- Kubernetes deployments
- Cloud resource management
- Monitoring and alerting setup

**Example Tasks:**
```
"Set up Kubernetes cluster on Azure"
"Create Terraform configuration for production"
"Deploy the application to staging environment"
```

---

### Harvester

**Purpose:** Data collection from various sources

**Skills:**
- `web-scraping-patterns` - Web scraping best practices
- `api-integration-patterns` - API consumption patterns

**MCP Servers:** `markitdown`

**Best For:**
- Web scraping
- API data collection
- Document processing
- Data extraction

**Example Tasks:**
```
"Collect product information from the catalog API"
"Scrape pricing data from competitor websites"
"Extract text from uploaded PDF documents"
```

---

### Planner

**Purpose:** Task breakdown and project planning

**Skills:**
- `agile-patterns` - Agile methodology guidance
- `jira-workflow` - Jira workflow patterns

**MCP Servers:** `atlassian`, `azure-devops`

**Best For:**
- Sprint planning
- Task breakdown
- Story creation
- Project roadmapping

**Example Tasks:**
```
"Plan the sprint backlog for the payment feature"
"Break down the authentication epic into stories"
"Create Jira tickets for the refactoring work"
```

---

### Researcher

**Purpose:** Investigation, documentation review, and research

**Skills:**
- `microsoft-docs-search` - Microsoft documentation search
- `best-practices-review` - Industry best practices

**MCP Servers:** `microsoft-docs`

**Best For:**
- Technical research
- Documentation review
- Best practices discovery
- Technology evaluation

**Example Tasks:**
```
"Research best practices for caching in .NET"
"Review Azure Functions documentation for scaling"
"Find recommended patterns for microservices communication"
```

---

### Reviewer

**Purpose:** Code review and security analysis

**Skills:**
- `code-review-checklist` - Code review guidelines
- `security-review-patterns` - Security vulnerability checks
- `pr-review-patterns` - Pull request review workflow

**MCP Servers:** `github`

**Best For:**
- Code review
- Security audits
- Pull request review
- Quality assurance

**Example Tasks:**
```
"Review the pull request for security issues"
"Perform security audit on the API endpoints"
"Review code quality in the authentication module"
```

---

### Tester

**Purpose:** Test generation and quality assurance

**Skills:**
- `test-generation-patterns` - Test case generation
- `coverage-analysis` - Code coverage analysis
- `e2e-test-patterns` - End-to-end testing patterns

**MCP Servers:** `playwright`

**Best For:**
- Writing unit tests
- Creating integration tests
- E2E test automation
- Coverage analysis

**Example Tasks:**
```
"Generate unit tests for the user service"
"Create E2E tests for the checkout flow"
"Run tests and analyze coverage"
```

---

### Writer

**Purpose:** Documentation and technical writing

**Skills:**
- `documentation-patterns` - Documentation best practices
- `api-documentation` - API documentation standards
- `readme-templates` - README structure and content

**Best For:**
- API documentation
- README creation
- Technical guides
- Code comments

**Example Tasks:**
```
"Write API documentation for the REST endpoints"
"Update the README with installation instructions"
"Create developer onboarding guide"
```

## Task Routing

The orchestrator uses keyword matching to route tasks:

| Keywords | Agent |
|----------|-------|
| implement, code, refactor, develop, build | coder |
| review, audit, check, security | reviewer |
| test, coverage, spec, qa | tester |
| deploy, infrastructure, kubernetes, terraform, pipeline | devops |
| analyze, debug, troubleshoot, investigate | analyst |
| document, readme, guide, write docs | writer |
| plan, sprint, breakdown, story, epic | planner |
| research, find, investigate, learn | researcher |
| collect, scrape, harvest, extract | harvester |

## Agent Handoffs

Agents can suggest handoffs to other agents:

```
coder (after implementation) → reviewer
coder (after tests) → tester
coder (after CI/CD) → devops
reviewer (after approval) → tester
tester (after tests pass) → devops
```

## Direct Agent Selection

To bypass automatic routing, use the `-a` flag:

```bash
/reflex:task "Create user login" -a coder
/reflex:task "Review PR #123" -a reviewer
```

## Custom Agents

To add a custom agent:

1. Create agent class in `src/agents/`:

```typescript
export class CustomAgent extends BaseAgent {
  readonly name = 'custom';
  readonly description = 'Custom agent description';
  readonly skills = ['custom-skill'];

  async execute(context: AgentContext): Promise<AgentResult> {
    // Implementation
  }
}
```

2. Register in orchestrator:

```typescript
this.agents.set('custom', new CustomAgent());
```

3. Add to routing patterns if needed
