---
description: Trace Azure resource dependencies and generate topology diagrams
allowed-tools: Bash(az:*), Bash(dot:*), Write, AskUserQuestion, mcp__qdrant__qdrant-store
argument-hint: <resource-name> [--subscription NAME] [--output FILE] [--store]
---

# Azure Resource Dependency Tracer

Trace all dependencies of a specific Azure resource — networking, security, identity, monitoring — and generate a topology diagram with metadata tables.

**SAFETY: This command is READ-ONLY. NEVER call `az` commands that create, modify, or delete resources. NEVER call `az account set` or other commands that mutate local CLI state. Only use `show`, `list`, `get`, and `query` operations. Pass `--subscription` as a flag to scope queries instead of switching context. The `Write` tool is only for writing the output markdown report.**

## Syntax

```
/reflex:azure-discover <resource-name> [--subscription NAME] [--output FILE] [--store]
```

## Arguments

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `<resource-name>` | Yes | — | Name of the Azure resource to trace |
| `--subscription` | No | (current default) | Subscription name or ID to narrow search |
| `--output` | No | `<resource-name>-topology.md` | Output file name for the report |
| `--store` | No | `false` | Store the report in Qdrant for RAG queries |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REFLEX_AZURE_DISCOVER_OUTPUT_DIR` | `$HOME/Desktop` | Directory where topology reports are written |

## Instructions

### Step 1: Parse Arguments

Parse the user's input to extract:
- First positional argument: `<resource-name>` (required — if missing, ask the user)
- `--subscription` — narrows search scope
- `--output` — custom output file name (default: `<resource-name>-topology.md`)
- `--store` — whether to store in Qdrant after generating

Resolve the output directory by running:

```bash
echo "${REFLEX_AZURE_DISCOVER_OUTPUT_DIR:-$HOME/Desktop}"
```

Use the result as the output directory. Combine it with the `--output` file name to get the full output path.

### Step 2: Verify Prerequisites

Run `az account show` to confirm Azure CLI is authenticated.

- If the command fails or returns an error, **stop immediately** and tell the user to run `az login` first.
- If `--subscription` was provided, pass `--subscription "<name>"` to all subsequent `az` commands. Do NOT run `az account set` — it mutates global CLI state.
- Display the active subscription name and ID for confirmation.

### Step 3: Find Target Resource

Use Azure Resource Graph to find the resource by name:

```bash
az graph query -q "resources | where name =~ '<resource-name>'" --first 10 -o json
```

Handle results:
- **Zero results**: Report that no resource was found. Suggest checking the name or subscription scope.
- **One result**: Use it as the target. Extract `id`, `name`, `type`, `resourceGroup`, `location`, `subscriptionId`.
- **Multiple results**: Use `AskUserQuestion` to let the user pick which resource. Show name, type, resource group, and subscription for each.

**IMPORTANT: Use the exact query templates from the azure-resource-discovery skill. Do NOT improvise Resource Graph KQL syntax — it frequently produces InvalidQuery errors. When you need filtering beyond the templates, use `az resource list` with JMESPath `--query` instead.**

### Step 4: Run Type-Specific Dependency Tracer

Based on the target resource's `type`, select the appropriate tracer from the **azure-resource-discovery** skill:

| Resource Type | Tracer |
|---------------|--------|
| `Microsoft.App/containerApps` | Container App Tracer |
| `Microsoft.Compute/virtualMachines` | Virtual Machine Tracer |
| `Microsoft.ContainerService/managedClusters` | AKS Cluster Tracer |
| `Microsoft.Web/sites` (not functionapp) | App Service Tracer |
| `Microsoft.Web/sites` (kind contains `functionapp`) | Function App Tracer |
| Any other type | Generic Tracer |

Execute the tracer's `az` CLI commands from the skill. Each tracer returns a set of discovered dependencies with metadata.

### Step 5: Collect Dependency Metadata

For each discovered dependency, collect:
- **Name**: Resource name
- **Type**: Azure resource type
- **Location**: Region
- **Resource Group**: May differ from the target's RG
- **SKU/Tier**: If available
- **Networking details**: CIDR, IP address, subnet, NSG
- **Relationship type**: How it relates to the target (e.g., `runs in`, `secured by`, `pulls from`)

Use the **Networking Detail Collectors** from the skill to gather VNet, subnet, NSG rules, and private endpoint information.

### Step 6: Build Dependency Graph

Construct a graph with:
- **Root node**: The target resource (emphasized in diagram)
- **Dependency nodes**: All discovered dependencies
- **Edges**: Relationships with labels from the skill's relationship table

Group nodes by category: Networking, Security, Data, Monitoring, Identity, Compute/Containers.

### Step 7: Generate Diagram

Choose diagram format based on node count:
- **15 or fewer nodes**: Generate a **Mermaid** flowchart (renders natively in GitHub/VS Code)
- **More than 15 nodes**: Generate a **Graphviz DOT** diagram, then attempt to render SVG via `dot -Tsvg`
  - If `dot` is not installed, fall back to Mermaid regardless of node count

Use the diagram templates from the **azure-resource-discovery** skill. The target resource should be visually emphasized (bold border, distinct fill color).

### Step 8: Generate Markdown Report

Assemble the report using the **Markdown Report Template** from the **azure-resource-discovery** skill. Sections:

1. **Header** — resource type, location, resource group, dependency count
2. **Topology diagram** — Mermaid block or DOT source + SVG image reference
3. **Target Resource table** — name, type, RG, location, subscription, SKU, identity type
4. **Networking table** — VNet, subnet, NSG, private endpoints, public IPs, load balancers with CIDR/IP
5. **NSG Rules table** — priority, direction, access, protocol, source, destination port (if NSG found)
6. **Security & Identity table** — managed identity, Key Vault references, RBAC role assignments
7. **Dependencies table** — all other connected resources with relationship type
8. **Quick Reference** — subscription, resource group, region, total dependencies
9. **Trace Notes** — errors, skipped checks, permission issues

Write the report to the output directory resolved in Step 1, combined with the output file name.

### Step 9: Store in Qdrant (Optional) and Report Results

If `--store` was specified, store a **summary** in Qdrant (not the full report — structured documents with tables and diagrams fragment poorly in vector search). The full report stays on disk; the Qdrant entry is a retrieval pointer.

Build a concise summary (3-5 sentences) covering: what resource was traced, key dependencies found, networking topology highlights, and any notable security findings.

```
Tool: qdrant-store
Information: "Azure topology trace for <resource-name> (<type-shorthand>) in <resource-group>, <location>. <summary of key dependencies — e.g., 'Runs in prod-vnet/app-subnet, secured by app-nsg, pulls images from prodregistry ACR, authenticates via user-assigned managed identity, secrets from prod-keyvault.'> <dependency-count> dependencies traced. Full report: <output-file-path>"
Metadata:
  source: "azure_discovery"
  content_type: "infrastructure_summary"
  harvested_at: "<current ISO 8601 timestamp>"
  subscription_name: "<subscription name>"
  subscription_id: "<subscription ID>"
  resource_name: "<target resource name>"
  resource_type: "<target resource type>"
  resource_group: "<target resource group>"
  dependency_count: <total count>
  regions: "<comma-separated regions>"
  report_path: "<full output file path>"
  category: "devops"
  subcategory: "azure"
  type: "topology_report"
  confidence: "high"
```

Summarize what was done:
- Target resource traced (name, type, resource group)
- Total dependencies discovered, broken down by category
- Output file path
- Qdrant storage confirmation (if `--store` was used)
- Any commands that failed or returned errors

## Examples

```bash
# Trace a container app's dependencies
/reflex:azure-discover my-container-app

# Trace with specific subscription
/reflex:azure-discover my-aks-cluster --subscription "Production"

# Custom output file name (written to $REFLEX_AZURE_DISCOVER_OUTPUT_DIR or ~/Desktop)
/reflex:azure-discover my-webapp --output webapp-deps.md

# Trace and store in Qdrant
/reflex:azure-discover my-vm --store

# Full options
/reflex:azure-discover my-func-app --subscription "Dev" --output func-topology.md --store
```
