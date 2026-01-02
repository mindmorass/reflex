# Embedding Comparison Skill

> Evaluate and compare different embedding models on your actual data.

## Overview

The default `all-MiniLM-L6-v2` model is a good starting point, but may not be optimal for your specific content. This skill helps you:
- Benchmark different models on your data
- Compare retrieval quality
- Make informed model selection decisions

## Why Compare Models?

| Factor | Impact |
|--------|--------|
| Domain vocabulary | Technical jargon may need specialized models |
| Document length | Some models handle long text better |
| Query style | Conversational vs keyword queries |
| Speed requirements | Larger models = better quality but slower |
| Memory constraints | Some models need significant RAM |

## Candidate Models

### General Purpose

| Model | Dimensions | Speed | Quality | Size |
|-------|-----------|-------|---------|------|
| `all-MiniLM-L6-v2` | 384 | Fast | Good | 80MB |
| `all-MiniLM-L12-v2` | 384 | Medium | Better | 120MB |
| `all-mpnet-base-v2` | 768 | Slow | Best | 420MB |

### Specialized

| Model | Best For | Dimensions |
|-------|----------|-----------|
| `multi-qa-MiniLM-L6-cos-v1` | Question answering | 384 |
| `msmarco-MiniLM-L6-cos-v5` | Search/retrieval | 384 |
| `paraphrase-MiniLM-L6-v2` | Semantic similarity | 384 |

### Code-Focused

| Model | Best For | Source |
|-------|----------|--------|
| `krlvi/sentence-t5-base-nlpl-code_search_net` | Code search | HuggingFace |
| `flax-sentence-embeddings/st-codesearch-distilroberta-base` | Code + docs | HuggingFace |

## Benchmarking Framework

### Step 1: Create Test Dataset

```python
#!/usr/bin/env python3
"""Create a test dataset for embedding comparison."""

from typing import List, Dict
import json

def create_test_dataset(
    documents: List[str],
    queries: List[str],
    relevance: Dict[str, List[int]]
) -> Dict:
    """
    Create a test dataset.

    Args:
        documents: List of documents to search
        queries: List of test queries
        relevance: Dict mapping query index to relevant document indices

    Returns:
        Test dataset dict
    """
    return {
        "documents": documents,
        "queries": queries,
        "relevance": relevance
    }


# Example: Create test dataset from your actual content
def create_from_collection(collection_name: str, sample_size: int = 50) -> Dict:
    """Create test dataset from existing collection."""
    import chromadb

    client = chromadb.PersistentClient(path="./rag/database/chroma")
    collection = client.get_collection(collection_name)

    # Get sample documents
    results = collection.get(limit=sample_size, include=["documents"])
    documents = results["documents"]

    # You'll need to manually create queries and mark relevance
    # This is the ground truth that benchmarks against

    return {
        "documents": documents,
        "queries": [],  # Fill in manually
        "relevance": {}  # Fill in manually
    }


# Example test dataset
EXAMPLE_DATASET = {
    "documents": [
        "Python is a high-level programming language known for readability.",
        "FastAPI is a modern web framework for building APIs with Python.",
        "ChromaDB is a vector database for AI applications.",
        "Docker containers provide isolated runtime environments.",
        "REST APIs use HTTP methods for client-server communication.",
    ],
    "queries": [
        "How do I build a web API?",
        "What is a vector database?",
        "How do I containerize my application?",
    ],
    "relevance": {
        "0": [1, 4],  # Query 0 is relevant to docs 1 and 4
        "1": [2],     # Query 1 is relevant to doc 2
        "2": [3],     # Query 2 is relevant to doc 3
    }
}

if __name__ == "__main__":
    with open("test_dataset.json", "w") as f:
        json.dump(EXAMPLE_DATASET, f, indent=2)
    print("Created test_dataset.json")
```

### Step 2: Benchmark Script

```python
#!/usr/bin/env python3
"""Benchmark embedding models on test dataset."""

import json
import time
from typing import Dict, List
import numpy as np
from sentence_transformers import SentenceTransformer

# Models to compare
MODELS = [
    "all-MiniLM-L6-v2",
    "all-MiniLM-L12-v2",
    "all-mpnet-base-v2",
    "multi-qa-MiniLM-L6-cos-v1",
    "msmarco-MiniLM-L6-cos-v5",
]


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Compute cosine similarity between two vectors."""
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


def compute_metrics(
    model: SentenceTransformer,
    documents: List[str],
    queries: List[str],
    relevance: Dict[str, List[int]],
    k: int = 3
) -> Dict:
    """
    Compute retrieval metrics for a model.

    Metrics:
    - Precision@k: Fraction of top-k results that are relevant
    - Recall@k: Fraction of relevant docs found in top-k
    - MRR: Mean Reciprocal Rank
    """
    # Encode documents
    doc_embeddings = model.encode(documents)

    precisions = []
    recalls = []
    reciprocal_ranks = []

    for q_idx, query in enumerate(queries):
        q_key = str(q_idx)
        if q_key not in relevance:
            continue

        relevant_docs = set(relevance[q_key])

        # Encode query and compute similarities
        q_embedding = model.encode([query])[0]
        similarities = [
            cosine_similarity(q_embedding, doc_emb)
            for doc_emb in doc_embeddings
        ]

        # Get top-k results
        top_k_indices = np.argsort(similarities)[-k:][::-1]

        # Precision@k
        hits = len(set(top_k_indices) & relevant_docs)
        precisions.append(hits / k)

        # Recall@k
        recalls.append(hits / len(relevant_docs))

        # MRR (reciprocal rank of first relevant result)
        for rank, idx in enumerate(top_k_indices, 1):
            if idx in relevant_docs:
                reciprocal_ranks.append(1 / rank)
                break
        else:
            reciprocal_ranks.append(0)

    return {
        "precision_at_k": np.mean(precisions),
        "recall_at_k": np.mean(recalls),
        "mrr": np.mean(reciprocal_ranks)
    }


def benchmark_model(model_name: str, dataset: Dict) -> Dict:
    """Benchmark a single model."""
    print(f"\nBenchmarking: {model_name}")

    # Load model (time it)
    load_start = time.perf_counter()
    model = SentenceTransformer(model_name)
    load_time = time.perf_counter() - load_start

    # Time encoding
    encode_start = time.perf_counter()
    _ = model.encode(dataset["documents"])
    encode_time = time.perf_counter() - encode_start

    # Compute retrieval metrics
    metrics = compute_metrics(
        model,
        dataset["documents"],
        dataset["queries"],
        dataset["relevance"]
    )

    # Get model info
    test_embedding = model.encode(["test"])[0]

    return {
        "model": model_name,
        "dimensions": len(test_embedding),
        "load_time_s": round(load_time, 2),
        "encode_time_s": round(encode_time, 3),
        "encode_per_doc_ms": round(encode_time / len(dataset["documents"]) * 1000, 2),
        **{k: round(v, 3) for k, v in metrics.items()}
    }


def run_benchmark(dataset_path: str = "test_dataset.json") -> List[Dict]:
    """Run full benchmark."""
    with open(dataset_path) as f:
        dataset = json.load(f)

    print(f"Dataset: {len(dataset['documents'])} docs, {len(dataset['queries'])} queries")

    results = []
    for model_name in MODELS:
        try:
            result = benchmark_model(model_name, dataset)
            results.append(result)
            print(f"  P@3: {result['precision_at_k']:.3f}, MRR: {result['mrr']:.3f}")
        except Exception as e:
            print(f"  Error: {e}")

    return results


def print_results_table(results: List[Dict]):
    """Print results as formatted table."""
    print("\n" + "=" * 80)
    print("BENCHMARK RESULTS")
    print("=" * 80)

    # Header
    print(f"{'Model':<35} {'Dim':>5} {'P@3':>6} {'R@3':>6} {'MRR':>6} {'ms/doc':>8}")
    print("-" * 80)

    # Sort by MRR (or your preferred metric)
    for r in sorted(results, key=lambda x: -x['mrr']):
        print(f"{r['model']:<35} {r['dimensions']:>5} {r['precision_at_k']:>6.3f} "
              f"{r['recall_at_k']:>6.3f} {r['mrr']:>6.3f} {r['encode_per_doc_ms']:>8.2f}")

    print("=" * 80)


if __name__ == "__main__":
    results = run_benchmark()
    print_results_table(results)

    # Save results
    with open("benchmark_results.json", "w") as f:
        json.dump(results, f, indent=2)
    print("\nResults saved to benchmark_results.json")
```

### Step 3: Side-by-Side Comparison

```python
#!/usr/bin/env python3
"""Interactive comparison of search results between models."""

from sentence_transformers import SentenceTransformer
import numpy as np

def compare_search(
    query: str,
    documents: list,
    models: list,
    top_k: int = 3
):
    """Compare search results across models."""
    print(f"\nQuery: {query}")
    print("=" * 60)

    for model_name in models:
        model = SentenceTransformer(model_name)

        # Encode
        q_emb = model.encode([query])[0]
        doc_embs = model.encode(documents)

        # Compute similarities
        sims = [
            np.dot(q_emb, d) / (np.linalg.norm(q_emb) * np.linalg.norm(d))
            for d in doc_embs
        ]

        # Get top results
        top_indices = np.argsort(sims)[-top_k:][::-1]

        print(f"\n{model_name}:")
        for rank, idx in enumerate(top_indices, 1):
            print(f"  {rank}. [{sims[idx]:.3f}] {documents[idx][:60]}...")


# Interactive usage
if __name__ == "__main__":
    # Your documents
    docs = [
        "The authentication module uses JWT tokens for stateless auth.",
        "Database connections are pooled using SQLAlchemy.",
        "API rate limiting is implemented in the middleware layer.",
        "User sessions are stored in Redis for fast access.",
        "The caching strategy uses a write-through pattern.",
    ]

    models = ["all-MiniLM-L6-v2", "all-mpnet-base-v2"]

    queries = [
        "How does login work?",
        "Where is caching handled?",
        "How are database connections managed?",
    ]

    for query in queries:
        compare_search(query, docs, models)
```

## Decision Framework

### When to Use Different Models

```
all-MiniLM-L6-v2 (default)
├── Fast enough for real-time
├── Good general quality
├── Low memory footprint
└── Use when: Starting out, general content

all-MiniLM-L12-v2
├── Slightly better quality
├── Still reasonably fast
└── Use when: Quality matters more than speed

all-mpnet-base-v2
├── Best quality
├── Significantly slower
├── Higher memory usage
└── Use when: Accuracy is critical, batch processing OK

multi-qa-MiniLM-L6-cos-v1
├── Optimized for Q&A
├── Better with question-form queries
└── Use when: Building Q&A system, FAQ retrieval

msmarco-MiniLM-L6-cos-v5
├── Optimized for search
├── Better with keyword-style queries
└── Use when: Building search engine, keyword queries
```

### Quick Selection Guide

| Your Content | Recommended Model |
|--------------|-------------------|
| General documentation | `all-MiniLM-L6-v2` |
| Technical/code docs | `msmarco-MiniLM-L6-cos-v5` |
| Q&A / FAQ | `multi-qa-MiniLM-L6-cos-v1` |
| High-stakes retrieval | `all-mpnet-base-v2` |
| Mixed content | Run benchmark on your data |

## Switching Models

After deciding on a model:

```python
# 1. Update environment
export EMBEDDING_MODEL=all-mpnet-base-v2

# 2. Re-embed all collections (embeddings aren't portable between models!)
python scripts/reembed_collections.py

# 3. Rebuild router embeddings
python scripts/rebuild_router.py
```

**Important**: Different models produce different dimensional embeddings. You cannot mix embeddings from different models in the same collection!

## Reembedding Script

```python
#!/usr/bin/env python3
"""Re-embed all collections with a new model."""

import os
import chromadb
from sentence_transformers import SentenceTransformer

NEW_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
DB_PATH = "./rag/database/chroma"

def reembed_collection(collection_name: str, model: SentenceTransformer):
    """Re-embed a single collection."""
    client = chromadb.PersistentClient(path=DB_PATH)

    # Get existing data
    old_coll = client.get_collection(collection_name)
    data = old_coll.get(include=["documents", "metadatas"])

    if not data["ids"]:
        print(f"  {collection_name}: empty, skipping")
        return

    # Delete and recreate
    client.delete_collection(collection_name)
    new_coll = client.create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"}
    )

    # Re-embed
    new_embeddings = model.encode(data["documents"]).tolist()

    new_coll.add(
        ids=data["ids"],
        documents=data["documents"],
        metadatas=data["metadatas"],
        embeddings=new_embeddings
    )

    print(f"  {collection_name}: re-embedded {len(data['ids'])} documents")


def main():
    print(f"Re-embedding with model: {NEW_MODEL}")

    model = SentenceTransformer(NEW_MODEL)
    client = chromadb.PersistentClient(path=DB_PATH)

    collections = client.list_collections()
    print(f"Found {len(collections)} collections")

    for coll in collections:
        reembed_collection(coll.name, model)

    print("✅ Re-embedding complete!")


if __name__ == "__main__":
    main()
```

## Refinement Notes

> Track findings from your benchmarks.

- [ ] Created test dataset from real content
- [ ] Ran benchmark on candidate models
- [ ] Selected optimal model for use case
- [ ] Re-embedded collections
- [ ] Verified retrieval quality improved
