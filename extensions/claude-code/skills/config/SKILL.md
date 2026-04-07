---
name: config
description: Manage OpenClaw configuration. View, set, and edit configuration options for behavior, plugins, and workspace settings.
---

# Config Command

Manage OpenClaw configuration.

## View Configuration

```bash
bash command:"openclaw config get"                    # Show all config
bash command:"openclaw config get model"              # Show specific key
bash command:"openclaw config get plugins"            # Show plugins
```

## Set Configuration

```bash
bash command:"openclaw config set model.preferred claude-3-5-sonnet"
bash command:"openclaw config set theme dark"
bash command:"openclaw config set maxTokens 8192"
```

## Edit Configuration File

```bash
bash command:"openclaw config edit"
# Opens config file in your editor
```

## Reset Configuration

```bash
bash command:"openclaw config reset"                  # Reset to defaults
bash command:"openclaw config reset model"          # Reset specific section
```

## Configuration Locations

1. **Global**: `~/.openclaw/config.json`
2. **Project**: `./.openclaw.json`
3. **Environment**: `OPENCLAW_*` env vars

## Common Settings

| Setting | Description | Example |
|---------|-------------|---------|
| `model.preferred` | Default AI model | `claude-3-5-sonnet` |
| `theme` | UI theme | `dark`, `light` |
| `maxTokens` | Max response tokens | `8192` |
| `temperature` | Response creativity | `0.7` |

## Workspace Settings

Project-specific settings in `.openclaw.json`:
```json
{
  "model": "claude-3-5-sonnet",
  "plugins": {
    "claude-code": {
      "sandboxMode": true
    }
  }
}
```
