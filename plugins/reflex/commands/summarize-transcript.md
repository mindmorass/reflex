---
description: Summarize a meeting transcript into structured notes
allowed-tools: Read, Write, Bash(uvx:*), Bash(wc:*), Bash(mkdir:*), Bash(cp:*), mcp__plugin_reflex_qdrant__qdrant-store, mcp__plugin_reflex_google-workspace__get_doc_content, mcp__plugin_reflex_google-workspace__get_drive_file_content, mcp__plugin_reflex_markitdown__convert_to_markdown
argument-hint: <source> [--to <directory>] [--llm ollama|openai|anthropic] [--model NAME] [--title "Title"]
---

# Summarize Transcript

Summarize a meeting transcript into structured notes with decisions, action items, and key topics.

## Syntax

```
/reflex:summarize-transcript <source> [--to <directory>] [--llm <provider>] [--model <name>] [--title "Title"]
```

## Instructions

### Step 1: Parse Arguments

Parse the user's input to extract:

| Argument | Description | Default |
|----------|-------------|---------|
| `<source>` | Transcript source (required) | - |
| `--to` | Root output directory | `./meetings` |
| `--llm` | LLM provider: `ollama`, `openai`, `anthropic` | `ollama` |
| `--model` | Model name override | Provider default |
| `--title` | Meeting title | Derived from filename |

**Source types:**
- **File path** (`.vtt`, `.srt`, `.txt`, `.docx`) -- use directly
- **`paste`** -- prompt user to paste transcript
- **`gdoc:<ID>`** or Google Docs URL -- fetch via MCP

**Destination:**
- A directory path that serves as the root for the output structure
- Default: `./meetings`
- The tool creates `<destination>/<YYYY-MM-DD>/<HH-MM>/` under this root

### Step 2: Resolve Source

**File path:**
Verify the file exists. Read the file content for processing.

**Paste:**
1. Ask the user to paste their transcript
2. Hold the pasted text in memory for processing

**Google Doc (`gdoc:<ID>` or URL):**
1. Extract the document ID from `gdoc:<ID>` or from a Google Docs URL
2. Fetch content using `get_doc_content` MCP tool (use user's email: `curtis.downing@gmail.com`)
3. Hold the fetched content for processing

### Step 3: Create Output Directory

Determine the meeting date and time:
- Extract from transcript timestamps if available
- Use `--title` date hint if provided
- Fall back to current date/time

Create the output directory structure:

```bash
mkdir -p <destination>/<YYYY-MM-DD>/<HH-MM>
```

### Step 4: Save Original Transcript

Copy or write the original, unmodified source to `original.txt`:

- **File source:** Copy the file as-is: `cp <source> <output_dir>/original.txt`
- **Paste/Google Doc:** Write the raw text to `<output_dir>/original.txt`

This preserves VTT/SRT timestamps, formatting artifacts, and all original content.

### Step 5: Clean Transcript → readable.md

Apply format-specific preprocessing (see the meeting-summarizer skill for rules) and write the cleaned transcript to `<output_dir>/readable.md`:

- Strip VTT/SRT headers, timestamps, and sequence numbers
- Remove position/alignment tags
- Deduplicate rolling captions
- Merge consecutive same-speaker lines
- Normalize speaker labels

The result should be a clean, human-readable version of who said what.

### Step 6: Run the Summarization Script

Build and execute the uvx command using the cleaned transcript:

```bash
uvx --with python-docx python ${CLAUDE_PLUGIN_ROOT}/scripts/summarize.py <output_dir>/readable.md \
  --llm <provider> \
  --output stdout
```

**Add provider-specific dependencies to uvx:**
- `ollama`: no extra deps needed
- `openai`: add `--with openai` to uvx command
- `anthropic`: add `--with anthropic` to uvx command

**Pass through optional flags:**
- `--model <name>` if specified
- `--title "Title"` if specified
- `--date YYYY-MM-DD` if known

Capture the stdout output and write it to `<output_dir>/summary.md`.

If the script exits with a non-zero code, report the stderr error to the user and stop.

### Step 7: Store in Qdrant

Always store the summary in Qdrant for RAG retrieval.

Parse the summary to extract metadata, then call `qdrant-store`:

```
Tool: qdrant-store
Information: "<full summary.md content>"
Metadata:
  source: "meeting_transcript"
  content_type: "meeting_summary"
  harvested_at: "<current ISO 8601 timestamp>"
  meeting_title: "<title from summary>"
  meeting_date: "<YYYY-MM-DD>"
  meeting_time: "<HH-MM>"
  attendees: "<comma-separated from summary, or 'unknown'>"
  output_dir: "<full path to YYYY-MM-DD/HH-MM directory>"
  source_format: "<vtt|srt|txt|docx|gdoc|pasted>"
  action_item_count: <count from action items table>
  decision_count: <count from decisions section>
  topics: "<comma-separated key topics from summary>"
  category: "business"
  type: "meeting_summary"
  confidence: "high"
```

### Step 8: Report Results

Summarize what was done:
- Source processed (filename, word count)
- LLM provider and model used
- Output directory path with files created:
  - `original.txt` (raw transcript)
  - `readable.md` (cleaned transcript)
  - `summary.md` (structured summary)
- Number of key topics, decisions, action items, and open questions extracted
- Qdrant storage confirmation

## Examples

```bash
# Summarize a VTT file (outputs to ./meetings/<date>/<time>/)
/reflex:summarize-transcript recording.vtt

# Specify output directory
/reflex:summarize-transcript meeting.srt --to ~/Documents/meetings

# Use OpenAI with a custom title
/reflex:summarize-transcript meeting.srt --llm openai --title "Q4 Planning"

# Paste transcript
/reflex:summarize-transcript paste --to ./project-meetings

# Summarize a Google Doc
/reflex:summarize-transcript gdoc:1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms --to ~/meetings

# Use Anthropic with a specific model
/reflex:summarize-transcript notes.txt --llm anthropic --model claude-sonnet-4-20250514
```
