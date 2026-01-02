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

---

## Operation 1: Export Collection

**Use case**: Backup before migration or share with others

```python
#!/usr/bin/env python3
"""Export a ChromaDB collection to JSON."""

import json
from pathlib import Path
from datetime import datetime
import chromadb
from chromadb.config import Settings

def export_collection(
    collection_name: str,
    output_path: str = None,
    db_path: str = "./rag/database/chroma"
) -> str:
    """
    Export collection to JSON file.

    Args:
        collection_name: Name of collection to export
        output_path: Output file path (default: exports/{name}_{timestamp}.json)
        db_path: Path to ChromaDB database

    Returns:
        Path to exported file
    """
    client = chromadb.PersistentClient(
        path=db_path,
        settings=Settings(anonymized_telemetry=False)
    )

    collection = client.get_collection(collection_name)

    # Get all documents
    results = collection.get(
        include=["documents", "metadatas", "embeddings"]
    )

    export_data = {
        "collection_name": collection_name,
        "exported_at": datetime.now().isoformat(),
        "count": len(results["ids"]),
        "documents": []
    }

    for i in range(len(results["ids"])):
        doc = {
            "id": results["ids"][i],
            "content": results["documents"][i] if results["documents"] else None,
            "metadata": results["metadatas"][i] if results["metadatas"] else {},
            "embedding": results["embeddings"][i] if results["embeddings"] else None
        }
        export_data["documents"].append(doc)

    # Determine output path
    if output_path is None:
        Path("exports").mkdir(exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = f"exports/{collection_name}_{timestamp}.json"

    with open(output_path, "w") as f:
        json.dump(export_data, f, indent=2)

    print(f"✅ Exported {len(results['ids'])} documents to {output_path}")
    return output_path


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python export_collection.py <collection_name> [output_path]")
        sys.exit(1)

    collection = sys.argv[1]
    output = sys.argv[2] if len(sys.argv) > 2 else None
    export_collection(collection, output)
```

---

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

---

## Operation 3: Rename Collection

**Use case**: Project renamed, fix typo in name

```python
def rename_collection(
    old_name: str,
    new_name: str,
    db_path: str = "./rag/database/chroma"
):
    """
    Rename a collection by export/import/delete.

    ChromaDB doesn't support direct rename, so we:
    1. Export the old collection
    2. Import with new name
    3. Verify the import
    4. Delete the old collection
    """
    print(f"Renaming '{old_name}' to '{new_name}'...")

    # Step 1: Export
    export_path = export_collection(old_name, db_path=db_path)

    # Step 2: Import with new name
    import_collection(export_path, new_name=new_name, db_path=db_path)

    # Step 3: Verify
    client = chromadb.PersistentClient(path=db_path)
    old_coll = client.get_collection(old_name)
    new_coll = client.get_collection(new_name)

    if old_coll.count() != new_coll.count():
        raise RuntimeError("Document count mismatch! Aborting delete.")

    # Step 4: Delete old
    client.delete_collection(old_name)

    print(f"✅ Renamed '{old_name}' to '{new_name}'")

    # Cleanup export file
    Path(export_path).unlink()
```

---

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

---

## Operation 5: Split Collection

**Use case**: Collection too large, separating by type

```python
def split_collection(
    source_collection: str,
    split_key: str,
    db_path: str = "./rag/database/chroma"
) -> dict:
    """
    Split collection based on metadata field.

    Args:
        source_collection: Collection to split
        split_key: Metadata field to split on (e.g., "type", "project")

    Returns:
        Dict mapping split values to new collection names
    """
    client = chromadb.PersistentClient(path=db_path)
    source = client.get_collection(source_collection)

    results = source.get(include=["documents", "metadatas", "embeddings"])

    # Group by split key
    groups = {}
    for i in range(len(results["ids"])):
        meta = results["metadatas"][i] if results["metadatas"] else {}
        key_value = meta.get(split_key, "unknown")

        if key_value not in groups:
            groups[key_value] = []

        groups[key_value].append({
            "id": results["ids"][i],
            "document": results["documents"][i] if results["documents"] else None,
            "metadata": meta,
            "embedding": results["embeddings"][i] if results["embeddings"] else None
        })

    # Create new collections
    new_collections = {}
    for key_value, docs in groups.items():
        new_name = f"{source_collection}_{key_value}"

        collection = client.get_or_create_collection(
            name=new_name,
            metadata={"hnsw:space": "cosine"}
        )

        collection.add(
            ids=[d["id"] for d in docs],
            documents=[d["document"] for d in docs],
            metadatas=[d["metadata"] for d in docs],
            embeddings=[d["embedding"] for d in docs] if docs[0]["embedding"] else None
        )

        new_collections[key_value] = new_name
        print(f"  Created '{new_name}' with {len(docs)} documents")

    print(f"✅ Split '{source_collection}' into {len(new_collections)} collections")
    return new_collections
```

---

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
        f.write(f"Archived: {datetime.now().isoformat()}\n")
        f.write(f"Export: {archive_path}\n")

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

---

## CLI Tool

```python
#!/usr/bin/env python3
"""Collection migration CLI tool."""

import argparse
from collection_ops import (
    export_collection,
    import_collection,
    rename_collection,
    merge_collections,
    split_collection,
    archive_collection,
    restore_archive
)

def main():
    parser = argparse.ArgumentParser(description="RAG Collection Migration Tool")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Export
    export_parser = subparsers.add_parser("export", help="Export collection to JSON")
    export_parser.add_argument("collection", help="Collection name")
    export_parser.add_argument("-o", "--output", help="Output file path")

    # Import
    import_parser = subparsers.add_parser("import", help="Import collection from JSON")
    import_parser.add_argument("file", help="JSON file to import")
    import_parser.add_argument("-n", "--name", help="New collection name")

    # Rename
    rename_parser = subparsers.add_parser("rename", help="Rename collection")
    rename_parser.add_argument("old_name", help="Current collection name")
    rename_parser.add_argument("new_name", help="New collection name")

    # Merge
    merge_parser = subparsers.add_parser("merge", help="Merge collections")
    merge_parser.add_argument("sources", nargs="+", help="Source collections")
    merge_parser.add_argument("-t", "--target", required=True, help="Target collection")
    merge_parser.add_argument("--no-dedup", action="store_true", help="Skip deduplication")

    # Split
    split_parser = subparsers.add_parser("split", help="Split collection by metadata")
    split_parser.add_argument("collection", help="Collection to split")
    split_parser.add_argument("-k", "--key", required=True, help="Metadata key to split on")

    # Archive
    archive_parser = subparsers.add_parser("archive", help="Archive collection")
    archive_parser.add_argument("collection", help="Collection to archive")

    # Restore
    restore_parser = subparsers.add_parser("restore", help="Restore archived collection")
    restore_parser.add_argument("collection", help="Collection to restore")

    args = parser.parse_args()

    if args.command == "export":
        export_collection(args.collection, args.output)
    elif args.command == "import":
        import_collection(args.file, args.name)
    elif args.command == "rename":
        rename_collection(args.old_name, args.new_name)
    elif args.command == "merge":
        merge_collections(args.sources, args.target, deduplicate=not args.no_dedup)
    elif args.command == "split":
        split_collection(args.collection, args.key)
    elif args.command == "archive":
        archive_collection(args.collection)
    elif args.command == "restore":
        restore_archive(args.collection)


if __name__ == "__main__":
    main()
```

## Usage Examples

```bash
# Export for backup
python migrate.py export my_project_docs -o backup.json

# Import with new name
python migrate.py import backup.json -n my_project_docs_v2

# Rename collection
python migrate.py rename old_name new_name

# Merge multiple collections
python migrate.py merge proj1_docs proj2_docs proj3_docs -t combined_docs

# Split by type
python migrate.py split mixed_content -k content_type

# Archive old project
python migrate.py archive old_project_docs

# Restore from archive
python migrate.py restore old_project_docs
```

## Refinement Notes

> Track improvements as you use this skill.

- [ ] Export/import tested
- [ ] Rename preserves embeddings
- [ ] Merge deduplication working
- [ ] Split handles missing keys
- [ ] Archive/restore cycle verified
