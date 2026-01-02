---
name: rag-builder
description: Build Retrieval-Augmented Generation systems with vector databases
---


# RAG Builder Skill

> Build the RAG (Retrieval-Augmented Generation) server using ChromaDB.

## Overview

The RAG server provides vector search capabilities for the workspace:
- Document ingestion with chunking
- Semantic search across collections
- Multi-project isolation via collections

## Prerequisites

```bash
pip install chromadb sentence-transformers mcp
```

## Build Steps

### Step 1: Create the RAG Server

**File: `mcp/servers/rag-server/server.py`**

```python
#!/usr/bin/env python3
"""
RAG MCP Server - Vector search for multi-project RAG.
"""

import asyncio
import json
import os
from pathlib import Path
from datetime import datetime
from typing import Optional

import chromadb
from chromadb.config import Settings
from mcp.server import Server
from mcp.server.stdio import stdio_server
from sentence_transformers import SentenceTransformer

# Configuration
DB_PATH = os.getenv("RAG_DB_PATH", "./rag/database/chroma")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
DEFAULT_COLLECTION = os.getenv("DEFAULT_COLLECTION", "default")
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "512"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "50"))


class RAGServer:
    def __init__(self):
        self.server = Server("rag-server")
        
        # Initialize ChromaDB
        Path(DB_PATH).mkdir(parents=True, exist_ok=True)
        self.client = chromadb.PersistentClient(
            path=DB_PATH,
            settings=Settings(anonymized_telemetry=False)
        )
        
        # Initialize embedding model
        self.embedder = SentenceTransformer(EMBEDDING_MODEL)
        
        self._setup_tools()
    
    def _get_collection(self, name: str):
        """Get or create a collection."""
        return self.client.get_or_create_collection(
            name=name,
            metadata={"hnsw:space": "cosine"}
        )
    
    def _chunk_text(self, text: str) -> list[str]:
        """Split text into overlapping chunks."""
        words = text.split()
        chunks = []
        for i in range(0, len(words), CHUNK_SIZE - CHUNK_OVERLAP):
            chunk = " ".join(words[i:i + CHUNK_SIZE])
            if chunk:
                chunks.append(chunk)
        return chunks
    
    def _setup_tools(self):
        
        @self.server.tool()
        async def ingest(
            content: str,
            collection: str = DEFAULT_COLLECTION,
            metadata: Optional[dict] = None,
            doc_id: Optional[str] = None
        ) -> str:
            """
            Ingest a document into the vector database.
            
            Args:
                content: Document text to ingest
                collection: Collection name (use project name for isolation)
                metadata: Optional metadata (source, type, date, etc.)
                doc_id: Optional custom document ID
            """
            coll = self._get_collection(collection)
            chunks = self._chunk_text(content)
            
            base_id = doc_id or f"doc_{datetime.now().timestamp()}"
            ids = [f"{base_id}_chunk_{i}" for i in range(len(chunks))]
            
            # Generate embeddings
            embeddings = self.embedder.encode(chunks).tolist()
            
            # Prepare metadata
            base_meta = metadata or {}
            base_meta["ingested_at"] = datetime.now().isoformat()
            base_meta["source_doc"] = base_id
            metadatas = [{**base_meta, "chunk_index": i} for i in range(len(chunks))]
            
            coll.add(
                ids=ids,
                embeddings=embeddings,
                documents=chunks,
                metadatas=metadatas
            )
            
            return json.dumps({
                "status": "success",
                "collection": collection,
                "chunks": len(chunks),
                "doc_id": base_id
            })
        
        @self.server.tool()
        async def search(
            query: str,
            collection: str = DEFAULT_COLLECTION,
            n_results: int = 5,
            where: Optional[dict] = None
        ) -> str:
            """
            Search for relevant documents.
            
            Args:
                query: Search query
                collection: Collection to search
                n_results: Number of results (default 5)
                where: Optional metadata filter
            """
            coll = self._get_collection(collection)
            
            query_embedding = self.embedder.encode([query]).tolist()
            
            results = coll.query(
                query_embeddings=query_embedding,
                n_results=n_results,
                where=where
            )
            
            formatted = []
            for i in range(len(results["ids"][0])):
                formatted.append({
                    "id": results["ids"][0][i],
                    "content": results["documents"][0][i],
                    "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                    "distance": results["distances"][0][i] if results["distances"] else None
                })
            
            return json.dumps({
                "query": query,
                "collection": collection,
                "results": formatted
            })
        
        @self.server.tool()
        async def list_collections() -> str:
            """List all collections."""
            collections = self.client.list_collections()
            return json.dumps({
                "collections": [
                    {"name": c.name, "count": c.count()}
                    for c in collections
                ]
            })
        
        @self.server.tool()
        async def delete_collection(collection: str) -> str:
            """Delete a collection."""
            self.client.delete_collection(collection)
            return json.dumps({"status": "deleted", "collection": collection})
        
        @self.server.tool()
        async def collection_stats(collection: str) -> str:
            """Get collection statistics."""
            coll = self._get_collection(collection)
            return json.dumps({
                "collection": collection,
                "count": coll.count()
            })
    
    async def run(self):
        async with stdio_server() as (read_stream, write_stream):
            await self.server.run(read_stream, write_stream)


def main():
    server = RAGServer()
    asyncio.run(server.run())


if __name__ == "__main__":
    main()
```

### Step 2: Create Requirements

**File: `mcp/servers/rag-server/requirements.txt`**

```
mcp>=1.0.0
chromadb>=0.4.0
sentence-transformers>=2.2.0
```

### Step 3: Create Test Script

**File: `mcp/servers/rag-server/test_rag.py`**

```python
#!/usr/bin/env python3
"""Quick test for RAG server components."""

import os
import sys

# Set up path
sys.path.insert(0, os.path.dirname(__file__))

def test_chromadb():
    """Test ChromaDB is working."""
    import chromadb
    client = chromadb.Client()
    collection = client.create_collection("test")
    collection.add(
        ids=["1"],
        documents=["test document"],
        metadatas=[{"source": "test"}]
    )
    results = collection.query(query_texts=["test"], n_results=1)
    assert len(results["ids"][0]) == 1
    print("✅ ChromaDB working")

def test_embeddings():
    """Test embedding model."""
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer('all-MiniLM-L6-v2')
    embedding = model.encode(["test sentence"])
    assert embedding.shape == (1, 384)
    print("✅ Embeddings working")

def test_server_init():
    """Test server initialization."""
    from server import RAGServer
    server = RAGServer()
    assert server.client is not None
    assert server.embedder is not None
    print("✅ Server initialization working")

if __name__ == "__main__":
    test_chromadb()
    test_embeddings()
    test_server_init()
    print("
✅ All RAG tests passed!")
```

## Verification

```bash
# Navigate to server directory
cd mcp/servers/rag-server

# Install dependencies
pip install -r requirements.txt

# Run tests
python test_rag.py

# Expected output:
# ✅ ChromaDB working
# ✅ Embeddings working
# ✅ Server initialization working
# ✅ All RAG tests passed!
```

## Usage Examples

Once running as MCP server:

```python
# Ingest a document
await ingest(
    content="Your document text here...",
    collection="project_alpha_docs",
    metadata={"source": "user_upload", "type": "notes"}
)

# Search
results = await search(
    query="quantum computing applications",
    collection="project_alpha_docs",
    n_results=5
)

# List collections
collections = await list_collections()
```

## Multi-Project Isolation

```python
# Each project gets its own collections
"project_alpha_docs"     # Project Alpha documentation
"project_alpha_code"     # Project Alpha code snippets
"project_beta_docs"      # Project Beta documentation
"shared_knowledge"       # Cross-project shared info
```

## Configuration

Environment variables:
```bash
RAG_DB_PATH=./rag/database/chroma
EMBEDDING_MODEL=all-MiniLM-L6-v2
DEFAULT_COLLECTION=default
CHUNK_SIZE=512
CHUNK_OVERLAP=50
```

## After Building

1. ✅ Run tests to verify
2. Update `CLAUDE.md` status
3. Proceed to `skills/router-builder/SKILL.md`

## Refinement Notes

> Add notes here as we build and discover what works/doesn't work.

- [ ] Initial implementation
- [ ] Tested with real documents
- [ ] Integrated with MCP config
- [ ] Performance tuned
