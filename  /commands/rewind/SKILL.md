---
name: rewind
description: Rewind the conversation by N messages. Go back in conversation history to a previous point.
---

# Rewind Command

Rewind conversation to a previous point.

## Usage

```bash
# Rewind 5 messages
/rewind 5

# Rewind to specific message
/rewind to message 20

# Show what will be rewound
/rewind --dry-run 5
```

## How Rewinding Works

1. Identifies the message N steps back
2. Removes that message and all subsequent messages
3. Restores state to that point
4. Context is updated accordingly

## Use Cases

- Mistake correction: Undo after providing wrong information
- Direction change: Go back before taking a wrong path
- Testing: Rewind to try a different approach

## What Gets Removed

- All messages after the rewind point
- All tool calls and their results
- Any state changes made

## Examples

```
# Before: [msg1, msg2, msg3, msg4, msg5]
# Command: /rewind 2
# After:  [msg1, msg2, msg3]
```

## Limitations

- Cannot rewind before session start
- Some side effects cannot be undone (e.g., file writes)
- External API calls cannot be reversed
