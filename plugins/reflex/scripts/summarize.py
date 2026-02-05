#!/usr/bin/env python3
"""
Summarize meeting transcripts using local or cloud LLMs.

Standalone script — works independently of Claude Code.
Supports Ollama (default, zero external deps), OpenAI, and Anthropic.

Usage:
    # Ollama (default, no extra deps)
    python summarize.py transcript.vtt

    # OpenAI
    uvx --with openai python summarize.py transcript.vtt --llm openai

    # Anthropic
    uvx --with anthropic python summarize.py transcript.vtt --llm anthropic

    # DOCX input (needs python-docx)
    uvx --with python-docx python summarize.py meeting.docx

    # Custom model and output
    python summarize.py notes.txt --llm ollama --model mistral --output summary.md

Environment variables (REFLEX_TRANSCRIPT_ prefix):
    REFLEX_TRANSCRIPT_LLM     LLM provider (default: ollama)
    REFLEX_TRANSCRIPT_MODEL   Model name override
"""

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request
from datetime import date as date_module
from pathlib import Path
from typing import Protocol


# =============================================================================
# Constants
# =============================================================================

WORD_THRESHOLD = 30_000
CHUNK_TARGET_WORDS = 20_000

DEFAULT_MODELS = {
    "ollama": "llama3.2",
    "openai": "gpt-4o-mini",
    "anthropic": "claude-haiku-4-20250414",
}

SYSTEM_PROMPT = """\
You are a meeting transcript summarizer. Your job is to extract structured \
information from meeting transcripts.

Given a transcript, produce a summary in markdown with these exact sections:

# Meeting Summary: <title>

**Date:** <date>
**Attendees:** <comma-separated names, or "Not identified">

## Executive Summary
<2-4 sentences summarizing the meeting's purpose and outcomes>

## Key Topics
1. **<Topic>** - <1-sentence description>
(3-7 topics)

## Decisions Made
- **<Decision>**: <reasoning or context>
(or "No explicit decisions recorded")

## Action Items
| Action | Owner | Deadline |
|--------|-------|----------|
| <task> | <person> | <date or TBD> |
(or "No action items identified")

## Open Questions
- <Unresolved item>
(or "None")

Rules:
- Only include information explicitly stated in the transcript
- If attendees are not clear, note "Not identified"
- Mark deadlines as "TBD" when not specified
- Keep the executive summary factual, not interpretive
"""

CHUNK_EXTRACT_PROMPT = """\
You are summarizing part of a longer meeting transcript (chunk {chunk_num} of \
{total_chunks}). Extract:

1. Key topics discussed in this section
2. Any decisions made
3. Action items (action, owner, deadline)
4. Open questions

Format as markdown bullet lists under each heading. Be thorough — every \
decision and action item matters."""

SYNTHESIS_PROMPT = """\
You are combining chunk summaries of a long meeting transcript into one \
coherent final summary. Below are summaries from {total_chunks} chunks.

Combine them into a single summary using this structure:

# Meeting Summary: {title}

**Date:** {date}
**Attendees:** <merge all identified attendees, deduplicate>

## Executive Summary
<2-4 sentences covering the entire meeting>

## Key Topics
<merge and deduplicate, 3-7 total>

## Decisions Made
<merge and deduplicate>

## Action Items
| Action | Owner | Deadline |
|--------|-------|----------|
<merge and deduplicate>

## Open Questions
<merge and deduplicate>

Deduplicate items that appear in multiple chunks. Order topics chronologically \
when possible."""


# =============================================================================
# Exceptions
# =============================================================================

class SummarizeError(Exception):
    """Base exception for summarization errors."""


class TranscriptParseError(SummarizeError):
    """Could not parse transcript file."""


class LLMConnectionError(SummarizeError):
    """Could not connect to LLM provider."""


class LLMResponseError(SummarizeError):
    """LLM returned an unexpected response."""


class DependencyError(SummarizeError):
    """A required dependency is missing."""


# =============================================================================
# Transcript Parsers
# =============================================================================

def parse_vtt(text: str) -> str:
    """Parse WebVTT captions into clean text.

    Strips WEBVTT header, timestamps, positioning tags, and deduplicates
    rolling captions (where the same line appears with shifting timestamps).
    """
    lines = text.splitlines()
    result = []
    seen = set()

    for line in lines:
        stripped = line.strip()
        # Skip header, blank lines, timestamp lines, NOTE blocks
        if not stripped:
            continue
        if stripped.startswith("WEBVTT"):
            continue
        if stripped.startswith("NOTE"):
            continue
        if re.match(r"^\d{2}:\d{2}[:\.]", stripped):
            continue
        if "-->" in stripped:
            continue
        # Strip VTT tags like <c>, </c>, <v Name>, etc
        cleaned = re.sub(r"<[^>]+>", "", stripped)
        cleaned = cleaned.strip()
        if not cleaned:
            continue
        # Deduplicate rolling captions
        if cleaned not in seen:
            seen.add(cleaned)
            result.append(cleaned)

    return "\n".join(result)


def parse_srt(text: str) -> str:
    """Parse SRT subtitles into clean text.

    Strips sequence numbers, timestamps, and blank separator lines.
    """
    lines = text.splitlines()
    result = []
    seen = set()

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        # Skip sequence numbers (standalone integers)
        if re.match(r"^\d+$", stripped):
            continue
        # Skip timestamp lines
        if "-->" in stripped:
            continue
        # Strip HTML-like tags sometimes in SRT
        cleaned = re.sub(r"<[^>]+>", "", stripped).strip()
        if not cleaned:
            continue
        if cleaned not in seen:
            seen.add(cleaned)
            result.append(cleaned)

    return "\n".join(result)


def parse_docx(path: str) -> str:
    """Extract text from a DOCX file using python-docx."""
    try:
        from docx import Document
    except ImportError:
        raise DependencyError(
            "python-docx is required for DOCX files. "
            "Run with: uvx --with python-docx python summarize.py ..."
        )

    doc = Document(path)
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n\n".join(paragraphs)


def parse_txt(text: str) -> str:
    """Pass-through for plain text. Normalizes whitespace."""
    # Normalize various speaker label formats
    # [Speaker Name] -> Speaker Name:
    text = re.sub(r"\[([^\]]+)\](\s*)", r"\1:\2", text)
    # SPEAKER_01 -> Speaker 1:
    text = re.sub(r"SPEAKER_(\d+)", lambda m: f"Speaker {int(m.group(1))}:", text)
    return text.strip()


def load_transcript(path: str) -> str:
    """Load and parse a transcript file based on its extension."""
    p = Path(path)
    if not p.exists():
        raise TranscriptParseError(f"File not found: {path}")

    suffix = p.suffix.lower()

    if suffix == ".docx":
        return parse_docx(path)

    try:
        text = p.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        try:
            text = p.read_text(encoding="latin-1")
        except Exception as e:
            raise TranscriptParseError(f"Could not read {path}: {e}")

    if suffix == ".vtt":
        return parse_vtt(text)
    elif suffix == ".srt":
        return parse_srt(text)
    else:
        # .txt and everything else
        return parse_txt(text)


# =============================================================================
# LLM Provider Protocol & Implementations
# =============================================================================

class LLMProvider(Protocol):
    """Interface for LLM providers."""

    def complete(self, system: str, user: str) -> str:
        """Send a system+user prompt and return the response text."""
        ...


class OllamaProvider:
    """Ollama provider using stdlib urllib (zero external deps)."""

    def __init__(self, model: str, base_url: str = "http://localhost:11434"):
        self.model = model
        self.base_url = base_url.rstrip("/")

    def complete(self, system: str, user: str) -> str:
        url = f"{self.base_url}/api/chat"
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "stream": False,
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
        )

        try:
            with urllib.request.urlopen(req, timeout=300) as resp:
                body = json.loads(resp.read().decode("utf-8"))
        except urllib.error.URLError as e:
            raise LLMConnectionError(
                f"Could not connect to Ollama at {self.base_url}. "
                f"Is Ollama running? Error: {e}"
            )
        except json.JSONDecodeError as e:
            raise LLMResponseError(f"Invalid JSON from Ollama: {e}")

        try:
            return body["message"]["content"]
        except (KeyError, TypeError):
            raise LLMResponseError(f"Unexpected Ollama response structure: {body}")


class OpenAIProvider:
    """OpenAI provider using the openai SDK."""

    def __init__(self, model: str, api_key: str | None = None):
        try:
            import openai
        except ImportError:
            raise DependencyError(
                "openai package required. "
                "Run with: uvx --with openai python summarize.py --llm openai ..."
            )
        self.model = model
        self.client = openai.OpenAI(api_key=api_key or os.environ.get("OPENAI_API_KEY"))

    def complete(self, system: str, user: str) -> str:
        try:
            resp = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
            )
            return resp.choices[0].message.content
        except Exception as e:
            raise LLMConnectionError(f"OpenAI API error: {e}")


class AnthropicProvider:
    """Anthropic provider using the anthropic SDK."""

    def __init__(self, model: str, api_key: str | None = None):
        try:
            import anthropic
        except ImportError:
            raise DependencyError(
                "anthropic package required. "
                "Run with: uvx --with anthropic python summarize.py --llm anthropic ..."
            )
        self.model = model
        self.client = anthropic.Anthropic(
            api_key=api_key or os.environ.get("ANTHROPIC_API_KEY")
        )

    def complete(self, system: str, user: str) -> str:
        try:
            resp = self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                system=system,
                messages=[{"role": "user", "content": user}],
            )
            return resp.content[0].text
        except Exception as e:
            raise LLMConnectionError(f"Anthropic API error: {e}")


def create_provider(name: str, model: str | None = None) -> LLMProvider:
    """Factory to create an LLM provider by name."""
    resolved_model = model or DEFAULT_MODELS.get(name)
    if not resolved_model:
        raise SummarizeError(f"Unknown provider: {name}")

    if name == "ollama":
        base_url = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
        return OllamaProvider(model=resolved_model, base_url=base_url)
    elif name == "openai":
        return OpenAIProvider(model=resolved_model)
    elif name == "anthropic":
        return AnthropicProvider(model=resolved_model)
    else:
        raise SummarizeError(
            f"Unknown provider '{name}'. Supported: ollama, openai, anthropic"
        )


# =============================================================================
# Summarization
# =============================================================================

def word_count(text: str) -> int:
    """Count words in text."""
    return len(text.split())


def chunk_transcript(text: str, target_words: int = CHUNK_TARGET_WORDS) -> list[str]:
    """Split transcript into chunks at natural boundaries.

    Prefers splitting at:
    1. Double newlines (paragraph breaks)
    2. Speaker label changes
    3. Single newlines

    Each chunk targets ~target_words but won't split mid-sentence.
    """
    paragraphs = re.split(r"\n\s*\n", text)
    chunks: list[str] = []
    current: list[str] = []
    current_words = 0

    for para in paragraphs:
        para_words = word_count(para)

        if current_words + para_words > target_words and current:
            chunks.append("\n\n".join(current))
            current = [para]
            current_words = para_words
        else:
            current.append(para)
            current_words += para_words

    if current:
        chunks.append("\n\n".join(current))

    return chunks


def summarize_single(
    provider: LLMProvider,
    transcript: str,
    title: str,
    meeting_date: str,
) -> str:
    """Single-pass summarization for shorter transcripts."""
    user_msg = (
        f"Meeting title: {title}\n"
        f"Date: {meeting_date}\n\n"
        f"Transcript:\n\n{transcript}"
    )
    return provider.complete(SYSTEM_PROMPT, user_msg)


def summarize_multi(
    provider: LLMProvider,
    transcript: str,
    title: str,
    meeting_date: str,
) -> str:
    """Two-pass chunked summarization for long transcripts."""
    chunks = chunk_transcript(transcript)
    total = len(chunks)
    eprint(f"Transcript split into {total} chunks for processing")

    # Pass 1: Extract from each chunk
    chunk_summaries: list[str] = []
    for i, chunk in enumerate(chunks, 1):
        eprint(f"Processing chunk {i}/{total}...")
        extract_prompt = CHUNK_EXTRACT_PROMPT.format(
            chunk_num=i, total_chunks=total
        )
        user_msg = (
            f"Meeting title: {title}\n"
            f"Date: {meeting_date}\n\n"
            f"Transcript chunk {i}/{total}:\n\n{chunk}"
        )
        summary = provider.complete(extract_prompt, user_msg)
        chunk_summaries.append(f"### Chunk {i}/{total}\n\n{summary}")

    # Pass 2: Synthesize
    eprint("Synthesizing final summary...")
    synthesis_prompt = SYNTHESIS_PROMPT.format(
        total_chunks=total, title=title, date=meeting_date
    )
    combined = "\n\n---\n\n".join(chunk_summaries)
    return provider.complete(synthesis_prompt, combined)


def summarize(
    provider: LLMProvider,
    transcript: str,
    title: str,
    meeting_date: str,
) -> str:
    """Route to single-pass or multi-pass based on transcript length."""
    wc = word_count(transcript)
    eprint(f"Transcript: {wc:,} words")

    if wc > WORD_THRESHOLD:
        eprint(f"Long transcript (>{WORD_THRESHOLD:,} words), using chunked processing")
        return summarize_multi(provider, transcript, title, meeting_date)
    else:
        eprint("Using single-pass summarization")
        return summarize_single(provider, transcript, title, meeting_date)


# =============================================================================
# Utilities
# =============================================================================

def eprint(*args, **kwargs):
    """Print to stderr (status messages)."""
    print(*args, file=sys.stderr, **kwargs)


# =============================================================================
# Main
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Summarize meeting transcripts using LLMs",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""\
examples:
  python summarize.py transcript.vtt
  python summarize.py meeting.srt --llm openai --model gpt-4o
  python summarize.py notes.txt --llm anthropic --title "Sprint Planning"
  python summarize.py meeting.docx --output summary.md
        """,
    )
    parser.add_argument(
        "file",
        help="Path to transcript file (.vtt, .srt, .txt, .docx)",
    )
    parser.add_argument(
        "--llm",
        choices=["ollama", "openai", "anthropic"],
        default=None,
        help="LLM provider (default: REFLEX_TRANSCRIPT_LLM env or 'ollama')",
    )
    parser.add_argument(
        "--model",
        default=None,
        help="Model name override (default depends on provider)",
    )
    parser.add_argument(
        "--title",
        default=None,
        help="Meeting title (default: derived from filename)",
    )
    parser.add_argument(
        "--date",
        default=None,
        help="Meeting date YYYY-MM-DD (default: today)",
    )
    parser.add_argument(
        "--output",
        default="stdout",
        help="Output path or 'stdout' (default: stdout)",
    )

    args = parser.parse_args()

    # Resolve LLM provider: flag > env > default
    llm_name = args.llm or os.environ.get("REFLEX_TRANSCRIPT_LLM", "ollama")
    model = args.model or os.environ.get("REFLEX_TRANSCRIPT_MODEL")

    # Resolve title
    title = args.title or Path(args.file).stem.replace("-", " ").replace("_", " ").title()

    # Resolve date
    meeting_date = args.date or date_module.today().isoformat()

    eprint(f"Provider: {llm_name} ({model or DEFAULT_MODELS.get(llm_name, '?')})")
    eprint(f"Title: {title}")
    eprint(f"Date: {meeting_date}")

    # Load transcript
    try:
        transcript = load_transcript(args.file)
    except SummarizeError as e:
        eprint(f"Error: {e}")
        sys.exit(1)

    if not transcript.strip():
        eprint("Error: Transcript is empty after parsing")
        sys.exit(1)

    # Create provider
    try:
        provider = create_provider(llm_name, model)
    except SummarizeError as e:
        eprint(f"Error: {e}")
        sys.exit(1)

    # Summarize
    try:
        result = summarize(provider, transcript, title, meeting_date)
    except SummarizeError as e:
        eprint(f"Error during summarization: {e}")
        sys.exit(1)

    # Output
    if args.output == "stdout":
        print(result)
    else:
        out_path = Path(args.output)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(result, encoding="utf-8")
        eprint(f"Summary written to {out_path}")


if __name__ == "__main__":
    main()
