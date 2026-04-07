---
name: clear
description: Clear the conversation while preserving session history. Start fresh while maintaining context for later resume.
---

# Clear Command

Clear the current conversation context.

## Usage

```bash
# Clear current conversation
/clear

# Clear with reason
/clear Moving to a different task

# Clear and compact first
/clear --compact
```

## What Gets Cleared

- All messages in current conversation
- All tool calls and results
- All reasoning traces

## What Gets Preserved

- Session history (stored for resume)
- Project configuration
- Global context from system prompt
- Loaded skills and plugins

## Clear vs Reset

| Command   | Effect                             |
| --------- | ---------------------------------- |
| `/clear`  | Clears conversation, keeps session |
| `/reset`  | Deletes session entirely           |
| `/rewind` | Goes back N messages               |

## Use Cases

- Topic change: Clear when switching to a completely different task
- Fresh start: Clear to remove accumulated context clutter
- After errors: Clear to reset stuck state

## Session History

Your conversation is saved before clearing. To resume:

```bash
bash command:"ls ~/.openclaw/sessions/"
# Find the session you want
bash command:"openclaw resume <session-id>"
```
