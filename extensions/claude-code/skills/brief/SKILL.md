---
name: brief
description: Execute tasks in brief/ concise mode. For quick, simple tasks that don't need full conversation context.
---

# Brief Command

Execute quick tasks without full thinking overhead.

## Usage

```bash
# Quick task
/brief Fix the typo in README.md

# Very concise
/brief Update version to 2.0.0

# Minimal output
/brief --quiet "Run tests"
```

## When to Use Brief Mode

### Good Use Cases
- Simple file edits
- Quick lookups
- One-liner tasks
- Low-complexity changes
- Time-sensitive requests

### Avoid For
- Complex problem-solving
- Architecture decisions
- Multi-file changes
- Debugging difficult issues
- Tasks requiring reasoning

## Brief vs Normal

| Aspect | Brief | Normal |
|--------|-------|--------|
| Thinking | Minimal | Full |
| Output | Concise | Detailed |
| Context | Light | Full |
| Speed | Fast | Slower |
| Token usage | Low | Higher |

## Examples

```
Normal:
"Looking at the code, I can see the issue. The function isn't handling null values properly. Let me fix this by adding a null check..."

Brief:
"Adding null check. Done."
```

## Options

| Option | Description |
|--------|-------------|
| `--quiet` | Minimal output |
| `--fast` | Skip verification |
| `--dry` | Show what would do |

## Tips

Use `/brief` when:
- The task is truly simple
- You need a fast response
- You already know the solution
- Just need an edit or command run

Switch to full mode if:
- Task proves complex
- Need more reasoning
- Errors occur
