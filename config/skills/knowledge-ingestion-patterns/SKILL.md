# Knowledge Ingestion Patterns Skill

> Systematic approaches for ingesting different content types into RAG with optimal chunking, metadata, and retrieval quality.

## Overview

Different content types require different ingestion strategies. This skill documents best practices for:
- Websites and web content
- PDF documents
- Code repositories
- Conversation exports
- Research notes
- API documentation

## Core Principles

1. **Chunk for retrieval** - Optimize chunk size for the questions you'll ask
2. **Metadata matters** - Rich metadata enables filtered search
3. **Preserve context** - Don't lose meaning when splitting
4. **Deduplicate** - Avoid ingesting the same content twice

## Content Type Patterns

---

### Pattern 1: Markdown Documentation

**When to use**: README files, guides, documentation sites

**Chunking Strategy**: Split by headers, preserve hierarchy

```python
import re
from typing import List, Dict

def chunk_markdown(content: str, source: str) -> List[Dict]:
    """Chunk markdown by headers while preserving hierarchy."""
    chunks = []

    # Split by headers (## or ###)
    sections = re.split(r'\n(#{2,3} .+)\n', content)

    current_h2 = ""

    for i, section in enumerate(sections):
        if section.startswith('## '):
            current_h2 = section[3:].strip()
        elif section.startswith('### '):
            current_h3 = section[4:].strip()
            # Next section is the content
            if i + 1 < len(sections):
                chunks.append({
                    "content": sections[i + 1].strip(),
                    "metadata": {
                        "type": "markdown",
                        "source": source,
                        "h2": current_h2,
                        "h3": current_h3,
                        "hierarchy": f"{current_h2} > {current_h3}"
                    }
                })
        elif section.strip() and not section.startswith('#'):
            # Content under h2
            if current_h2:
                chunks.append({
                    "content": section.strip(),
                    "metadata": {
                        "type": "markdown",
                        "source": source,
                        "h2": current_h2,
                        "hierarchy": current_h2
                    }
                })

    return chunks
```

**Metadata Schema**:
```yaml
type: markdown
source: filename or URL
h2: Parent section
h3: Subsection (if any)
hierarchy: "Parent > Child" path
```

---

### Pattern 2: PDF Documents

**When to use**: Research papers, reports, ebooks, scanned documents

**Chunking Strategy**: Page-aware with overlap, handle tables/figures specially

```python
import fitz  # PyMuPDF
from typing import List, Dict

def chunk_pdf(pdf_path: str, chunk_size: int = 500) -> List[Dict]:
    """Extract and chunk PDF content with page awareness."""
    doc = fitz.open(pdf_path)
    chunks = []

    for page_num, page in enumerate(doc, 1):
        text = page.get_text()

        # Skip empty pages
        if not text.strip():
            continue

        # Split into paragraphs
        paragraphs = text.split('\n\n')

        current_chunk = ""
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            if len(current_chunk) + len(para) < chunk_size:
                current_chunk += " " + para
            else:
                if current_chunk:
                    chunks.append({
                        "content": current_chunk.strip(),
                        "metadata": {
                            "type": "pdf",
                            "source": pdf_path,
                            "page": page_num,
                            "total_pages": len(doc)
                        }
                    })
                current_chunk = para

        # Don't forget last chunk of page
        if current_chunk:
            chunks.append({
                "content": current_chunk.strip(),
                "metadata": {
                    "type": "pdf",
                    "source": pdf_path,
                    "page": page_num,
                    "total_pages": len(doc)
                }
            })

    return chunks

def extract_pdf_tables(pdf_path: str) -> List[Dict]:
    """Extract tables from PDF as separate chunks."""
    import pdfplumber

    tables = []
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            for table_num, table in enumerate(page.extract_tables(), 1):
                # Convert table to markdown format
                if table:
                    headers = table[0]
                    rows = table[1:]

                    md_table = "| " + " | ".join(str(h) for h in headers) + " |\n"
                    md_table += "| " + " | ".join("---" for _ in headers) + " |\n"
                    for row in rows:
                        md_table += "| " + " | ".join(str(c) for c in row) + " |\n"

                    tables.append({
                        "content": md_table,
                        "metadata": {
                            "type": "pdf_table",
                            "source": pdf_path,
                            "page": page_num,
                            "table_number": table_num
                        }
                    })

    return tables
```

**Metadata Schema**:
```yaml
type: pdf | pdf_table
source: file path
page: page number
total_pages: document length
table_number: (for tables) which table on page
```

---

### Pattern 3: Code Repositories

**When to use**: Ingesting code patterns, examples, or entire codebases

**Chunking Strategy**: By function/class with context, include imports

```python
import ast
from pathlib import Path
from typing import List, Dict

def chunk_python_file(file_path: str) -> List[Dict]:
    """Extract functions and classes from Python file."""
    chunks = []

    with open(file_path) as f:
        content = f.read()

    try:
        tree = ast.parse(content)
    except SyntaxError:
        # Fall back to raw chunking if parse fails
        return [{"content": content, "metadata": {"type": "code", "source": file_path}}]

    lines = content.split('\n')

    # Extract imports for context
    imports = []
    for node in ast.walk(tree):
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            import_line = ast.get_source_segment(content, node)
            if import_line:
                imports.append(import_line)

    import_context = '\n'.join(imports)

    for node in ast.iter_child_nodes(tree):
        if isinstance(node, ast.FunctionDef):
            func_source = ast.get_source_segment(content, node)
            chunks.append({
                "content": f"{import_context}\n\n{func_source}",
                "metadata": {
                    "type": "code",
                    "language": "python",
                    "source": file_path,
                    "entity_type": "function",
                    "entity_name": node.name,
                    "line_start": node.lineno,
                    "docstring": ast.get_docstring(node) or ""
                }
            })

        elif isinstance(node, ast.ClassDef):
            class_source = ast.get_source_segment(content, node)
            chunks.append({
                "content": f"{import_context}\n\n{class_source}",
                "metadata": {
                    "type": "code",
                    "language": "python",
                    "source": file_path,
                    "entity_type": "class",
                    "entity_name": node.name,
                    "line_start": node.lineno,
                    "docstring": ast.get_docstring(node) or "",
                    "methods": [m.name for m in node.body if isinstance(m, ast.FunctionDef)]
                }
            })

    return chunks


def chunk_repository(repo_path: str, patterns: List[str] = None) -> List[Dict]:
    """Chunk an entire repository."""
    if patterns is None:
        patterns = ["**/*.py", "**/*.js", "**/*.ts"]

    chunks = []
    repo = Path(repo_path)

    for pattern in patterns:
        for file_path in repo.glob(pattern):
            # Skip common non-source directories
            if any(p in file_path.parts for p in ['node_modules', '.git', '__pycache__', 'venv']):
                continue

            if file_path.suffix == '.py':
                chunks.extend(chunk_python_file(str(file_path)))
            else:
                # Generic chunking for other languages
                with open(file_path) as f:
                    content = f.read()
                chunks.append({
                    "content": content,
                    "metadata": {
                        "type": "code",
                        "language": file_path.suffix[1:],
                        "source": str(file_path)
                    }
                })

    return chunks
```

**Metadata Schema**:
```yaml
type: code
language: python | javascript | typescript | etc
source: file path
entity_type: function | class | module
entity_name: name of function/class
line_start: starting line number
docstring: extracted docstring
methods: (for classes) list of method names
```

---

### Pattern 4: Websites / Web Content

**When to use**: Documentation sites, articles, blog posts

**Chunking Strategy**: Clean HTML, respect structure, handle navigation

```python
import httpx
from bs4 import BeautifulSoup
from typing import List, Dict
from urllib.parse import urljoin, urlparse

def chunk_webpage(url: str) -> List[Dict]:
    """Fetch and chunk a webpage."""
    response = httpx.get(url, follow_redirects=True)
    soup = BeautifulSoup(response.text, 'html.parser')

    # Remove noise
    for tag in soup.find_all(['nav', 'footer', 'aside', 'script', 'style']):
        tag.decompose()

    chunks = []

    # Find main content
    main = soup.find('main') or soup.find('article') or soup.find('body')

    # Chunk by sections
    for section in main.find_all(['section', 'div'], class_=lambda x: x and 'content' in str(x).lower()):
        text = section.get_text(separator=' ', strip=True)
        if len(text) > 100:  # Skip tiny sections
            chunks.append({
                "content": text,
                "metadata": {
                    "type": "webpage",
                    "source": url,
                    "domain": urlparse(url).netloc,
                    "title": soup.title.string if soup.title else ""
                }
            })

    # If no sections found, chunk the whole page
    if not chunks:
        text = main.get_text(separator=' ', strip=True)
        # Split into ~500 word chunks
        words = text.split()
        for i in range(0, len(words), 450):
            chunk_text = ' '.join(words[i:i+500])
            chunks.append({
                "content": chunk_text,
                "metadata": {
                    "type": "webpage",
                    "source": url,
                    "domain": urlparse(url).netloc,
                    "title": soup.title.string if soup.title else ""
                }
            })

    return chunks


async def crawl_site(start_url: str, max_pages: int = 50) -> List[Dict]:
    """Crawl a site and chunk all pages."""
    from urllib.parse import urlparse

    base_domain = urlparse(start_url).netloc
    visited = set()
    to_visit = [start_url]
    all_chunks = []

    async with httpx.AsyncClient() as client:
        while to_visit and len(visited) < max_pages:
            url = to_visit.pop(0)
            if url in visited:
                continue

            try:
                response = await client.get(url, follow_redirects=True)
                visited.add(url)

                # Chunk this page
                all_chunks.extend(chunk_webpage(url))

                # Find links to follow
                soup = BeautifulSoup(response.text, 'html.parser')
                for link in soup.find_all('a', href=True):
                    href = urljoin(url, link['href'])
                    if urlparse(href).netloc == base_domain and href not in visited:
                        to_visit.append(href)

            except Exception as e:
                print(f"Failed to fetch {url}: {e}")

    return all_chunks
```

**Metadata Schema**:
```yaml
type: webpage
source: full URL
domain: domain name
title: page title
crawl_depth: (for crawls) how many links from start
```

---

### Pattern 5: Conversation Exports

**When to use**: Chat logs, meeting transcripts, support conversations

**Chunking Strategy**: By speaker turn or topic, preserve temporal order

```python
import json
from datetime import datetime
from typing import List, Dict

def chunk_conversation(messages: List[Dict], context_window: int = 3) -> List[Dict]:
    """
    Chunk conversation with sliding context window.

    Each chunk includes surrounding messages for context.
    """
    chunks = []

    for i, msg in enumerate(messages):
        # Get context window
        start = max(0, i - context_window)
        end = min(len(messages), i + context_window + 1)
        context = messages[start:end]

        # Build chunk with context
        context_text = "\n".join([
            f"[{m.get('role', 'unknown')}]: {m.get('content', '')}"
            for m in context
        ])

        chunks.append({
            "content": context_text,
            "metadata": {
                "type": "conversation",
                "source": msg.get("source", "unknown"),
                "message_index": i,
                "speaker": msg.get("role", "unknown"),
                "timestamp": msg.get("timestamp", ""),
                "primary_message": msg.get("content", "")
            }
        })

    return chunks


def extract_decisions_from_conversation(messages: List[Dict]) -> List[Dict]:
    """Extract decision points and action items from conversation."""
    decision_markers = [
        "decided", "agreed", "will do", "action item",
        "let's go with", "we should", "the plan is"
    ]

    decisions = []

    for i, msg in enumerate(messages):
        content = msg.get("content", "").lower()

        if any(marker in content for marker in decision_markers):
            # Include context
            context_start = max(0, i - 2)
            context = messages[context_start:i+1]

            decisions.append({
                "content": "\n".join([
                    f"[{m.get('role')}]: {m.get('content')}"
                    for m in context
                ]),
                "metadata": {
                    "type": "decision",
                    "source": msg.get("source", "conversation"),
                    "timestamp": msg.get("timestamp", ""),
                    "extracted_from": "conversation"
                }
            })

    return decisions
```

**Metadata Schema**:
```yaml
type: conversation | decision
source: conversation ID or filename
message_index: position in conversation
speaker: who said it
timestamp: when it was said
primary_message: the main message content
```

---

### Pattern 6: Research Notes

**When to use**: Personal notes, research findings, learnings

**Chunking Strategy**: By paragraph with topic extraction

```python
from typing import List, Dict
from datetime import datetime

def chunk_research_notes(content: str, topic: str = None) -> List[Dict]:
    """Chunk research notes with topic awareness."""

    # Split by double newlines (paragraphs)
    paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]

    chunks = []
    current_topic = topic or "general"

    for para in paragraphs:
        # Check if this is a topic header
        if para.startswith('#') or (len(para) < 50 and para.endswith(':')):
            current_topic = para.strip('#: ')
            continue

        chunks.append({
            "content": para,
            "metadata": {
                "type": "research",
                "topic": current_topic,
                "ingested_at": datetime.now().isoformat(),
                "word_count": len(para.split())
            }
        })

    return chunks


def chunk_with_source_attribution(
    content: str,
    source_url: str = None,
    source_title: str = None,
    researcher: str = None
) -> List[Dict]:
    """Chunk research with full source attribution."""

    chunks = chunk_research_notes(content)

    for chunk in chunks:
        chunk["metadata"].update({
            "source_url": source_url,
            "source_title": source_title,
            "researcher": researcher
        })

    return chunks
```

**Metadata Schema**:
```yaml
type: research
topic: extracted or assigned topic
source_url: where the info came from
source_title: title of source
researcher: who did the research
ingested_at: timestamp
word_count: chunk size
```

---

## Ingestion Best Practices

### Deduplication

```python
import hashlib

def compute_chunk_hash(content: str) -> str:
    """Compute hash for deduplication."""
    return hashlib.md5(content.encode()).hexdigest()

async def ingest_with_dedup(chunks: List[Dict], collection: str):
    """Ingest chunks with deduplication."""
    for chunk in chunks:
        chunk_hash = compute_chunk_hash(chunk["content"])

        # Check if already exists
        existing = await rag.search(
            query=chunk["content"][:100],
            collection=collection,
            n_results=1,
            where={"content_hash": chunk_hash}
        )

        if not existing["results"]:
            chunk["metadata"]["content_hash"] = chunk_hash
            await rag.ingest(
                content=chunk["content"],
                collection=collection,
                metadata=chunk["metadata"]
            )
```

### Batch Ingestion

```python
async def batch_ingest(chunks: List[Dict], collection: str, batch_size: int = 50):
    """Ingest in batches for efficiency."""
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i + batch_size]

        ids = [f"chunk_{i+j}" for j in range(len(batch))]
        documents = [c["content"] for c in batch]
        metadatas = [c["metadata"] for c in batch]

        await rag.batch_ingest(
            ids=ids,
            documents=documents,
            metadatas=metadatas,
            collection=collection
        )

        print(f"Ingested {min(i + batch_size, len(chunks))}/{len(chunks)}")
```

### Quality Checks

```python
def validate_chunks(chunks: List[Dict]) -> List[Dict]:
    """Filter out low-quality chunks."""
    valid = []

    for chunk in chunks:
        content = chunk["content"]

        # Skip too short
        if len(content) < 50:
            continue

        # Skip mostly whitespace
        if len(content.split()) < 10:
            continue

        # Skip repetitive content
        words = content.lower().split()
        unique_ratio = len(set(words)) / len(words)
        if unique_ratio < 0.3:
            continue

        valid.append(chunk)

    return valid
```

## Collection Organization

```yaml
# Recommended collection structure per project
{project}_docs:       # Static documentation, README
{project}_code:       # Code patterns, examples
{project}_research:   # Research findings, notes
{project}_decisions:  # Architectural decisions, ADRs
{project}_chat:       # Conversation excerpts

# Cross-project collections
shared_knowledge:     # Universal knowledge
reference_docs:       # Language/framework docs
```

## Refinement Notes

> Track improvements as you use these patterns.

- [ ] Patterns validated with real content
- [ ] Chunking sizes optimized
- [ ] Metadata schemas finalized
- [ ] Deduplication working
- [ ] Batch ingestion tested
