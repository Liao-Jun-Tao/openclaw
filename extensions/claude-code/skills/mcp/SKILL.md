---
name: mcp
description: Manage MCP (Model Context Protocol) servers. Install, configure, and manage MCP tools and resources.
---

# MCP Command

Manage MCP servers and connections.

## List MCP Servers

```bash
bash command:"openclaw mcp list"
bash command:"openclaw mcp status"
```

## Add MCP Server

```bash
# From registry
bash command:"openclaw mcp add github"

# From URL
bash command:"openclaw mcp add filesystem --url http://localhost:3000"

# From local installation
bash command:"openclaw mcp add ./my-mcp-server"
```

## Remove MCP Server

```bash
bash command:"openclaw mcp remove github"
bash command:"openclaw mcp uninstall filesystem"
```

## MCP Configuration

Edit `.openclaw.json`:
```json
{
  "mcp": {
    "servers": {
      "github": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "env": {
          "GITHUB_TOKEN": "your-token"
        }
      },
      "filesystem": {
        "command": "uvx",
        "args": ["mcp-server-filesystem", "./workspace"]
      }
    }
  }
}
```

## Test MCP Connection

```bash
bash command:"openclaw mcp test github"
bash command:"openclaw mcp check"
```

## Available MCP Servers

| Server | Description |
|--------|-------------|
| `github` | GitHub API integration |
| `filesystem` | Local file access |
| `brave-search` | Web search |
| `slack` | Slack messaging |
| `sequential-thinking` | Advanced reasoning |

## Troubleshooting

```bash
# Debug mode
bash command:"openclaw mcp debug github"

# Check logs
bash command:"openclaw mcp logs github"
```
