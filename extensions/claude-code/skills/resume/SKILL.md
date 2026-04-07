---
name: resume
description: Resume a previous conversation session. Load and continue from a past session.
---

# Resume Command

Resume a previous conversation session.

## Usage

```bash
# List available sessions
/openclaw sessions list

# Resume most recent session
/resume

# Resume specific session
/resume <session-id>

# Resume with session browser
/resume --interactive
```

## Session Management

```bash
# List sessions
bash command:"ls ~/.openclaw/sessions/"
bash command:"openclaw session list"

# Show session info
bash command:"openclaw session info <session-id>"

# Delete session
bash command:"openclaw session delete <session-id>"
```

## Resume Options

| Option | Description |
|--------|-------------|
| `--session <id>` | Resume specific session |
| `--fresh` | Resume but don't load context |
| `--compact` | Auto-compact on resume |

## Session Metadata

Sessions store:
- Conversation history
- Model used
- Working directory
- Timestamp
- Custom metadata

## Search Sessions

```bash
# Find sessions by keyword
bash command:"openclaw session search 'auth implementation'"

# Find by date
bash command:"openclaw session --after 2024-01-01"
```

## Best Practices

- Use descriptive session names for important sessions
- Delete old sessions periodically
- Export important sessions before deletion
