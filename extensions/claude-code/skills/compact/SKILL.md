---
name: compact
description: Compact conversation context to reduce token usage while preserving important information and context.
---

# Compact Command

Compact conversation context to reduce token usage while preserving key information.

## Usage

```bash
# Compact with default settings
/compact

# Choose strategy
/compact --strategy hybrid

# Custom settings
/compact --strategy summary --keep-recent 15
```

## Strategies

### hybrid (default)

Combines pruning and summarization:

- Keeps early context (project info)
- Keeps recent messages
- Summarizes middle section

### summary

Summarizes old messages:

- Keeps recent N messages
- Generates AI summary of old messages
- Preserves all important decisions

### prune

Simple removal:

- Keeps recent N messages
- Removes older messages entirely
- Fast but loses context

## Options

| Option          | Description             | Default  |
| --------------- | ----------------------- | -------- |
| `--strategy`    | Compaction strategy     | `hybrid` |
| `--keep-recent` | Recent messages to keep | 10       |
| `--custom`      | What to preserve        | none     |

## When to Compact

- Context approaching token limits (85%+)
- Conversation has become long and unwieldy
- After completing a major task or milestone
- Before starting a new topic

## What Gets Preserved

- Current project context and goals
- Recent decisions and their rationale
- Active file state and modifications
- Unresolved issues or TODO items
- Custom instructions you provide

## What Gets Removed

- Completed task details
- Verbose debugging output
- Redundant explanations
- Old context no longer relevant

## Example Output

```
Compaction complete.

Messages: 45 → 12
Tokens: 156,000 → 42,000 (73% reduction)
Strategy: hybrid

[Earlier conversation summarized]

Earlier conversation (32 messages, ~39,000 tokens):
- 16 user messages
- 16 assistant messages

Key topics discussed were removed to make room for new work.
```

## Token Budget

Compaction helps manage token budget:

| Context Usage | Action              |
| ------------- | ------------------- |
| 0-70%         | Normal operation    |
| 70-85%        | Consider compacting |
| 85-95%        | Compact recommended |
| 95%+          | Urgent compaction   |

## Tips

1. **Compact before limits** - Don't wait until interrupted
2. **Use custom instructions** - Tell it what to preserve
3. **Review after compacting** - Verify important context kept
4. **Compact periodically** - Better to compact often than rarely

## Automated Compaction

OpenClaw can auto-compact when:

- Token usage exceeds 85%
- After N messages (configurable)
- Based on conversation patterns

Configure in `.openclaw.json`:

```json
{
  "plugins": {
    "claude-code": {
      "autoCompact": {
        "enabled": true,
        "threshold": 0.85,
        "minMessages": 10
      }
    }
  }
}
```
