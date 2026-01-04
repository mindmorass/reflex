---
description: Ingest local files (PDF, markdown, text) into Qdrant vector database
allowed-tools: Bash(python3:*), Bash(cat:*), Read
argument-hint: <path> [--collection <name>] [--chunk-size <words>]
---

# File Ingestion

Ingest local documents into Qdrant for semantic search.

## Instructions

1. **Parse arguments:**
   - `<path>` - File or directory path (required)
   - `--collection <name>` - Collection name (default: `${WORKSPACE_PROFILE:-default}_memories`)
   - `--chunk-size <words>` - Words per chunk (default: 400)

2. **Detect file type** from extension:
   - `.pdf` → PDF extraction
   - `.md` → Markdown
   - `.txt` → Plain text
   - Directory → Recursively process supported files

3. **Extract content** based on type:

### PDF Extraction

```bash
# Check if pymupdf is available
python3 -c "import fitz; print('OK')" 2>/dev/null || echo "Install: pip install pymupdf"
```

```python
import fitz
import json
import sys

def extract_pdf(path):
    doc = fitz.open(path)
    pages = []
    for i, page in enumerate(doc, 1):
        text = page.get_text().strip()
        if text:
            pages.append({"page": i, "text": text})
    return {
        "filename": path.split("/")[-1],
        "total_pages": len(doc),
        "pages": pages
    }

result = extract_pdf(sys.argv[1])
print(json.dumps(result))
```

### Markdown/Text Extraction

```bash
cat "<path>"
```

4. **Chunk content:**
   - Split by paragraphs (double newlines)
   - Combine paragraphs until chunk reaches target size
   - Keep ~50 word overlap between chunks

5. **Store each chunk** using the Qdrant MCP server:

For each chunk, call `qdrant-store` with:

```
Information: |
  <chunk content>

Metadata:
  source: "local_file"
  content_type: "pdf" | "markdown" | "text"
  file_path: "<absolute path>"
  filename: "<filename>"
  harvested_at: "<ISO 8601>"
  chunk_index: <n>
  total_chunks: <total>
  # For PDFs:
  page_start: <n>
  page_end: <n>
  total_pages: <n>
```

6. **Report results:**
   - Files processed
   - Chunks created
   - Any errors

## Chunking Logic

```python
def chunk_text(text, target_words=400, overlap_words=50):
    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
    chunks = []
    current = []
    current_words = 0

    for para in paragraphs:
        para_words = len(para.split())

        if current_words + para_words > target_words and current:
            chunks.append('\n\n'.join(current))
            # Keep last paragraph for overlap
            overlap = current[-1] if current else ""
            current = [overlap] if overlap else []
            current_words = len(overlap.split()) if overlap else 0

        current.append(para)
        current_words += para_words

    if current:
        chunks.append('\n\n'.join(current))

    return chunks
```

## Examples

```bash
# Ingest a PDF
/reflex:ingest ~/Documents/architecture-guide.pdf

# Ingest markdown notes
/reflex:ingest ~/notes/project-decisions.md

# Ingest with custom collection
/reflex:ingest ~/research/paper.pdf --collection research_papers

# Ingest a directory of docs
/reflex:ingest ~/Documentation/

# Ingest with larger chunks
/reflex:ingest ~/manual.pdf --chunk-size 600
```

## Supported File Types

| Extension | Type | Extraction Method |
|-----------|------|-------------------|
| `.pdf` | PDF | PyMuPDF (fitz) |
| `.md` | Markdown | Direct read |
| `.txt` | Plain text | Direct read |
| `.rst` | reStructuredText | Direct read |

## After Ingestion

Search your ingested content:

```
qdrant-find: "how to configure authentication"
```

Filter by source:

```
qdrant-find with filter:
  source: "local_file"
  filename: "architecture-guide.pdf"
```
