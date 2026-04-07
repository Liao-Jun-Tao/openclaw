---
name: session
description: Manage conversation sessions. List, switch, resume, or clear sessions for context management.
---

# Session Command

Manage OpenClaw conversation sessions.

## List Sessions

```bash
# List all sessions
bash command:"ls -la ~/.openclaw/sessions/"

# Show session files with metadata
bash command:"find ~/.openclaw/sessions -name '*.jsonl' -mtime -7"
```

## Resume Session

To resume a previous session, use the `sessions_send` tool or specify the session key.

## Session Management Tips

- Use `/compact` to reduce context length in long sessions
- Use `/clear` to start fresh while preserving session history
- Session history is stored in `~/.openclaw/sessions/`

## Session Files

Sessions are stored as JSONL files with:
- `session.json` - Session metadata
- `messages.jsonl` - Conversation history

## Export Session

```bash
# Copy session files
bash command:"cp -r ~/.openclaw/sessions/<session-id> ./backup-session/"
```

## Context Management

- `/compact [reason]` - Compact context and summarize
- `/clear` - Clear conversation (keeps session)
- `/rewind [n]` - Go back N messages in conversation
