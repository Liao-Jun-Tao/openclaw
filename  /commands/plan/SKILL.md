---
name: plan
description: Enter planning mode to outline approach before executing. Creates a structured plan for complex tasks.
---

# Plan Command

Enter planning mode for complex tasks.

## Usage

```bash
/plan
/plan Fix the authentication bug
/plan Implement user dashboard
```

## What Plan Mode Does

1. **Analyze** - Understands the task requirements
2. **Outline** - Breaks down into steps
3. **Review** - Shows proposed approach
4. **Execute** - Runs with your approval

## Plan Format

```
## Task Analysis
[What needs to be done]

## Proposed Approach
1. [First step]
2. [Second step]
3. [Third step]

## Considerations
- [Potential issues]
- [Dependencies]
- [Risks]

## Estimated Effort
- Time: [estimate]
- Complexity: [low/medium/high]

## Confirmation
[Ready to proceed? y/n]
```

## Plan Mode Features

- **Structured thinking** - Breaks complex tasks clearly
- **Step-by-step execution** - Execute one step at a time
- **Easy corrections** - Modify plan at any point
- **Progress tracking** - See what's been completed

## Use Cases

### When to Use Plan Mode

- Large refactoring projects
- Multi-file changes
- Complex bug fixes
- New feature implementation
- Unknown/unclear requirements

### When NOT to Use

- Quick, simple tasks
- One-liner fixes
- Already well-understood work

## Exit Plan Mode

```bash
# Cancel plan mode
/exit-plan

# Execute without planning
/exit-plan --force
```
