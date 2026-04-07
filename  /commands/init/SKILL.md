---
name: init
description: Initialize a new project with OpenClaw. Creates configuration files and sets up the development environment.
---

# Init Command

Initialize a new project for OpenClaw.

## Basic Usage

```bash
bash command:"openclaw init"
bash command:"openclaw init --project ./my-project"
bash command:"openclaw init --template web"
```

## Options

| Option              | Description                          |
| ------------------- | ------------------------------------ |
| `--project <path>`  | Project directory (default: current) |
| `--template <name>` | Use a template (web, api, fullstack) |
| `--skip-git`        | Skip git initialization              |
| `--no-install`      | Skip dependency installation         |

## What Init Does

1. Creates `.openclaw.json` configuration
2. Sets up initial workspace settings
3. Creates `.openclaw/` directory for session storage
4. Optionally initializes git repo
5. Installs required dependencies

## Project Templates

### Web Project

```bash
bash command:"openclaw init --template web"
```

Creates config for frontend development with relevant tools.

### API Project

```bash
bash command:"openclaw init --template api"
```

Creates config for backend API development.

### Fullstack

```bash
bash command:"openclaw init --template fullstack"
```

Creates config for fullstack projects.

## After Initialization

```bash
# Start a conversation
openclaw

# Or run a specific task
openclaw /task "Build user authentication"
```
