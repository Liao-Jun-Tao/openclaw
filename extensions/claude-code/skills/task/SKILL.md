---
name: task
description: Execute a development task using a coding agent with reasoning. Simpler interface for /coding with automatic context and tool access.
---

# Task Command

Execute development tasks with an AI coding agent.

## Usage

```bash
/task <description>        # Simple task
/task <description> --thinking high  # With reasoning
```

## Examples

```bash
/task Add user login endpoint
/task Fix the null pointer exception
/task Refactor the authentication module
/task Write tests for the payment service
/task "Implement webhook handler for payment notifications"
```

## What Happens

1. **Spawns a coding agent** with access to:
   - All files in the project
   - Shell commands (bash)
   - File editing tools
   - Git operations

2. **Agent analyzes** the task:
   - Reads relevant files
   - Understands context
   - Plans approach

3. **Agent implements**:
   - Makes code changes
   - Runs commands as needed
   - Reports progress

4. **Agent reviews**:
   - Verifies changes
   - Runs tests if available
   - Summarizes work

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--thinking` | Reasoning visibility | `medium` |
| `--model` | AI model to use | Config default |
| `--timeout` | Max seconds | 300 |

## Thinking Levels

```bash
/task "Complex refactor" --thinking high   # Full reasoning
/task "Simple fix" --thinking low        # Quick execution
```

## Integration

This command uses `sessions_spawn` under the hood to run in an isolated subagent session while having access to the parent session's context.

## Tips

- **Be specific** - Better: "Add /api/users endpoint returning JSON list" vs "add user endpoint"
- **Provide context** - Mention relevant files or patterns
- **Set scope** - One task at a time works best
- **Iterate** - Run multiple tasks for larger features
