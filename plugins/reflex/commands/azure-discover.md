---
description: Discover and document Azure infrastructure with architecture diagrams
allowed-tools: Write, AskUserQuestion, mcp__azure__subscription_list, mcp__azure__group_list, mcp__azure__appservice, mcp__azure__functionapp, mcp__azure__aks, mcp__azure__acr, mcp__azure__keyvault, mcp__azure__sql, mcp__azure__cosmos, mcp__azure__postgres, mcp__azure__mysql, mcp__azure__redis, mcp__azure__eventhubs, mcp__azure__servicebus, mcp__azure__eventgrid, mcp__azure__signalr, mcp__azure__storage, mcp__azure__appconfig, mcp__azure__applicationinsights, mcp__azure__monitor, mcp__azure__search, mcp__qdrant__qdrant-store
argument-hint: [--subscription NAME] [--resource-group NAME] [--output FILE] [--store]
---

# Azure Resource Discovery

Discover Azure resources using Azure MCP tools, map relationships, and generate a markdown report with an embedded Mermaid architecture diagram.

**SAFETY: This command is READ-ONLY. NEVER call Azure MCP tools that create, modify, or delete resources. Only use list/get/read operations for discovery. The `Write` tool is only for writing the output markdown report file.**

## Syntax

```
/reflex:azure-discover [--subscription NAME] [--resource-group NAME] [--output FILE] [--store]
```

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `--subscription` | (interactive) | Subscription name or ID to discover |
| `--resource-group` | (interactive) | Resource group name, or "all" for all groups |
| `--output` | `azure-infrastructure.md` | Output file path for the report |
| `--store` | `false` | Store the report in Qdrant for RAG queries |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AZURE_SUBSCRIPTION_ID` | Default subscription ID (overridden by `--subscription`) | (none) |
| `AZURE_TENANT_ID` | Default tenant ID for authentication | (none) |

These are passed to the Azure MCP server at startup via `.mcp.json`. The `--subscription` flag or interactive selection in Step 2 can override the subscription within the active tenant. To switch tenants, update `AZURE_TENANT_ID` and restart the MCP server.

## Instructions

### Step 1: Parse Arguments

Parse the user's input to extract:
- `--subscription` — skip subscription selection if provided
- `--resource-group` — skip resource group selection if provided
- `--output` — custom output file path
- `--store` — whether to store in Qdrant after generating

### Step 2: Select Subscription

If `--subscription` was not provided:

1. Call `mcp__azure__subscription_list` to list available subscriptions
2. Use `AskUserQuestion` to let the user select a subscription
3. If only one subscription exists, use it automatically

If `--subscription` was provided, use it directly.

### Step 3: Select Resource Group(s)

If `--resource-group` was not provided:

1. Call `mcp__azure__group_list` for the selected subscription
2. Use `AskUserQuestion` to let the user select resource group(s) or "All resource groups"
3. If only one resource group exists, use it automatically

If `--resource-group` was provided, use it directly. The value "all" means discover all resource groups.

### Step 4: Discover Resources

Call the following Azure MCP tools to discover resources. Run calls in **parallel** where possible for speed. Each tool call should be scoped to the selected subscription and resource group(s). See the **azure-resource-discovery** skill for the full resource taxonomy and category mappings.

Tools to call: `appservice`, `functionapp`, `aks`, `acr`, `keyvault`, `sql`, `cosmos`, `postgres`, `mysql`, `redis`, `eventhubs`, `servicebus`, `eventgrid`, `signalr`, `storage`, `appconfig`, `applicationinsights`, `monitor`, `search`

#### Error Handling

- **Tool unavailable / not loaded** — skip the tool, note in Discovery Notes
- **Permission denied (403)** — note which category was inaccessible, continue with remaining tools
- **Subscription or resource group not found (404)** — stop discovery and inform the user immediately
- **Empty results** — omit that category section from the report entirely (no empty tables)

### Step 5: Map Relationships

After collecting resources, infer relationships between them using the patterns in the **azure-resource-discovery** skill's Relationship Mapping section. The skill covers connection string matching, Key Vault references, managed identity, tag-based inference, and more.

### Step 6: Generate Mermaid Diagram

Build a Mermaid flowchart diagram from the discovered resources. Use the azure-resource-discovery skill for diagram templates and styling.

Guidelines:
- Use `flowchart TB` for multi-tier architectures, `flowchart LR` for pipeline/container architectures
- Group resources by category using `subgraph`
- Show relationships as arrows with labels describing the connection type
- Apply the category color scheme from the skill
- Include resource name, type shorthand, and SKU/tier in node labels
- Keep the diagram readable — for large environments, focus on the primary resource group or limit to key resources

### Step 7: Generate Markdown Report

Assemble the full report using the **Markdown Report Template** from the **azure-resource-discovery** skill. The report includes these sections: Architecture (Mermaid diagram), Resource Inventory (per-category tables), Relationships, Quick Reference, and Discovery Notes.

Write the report to the output file path (default: `azure-infrastructure.md`).

### Step 8: Store in Qdrant (Optional)

If `--store` was specified, store the report in Qdrant:

```
Tool: qdrant-store
Information: "<full report content>"
Metadata:
  source: "azure_discovery"
  content_type: "infrastructure_report"
  harvested_at: "<current ISO 8601 timestamp>"
  subscription_name: "<subscription name>"
  subscription_id: "<subscription ID>"
  resource_groups: "<comma-separated resource group names>"
  resource_count: <total count>
  regions: "<comma-separated regions>"
  categories: "<comma-separated non-empty categories>"
  category: "devops"
  subcategory: "azure"
  type: "infrastructure_report"
  confidence: "high"
```

### Step 9: Report Results

Summarize what was done:
- Subscription and resource group(s) scanned
- Total resources discovered, broken down by category
- Output file path
- Qdrant storage confirmation (if `--store` was used)
- Any categories that returned no results or had errors

## Examples

```bash
# Interactive discovery (prompts for subscription and resource group)
/reflex:azure-discover

# Specific subscription and resource group
/reflex:azure-discover --subscription "My Subscription" --resource-group my-rg

# All resource groups, custom output
/reflex:azure-discover --subscription "Production" --resource-group all --output infra-report.md

# Discover and store in Qdrant
/reflex:azure-discover --store

# Targeted scan with storage
/reflex:azure-discover --resource-group staging-rg --output staging-infra.md --store
```
