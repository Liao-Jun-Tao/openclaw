---
name: status
description: Show current OpenClaw status including model, session info, configuration, and connected channels.
---

# Status Command

View current OpenClaw status.

## Basic Status

```bash
/status
bash command:"openclaw status"
bash command:"openclaw status --short"
```

## Detailed Status

```bash
bash command:"openclaw status --detailed"
bash command:"openclaw status --verbose"
```

## Status Sections

### Session Info

```
Session: abc123
Model: claude-3-5-sonnet-20241022
Messages: 45
Tokens Used: 12,345
```

### Configuration

```
Theme: dark
Plugins: 12 enabled
Commands: 34 available
```

### Channels

```
Webchat: ✓ Connected
Telegram: ✓ Connected
Discord: ✗ Not configured
```

## Status Flags

| Flag         | Description          |
| ------------ | -------------------- |
| `--session`  | Show session details |
| `--model`    | Show model info      |
| `--plugins`  | Show plugin status   |
| `--channels` | Show channel status  |
| `--config`   | Show config summary  |

## Example Output

```
╔════════════════════════════════════════╗
║           OpenClaw Status             ║
╠════════════════════════════════════════╣
║ Session: sess_abc123                 ║
║ Model: claude-3-5-sonnet             ║
║ Messages: 23                          ║
║ Tokens: 5,432 / 200,000              ║
╠════════════════════════════════════════╣
║ Plugins (12)                          ║
║ ✓ claude-code                         ║
║ ✓ diffs                               ║
║ ✓ github-copilot                      ║
╚════════════════════════════════════════╝
```

## Check Health

```bash
bash command:"openclaw status --health"
bash command:"openclaw status --probe"
```
