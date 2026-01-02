---
name: collection-migration
description: Migrate and sync vector database collections across environments
---


# Collection Migration Skill

> Safely move, rename, merge, and manage RAG collections.

## Overview

As projects evolve, you may need to:
- Rename collections (project renamed)
- Merge collections (consolidating knowledge)
- Split collections (grew too large)
- Archive collections (project ended)
- Clone collections (forking a project)

This skill provides safe procedures for each operation.

## Prerequisites

```bash
pip install chromadb
```

## Safety Principles

1. **Always backup first** - Export before any destructive operation
2. **Verify after migration** - Run validation checks
3. **Preserve metadata** - Don't lose document provenance
4. **Atomic operations** - Complete fully or rollback


## Operation 2: Import Collection

**Use case**: Restore from backup or import shared collection

```python
#!/usr/bin/env python3
"""Import a collection from JSON export."""

import json
import chromadb
from chromadb.config import Settings

def import_collection(
    input_path: str,
    new_name: str = None,
    db_path: str = "./rag/database/chroma",
    skip_embeddings: bool = False
) -> str:
    """
    Import collection from JSON file.

    Args:
        input_path: Path to exported JSON file
        new_name: New collection name (default: use original name)
        db_path: Path to ChromaDB database
        skip_embeddings: If True, regenerate embeddings instead of using exported ones

    Returns:
        Name of imported collection
    """
    with open(input_path) as f:
        data = json.load(f)

    collection_name = new_name or data["collection_name"]

    client = chromadb.PersistentClient(
        path=db_path,
        settings=Settings(anonymized_telemetry=False)
    )

    # Check if collection exists
    existing = [c.name for c in client.list_collections()]
    if collection_name in existing:
        raise ValueError(f"Collection '{collection_name}' already exists. Use different name or delete first.")

    collection = client.create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"}
    )

    # Prepare data for batch insert
    ids = []
    documents = []
    metadatas = []
    embeddings = [] if not skip_embeddings else None

    for doc in data["documents"]:
        ids.append(doc["id"])
        documents.append(doc["content"])

        # Update metadata to track import
        meta = doc["metadata"] or {}
        meta["imported_from"] = data["collection_name"]
        meta["imported_at"] = data["exported_at"]
        metadatas.append(meta)

        if not skip_embeddings and doc.get("embedding"):
            embeddings.append(doc["embedding"])

    # Batch insert
    batch_size = 100
    for i in range(0, len(ids), batch_size):
        batch_end = min(i + batch_size, len(ids))

        add_kwargs = {
            "ids": ids[i:batch_end],
            "documents": documents[i:batch_end],
            "metadatas": metadatas[i:batch_end]
        }

        if embeddings:
            add_kwargs["embeddings"] = embeddings[i:batch_end]

        collection.add(**add_kwargs)

    print(f"✅ Imported {len(ids)} documents into '{collection_name}'")
    return collection_name


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python import_collection.py <input_path> [new_name]")
        sys.exit(1)

    input_path = sys.argv[1]
    new_name = sys.argv[2] if len(sys.argv) > 2 else None
    import_collection(input_path, new_name)
```


## Operation 4: Merge Collections

**Use case**: Consolidating multiple projects, combining research

```python
def merge_collections(
    source_collections: list,
    target_collection: str,
    db_path: str = "./rag/database/chroma",
    deduplicate: bool = True
):
    """
    Merge multiple collections into one.

    Args:
        source_collections: List of collection names to merge
        target_collection: Name for merged collection
        deduplicate: If True, skip duplicate content
    """
    client = chromadb.PersistentClient(path=db_path)

    # Create or get target collection
    target = client.get_or_create_collection(
        name=target_collection,
        metadata={"hnsw:space": "cosine"}
    )

    seen_hashes = set()
    total_added = 0
    total_skipped = 0

    for source_name in source_collections:
        print(f"Merging '{source_name}'...")

        source = client.get_collection(source_name)
        results = source.get(include=["documents", "metadatas", "embeddings"])

        for i in range(len(results["ids"])):
            content = results["documents"][i] if results["documents"] else ""

            # Deduplication
            if deduplicate:
                content_hash = hash(content)
                if content_hash in seen_hashes:
                    total_skipped += 1
                    continue
                seen_hashes.add(content_hash)

            # Create new ID to avoid collisions
            new_id = f"{source_name}_{results['ids'][i]}"

            # Track source in metadata
            meta = results["metadatas"][i] if results["metadatas"] else {}
            meta["merged_from"] = source_name

            target.add(
                ids=[new_id],
                documents=[content],
                metadatas=[meta],
                embeddings=[results["embeddings"][i]] if results["embeddings"] else None
            )
            total_added += 1

    print(f"✅ Merged {total_added} documents into '{target_collection}'")
    if deduplicate:
        print(f"   Skipped {total_skipped} duplicates")
```


## Operation 6: Archive Collection

**Use case**: Project ended, keep data but mark as inactive

```python
def archive_collection(
    collection_name: str,
    db_path: str = "./rag/database/chroma"
):
    """
    Archive a collection (export + delete with marker file).
    """
    # Export
    export_path = export_collection(collection_name, db_path=db_path)

    # Move to archives
    archive_dir = Path("archives")
    archive_dir.mkdir(exist_ok=True)

    archive_path = archive_dir / Path(export_path).name
    Path(export_path).rename(archive_path)

    # Delete from database
    client = chromadb.PersistentClient(path=db_path)
    client.delete_collection(collection_name)

    # Create marker file
    marker_path = archive_dir / f"{collection_name}.archived"
    with open(marker_path, "w") as f:
        f.write(f"Archived: {datetime.now().isoformat()}
")
        f.write(f"Export: {archive_path}
")

    print(f"✅ Archived '{collection_name}' to {archive_path}")


def restore_archive(collection_name: str):
    """Restore an archived collection."""
    archive_dir = Path("archives")

    # Find the export file
    exports = list(archive_dir.glob(f"{collection_name}_*.json"))
    if not exports:
        raise FileNotFoundError(f"No archive found for '{collection_name}'")

    # Use most recent
    export_path = sorted(exports)[-1]

    # Import
    import_collection(str(export_path), new_name=collection_name)

    # Remove marker
    marker = archive_dir / f"{collection_name}.archived"
    if marker.exists():
        marker.unlink()

    print(f"✅ Restored '{collection_name}' from archive")
```
