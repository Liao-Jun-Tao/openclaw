---
name: theme
description: Change the visual theme of the interface. Switch between light, dark, and custom color schemes.
---

# Theme Command

Manage OpenClaw UI themes.

## View Current Theme

```bash
bash command:"openclaw theme"
bash command:"openclaw config get theme"
```

## Available Themes

### Dark Themes
- `dark` - Default dark theme
- `monokai` - Monokai colors
- `dracula` - Dracula theme
- `github-dark` - GitHub dark

### Light Themes
- `light` - Default light theme
- `github-light` - GitHub light
- `solarized-light` - Solarized light

## Set Theme

```bash
bash command:"openclaw theme set dark"
bash command:"openclaw theme set monokai"
bash command:"openclaw config set theme dracula"
```

## Theme Options

| Option | Description |
|--------|-------------|
| `--list` | List all available themes |
| `--preview` | Preview theme before applying |
| `--persist` | Save theme preference |

## Custom Themes

Create custom themes in `~/.openclaw/themes/`:
```json
{
  "name": "my-theme",
  "colors": {
    "background": "#1e1e1e",
    "foreground": "#d4d4d4",
    "accent": "#007acc"
  }
}
```

## Terminal Themes

For terminal integration:
```bash
bash command:"openclaw theme export iterm2"
bash command:"openclaw theme export terminal.app"
```
