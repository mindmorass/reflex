---
description: Summarize a meeting transcript into structured notes
allowed-tools: Read, Write, Bash(uvx:*), Bash(wc:*), Bash(mktemp:*), Bash(cat:*), mcp__plugin_reflex_qdrant__qdrant-store, mcp__plugin_reflex_google-workspace__get_doc_content, mcp__plugin_reflex_google-workspace__create_doc, mcp__plugin_reflex_google-workspace__get_drive_file_content, mcp__plugin_reflex_markitdown__convert_to_markdown
argument-hint: <file|paste|gdoc:ID> [--to local|obsidian:<path>|gdoc] [--llm ollama|openai|anthropic] [--model NAME] [--title "Title"]
---

# Summarize Meeting

Summarize a meeting transcript into structured notes with decisions, action items, and key topics.

## Syntax

```
/reflex:summarize-meeting <source> [--to <destination>] [--llm <provider>] [--model <name>] [--title "Title"]
```

## Instructions

### Step 1: Parse Arguments

Parse the user's input to extract:

| Argument | Description | Default |
|----------|-------------|---------|
| `<source>` | Transcript source (required) | - |
| `--to` | Output destination | `local` |
| `--llm` | LLM provider: `ollama`, `openai`, `anthropic` | `ollama` |
| `--model` | Model name override | Provider default |
| `--title` | Meeting title | Derived from filename |

**Source types:**
- **File path** (`.vtt`, `.srt`, `.txt`, `.docx`) -- use directly
- **`paste`** -- prompt user to paste transcript
- **`gdoc:<ID>`** or Google Docs URL -- fetch via MCP

**Destination types:**
- **`local`** or a file path -- write markdown file
- **`obsidian:<vault-path>`** -- write to vault with YAML frontmatter
- **`gdoc`** -- create a Google Doc via MCP

### Step 2: Resolve Source

**File path:**
Pass the file path directly to the script. Verify the file exists first.

**Paste:**
1. Ask the user to paste their transcript
2. Write the pasted text to a temp file: `mktemp /tmp/transcript-XXXXXX.txt`
3. Use the temp file path for the script

**Google Doc (`gdoc:<ID>` or URL):**
1. Extract the document ID from `gdoc:<ID>` or from a Google Docs URL
2. Fetch content using `get_doc_content` MCP tool (use user's email: `curtis.downing@gmail.com`)
3. Write fetched content to a temp file
4. Use the temp file path for the script

### Step 3: Run the Summarization Script

Build and execute the uvx command:

```bash
uvx --with python-docx python ${CLAUDE_PLUGIN_ROOT}/scripts/summarize.py <file> \
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

**Full examples:**

```bash
# Ollama (default, zero extra deps)
uvx --with python-docx python ${CLAUDE_PLUGIN_ROOT}/scripts/summarize.py transcript.vtt --llm ollama --output stdout

# OpenAI
uvx --with python-docx,openai python ${CLAUDE_PLUGIN_ROOT}/scripts/summarize.py transcript.vtt --llm openai --output stdout

# Anthropic
uvx --with python-docx,anthropic python ${CLAUDE_PLUGIN_ROOT}/scripts/summarize.py transcript.vtt --llm anthropic --output stdout
```

Capture the stdout output -- this is the markdown summary.

If the script exits with a non-zero code, report the stderr error to the user and stop.

### Step 4: Route to Destination

**Local file** (`--to local` or `--to <path>`):
- If a specific path was given, write the summary there
- Otherwise write to `./meeting-summary-YYYY-MM-DD.md` (use today's date or extracted date)
- Report the file path to the user

**Obsidian vault** (`--to obsidian:<vault-path>`):
- Validate the vault path exists
- Extract meeting title and date from the summary
- Prepend YAML frontmatter before the summary content:

```yaml
---
title: "<meeting title>"
date: <YYYY-MM-DD>
tags: [meeting, summary]
attendees:
  - Name1
  - Name2
action_items: <count>
decisions: <count>
---
```

- Write to `<vault>/meetings/YYYY/MM/<title-slugified>.md`
- Create intermediate directories as needed
- Report the file path to the user

**Google Doc** (`--to gdoc`):
- Modify the summary for Google Docs compatibility:
  - Replace the action items markdown table with bullet list format:
    `- **<task>** (Owner: <person>, Deadline: <date>)`
- Create the Google Doc using `create_doc` MCP tool:
  - Title: the meeting title from the summary
  - Content: the modified summary markdown
  - User email: `curtis.downing@gmail.com`
- Report the Google Doc link to the user

### Step 5: Store in Qdrant

Always store the summary in Qdrant for RAG retrieval, regardless of destination.

Parse the summary to extract metadata, then call `qdrant-store`:

```
Tool: qdrant-store
Information: "<full summary text>"
Metadata:
  source: "meeting_transcript"
  content_type: "meeting_summary"
  harvested_at: "<current ISO 8601 timestamp>"
  meeting_title: "<title from summary>"
  meeting_date: "<YYYY-MM-DD>"
  attendees: "<comma-separated from summary, or 'unknown'>"
  source_file: "<original filename or gdoc:ID>"
  source_format: "<vtt|srt|txt|docx|gdoc|pasted>"
  action_item_count: <count from action items table>
  decision_count: <count from decisions section>
  topics: "<comma-separated key topics from summary>"
  category: "business"
  type: "meeting_summary"
  confidence: "high"
```

### Step 6: Report Results

Summarize what was done:
- Source processed (filename, word count)
- LLM provider and model used
- Destination where summary was written (with link/path)
- Number of key topics, decisions, action items, and open questions extracted
- Qdrant storage confirmation

## Examples

```bash
# Summarize a VTT file using local Ollama
/reflex:summarize-meeting recording.vtt

# Use OpenAI with a custom title
/reflex:summarize-meeting meeting.srt --llm openai --title "Q4 Planning"

# Paste transcript and save to Obsidian
/reflex:summarize-meeting paste --to obsidian:~/Documents/Obsidian/Work

# Summarize a Google Doc and create a new Google Doc
/reflex:summarize-meeting gdoc:1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms --to gdoc

# Use Anthropic with a specific model
/reflex:summarize-meeting notes.txt --llm anthropic --model claude-sonnet-4-20250514

# Save to a specific local path
/reflex:summarize-meeting standup.vtt --to ./summaries/standup-summary.md
```
