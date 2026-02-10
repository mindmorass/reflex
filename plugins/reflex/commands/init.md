---
description: Initialize MCP server credentials or project workflows
allowed-tools: Bash(*), Read(*), Write(*), Edit(*), AskUserQuestion(*)
argument-hint: <langfuse|atlassian|qdrant|azure|azure-devops|github|sql-server|all|status|workflow>
---

# Credential Initialization

Configure credentials for MCP servers and store them in a `.env` file.

**Supported services:** LangFuse, Atlassian, Qdrant, Azure, Azure DevOps, GitHub, SQL Server

## Instructions

This is an **interactive workflow**. Follow these steps:

### Step 1: Determine Environment File Location

```bash
ENV_FILE="${WORKSPACE_HOME:-$HOME}/.env"
echo "Environment file location: $ENV_FILE"
if [ -f "$ENV_FILE" ]; then
    echo "Status: EXISTS"
else
    echo "Status: NOT FOUND (will be created)"
fi
```

### Step 2: Read Existing Configuration

If the `.env` file exists, read it to check for existing values.

### Step 3: Prompt for Credentials

Use `AskUserQuestion` to gather credentials for the requested service(s).

### Step 4: Validate Credentials

Test each service connection before saving.

### Step 5: Write Configuration

Update or create the `.env` file with the new credentials.

### Step 6: Check MCP Server State

After configuring credentials, check if the corresponding MCP server is installed:

```bash
CONFIG_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/reflex"
CONFIG="${CONFIG_DIR}/mcp-config.json"
```

If the server is not installed in `mcp-config.json`, inform the user:
"The {service} MCP server is not currently installed. Install it with: `/reflex:mcp install {service}`"

---

## Arguments

### langfuse

Configure LangFuse observability credentials.

**Required variables:**
- `LANGFUSE_BASE_URL` - LangFuse server URL (e.g., `https://langfuse.example.com`)
- `LANGFUSE_PUBLIC_KEY` - Public API key (starts with `pk-lf-`)
- `LANGFUSE_SECRET_KEY` - Secret API key (starts with `sk-lf-`)

**Validation:**
```bash
curl -s -o /dev/null -w "%{http_code}" "$LANGFUSE_BASE_URL/api/public/health"
# Expected: 200
```

### atlassian

Configure Atlassian (Jira/Confluence) credentials.

**Required variables:**
- `JIRA_URL` - Jira instance URL (e.g., `https://company.atlassian.net`)
- `JIRA_USERNAME` - Email address for Jira authentication
- `JIRA_API_TOKEN` - API token from https://id.atlassian.com/manage-profile/security/api-tokens
- `CONFLUENCE_URL` - Confluence instance URL (usually same as Jira for Cloud)

**Validation:**
```bash
curl -s -o /dev/null -w "%{http_code}" -u "$JIRA_USERNAME:$JIRA_API_TOKEN" "$JIRA_URL/rest/api/2/myself"
# Expected: 200
```

### qdrant

Configure Qdrant vector database credentials.

**Required variables:**
- `QDRANT_URL` - Qdrant server URL (e.g., `http://localhost:6333`)
- `QDRANT_API_KEY` - API key (optional for local instances)
- `QDRANT_COLLECTION_NAME` - Default collection name (e.g., `claude-memory`)

**Validation:**
```bash
curl -s -o /dev/null -w "%{http_code}" -H "api-key: $QDRANT_API_KEY" "$QDRANT_URL/collections"
# Expected: 200
```

### azure

Configure Azure resource management credentials (Service Principal).

**Required variables:**
- `AZURE_SUBSCRIPTION_ID` - Azure subscription ID (UUID format)
- `AZURE_TENANT_ID` - Azure AD tenant ID (UUID format)
- `AZURE_CLIENT_ID` - Service principal application (client) ID
- `AZURE_CLIENT_SECRET` - Service principal client secret

**How to create a Service Principal:**
```bash
az ad sp create-for-rbac --name "claude-code-sp" --role contributor \
    --scopes /subscriptions/{subscription-id}
```

**Validation:**
```bash
# Validate by attempting to get an access token
curl -s -X POST "https://login.microsoftonline.com/$AZURE_TENANT_ID/oauth2/v2.0/token" \
    -d "client_id=$AZURE_CLIENT_ID" \
    -d "client_secret=$AZURE_CLIENT_SECRET" \
    -d "scope=https://management.azure.com/.default" \
    -d "grant_type=client_credentials" | jq -r '.access_token' | head -c 20
# Expected: eyJ... (token prefix)
```

### azure-devops

Configure Azure DevOps credentials.

**Required variables:**
- `AZURE_DEVOPS_ORG` - Azure DevOps organization name (e.g., `mycompany`)
- `AZURE_DEVOPS_PAT` - Personal Access Token from https://dev.azure.com/{org}/_usersSettings/tokens

**Validation:**
```bash
curl -s -o /dev/null -w "%{http_code}" -u ":$AZURE_DEVOPS_PAT" \
    "https://dev.azure.com/$AZURE_DEVOPS_ORG/_apis/projects?api-version=7.0"
# Expected: 200
```

### github

Configure GitHub API credentials.

**Required variables:**
- `GITHUB_TOKEN` - Personal Access Token from https://github.com/settings/tokens
  - Classic token: Select scopes `repo`, `read:org`, `read:user`
  - Fine-grained token: Select repositories and permissions as needed

**Validation:**
```bash
curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $GITHUB_TOKEN" \
    "https://api.github.com/user"
# Expected: 200
```

### sql-server

Configure Microsoft SQL Server connection.

**Required variables:**
- `MSSQL_CONNECTION_STRING` - Full connection string

**Connection string formats:**
```
# SQL Authentication
Server=myserver.database.windows.net;Database=mydb;User Id=myuser;Password=mypass;Encrypt=yes;

# Azure AD Authentication (with service principal)
Server=myserver.database.windows.net;Database=mydb;Authentication=ActiveDirectoryServicePrincipal;User Id={client_id};Password={client_secret};Encrypt=yes;
```

**Validation:**
```bash
# Basic connectivity test (requires sqlcmd or similar)
echo "SELECT 1" | sqlcmd -S "$MSSQL_SERVER" -d "$MSSQL_DATABASE" -U "$MSSQL_USER" -P "$MSSQL_PASSWORD" 2>/dev/null && echo "OK" || echo "FAILED"
```

### all

Configure all services. This is the default when no argument is provided.

**Services configured:**
- LangFuse (observability)
- Atlassian (Jira/Confluence)
- Qdrant (vector database)
- Azure (resource management)
- Azure DevOps (CI/CD, repos)
- GitHub (repos, issues, PRs)
- SQL Server (database)

### status

Show current configuration status with masked secrets.

```bash
ENV_FILE="${WORKSPACE_HOME:-$HOME}/.env"

mask_secret() {
    local value="$1"
    local len=${#value}
    if [ $len -le 8 ]; then
        echo "***"
    else
        echo "${value:0:4}...${value: -4}"
    fi
}

echo "=== Credential Status ==="
echo "Environment file: $ENV_FILE"
echo ""

if [ ! -f "$ENV_FILE" ]; then
    echo "No .env file found."
    exit 0
fi

source "$ENV_FILE" 2>/dev/null

echo "## LangFuse"
echo "  LANGFUSE_BASE_URL: ${LANGFUSE_BASE_URL:-<not set>}"
echo "  LANGFUSE_PUBLIC_KEY: ${LANGFUSE_PUBLIC_KEY:+$(mask_secret "$LANGFUSE_PUBLIC_KEY")}"
echo "  LANGFUSE_SECRET_KEY: ${LANGFUSE_SECRET_KEY:+$(mask_secret "$LANGFUSE_SECRET_KEY")}"
echo ""

echo "## Atlassian"
echo "  JIRA_URL: ${JIRA_URL:-<not set>}"
echo "  JIRA_USERNAME: ${JIRA_USERNAME:-<not set>}"
echo "  JIRA_API_TOKEN: ${JIRA_API_TOKEN:+$(mask_secret "$JIRA_API_TOKEN")}"
echo "  CONFLUENCE_URL: ${CONFLUENCE_URL:-<not set>}"
echo ""

echo "## Qdrant"
echo "  QDRANT_URL: ${QDRANT_URL:-<not set>}"
echo "  QDRANT_API_KEY: ${QDRANT_API_KEY:+$(mask_secret "$QDRANT_API_KEY")}"
echo "  QDRANT_COLLECTION_NAME: ${QDRANT_COLLECTION_NAME:-<not set>}"
echo ""

echo "## Azure"
echo "  AZURE_SUBSCRIPTION_ID: ${AZURE_SUBSCRIPTION_ID:-<not set>}"
echo "  AZURE_TENANT_ID: ${AZURE_TENANT_ID:-<not set>}"
echo "  AZURE_CLIENT_ID: ${AZURE_CLIENT_ID:-<not set>}"
echo "  AZURE_CLIENT_SECRET: ${AZURE_CLIENT_SECRET:+$(mask_secret "$AZURE_CLIENT_SECRET")}"
echo ""

echo "## Azure DevOps"
echo "  AZURE_DEVOPS_ORG: ${AZURE_DEVOPS_ORG:-<not set>}"
echo "  AZURE_DEVOPS_PAT: ${AZURE_DEVOPS_PAT:+$(mask_secret "$AZURE_DEVOPS_PAT")}"
echo ""

echo "## GitHub"
echo "  GITHUB_TOKEN: ${GITHUB_TOKEN:+$(mask_secret "$GITHUB_TOKEN")}"
echo ""

echo "## SQL Server"
echo "  MSSQL_CONNECTION_STRING: ${MSSQL_CONNECTION_STRING:+$(mask_secret "$MSSQL_CONNECTION_STRING")}"
```

### workflow

**Note:** Workflow management has moved to `/reflex:workflow`.

- Apply a workflow template: `/reflex:workflow apply`
- List available templates: `/reflex:workflow list`
- Compose from steps: `/reflex:workflow compose`
- Check status: `/reflex:workflow status`

For backwards compatibility, running `/reflex:init workflow` proceeds with the apply flow. Follow the same instructions as `/reflex:workflow apply`.

### No argument or invalid

If no argument or an invalid argument is provided, show usage:

```
Usage: /reflex:init <langfuse|atlassian|qdrant|azure|azure-devops|github|sql-server|all|status|workflow>

Initialize and configure MCP server credentials, or set up project workflows.

Commands:
  langfuse      Configure LangFuse observability credentials
  atlassian     Configure Atlassian (Jira/Confluence) credentials
  qdrant        Configure Qdrant vector database credentials
  azure         Configure Azure resource management credentials
  azure-devops  Configure Azure DevOps credentials
  github        Configure GitHub API credentials
  sql-server    Configure SQL Server connection
  all           Configure all services (default)
  status        Show current configuration status (secrets masked)
  workflow      Set up a project workflow (redirects to /reflex:workflow apply)

Credentials are stored in: $WORKSPACE_HOME/.env (or $HOME/.env)
```

---

## MCP Package Reference

These are the npm/PyPI packages used by each MCP server:

| Server | Package | Runtime |
|--------|---------|---------|
| qdrant | `mcp-server-qdrant` | uvx (Python 3.12) |
| atlassian | `mcp-atlassian` | uvx (Python 3.12) |
| git | `mcp-server-git` | uvx |
| github | `@modelcontextprotocol/server-github` | npx |
| microsoft-docs | `mcp-remote` → MS Learn | npx |
| azure | `@azure/mcp` | npx |
| azure-devops | `@azure-devops/mcp` | npx |
| markitdown | `markitdown-mcp` | uvx (Python 3.12) |
| sql-server | `mssql-mcp` | npx |
| playwright | `@playwright/mcp` | npx |
| devbox | `@microsoft/devbox-mcp` | npx |
| azure-ai-foundry | `mcp-remote` → Azure AI | npx |

---

## Interactive Workflow

When configuring credentials, Claude should:

1. **Read existing values** from the `.env` file
2. **For each credential**, use `AskUserQuestion`:
   - If value exists: Ask "Edit or Skip?"
   - If value missing: Prompt for the value
3. **Validate** by testing the service endpoint
4. **Report** success or failure for each validation
5. **Write** the updated `.env` file

### Example AskUserQuestion for LangFuse:

```
Questions:
1. "What is your LangFuse server URL?"
   Options: ["https://cloud.langfuse.com (Recommended)", "Self-hosted URL"]

2. "Enter your LangFuse Public Key (pk-lf-...)"
   [Text input]

3. "Enter your LangFuse Secret Key (sk-lf-...)"
   [Text input]
```

### Writing the .env file

Use the `Write` or `Edit` tool to update the `.env` file. Preserve any existing variables not being configured.

Example format:
```bash
# Reflex MCP Server Credentials
# Generated by /reflex:init

# LangFuse
LANGFUSE_BASE_URL=https://langfuse.example.com
LANGFUSE_PUBLIC_KEY=pk-lf-xxx
LANGFUSE_SECRET_KEY=sk-lf-xxx

# Atlassian
JIRA_URL=https://company.atlassian.net
JIRA_USERNAME=user@example.com
JIRA_API_TOKEN=xxx
CONFLUENCE_URL=https://company.atlassian.net

# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
QDRANT_COLLECTION_NAME=claude-memory

# Azure
AZURE_SUBSCRIPTION_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_SECRET=xxx

# Azure DevOps
AZURE_DEVOPS_ORG=mycompany
AZURE_DEVOPS_PAT=xxx

# GitHub
GITHUB_TOKEN=ghp_xxx

# SQL Server
MSSQL_CONNECTION_STRING=Server=myserver.database.windows.net;Database=mydb;User Id=myuser;Password=mypass;Encrypt=yes;
```
