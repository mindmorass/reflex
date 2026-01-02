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

---

## RAG Troubleshooting

### Issue: Search Returns Irrelevant Results

**Symptoms**: Query returns documents that don't match intent

**Diagnostic Steps**:

```python
# 1. Check what's actually in the collection
async def inspect_collection(collection: str, sample_size: int = 5):
    """See what documents are in a collection."""
    results = await rag.search(
        query="*",  # Match all
        collection=collection,
        n_results=sample_size
    )

    for r in results["results"]:
        print(f"ID: {r['id']}")
        print(f"Content: {r['content'][:200]}...")
        print(f"Metadata: {r['metadata']}")
        print("---")

# 2. Check embedding similarity
async def debug_search(query: str, collection: str):
    """See similarity scores for a query."""
    results = await rag.search(
        query=query,
        collection=collection,
        n_results=10
    )

    print(f"Query: {query}")
    for r in results["results"]:
        print(f"  Score: {1 - r['distance']:.3f} | {r['content'][:50]}...")

# 3. Test with known document
async def test_retrieval(collection: str):
    """Ingest known doc and verify retrieval."""
    test_content = "The quick brown fox jumps over the lazy dog"

    await rag.ingest(
        content=test_content,
        collection=collection,
        doc_id="test_doc"
    )

    results = await rag.search(
        query="quick brown fox",
        collection=collection,
        n_results=1
    )

    if results["results"][0]["content"] == test_content:
        print("✅ Retrieval working correctly")
    else:
        print("❌ Retrieval issue detected")
```

**Common Causes**:
- Chunk size too large (context dilutes the match)
- Chunk size too small (not enough context)
- Wrong embedding model for domain
- Metadata filters too restrictive

**Solutions**:
```python
# Re-chunk with smaller size
CHUNK_SIZE = 256  # Try smaller

# Check if filters are blocking results
results = await rag.search(
    query=query,
    collection=collection,
    n_results=10,
    where=None  # Disable filters temporarily
)
```

---

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

---

### Issue: Slow Search Performance

**Symptoms**: Queries take >1 second

**Diagnostic Steps**:

```python
import time

async def benchmark_search(collection: str, queries: list):
    """Benchmark search performance."""
    times = []

    for query in queries:
        start = time.perf_counter()
        await rag.search(query=query, collection=collection)
        elapsed = time.perf_counter() - start
        times.append(elapsed)
        print(f"{query[:30]}... : {elapsed*1000:.1f}ms")

    print(f"\nAverage: {sum(times)/len(times)*1000:.1f}ms")
    print(f"Max: {max(times)*1000:.1f}ms")
```

**Common Causes**:
- Collection too large (>100k documents)
- Embedding model loading on each query
- Cold start (first query loads model)

**Solutions**:
```python
# Pre-warm the model
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('all-MiniLM-L6-v2')
_ = model.encode(["warmup"])

# Use HNSW index settings for faster search
collection = client.get_or_create_collection(
    name=name,
    metadata={
        "hnsw:space": "cosine",
        "hnsw:M": 16,  # Connections per node
        "hnsw:ef_construction": 100
    }
)
```

---

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
    print("\nAll scores:")
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

---

### Issue: Router Server Won't Start

**Symptoms**: MCP server fails to initialize

**Diagnostic Steps**:

```bash
# 1. Check dependencies
python -c "from semantic_router import Route; print('✅ semantic_router')"
python -c "from sentence_transformers import SentenceTransformer; print('✅ sentence_transformers')"

# 2. Check route definitions
python -c "
import yaml
with open('routing/routes/routes.yaml') as f:
    routes = yaml.safe_load(f)
    print(f'✅ Loaded {len(routes)} routes')
"

# 3. Try starting manually with debug
LOG_LEVEL=DEBUG python mcp/servers/router-server/server.py
```

**Common Causes**:
- YAML syntax error in routes
- Missing route embeddings cache
- Dependency version mismatch

---

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

---

### Issue: Agent Gives Wrong Answers

**Symptoms**: Agent response doesn't match expected behavior

**Diagnostic Steps**:

```python
# 1. Check what context agent receives
async def debug_agent_context(agent_name: str, task: str):
    """See what the agent actually receives."""
    result = await agent_server.invoke(
        agent=agent_name,
        task=task,
        debug=True  # Return full context
    )

    print("System prompt:", result['system_prompt'][:500])
    print("Tools available:", result['tools'])
    print("Context length:", len(result['full_context']))

# 2. Test with simplified task
simple_tasks = [
    "What tools do you have access to?",
    "Describe your role in one sentence.",
    "What would you do if asked to research Python?",
]
```

**Common Causes**:
- System prompt unclear or contradictory
- Wrong tools attached to agent
- RAG context polluting with irrelevant info

---

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

---

### Issue: Workflow Loops Forever

**Symptoms**: Workflow never completes, keeps running same steps

**Diagnostic Steps**:

```python
# 1. Check for circular dependencies
def check_workflow_cycles(workflow_path: str):
    """Detect circular step dependencies."""
    import yaml
    with open(workflow_path) as f:
        workflow = yaml.safe_load(f)

    # Build dependency graph
    deps = {}
    for step in workflow['steps']:
        name = step['name']
        deps[name] = step.get('depends_on', [])

    # Check for cycles (simple DFS)
    def has_cycle(node, visited, path):
        visited.add(node)
        path.add(node)

        for dep in deps.get(node, []):
            if dep in path:
                return True, list(path) + [dep]
            if dep not in visited:
                result, cycle = has_cycle(dep, visited, path)
                if result:
                    return True, cycle

        path.remove(node)
        return False, []

    for step in deps:
        found, cycle = has_cycle(step, set(), set())
        if found:
            print(f"❌ Cycle detected: {' -> '.join(cycle)}")
            return

    print("✅ No cycles detected")

# 2. Add step limits
workflow_config = {
    "max_iterations": 10,
    "step_timeout": 60
}
```

---

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
