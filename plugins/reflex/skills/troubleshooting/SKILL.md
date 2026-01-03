---
name: troubleshooting
description: Systematic troubleshooting patterns for debugging issues
---


# Troubleshooting Skill

> Systematic debugging approaches for workspace components: RAG, routing, agents, and workflows.

## Overview

When things go wrong, having a documented debugging approach saves time. This skill captures diagnostic steps for common issues across all workspace components.

## General Debugging Principles

1. **Reproduce first** - Confirm the issue is reproducible
2. **Isolate the layer** - Is it RAG, routing, agent, or workflow?
3. **Check logs** - Enable debug logging before diving deeper
4. **Test components independently** - Verify each piece in isolation
5. **Document findings** - Add to this skill when you learn something

## Enable Debug Logging

```bash
# Set for all components
export LOG_LEVEL=DEBUG

# Or per-component
export RAG_LOG_LEVEL=DEBUG
export ROUTER_LOG_LEVEL=DEBUG
export AGENT_LOG_LEVEL=DEBUG
```


### Issue: Search Returns Nothing

**Symptoms**: Empty results for any query

**Diagnostic Steps**:

```python
# 1. Verify collection exists and has documents
async def check_collection_health(collection: str):
    stats = await rag.collection_stats(collection)
    print(f"Collection: {collection}")
    print(f"Document count: {stats['count']}")

    if stats['count'] == 0:
        print("❌ Collection is empty!")

# 2. Check ChromaDB is accessible
def check_chroma_connection():
    import chromadb
    try:
        client = chromadb.PersistentClient(path="./rag/database/chroma")
        collections = client.list_collections()
        print(f"✅ ChromaDB connected, {len(collections)} collections")
    except Exception as e:
        print(f"❌ ChromaDB error: {e}")

# 3. Verify embedding model loads
def check_embeddings():
    from sentence_transformers import SentenceTransformer
    try:
        model = SentenceTransformer('all-MiniLM-L6-v2')
        test = model.encode(["test"])
        print(f"✅ Embeddings working, dimension: {test.shape[1]}")
    except Exception as e:
        print(f"❌ Embedding error: {e}")
```

**Common Causes**:
- Collection name typo
- ChromaDB path incorrect
- Database files corrupted
- Embedding model not downloaded

**Solutions**:
```bash
# Reset ChromaDB (caution: deletes data)
rm -rf ./rag/database/chroma
mkdir -p ./rag/database/chroma

# Re-download embedding model
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"
```


## Router Troubleshooting

### Issue: Routes Not Matching

**Symptoms**: Queries route to wrong category or fall through

**Diagnostic Steps**:

```python
async def debug_routing(query: str):
    """See routing decision details."""
    result = await router.route(
        query=query,
        return_scores=True
    )

    print(f"Query: {query}")
    print(f"Selected: {result['route']}")
    print(f"Confidence: {result['score']:.3f}")
    print("
All scores:")
    for route, score in sorted(result['all_scores'].items(), key=lambda x: -x[1]):
        print(f"  {route}: {score:.3f}")

# Test with known phrases
test_queries = [
    "find code in project",      # Should match code search
    "what's the architecture",   # Should match docs
    "review this PR",            # Should match workflow
]

for q in test_queries:
    await debug_routing(q)
```

**Common Causes**:
- Utterance examples too similar across routes
- Not enough training utterances
- Query phrasing very different from examples

**Solutions**:
```python
# Add more diverse utterances
routes = [
    {
        "name": "code_search",
        "utterances": [
            "find code",
            "search for function",
            "where is the implementation",
            "show me the code for",
            "locate the class",
            "grep for",  # Add variations
        ]
    }
]

# Rebuild route embeddings
await router.rebuild_embeddings()
```


## Agent Troubleshooting

### Issue: Agent Not Responding

**Symptoms**: Agent tool call hangs or returns nothing

**Diagnostic Steps**:

```python
# 1. Test agent in isolation
async def test_agent(agent_name: str):
    """Test if agent responds."""
    result = await agent_server.invoke(
        agent=agent_name,
        task="Say hello",
        timeout=10
    )
    print(f"Response: {result}")

# 2. Check agent is registered
async def list_agents():
    agents = await agent_server.list_agents()
    for a in agents:
        print(f"  {a['name']}: {a['status']}")

# 3. Check agent definition
def validate_agent_definition(agent_path: str):
    import yaml
    with open(agent_path) as f:
        agent = yaml.safe_load(f)

    required = ['name', 'description', 'system_prompt']
    for field in required:
        if field not in agent:
            print(f"❌ Missing required field: {field}")
        else:
            print(f"✅ {field}: present")
```

**Common Causes**:
- Agent not registered in registry
- System prompt causing issues
- Tool references broken


## Workflow Troubleshooting

### Issue: Workflow Fails Mid-Execution

**Symptoms**: Workflow starts but doesn't complete

**Diagnostic Steps**:

```python
# 1. Check workflow execution log
async def get_workflow_log(workflow_id: str):
    """Get detailed execution log."""
    log = await workflow_server.get_execution_log(workflow_id)

    for step in log['steps']:
        status = "✅" if step['completed'] else "❌"
        print(f"{status} {step['name']}: {step['status']}")
        if step.get('error'):
            print(f"   Error: {step['error']}")

# 2. Validate workflow definition
def validate_workflow(workflow_path: str):
    import yaml
    with open(workflow_path) as f:
        workflow = yaml.safe_load(f)

    # Check required fields
    if 'steps' not in workflow:
        print("❌ No steps defined")
        return

    for i, step in enumerate(workflow['steps']):
        if 'name' not in step:
            print(f"❌ Step {i} missing name")
        if 'agent' not in step and 'action' not in step:
            print(f"❌ Step {step.get('name', i)} has no agent or action")
        else:
            print(f"✅ Step {step['name']}")

# 3. Test step in isolation
async def test_workflow_step(workflow_name: str, step_name: str):
    """Run single step from workflow."""
    result = await workflow_server.run_step(
        workflow=workflow_name,
        step=step_name,
        context={}
    )
    print(f"Step result: {result}")
```

**Common Causes**:
- Step dependency not met
- Agent referenced doesn't exist
- Context variable missing


## Quick Diagnostic Commands

```bash
# Check all services are running
./scripts/health-check.sh

# View recent logs
tail -f logs/rag-server.log
tail -f logs/router-server.log
tail -f logs/agent-server.log

# Test RAG connectivity
curl http://localhost:8100/health

# Test router
curl -X POST http://localhost:8101/route \
  -d '{"query": "test query"}'

# Reset everything (nuclear option)
./scripts/reset-services.sh
```

## Health Check Script

```bash
#!/bin/bash
# scripts/health-check.sh

echo "🔍 Workspace Health Check"
echo "========================="

# Check Python environment
echo -n "Python: "
python --version 2>/dev/null || echo "❌ Not found"

# Check dependencies
echo -n "ChromaDB: "
python -c "import chromadb; print('✅')" 2>/dev/null || echo "❌"

echo -n "Sentence Transformers: "
python -c "import sentence_transformers; print('✅')" 2>/dev/null || echo "❌"

echo -n "MCP: "
python -c "import mcp; print('✅')" 2>/dev/null || echo "❌"

# Check directories
echo ""
echo "Directories:"
for dir in rag/database routing/embeddings agents/registry; do
    if [ -d "$dir" ]; then
        echo "  ✅ $dir"
    else
        echo "  ❌ $dir (missing)"
    fi
done

# Check config files
echo ""
echo "Config Files:"
for file in .claude.json .env config/base.yaml; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ⚠️  $file (missing)"
    fi
done

echo ""
echo "Health check complete!"
```

## Refinement Notes

> Add debugging insights as you encounter and solve issues.

- [ ] RAG troubleshooting validated
- [ ] Router debugging tested
- [ ] Agent isolation working
- [ ] Workflow diagnostics complete
- [ ] Health check script reliable
