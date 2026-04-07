---
name: hooks
description: Configure and manage workflow hooks. Set up automated actions that run before/after commands or events.
---

# Hooks Command

Manage OpenClaw hooks for workflow automation.

## List Hooks

```bash
bash command:"openclaw hooks list"
bash command:"openclaw hooks --all"
```

## Create Hook

```bash
# Before a command
bash command:"openclaw hooks add --before '/commit' --exec 'npm test'"

# After a command
bash command:"openclaw hooks add --after '/review' --exec 'echo Done'"

# On event
bash command:"openclaw hooks add --on 'session:start' --exec './backup.sh'"
```

## Hook Types

| Type     | Trigger        | Example                 |
| -------- | -------------- | ----------------------- |
| `before` | Before command | Run tests before commit |
| `after`  | After command  | Notify after review     |
| `on`     | On event       | Backup on session start |

## Hook Configuration

Edit `~/.openclaw/hooks.json`:

```json
{
  "hooks": [
    {
      "name": "pre-commit-test",
      "trigger": "before:/commit",
      "command": "npm test",
      "timeout": 60000
    },
    {
      "name": "post-review-notify",
      "trigger": "after:/review",
      "command": "slack通知",
      "env": {
        "WEBHOOK_URL": "..."
      }
    }
  ]
}
```

## Delete Hooks

```bash
bash command:"openclaw hooks remove pre-commit-test"
bash command:"openclaw hooks delete --all"
```

## Test Hooks

```bash
bash command:"openclaw hooks test pre-commit-test"
bash command:"openclaw hooks --dry-run /commit"
```

## Available Events

| Event            | Description        |
| ---------------- | ------------------ |
| `session:start`  | New session begins |
| `session:end`    | Session ends       |
| `command:before` | Before any command |
| `command:after`  | After any command  |
| `tool:use`       | Tool execution     |
