---
name: coding
description: Use OpenClaw's coding agent for complex programming tasks. Spawns a dedicated agent to think through and implement code changes with full reasoning visibility.
---

# Coding Agent Command

Spawn a coding agent to handle complex development tasks with full thinking visibility.

## Usage

### Basic Usage
```bash
# Start a coding agent for a task
/coding Build user authentication system

# With specific model
/coding --model claude-sonnet-4 "Refactor the database layer"

# With thinking enabled
/coding --thinking high "Implement caching layer"
```

### Spawn Subagent Directly

Use the `sessions_spawn` tool to spawn a dedicated coding agent:

```bash
sessions_spawn task:"Implement the feature" runtime:"subagent" thinking:"high"
```

## Thinking Visibility

OpenClaw supports visible thinking - the agent shows its reasoning:

```bash
# Enable thinking (high/medium/low)
/coding --thinking high "Complex refactor"

# Thinking off for simple tasks
/coding --thinking off "Quick fix"
```

## Code Writing Workflow

### 1. Understand the Task
```
Agent will:
- Read relevant files
- Understand existing code patterns
- Identify what needs to change
```

### 2. Plan Changes
```
Agent will:
- Outline the approach
- Consider edge cases
- Plan file modifications
```

### 3. Implement
```
Agent will:
- Edit files using tools
- Create new files as needed
- Test the changes
```

### 4. Review
```
Agent will:
- Verify changes are correct
- Check for issues
- Summarize what was done
```

## Options

| Option | Description | Values |
|--------|-------------|--------|
| `--model` | AI model to use | `sonnet`, `opus`, `gpt-5` |
| `--thinking` | Thinking level | `high`, `medium`, `low`, `off` |
| `--timeout` | Max runtime | seconds |
| `--sandbox` | Run in sandbox | `true`, `false` |

## Examples

### Build a Feature
```
/coding Build a REST API for user management
```

### Refactor Code
```
/coding --thinking high Refactor all async functions to use await
```

### Complex Implementation
```
/coding --model opus --thinking high "Implement a complete authentication flow"
```

### Bug Fix
```
/coding Fix the memory leak in the data processing module
```

## Best Practices

1. **Be specific** - Give clear requirements
2. **Show thinking** - Use `--thinking high` for complex tasks
3. **Set scope** - Don't make tasks too broad
4. **Iterate** - Start simple, add complexity as needed

## Integration with Tools

The coding agent has access to all tools:
- `bash` - Run commands, git operations
- `read` - Read files
- `edit` - Modify files
- `glob` - Find files
- `grep` - Search code

This allows it to:
- Explore the codebase
- Make targeted edits
- Run tests
- Commit changes
